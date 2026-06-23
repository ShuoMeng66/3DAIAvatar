"""
陪聊增强服务
提供天气查询、吃药提醒、重复问题检测、情绪关键词共情等功能。
"""

import re
import json
import os
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, List
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)


class CompanionService:
    """陪聊增强服务"""

    def __init__(self, config: dict):
        self.config = config
        self.weather_api_key = config.get("WEATHER_API_KEY", "")
        self.weather_base_url = config.get("WEATHER_BASE_URL", "https://devapi.qweather.com/v7/weather/now")
        self.recent_questions: List[str] = []  # 会话级别最近问题缓存
        self.max_recent = 3
        self._load_songs()

    # ========== 情绪关键词检测 ==========
    
    EMOTION_KEYWORDS = {
        "孤独": ["孤独", "孤单", "一个人", "没人陪", "寂寞"],
        "失眠": ["睡不着", "失眠", "睡不好", "难入睡", "半夜醒"],
        "想亲人": ["想孩子", "想孙子", "想女儿", "想儿子", "想家", "想念", "想他们"],
        "难过": ["难过", "不开心", "伤心", "哭", "想哭", "心里难受"],
        "身体不适": ["不舒服", "头晕", "头疼", "腰疼", "腿疼", "没力气"],
    }

    def detect_emotion(self, text: str) -> Optional[str]:
        """检测文本中的情绪关键词，返回情绪类型或 None"""
        text_lower = text.lower()
        for emotion, keywords in self.EMOTION_KEYWORDS.items():
            for kw in keywords:
                if kw in text_lower:
                    return emotion
        return None

    def get_empathy_response(self, emotion: str) -> str:
        """根据情绪类型返回共情模板回复"""
        templates = {
            "孤独": "我理解您的心情，一个人待着确实会有些孤单。您随时都可以找我聊天，我就在这儿陪着您呢。要不要听听您喜欢的歌？",
            "失眠": "睡不着确实挺难受的。要不我给您哼个小曲儿？或者咱们聊聊以前的事儿，说着说着可能就有睡意了。",
            "想亲人": "哎，想念亲人是很正常的。您跟我讲讲他们的故事吧，您一说起来肯定特别开心。他们一定也很想您呢。",
            "难过": "听到您不开心，我也挺担心的。不过没关系，有什么事儿您跟我说说，说出来心里会好受些。",
            "身体不适": "身体不舒服可不能马虎，您先歇着，如果有需要还是得去医院看看。要不要我给您倒杯热水？",
        }
        return templates.get(emotion, "嗯，我听着呢，您慢慢说。")

    # ========== 重复问题检测 ==========

    def check_repeat_question(self, question: str) -> Optional[str]:
        """
        检测是否重复提问，返回差异化回答或 None
        使用文本相似度比较
        """
        for prev_q in self.recent_questions:
            similarity = SequenceMatcher(None, question, prev_q).ratio()
            if similarity > 0.6:
                # 找到重复，返回不同回答
                repeat_responses = {
                    "天气": "嗯，刚才说过了，今天天气还不错呢。不过您要是想再听一遍，我再给您说说。",
                    "吃饭": "您吃了就好，要记得按时吃饭，身体最重要。",
                    "睡觉": "睡眠很重要，您要是睡不着咱们聊聊天，说说话就困了。",
                }
                for key, resp in repeat_responses.items():
                    if key in question or key in prev_q:
                        return resp
                return "嗯，我记得您刚才问过。我再跟您说说，这次换个说法..."
        
        # 添加到缓存
        self.recent_questions.append(question)
        if len(self.recent_questions) > self.max_recent:
            self.recent_questions.pop(0)
        
        return None

    def clear_history(self):
        """清空问题缓存（新会话时调用）"""
        self.recent_questions.clear()

    # ========== 天气查询 ==========

    def check_weather_intent(self, text: str) -> bool:
        """检测是否包含天气查询意图"""
        patterns = [
            r"天气", r"气温", r"温度", r"冷不冷", r"热不热",
            r"下雨", r"下雪", r"刮风", r"出门",
        ]
        return any(re.search(p, text) for p in patterns)

    async def query_weather(self, city: str = "北京") -> str:
        """
        查询天气（占位实现）
        实际需要和风天气 API Key
        """
        if not self.weather_api_key:
            return f"嗯，{city}今天的天气还不错呢，不过具体的天气预报需要连上网才能查。您出门的话记得看看窗外哦。"
        
        # TODO: 实际 API 调用
        # async with aiohttp.ClientSession() as session:
        #     params = {"key": self.weather_api_key, "location": city}
        #     async with session.get(self.weather_base_url, params=params) as resp:
        #         data = await resp.json()
        #         return f"{city}今天{data['now']['text']}，气温{data['now']['temp']}度。"
        
        return f"{city}今天天气还不错，适合出去走走。不过早晚温差大，您出门记得多穿一件。"

    # ========== 吃药提醒 ==========

    def check_medication_reminder(self) -> Optional[str]:
        """检查当前时间是否有吃药提醒，返回提醒文本或 None"""
        now = datetime.now().strftime("%H:%M")
        reminders = self._get_reminders()
        for r in reminders:
            if r["time"] == now:
                return f"到时间了，该吃药了哦。{r.get('text', '')}"
        return None

    def _get_reminders(self) -> list:
        """获取提醒列表（从配置文件或环境变量）"""
        # 占位实现：后续从数据库读取
        return [
            {"time": "08:00", "text": "早饭后的药"},
            {"time": "12:00", "text": "午饭后的药"},
            {"time": "20:00", "text": "晚饭后的药"},
        ]

    # ========== 经典歌曲 ==========

    def _load_songs(self):
        """加载经典歌曲列表"""
        songs_path = Path(__file__).parent.parent / "data" / "classic_songs.json"
        if songs_path.exists():
            with open(songs_path, "r", encoding="utf-8") as f:
                self.songs = json.load(f)
        else:
            self.songs = {"old_songs": [], "opera": []}

    def get_random_song_topic(self) -> str:
        """获取随机歌曲话题"""
        import random
        all_songs = self.songs.get("old_songs", [])
        all_opera = self.songs.get("opera", [])
        
        if all_songs and random.random() < 0.6:
            song = random.choice(all_songs)
            return f"您还记得{song['name']}这首歌吗？{song.get('singer', '')}唱的，以前可流行了。"
        elif all_opera:
            opera = random.choice(all_opera)
            return f"您喜欢听{opera['name']}吗？这是{opera.get('type', '戏曲')}里的经典段子。"
        return "您最近有没有听什么好听的歌呀？"

    # ========== 空闲问候 ==========

    def get_idle_greeting(self, elder_title: str = "奶奶") -> str:
        """获取空闲问候语"""
        hour = datetime.now().hour
        if hour < 6:
            return f"{elder_title}，这么早就醒了？天还没亮呢，再睡会儿吧。"
        elif hour < 9:
            return f"{elder_title}，早上好呀！今天早上吃了吗？"
        elif hour < 12:
            return f"{elder_title}，我在呢，想聊点什么？今天天气不错呢。"
        elif hour < 14:
            return f"{elder_title}，中午好！午饭吃了吗？要记得按时吃饭。"
        elif hour < 18:
            return f"{elder_title}，下午好！有没有出去走走？"
        else:
            return f"{elder_title}，晚上好！我在呢，想聊点什么？"