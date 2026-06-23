# 素材替换与使用指南

## 目录结构

```
assets/
├── avatars/          # 数字人形象
│   ├── MANIFEST.json
│   ├── grandma_warm/  # 慈祥奶奶
│   ├── grandpa_kind/  # 慈祥爷爷
│   ├── young_girl/    # 孙女小暖
│   └── caregiver/     # 护工志愿者
├── voices/           # 声音模型
│   ├── MANIFEST.json
│   ├── reference/    # 参考音频
│   └── custom/       # 自定义克隆声音
├── animations/       # 动画素材
│   ├── MANIFEST.json
│   └── idle_breathing.css
└── topics/           # 陪聊话题库
    └── companion_topics.json
```

## 如何替换数字人形象

### 1. 下载新形象

从 Pixabay 免费下载（CC0 可商用）：
- 慈祥女性：https://pixabay.com/photos/search/elderly%20woman%20smile/
- 慈祥男性：https://pixabay.com/photos/search/elderly%20man%20smile/
- 年轻女性：https://pixabay.com/photos/search/young%20woman%20smile%20portrait/
- 护工/志愿者：https://pixabay.com/photos/search/nurse%20smile/

### 2. 放入对应目录

```bash
# 例如替换慈祥奶奶
cp ~/Downloads/new_grandma.jpg assets/avatars/grandma_warm/source.jpg
```

### 3. 运行预处理

```bash
# 生成 SadTalker / MuseTalk 缓存文件
python backend/scripts/preprocess_avatar.py \
    --input assets/avatars/grandma_warm/source.jpg \
    --output assets/avatars/grandma_warm/
```

### 4. 图片质量要求

| 要求 | 说明 |
|------|------|
| 分辨率 | ≥ 512×512 |
| 角度 | 正面或微侧（偏转 < 30°） |
| 光照 | 均匀，无强烈阴影 |
| 表情 | 自然微笑，嘴闭合 |
| 背景 | 简洁或可去除 |
| 眼镜 | 尽量避免，或无反光 |
| 妆容 | 自然，无夸张妆容 |

## 如何替换声音

### 使用 CosyVoice 3 秒克隆（推荐）

```bash
# 1. 准备 1-5 秒参考音频（WAV, 16kHz, 单声道）
# 2. 调用 API
curl -X POST http://localhost:8010/api/v1/voice/clone \
  -F "audio=@reference.wav" \
  -F "voice_name=家人的声音" \
  -F "engine=cosyvoice"
```

### 使用 GPT-SoVITS 微调（效果更好）

```bash
# 1. 准备 1 分钟以上录音 + 对应文字
# 2. 调用 API
curl -X POST http://localhost:8010/api/v1/voice/clone \
  -F "audio=@long_recording.wav" \
  -F "voice_name=家人的声音" \
  -F "engine=gpt_sovits" \
  -F "reference_text=录音的文字内容"
```

### 使用 Edge TTS（快速测试）

```bash
# 无需上传音频，直接使用微软云端语音
curl -X POST http://localhost:8010/api/v1/voice/clone \
  -F "voice_name=测试声音" \
  -F "engine=edge_tts"
```

## 如何添加新话题

编辑 `assets/topics/companion_topics.json`：

```json
{
  "id": 101,
  "title": "新歌名",
  "artist": "歌手",
  "year": 1980,
  "category": "classic_songs",
  "tags": ["标签1", "标签2"]
}
```

添加问候语：

```json
{
  "id": "g051",
  "time": "06:00-08:00",
  "text": "你的问候语内容",
  "tags": ["问候", "早晨"]
}
```

## 如何添加动画

### CSS 动画

编辑 `assets/animations/idle_breathing.css`，添加新的 keyframes：

```css
@keyframes myAnimation {
  0% { /* 起始状态 */ }
  100% { /* 结束状态 */ }
}

.animate-my {
  animation: myAnimation 2s ease-in-out infinite;
}
```

### Lottie 动画

1. 访问 https://lottiefiles.com/search?type=free
2. 搜索并下载免费动画 JSON
3. 放入 `assets/animations/`
4. 在组件中引用：

```tsx
import myAnimation from '@/assets/animations/my_animation.json';
<Lottie animationData={myAnimation} />
```

## 许可证说明

| 素材 | 来源 | 许可证 |
|------|------|--------|
| 数字人图片 | Pixabay | Pixabay Content License（免费可商用） |
| CosyVoice | 阿里通义实验室 | Apache 2.0 |
| GPT-SoVITS | GitHub | MIT |
| Edge TTS | 微软 | 免费非商业使用 |
| Lottie 动画 | LottieFiles | LottieFiles Free License |
| 歌曲列表 | 公共知识 | 仅作引用，无版权内容 |

## 家属定制流程

完整的「家人形象 + 家人声音」定制：

1. **上传照片**：正面照 → SadTalker 预处理 → 生成数字人形象
2. **上传录音**：1 分钟语音 → CosyVoice/GPT-SoVITS 克隆 → 生成声音
3. **组合使用**：前端选择家人形象 + 家人声音 → 数字人陪聊

```
前端 → 上传照片 + 录音
     ↓
后端 voice_clone 模块 → 预处理 + 克隆
     ↓
返回 avatar_id + voice_id
     ↓
前端 AvatarPlayer 使用新形象 → 新声音 TTS 播报
```