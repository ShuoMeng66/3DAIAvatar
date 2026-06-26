"""
Rewrite WebRTC answer SDP so ICE host candidates use a public host/port.

When Linly runs inside Docker/AutoDL, aiortc embeds private IPs in SDP.
Remote browsers cannot reach those addresses; replace them with
LINLY_ICE_PUBLIC_HOST / LINLY_ICE_PUBLIC_PORT from env.
"""

from __future__ import annotations

import logging
import re
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

_PRIVATE_IP = re.compile(
    r"^(?:127\.|10\.|192\.168\.|172\.(?:1[6-9]|2[0-9]|3[01])\.)"
)

_CANDIDATE_RE = re.compile(
    r"^a=candidate:(?P<foundation>\S+)\s+(?P<component>\d+)\s+"
    r"(?P<protocol>\S+)\s+(?P<priority>\d+)\s+(?P<ip>\S+)\s+(?P<port>\d+)\s+"
    r"typ\s+(?P<type>\S+)(?P<rest>.*)$"
)


def parse_public_host_from_url(url: str) -> tuple[str, int | None]:
    """Extract hostname and optional port from a public URL."""
    if not url:
        return "", None
    if "://" not in url:
        url = f"https://{url}"
    parsed = urlparse(url)
    host = parsed.hostname or ""
    port = parsed.port
    return host, port


def _is_private_ip(ip: str) -> bool:
    return bool(_PRIVATE_IP.match(ip))


def rewrite_sdp_ice(
    sdp: str,
    public_host: str,
    public_port: int,
) -> str:
    """
    Replace private host ICE candidates and connection lines with public address.
    srflx/relay candidates are kept; if no public host candidate remains, append one.
    """
    if not public_host:
        return sdp

    lines = sdp.replace("\r\n", "\n").split("\n")
    out: list[str] = []
    has_public_host = False
    foundation = "1"
    component = "1"
    protocol = "udp"
    priority = "2130706431"

    for line in lines:
        if not line:
            continue

        if line.startswith("c=IN IP4 "):
            ip = line.split()[-1]
            if _is_private_ip(ip):
                out.append(f"c=IN IP4 {public_host}")
            else:
                out.append(line)
            continue

        m = _CANDIDATE_RE.match(line)
        if m:
            cand_type = m.group("type")
            ip = m.group("ip")
            port = m.group("port")
            rest = m.group("rest")

            if cand_type == "host" and _is_private_ip(ip):
                foundation = m.group("foundation")
                component = m.group("component")
                protocol = m.group("protocol")
                priority = m.group("priority")
                out.append(
                    f"a=candidate:{foundation} {component} {protocol} {priority} "
                    f"{public_host} {public_port} typ host{rest}"
                )
                has_public_host = True
            else:
                out.append(line)
                if cand_type == "host" and ip == public_host:
                    has_public_host = True
            continue

        out.append(line)

    if not has_public_host:
        out.append(
            f"a=candidate:{foundation} {component} {protocol} {priority} "
            f"{public_host} {public_port} typ host generation 0"
        )
        logger.info(
            "Appended public host ICE candidate %s:%s",
            public_host,
            public_port,
        )

    result = "\r\n".join(out)
    if not result.endswith("\r\n"):
        result += "\r\n"
    return result
