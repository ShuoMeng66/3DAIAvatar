# Session 7C：WebRTC 信令补全 + 2D 数字人黑底降级 Spec

## Why
Session 7B 完成了 3D 场景，但缺少实时视频链路。本 Session 补全 WebRTC 信令流程，使全息仓能接收 Linly-Talker-Stream 的实时数字人视频流，同时提供 2D 视频 fallback 层，确保在 3D 场景不可用时仍有可用画面。

## What Changes
- **重写** `frontend/src/services/webrtc.ts`：RTCPeerConnection + STUN + ICE 候选收集 + offer/answer 交换
- **重写** `frontend/src/hooks/useWebRTC.ts`：状态管理（connecting/connected/failed），自动重连 3 次
- **修改** `frontend/src/pages/CabinetPage.tsx`：新增 2D fallback 视频层，根据 `VITE_CABINET_MODE` 切换
- **修改** `frontend/src/services/api.ts`：修正 `sendOffer` 端点路径
- **修改** `backend/main.py`：`/offer` 从占位改为代理 Linly-Talker-Stream
- **修改** `backend/config.py`：新增 `LINLY_STREAM_URL` 配置
- **修改** `.env.example`：新增 `VITE_CABINET_MODE` 和 `LINLY_STREAM_URL`
- 新增 `frontend/src/styles/cabinet.css` 中 2D 视频层样式

## Impact
- Affected specs: session-7b-threejs-vrm-scene（7B 的 3D 场景）
- Affected code: `frontend/src/services/webrtc.ts`, `frontend/src/hooks/useWebRTC.ts`, `frontend/src/pages/CabinetPage.tsx`, `frontend/src/services/api.ts`, `backend/main.py`, `backend/config.py`, `.env.example`, `frontend/src/styles/cabinet.css`
- 不删 hologram/ LED 风扇模块

## ADDED Requirements

### Requirement: WebRTC 连接管理
The system SHALL establish a WebRTC connection using RTCPeerConnection with STUN and proxy signaling through the backend.

#### Scenario: Successful WebRTC connection
- **WHEN** user navigates to `/#/cabinet` and WebRTC is initiated
- **THEN** a RTCPeerConnection is created with `stun:stun.l.google.com:19302`
- **AND** audio and video transceivers are added with `recvonly` direction
- **AND** an SDP offer is created and sent via `POST /api/v1/offer`
- **AND** the returned SDP answer is set as remote description
- **AND** `ontrack` event binds the remote MediaStream to a `<video>` element

#### Scenario: WebRTC connection state tracking
- **WHEN** the WebRTC connection state changes
- **THEN** the hook exposes one of: `idle`, `connecting`, `connected`, `failed`
- **AND** `connecting` state is set when offer is being sent
- **AND** `connected` state is set when `iceConnectionState` or `connectionState` becomes `connected`
- **AND** `failed` state is set when connection fails after all retries

#### Scenario: Auto-reconnect on failure
- **WHEN** the WebRTC connection enters `failed` state
- **THEN** the system automatically retries connection up to 3 times
- **AND** each retry waits 2 seconds before attempting
- **AND** after 3 failed attempts, the state remains `failed` and no further retries occur

### Requirement: 2D Video Fallback Layer
The system SHALL provide a 2D video fallback layer in CabinetPage with pure black background.

#### Scenario: 2D video display
- **WHEN** WebRTC connection is established and `VITE_CABINET_MODE` is `2d` or `auto`
- **THEN** a `<video>` element renders the remote stream
- **AND** the video is styled with `object-fit: contain` and centered
- **AND** the video container background is `#000000` (pure black)
- **AND** no white/light background appears around the video

#### Scenario: Cabinet mode switching
- **WHEN** `VITE_CABINET_MODE` is `3d` (default)
- **THEN** only the 3D CabinetStage is rendered in the scene area
- **WHEN** `VITE_CABINET_MODE` is `2d`
- **THEN** only the 2D video layer is rendered in the scene area
- **WHEN** `VITE_CABINET_MODE` is `auto`
- **THEN** 3D scene is rendered by default; WebRTC video can be shown as a Picture-in-Picture overlay or replace 3D on successful connection

### Requirement: Backend WebRTC Signaling Proxy
The system SHALL proxy `/offer` requests to the Linly-Talker-Stream backend.

#### Scenario: Linly-Talker-Stream is running
- **WHEN** `POST /offers` is received with a valid SDP offer
- **THEN** the backend forwards the offer to `LINLY_STREAM_URL/offer`
- **AND** the response from Linly is returned to the frontend as-is
- **AND** the response includes valid `sdp` and `type: "answer"` fields

#### Scenario: Linly-Talker-Stream is not running
- **WHEN** `POST /offer` is received but Linly is unreachable
- **THEN** the backend returns HTTP 503 with JSON `{"error": "Linly-Talker-Stream 未启动", "status": "unavailable"}`
- **AND** the frontend displays a clear error message without white screen

### Requirement: Configuration
The system SHALL support environment variables for cabinet mode and Linly stream URL.

#### Scenario: Environment variables are defined
- **WHEN** `.env.example` is checked
- **THEN** `VITE_CABINET_MODE=3d|2d|auto` is documented (default: `auto`)
- **AND** `LINLY_STREAM_URL` is documented (default: `http://localhost:8000`)
- **AND** `backend/config.py` reads `LINLY_STREAM_URL` from environment