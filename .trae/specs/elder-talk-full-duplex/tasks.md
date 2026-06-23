# Tasks: 实时全双工对话与 Barge-in

- [x] Task 1: 前端集成 VAD 语音活动检测
- [x] Task 2: 实现对话状态机 useConversationState
- [x] Task 3: 实现 Barge-in 打断逻辑
- [x] Task 4: 创建后端陪聊增强服务 companion.py
- [x] Task 5: 经典老歌/戏曲列表与天气 API 搜索
- [x] Task 6: 后端流式 LLM 输出支持
- [x] Task 7: 更新前端 ChatPage 集成状态机
- [x] Task 8: 延迟优化与数字人特征预加载
- [x] Task 9: 编写文档和脚本

# Task Dependencies
- Task 2 依赖 Task 1（状态机需要 VAD 事件作为输入）
- Task 3 依赖 Task 1, Task 2（打断需要 VAD + 状态机协作）
- Task 5 可独立执行
- Task 6 可独立执行
- Task 7 依赖 Task 1, Task 2, Task 3（ChatPage 改造需要全部就绪）
- Task 8 可独立执行
- Task 9 依赖所有 Task 完成后

# Parallelizable
- Task 1, Task 4, Task 5, Task 6, Task 8 可并行执行
- Task 2, Task 3 在 Task 1 完成后可并行执行
- Task 7 在 Task 1-3 完成后执行
- Task 9 最后执行