# ElderTalk 全息屏适配规范

## 概述
本项目输出适配 3D LED 全息风扇屏的视频内容，用于在物理空间中展示数字人形象。
全息风扇屏通过高速旋转的 LED 灯条显示图像，利用人眼视觉暂留效应呈现 3D 悬浮效果。

## 视频规格

### 分辨率
- 推荐：512×512 像素（正方形）
- 高清：1024×1024 像素（正方形）
- 部分设备支持 480×480、256×256

### 背景
- 颜色：纯黑 #000000（RGB: 0, 0, 0）
- 原理：全息风扇屏通过黑色区域实现"透明"效果，黑色像素不发光
- 注意：确保视频背景为纯黑，无渐变、无暗纹

### 画面构图
- 人物居中，半身像/胸像（头顶到胸部）
- 人物占画面高度的 60%-70%
- 人物底部对齐画面下边缘 10%-15% 处
- 避免人物边缘与背景产生模糊过渡

### 编码格式
- 容器：MP4
- 视频编码：H.264（High Profile）
- 比特率：2-5 Mbps
- 帧率：25-30 fps（推荐 25fps）
- 像素格式：yuv420p
- 音频：无音频轨道（全息屏通过独立蓝牙音箱输出声音）

### FFmpeg 编码示例
```bash
ffmpeg -i input.mp4 \
  -vf "crop=min(iw\\,ih):min(iw\\,ih):(iw-min(iw\\,ih))/2:(ih-min(iw\\,ih))/2,scale=512:512" \
  -c:v libx264 -preset medium -crf 23 \
  -pix_fmt yuv420p -r 25 -an \
  output_hologram.mp4
```

## 推送方式

### 方式一：TF 卡 / U 盘
- 将视频文件拷贝到 TF 卡/U 盘
- 插入全息屏设备的 TF 卡槽
- 通过设备自带遥控器或 APP 播放
- 适用场景：定时播放（如整点报时）、固定内容循环

### 方式二：WiFi APP 推送
- 全息屏设备连接 WiFi
- 通过厂商配套 APP（如"3D全息屏"、"HoloPlay"等）上传视频
- 支持远程管理和批量推送
- 适用场景：远程内容更新、多设备管理

### 方式三：局域网 CMS 推送
- 全息屏设备连接局域网
- 通过 CMS（内容管理系统）管理播放列表
- 支持 HTTP/FTP 上传
- 适用场景：养老院/医院内部多设备统一管理

### 方式四：HDMI 实时流（高级）
- 部分高端全息屏支持 HDMI IN 接口
- 通过 RTSP 实时推流（需 RTSP 服务器中转）
- 延迟约 1-3 秒
- 适用场景：实时对话场景的数字人全息展示
- FFmpeg RTSP 推流示例：
```bash
ffmpeg -re -i input.mp4 \
  -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=512:512" \
  -c:v libx264 -preset ultrafast -tune zerolatency \
  -pix_fmt yuv420p -r 25 -an \
  -f rtsp rtsp://设备IP:8554/stream
```

## 设备兼容性

### 常见全息风扇屏品牌
- Hologram Fan (3D LED Fan)
- WOW! 3D Hologram Fan
- HY-3D 全息广告机
- 麦田科技 3D 全息风扇屏

### 兼容性注意事项
- 不同设备支持的视频格式可能略有差异，建议先测试小样
- 部分设备要求文件名不含中文和特殊字符
- 部分设备对视频时长有限制（通常 ≤ 5 分钟）
- 建议设备端使用独立蓝牙音箱，避免风扇噪音干扰

## 搜索关键词
- "hologram fan video format black background"
- "3D LED fan video specifications"
- "全息风扇屏 视频格式 黑底"
- "3D全息广告机 视频制作规范"

---

## 陪老人场景的全息部署建议

### 设备摆放
- **高度**：全息屏中心离地 1.2–1.5m，与老人坐姿视线齐平
- **距离**：设备距老人 1.5–2.5m，不宜过近（风扇噪音）或过远（看不清）
- **角度**：正面朝向老人，避免侧视导致画面变形
- **环境光**：避免阳光直射或强顶灯照射屏幕，全息屏在暗光环境下效果最佳
- **固定**：使用三脚架或壁挂支架，确保稳定不晃动

### 音频方案
- **蓝牙音箱**：放在设备旁边（非设备正下方），同步延迟 < 200ms
- **避免自带喇叭**：全息风扇屏自带喇叭音质差且有风扇噪音
- **音量**：适中偏大（老人听力可能下降），建议 60-75dB
- **夜间模式**：音量自动降低 30%，避免惊吓

### 内容策略
- **默认动画**：半身像 + 缓慢轻微点头动画（每 3-5 秒一次）
- **早间模式**（6:00-9:00）：问候 + 天气预报 + 吃药提醒
- **日间模式**（9:00-18:00）：闲聊 + 老歌话题 + 回忆往事
- **晚间模式**（18:00-22:00）：轻声陪伴 + 故事 + 助眠引导
- **夜间模式**（22:00-6:00）：降低亮度至 40%，对话语气更轻柔，仅响应主动呼叫

### 多设备场景（养老院）
- 每台设备分配固定 IP，通过局域网 CMS 统一管理
- 中央服务器定时推送不同内容
- 监控设备在线状态，异常时自动告警
- 家属可通过小程序远程查看老人互动记录

### 维护清单
- 每周检查 TF 卡读写状态
- 每月清洁风扇叶片（断电后操作）
- 每季度更新视频内容
- 备 1-2 张 TF 卡轮换使用

---

## 全息模块使用指南

### 视频转换
```bash
# 基本转换
python -m hologram.converter input.mp4 -o hologram.mp4 -r 512

# 高清 + 保留音频
python -m hologram.converter input.mp4 -o hologram.mp4 -r 1024 --keep-audio

# 使用 rembg 自动抠图（需 GPU）
python -m hologram.converter input.mp4 -o hologram.mp4 --rembg
```

### RTSP 推流
```bash
# 启动 mediamtx（RTSP 服务器）
docker run -d --network=host bluenviron/mediamtx

# 开始推流
python -m hologram.streamer rtsp input.mp4

# 测试播放
ffplay -rtsp_transport tcp rtsp://localhost:8554/hologram
```

### Watch Folder 模式
```bash
python -m hologram.streamer watch input.mp4 --dir /mnt/tfcard/
```