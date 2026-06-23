import { useState, useCallback } from 'react';
import { Monitor, Upload, Play, Square, Settings, Download, RotateCw } from 'lucide-react';

type StreamMode = 'idle' | 'streaming' | 'exporting';

interface HologramSettings {
  resolution: 256 | 512 | 1024;
  rotation: 0 | 90 | 180 | 270;
  deviceIp: string;
  fps: 25 | 30;
  brightness: number;
}

export default function HologramPage() {
  const [mode, setMode] = useState<StreamMode>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<HologramSettings>({
    resolution: 512,
    rotation: 0,
    deviceIp: '192.168.1.100',
    fps: 25,
    brightness: 0.05,
  });

  const handleExport = useCallback(() => {
    if (!selectedFile) return;
    setMode('exporting');
    // 模拟导出过程
    setTimeout(() => setMode('idle'), 3000);
  }, [selectedFile]);

  const handleStream = useCallback(() => {
    setMode('streaming');
  }, []);

  const handleStop = useCallback(() => {
    setMode('idle');
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  }, []);

  const statusText = {
    idle: '就绪',
    streaming: '推流中...',
    exporting: '导出中...',
  };

  const statusColor = {
    idle: 'text-warm-text-light',
    streaming: 'text-green-500 animate-pulse',
    exporting: 'text-warm-primary animate-pulse',
  };

  return (
    <div className="flex flex-col items-center h-full px-4 py-4 gap-4 overflow-y-auto">
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <Monitor size={32} className="text-warm-primary" />
        <h2 className="text-2xl font-bold">全息屏控制</h2>
      </div>

      {/* 双栏预览 */}
      <div className="flex gap-4 w-full max-w-3xl">
        {/* 左侧：标准预览 */}
        <div className="flex-1 flex flex-col items-center">
          <p className="text-sm text-warm-text-light mb-1">标准预览</p>
          <div className="w-full aspect-video bg-gray-200 rounded-xl flex items-center justify-center border-2 border-warm-border">
            {selectedFile ? (
              <video
                src={URL.createObjectURL(selectedFile)}
                controls
                className="w-full h-full rounded-xl object-contain"
              />
            ) : (
              <p className="text-gray-400 text-base">未选择视频</p>
            )}
          </div>
        </div>

        {/* 右侧：全息预览（黑底正方形） */}
        <div className="flex-1 flex flex-col items-center">
          <p className="text-sm text-warm-text-light mb-1">
            全息预览 {settings.resolution}×{settings.resolution}
          </p>
          <div
            className="bg-black rounded-xl flex items-center justify-center border-2 border-warm-border"
            style={{
              width: Math.min(settings.resolution / 2, 256),
              height: Math.min(settings.resolution / 2, 256),
              transform: `rotate(${settings.rotation}deg)`,
            }}
          >
            {selectedFile ? (
              <video
                src={URL.createObjectURL(selectedFile)}
                controls
                className="w-full h-full rounded-xl object-cover"
                style={{ filter: `brightness(${1 + settings.brightness})` }}
              />
            ) : (
              <p className="text-gray-600 text-sm text-center">
                黑底正方形<br />
                <span className="text-xs">全息屏专用</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 状态 */}
      <p className={`text-xl font-bold ${statusColor[mode]}`}>
        {statusText[mode]}
      </p>

      {/* 文件选择 */}
      <div className="flex items-center gap-3">
        <label className="btn-secondary flex items-center gap-2 cursor-pointer">
          <Upload size={24} />
          选择视频
          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
        {selectedFile && (
          <span className="text-sm text-warm-text-light truncate max-w-[200px]">
            {selectedFile.name}
          </span>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          className="btn-primary flex items-center gap-2"
          onClick={handleExport}
          disabled={!selectedFile || mode !== 'idle'}
        >
          <Download size={24} />
          导出全息 MP4
        </button>

        {mode === 'streaming' ? (
          <button
            className="btn-danger flex items-center gap-2"
            onClick={handleStop}
          >
            <Square size={24} />
            停止推流
          </button>
        ) : (
          <button
            className="btn-primary flex items-center gap-2"
            onClick={handleStream}
            disabled={!selectedFile}
          >
            <Play size={24} />
            开始全息推流
          </button>
        )}

        <button
          className="btn-secondary flex items-center gap-2"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings size={24} />
          设置
        </button>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="w-full max-w-md bg-white rounded-2xl p-4 shadow-sm border border-warm-border space-y-3">
          <h3 className="text-lg font-bold">全息设置</h3>

          {/* 分辨率 */}
          <div>
            <label className="text-sm text-warm-text-light">分辨率</label>
            <div className="flex gap-2 mt-1">
              {([256, 512, 1024] as const).map((r) => (
                <button
                  key={r}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    settings.resolution === r
                      ? 'bg-warm-primary text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  onClick={() => setSettings({ ...settings, resolution: r })}
                >
                  {r}×{r}
                </button>
              ))}
            </div>
          </div>

          {/* 旋转角度 */}
          <div>
            <label className="text-sm text-warm-text-light flex items-center gap-1">
              <RotateCw size={14} />
              旋转角度
            </label>
            <div className="flex gap-2 mt-1">
              {([0, 90, 180, 270] as const).map((deg) => (
                <button
                  key={deg}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    settings.rotation === deg
                      ? 'bg-warm-primary text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  onClick={() => setSettings({ ...settings, rotation: deg })}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>

          {/* 帧率 */}
          <div>
            <label className="text-sm text-warm-text-light">帧率</label>
            <div className="flex gap-2 mt-1">
              {([25, 30] as const).map((f) => (
                <button
                  key={f}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    settings.fps === f
                      ? 'bg-warm-primary text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  onClick={() => setSettings({ ...settings, fps: f })}
                >
                  {f} fps
                </button>
              ))}
            </div>
          </div>

          {/* 设备 IP */}
          <div>
            <label className="text-sm text-warm-text-light">设备 IP 地址</label>
            <input
              className="input-large w-full mt-1"
              value={settings.deviceIp}
              onChange={(e) => setSettings({ ...settings, deviceIp: e.target.value })}
              placeholder="192.168.1.100"
            />
          </div>

          {/* 亮度 */}
          <div>
            <label className="text-sm text-warm-text-light">
              亮度调整：{settings.brightness > 0 ? '+' : ''}{settings.brightness.toFixed(2)}
            </label>
            <input
              type="range"
              min={-0.3}
              max={0.3}
              step={0.01}
              value={settings.brightness}
              onChange={(e) => setSettings({ ...settings, brightness: parseFloat(e.target.value) })}
              className="w-full mt-1"
            />
          </div>
        </div>
      )}

      {/* 设备信息 */}
      <div className="w-full max-w-md bg-amber-50 rounded-2xl p-4 text-sm text-warm-text-light space-y-1">
        <p className="font-bold text-warm-text">推流方式</p>
        <p>• TF 卡/U 盘：导出 MP4 → 拷贝到 TF 卡</p>
        <p>• WiFi APP：设备连接 WiFi → APP 上传</p>
        <p>• RTSP 推流：mediamtx → ffmpeg 推流 → 设备拉流</p>
        <p>• 支持 HDMI IN 的设备可直接 RTSP 推流</p>
      </div>
    </div>
  );
}