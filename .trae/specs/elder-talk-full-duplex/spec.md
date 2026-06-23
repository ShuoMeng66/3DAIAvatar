# 实时全双工对话与 Barge-in Spec

## Why
当前 ElderTalk 是「按轮对话」（用户说一句→数字人回一句），不自然。本 Session 实现「像真人一样聊天」：数字人说话时可被用户打断（barge-in），VAD 实时检测语音活动，流式 LLM 输出降低延迟，并增加主动陪聊能力（天气、提醒、情绪感知）。

## What Changes
- **前端**：引入 VAD 库（@ricky0123/vad-web），实现对话状态机（IDLE→LISTENING→THINKING→SPEAKING），支持 barge-in 打断
- **后端**：新增 `companion.py` 陪聊增强服务（天气查询、吃药提醒、重复问题检测、情绪关键词共情）
- **延迟优化**：流式 LLM token 输出、首字延迟目标 <2s、预加载数字人特征
- **素材搜索**：免费天气 API 集成、经典老歌/戏曲列表、环境白噪音
- **文档**：PERFORMANCE.md（各环节耗时记录）、record_demo.sh（演示录制脚本）

## Impact
- Affected specs: elder-talk-frontend（对话状态机改造）、elder-talk-backend-integration（新增 companion 服务）
- Affected code:
  - `frontend/src/` — 新增状态机、VAD 集成、打断逻辑
  - `backend/services/companion.py` — 全新陪聊增强服务
  - `backend/services/llm_adapter.py` — 流式输出支持
  - `backend/config.py` — 新增天气 API、提醒等配置

## ADDED Requirements

### Requirement: 全双工对话与 Barge-in
系统 SHALL 支持用户说话时打断数字人播放，实现自然全双工对话。

#### Scenario: 用户打断数字人
- **WHEN** 数字人正在 SPEAKING 状态（TTS + Avatar 播放中）
- **AND** 用户开口说话（VAD 检测到语音活动）
- **THEN** 系统发送 interrupt 信号 → 停止 TTS/Avatar → 切换到 LISTENING 状态

### Requirement: 前端对话状态机
系统 SHALL 实现五态状态机：IDLE → LISTENING → THINKING → SPEAKING → IDLE，SPEAKING 中用户开口 → INTERRUPTING → LISTENING。

#### Scenario: 状态流转
- **WHEN** 用户按下语音按钮
- **THEN** 状态从 IDLE → LISTENING
- **WHEN** 用户松手或静音超时
- **THEN** 状态从 LISTENING → THINKING
- **WHEN** LLM 开始返回流式输出
- **THEN** 状态从 THINKING → SPEAKING
- **WHEN** 播放完毕
- **THEN** 状态回到 IDLE

### Requirement: VAD 语音活动检测
系统 SHALL 在前端集成 VAD（Voice Activity Detection）库，支持实时检测用户是否在说话。

#### Scenario: VAD 检测
- **WHEN** 用户说话
- **THEN** VAD 触发 speech 事件
- **WHEN** 用户停止说话
- **THEN** VAD 触发 silence 事件（静音超时后自动结束）

### Requirement: 陪聊增强服务
系统 SHALL 在 `backend/services/companion.py` 中提供以下能力：
- 天气查询：集成免费国内天气 API（和风天气/高德天气），支持城市名查询
- 吃药提醒：到点 TTS 播报提醒
- 重复问题检测：同一问题 3 次内给相似但略不同的回答
- 情绪关键词检测：「孤独」「睡不着」「想孩子」等触发共情模板

#### Scenario: 天气查询
- **WHEN** 用户问「今天天气怎么样」
- **THEN** 系统调用天气 API，返回该城市天气信息

#### Scenario: 情绪共情
- **WHEN** 用户说「我睡不着」
- **THEN** 系统触发共情模板，先安慰再转移话题

### Requirement: 延迟优化
系统 SHALL 优化对话延迟，首字延迟目标 <2s。
- 流式 LLM 输出：token stream → 分段 TTS
- 预加载数字人特征：固定 avatar 不重复 extract
- PERFORMANCE.md 记录各环节耗时（VAD → ASR → LLM → TTS → Avatar）

### Requirement: 主动问候与提醒
系统 SHALL 支持空闲时主动问候和定时提醒。

#### Scenario: 空闲问候
- **WHEN** 30 秒无交互
- **THEN** 数字人主动问候

#### Scenario: 吃药提醒
- **WHEN** 设置提醒时间到点
- **THEN** TTS 播报「该吃药了」

### Requirement: 素材搜索
系统 SHALL 搜索并集成以下素材：
- 免费国内天气 API 适配（和风天气 Dev API / 高德天气 API）
- 中国经典老歌/戏曲名列表 JSON（用于主动聊话题）
- 10 秒环境白噪音音频（可选播放）

### Requirement: 文档
系统 SHALL 提供：
- PERFORMANCE.md：各环节耗时记录和优化目标
- record_demo.sh：演示录制脚本（使用 ffmpeg 录屏 + 录音）

## REMOVED Requirements
无

## MODIFIED Requirements
### Requirement: 对话接口（原有）
对话接口从「一次性请求/响应」升级为「流式 token 输出」，适配 barge-in 打断逻辑。