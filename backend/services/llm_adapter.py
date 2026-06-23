"""
LLM Adapter 服务
封装 LLM 调用，支持 DeepSeek API 和本地 Qwen 模型。
加载 System Prompt，提供统一的对话接口。
"""

import os
from pathlib import Path
from typing import Optional, List, Dict
import logging

logger = logging.getLogger(__name__)


class LLMAdapter:
    """LLM 适配器，统一 LLM 调用接口"""

    def __init__(self, config: dict):
        """
        初始化 LLM 适配器
        
        Args:
            config: 配置字典，包含 api_key, model, base_url 等
        """
        self.config = config
        self.api_key = config.get("api_key", "")
        self.model = config.get("model", "deepseek-chat")
        self.base_url = config.get("base_url", "https://api.deepseek.com")
        self.system_prompt = self._load_system_prompt()
        logger.info(f"LLM 适配器初始化: model={self.model}")

    def _load_system_prompt(self) -> str:
        """
        加载 System Prompt
        从 prompts/elder_companion.txt 读取
        """
        prompt_path = Path(__file__).parent.parent / "prompts" / "elder_companion.txt"
        if prompt_path.exists():
            with open(prompt_path, "r", encoding="utf-8") as f:
                return f.read()
        logger.warning(f"System Prompt 文件不存在: {prompt_path}")
        return "你是一个温暖贴心的陪伴助手。"

    def chat(
        self,
        message: str,
        history: Optional[List[Dict[str, str]]] = None,
        session_id: str = "default",
    ) -> dict:
        """
        发送对话消息，获取 LLM 回复
        
        Args:
            message: 用户输入文本
            history: 对话历史列表 [{"role": "user", "content": "..."}, ...]
            session_id: 会话 ID
        
        Returns:
            {"reply": "回复文本", "session_id": "...", "status": "ok"}
        """
        # 构建消息列表
        messages = [{"role": "system", "content": self.system_prompt}]
        
        if history:
            messages.extend(history)
        
        messages.append({"role": "user", "content": message})
        
        # 占位实现：后续接入真实 API 调用
        # 实际调用示例（DeepSeek API）:
        # import openai
        # client = openai.OpenAI(api_key=self.api_key, base_url=self.base_url)
        # response = client.chat.completions.create(
        #     model=self.model,
        #     messages=messages,
        #     temperature=0.7,
        #     max_tokens=512,
        # )
        # reply = response.choices[0].message.content
        
        # 占位回复
        reply = self._generate_placeholder_reply(message)
        
        logger.info(f"对话回复: session={session_id}, message_len={len(message)}, reply_len={len(reply)}")
        
        return {
            "reply": reply,
            "session_id": session_id,
            "status": "ok",
        }

    def _generate_placeholder_reply(self, message: str) -> str:
        """生成占位回复（后续替换为真实 LLM 调用）"""
        # 简单的占位回复逻辑
        greetings = ["你好", "您好", "嗨", "早上好", "下午好", "晚上好"]
        if any(g in message for g in greetings):
            return "您好呀，我是小暖。今天过得怎么样？吃饭了吗？"
        
        weather_keywords = ["天气", "气温", "冷", "热", "下雨", "刮风"]
        if any(k in message for k in weather_keywords):
            return "嗯，天气确实很重要。您要多注意保暖，出门记得带件外套哦。"
        
        return f"嗯，我听着呢。您说的我都记在心里了。还有什么想跟我聊聊的吗？"


# 单例模式
_llm_adapter: Optional[LLMAdapter] = None


def get_llm_adapter(config: Optional[dict] = None) -> LLMAdapter:
    """获取 LLM 适配器单例"""
    global _llm_adapter
    if _llm_adapter is None and config is not None:
        _llm_adapter = LLMAdapter(config)
    return _llm_adapter