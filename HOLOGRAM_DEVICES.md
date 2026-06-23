# 全息屏设备兼容性文档

## 设备分类

### 第一类：TF 卡 / U 盘播放型

最常见的全息风扇屏，通过 TF 卡存储视频，开机自动循环播放。

| 品牌 | 型号示例 | 分辨率 | 格式 | 控制方式 |
|------|---------|--------|------|---------|
| 通用 3D LED Fan | 42cm / 52cm / 65cm | 512×512 | MP4 | TF 卡 + 遥控器 |
| HY-3D 全息广告机 | HY-42 / HY-52 | 512×512 | MP4/MOV | TF 卡 + APP |
| 麦田科技 | MT-3D-42 | 512×512 | MP4 | TF 卡 + PC 软件 |
| WOW! Hologram | WOW-42 | 480×480 | MP4/AVI | TF 卡 |
| HoloFan | HF-42 | 512×512 | MP4 | TF 卡 |

**适配方式**：`GenericMP4Device` — 导出 MP4 → 拷贝到 TF 卡

### 第二类：WiFi APP 控制型

通过 WiFi 连接手机 APP 上传和管理视频。

| 品牌 | APP 名称 | 协议 | 备注 |
|------|---------|------|------|
| 3D LED FAN | 3D LED FAN | HTTP (80) | 部分型号支持 HTTP API |
| HY-3D | HY-3D 全息屏 | HTTP (80) | 扫码下载 APP |
| HoloPlay | HoloPlay | HTTP (8080) | 支持批量管理 |
| MagiLED | MagiLED | HTTP (80) | 支持远程更新 |

**适配方式**：`HologramFanAppDevice` — HTTP API 上传

### 第三类：HDMI / RTSP 流媒体型

高端型号，支持实时视频流输入，延迟 1-3 秒。

| 品牌 | 输入接口 | 协议 | 分辨率 |
|------|---------|------|--------|
| 高端全息屏 | HDMI IN | — | 取决于输入 |
| RTSP 中转盒 | 网络 | RTSP | 可配置 |
| VLC 全屏输出 | HDMI 显卡 | RTSP 拉流 | 512×512 |
| 局域网 CMS | 网络 | RTSP/HLS | 可配置 |

**适配方式**：`HDMIRTSPDevice` — mediamtx + ffmpeg RTSP 推流

## 通用全息视频规格

所有设备通用的全息视频参数：

```
容器：MP4
编码：H.264 (High Profile)
分辨率：512×512（推荐）/ 1024×1024（高清）/ 256×256（低端）
帧率：25 fps（推荐）/ 30 fps
像素格式：yuv420p
比特率：2-5 Mbps
背景：纯黑 #000000
音频：无（蓝牙音箱独立输出）
文件命名：英文 + 数字，无特殊字符
```

## 各品牌差异速查

### 3D LED FAN 系列
```
分辨率：512×512
格式：MP4
文件大小：≤ 500MB
命名：hologram_001.mp4
播放：按文件名排序循环
```

### HY-3D 系列
```
分辨率：512×512（部分型号 1024×1024）
格式：MP4 / MOV
文件大小：≤ 1GB
命名：支持中文
播放：APP 管理播放列表
```

### 麦田科技
```
分辨率：512×512
格式：MP4
文件大小：≤ 2GB
命名：建议英文
播放：PC 软件 / TF 卡
```

## 局域网 HTTP API 尝试路径

如果设备支持 WiFi 且连接到了局域网，尝试以下 API：

```bash
# 上传文件
curl -X POST -F "file=@video.mp4" http://DEVICE_IP/upload
curl -X POST -F "file=@video.mp4" http://DEVICE_IP/api/upload
curl -X POST -F "file=@video.mp4" http://DEVICE_IP:8080/upload

# 获取状态
curl http://DEVICE_IP/status
curl http://DEVICE_IP/api/status

# 获取文件列表
curl http://DEVICE_IP/files
curl http://DEVICE_IP/api/files

# 删除文件
curl -X POST http://DEVICE_IP/delete?file=video.mp4
```

## 部署建议

### 养老院/医院多设备场景
1. 每台全息屏分配固定 IP 地址
2. 使用局域网 CMS 统一管理
3. 定时推送不同的陪伴内容（早间问候、午间提醒、晚间故事）
4. 通过监控设备状态确保正常运行

### 家庭单设备场景
1. TF 卡导出最简单可靠
2. 准备 2-3 张 TF 卡轮换更新内容
3. 蓝牙音箱放在设备旁，避免风扇噪音干扰
4. 设备高度 1.2-1.5m（老人视线高度）