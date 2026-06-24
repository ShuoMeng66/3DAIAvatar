# Session 7E：全息仓控制面板 + 双屏部署 + 文档 Spec

## Why
Session 7A–7D 完成了全息仓展示页的完整功能链路（3D 场景 → WebRTC → SSE 同步）。本 Session 做部署收尾：改造 HologramPage 为全息仓控制面板、编写一键部署脚本、完善三份文档，确保项目可交付。

## What Changes
- **重构** `frontend/src/pages/HologramPage.tsx`：从 LED 风扇 MP4 导出页改为全息仓控制面板
- **新增** `scripts/start_cabinet.ps1`：Windows 一键启动脚本
- **新增** `scripts/start_cabinet.sh`：Linux/macOS 一键启动脚本
- **修改** `HOLOGRAM_CABINET.md`：补充双屏步骤、故障排查
- **修改** `HOLOGRAM.md`：顶部添加警告，指向全息仓文档
- **修改** `README.md`：增加全息仓 vs LED 风扇 FAQ
- **新增** `SESSION_7E_DONE.md`：本次 Session 完成记录
- **新增** `SESSION_7_DONE.md`：Session 7 全系列汇总

## Impact
- Affected specs: session-7a 到 7d 全部
- Affected code: `frontend/src/pages/HologramPage.tsx`
- New files: `scripts/start_cabinet.ps1`, `scripts/start_cabinet.sh`, `SESSION_7E_DONE.md`, `SESSION_7_DONE.md`
- Modified docs: `HOLOGRAM_CABINET.md`, `HOLOGRAM.md`, `README.md`

## ADDED Requirements

### Requirement: 全息仓控制面板
The system SHALL provide a control panel page for managing the hologram cabinet display.

#### Scenario: Control panel layout
- **WHEN** user navigates to `/#/hologram`
- **THEN** the page shows a two-column layout: left side `/chat` preview, right side `/cabinet` iframe preview (9:16 black frame)
- **AND** buttons are present: "新窗口打开展示页" and "复制副屏启动命令"
- **AND** LED fan related UI (512 resolution, TF card, device IP) is collapsed under "高级 / LED 风扇模式" section

#### Scenario: Open cabinet in new window
- **WHEN** user clicks "新窗口打开展示页"
- **THEN** `window.open('/#/cabinet', '_blank', 'width=1440,height=2560')` is called
- **AND** the new window is sized for the 9:16 display

#### Scenario: Copy secondary screen command
- **WHEN** user clicks "复制副屏启动命令"
- **THEN** the Chrome kiosk command is copied to clipboard:
  `chrome.exe --kiosk --window-position=1920,0 --window-size=1440,2560 --app=http://localhost:5173/#/cabinet`
- **AND** a toast confirms the copy

### Requirement: Deployment Scripts
The system SHALL provide one-click startup scripts for both Windows and Linux.

#### Scenario: Windows startup script
- **WHEN** `start_cabinet.ps1` is executed
- **THEN** the script starts backend (`uvicorn`) in a new terminal
- **AND** starts frontend dev server (`npm run dev`) in a new terminal
- **AND** opens the main display (`http://localhost:5173/#/chat`) in the default browser
- **AND** prints the Chrome kiosk command for the secondary display

#### Scenario: Linux startup script
- **WHEN** `start_cabinet.sh` is executed
- **THEN** the script starts backend in background
- **AND** starts frontend dev server in background
- **AND** opens the main display URL
- **AND** prints the Chrome kiosk command for the secondary display

### Requirement: Documentation Updates
The system SHALL have complete and accurate documentation for both hologram types.

#### Scenario: HOLOGRAM_CABINET.md is complete
- **WHEN** reading HOLOGRAM_CABINET.md
- **THEN** sections include: hardware specs, black background rules, dual-screen setup steps, troubleshooting
- **AND** the "后续计划" checklist is updated to reflect completed items

#### Scenario: HOLOGRAM.md has warning
- **WHEN** reading the top of HOLOGRAM.md
- **THEN** a warning box states: "本文档仅适用于 LED 风扇屏，全息仓请见 HOLOGRAM_CABINET.md"
- **AND** clarifies that the cabinet does NOT require `python -m hologram.converter`

#### Scenario: README.md has FAQ
- **WHEN** reading the FAQ section
- **THEN** a new entry explains the difference between hologram cabinet and LED fan
- **AND** links to HOLOGRAM_CABINET.md for cabinet setup

### Requirement: Session Summary
The system SHALL have a comprehensive summary of all Session 7 work.

#### Scenario: SESSION_7_DONE.md
- **WHEN** reading SESSION_7_DONE.md
- **THEN** it summarizes 7A through 7E with key deliverables
- **AND** lists known limitations
- **AND** suggests topics for Session 8