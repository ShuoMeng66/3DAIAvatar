# Session 7D：控制端与全息仓同步（SSE + 字幕 + 口型）Spec

## Why
Session 7C 完成了 WebRTC 信令，但控制端 `/chat` 与展示端 `/cabinet` 之间缺乏同步机制。老人使用的 `/cabinet` 全息仓需要实时显示对话字幕、播放 TTS 音频、驱动 VRM 口型动画，而家属/志愿者在 `/chat` 控制端操作。本 Session 通过 SSE 事件流 + 后端广播实现双端同步。

## What Changes
- **新增** `backend/routers/cabinet.py`：SSE 事件流端点 + 事件广播器
- **修改** `backend/routers/chat.py`：对话完成后生成 TTS 音频并广播 SSE 事件
- **修改** `backend/routers/interrupt.py`：打断时广播 SSE `interrupt` 事件
- **修改** `backend/main.py`：注册 cabinet 路由
- **新增** `frontend/src/hooks/useCabinetSync.ts`：SSE 订阅 + 事件分发
- **修改** `frontend/src/pages/CabinetPage.tsx`：集成 useCabinetSync，驱动字幕 + 音频 + 口型
- **修改** `frontend/src/components/cabinet/CabinetSubtitle.tsx`：增加 text-shadow 样式
- **修改** `frontend/src/components/cabinet/CabinetScene.ts`：新增 VRM 口型动画方法
- DI 新增：`edge-tts`（TTS 降级生成音频）、`sse-starlette`（SSE 服务端）

## Impact
- Affected specs: session-7c-webrtc-signaling, session-7b-threejs-vrm-scene
- Affected code: `backend/routers/chat.py`, `backend/routers/interrupt.py`, `backend/main.py`, `frontend/src/pages/CabinetPage.tsx`, `frontend/src/components/cabinet/CabinetScene.ts`, `frontend/src/components/cabinet/CabinetSubtitle.tsx`
- New files: `backend/routers/cabinet.py`, `frontend/src/hooks/useCabinetSync.ts`

## ADDED Requirements

### Requirement: SSE 事件流
The system SHALL provide a Server-Sent Events endpoint for the cabinet display page to receive real-time synchronization events.

#### Scenario: Cabinet page subscribes to SSE
- **WHEN** `GET /api/v1/cabinet/events` is called
- **THEN** an SSE stream is established with `Content-Type: text/event-stream`
- **AND** the connection stays open for continuous event delivery
- **AND** initial `state` event is sent immediately with current status

#### Scenario: SSE events broadcast
- **WHEN** the chat backend generates a response
- **THEN** a `subtitle` event containing the reply text is broadcast to all SSE clients
- **WHEN** TTS audio is ready
- **THEN** a `speak_start` event containing `audio_url` is broadcast
- **WHEN** TTS playback ends
- **THEN** a `speak_end` event is broadcast
- **WHEN** interrupt is triggered
- **THEN** an `interrupt` event is broadcast with `{"action": "stop"}`

### Requirement: TTS Audio Generation
The system SHALL generate TTS audio files from the LLM reply and serve them via static URL.

#### Scenario: TTS audio generation via edge-tts
- **WHEN** a chat response is generated and no real TTS engine is configured
- **THEN** the backend uses `edge-tts` to generate a `.wav` file
- **AND** the file is saved to `backend/data/audio/`
- **AND** the `audio_url` returned points to the static file path

#### Scenario: TTS audio URL in chat response
- **WHEN** `/api/v1/chat/text` or `/api/v1/chat/voice` returns a response
- **THEN** the response JSON includes `audio_url` field
- **AND** `audio_url` is a valid URL to the generated WAV file

### Requirement: Cabinet Sync Hook
The system SHALL provide a React hook that subscribes to the SSE event stream and dispatches events to the cabinet page.

#### Scenario: Hook subscribes to SSE
- **WHEN** `useCabinetSync()` is called in CabinetPage
- **THEN** an EventSource connection is opened to `/api/v1/cabinet/events`
- **AND** the hook exposes `subtitle`, `audioUrl`, `isSpeaking`, `isInterrupted` state
- **AND** on `subtitle` event, the subtitle text is updated
- **AND** on `speak_start` event, `audioUrl` is set and `isSpeaking` becomes true
- **AND** on `speak_end` event, `isSpeaking` becomes false
- **AND** on `interrupt` event, audio playback stops and `isInterrupted` becomes true
- **AND** automatically reconnects on SSE disconnect

### Requirement: VRM Mouth Animation
The system SHALL drive VRM mouth animation based on audio playback state.

#### Scenario: Mouth opens when speaking
- **WHEN** `isSpeaking` is true
- **THEN** the VRM model's mouth blend shape (e.g., `A`, `I`, `U`, `E`, `O`) is animated
- **AND** the animation uses a simple volume-based approach (oscillate mouth openness)
- **AND** mouth resets to closed when `isSpeaking` becomes false

#### Scenario: Mouth resets on interrupt
- **WHEN** an `interrupt` event is received
- **THEN** the VRM mouth blend shapes reset to neutral (closed)
- **AND** any playing audio is stopped

### Requirement: Subtitle Styling
The system SHALL display subtitles with text-shadow for better readability on black background.

#### Scenario: Subtitle with text-shadow
- **WHEN** a subtitle is displayed
- **THEN** the text is white `#ffffff` with `text-shadow: 0 0 12px rgba(255, 255, 255, 0.3)`
- **AND** minimum font size is 36px
- **AND** background is pure black `#000000`