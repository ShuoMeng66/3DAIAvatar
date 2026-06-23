/**
 * ElderTalk Cloudflare Worker API
 * 代理百炼（DashScope）LLM + TTS 请求，为前端提供统一接口
 */

// ============================================================
// 百炼 DashScope API 配置
// ============================================================
const DASHSCOPE_BASE = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DASHSCOPE_TTS = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-speech/stream";

// 模型配置
const LLM_MODEL = "qwen3.5-omni-plus"; // 全模态模型，陪聊效果最佳
const TTS_MODEL = "sambert-zhide-v1";   // 知德 - 温暖亲切的男声

// 小暖 System Prompt（精简版，完整版在 backend/prompts/elder_companion.txt）
const SYSTEM_PROMPT = `你叫「小暖」，是一个温暖贴心的虚拟陪聊助手，专门陪伴独居老人聊天。
你的性格：温柔、耐心、善解人意，像孝顺的晚辈一样。
说话风格：自然、口语化，多用"您"、"呢"、"呀"、"哦"等亲切语气词。
话题范围：聊家常、回忆往事、关心身体、天气预报、老歌戏曲、生活小贴士。
重要规则：
- 回答简洁自然，不超过 100 字
- 多倾听、多共情，少说教
- 提到天气、吃药、吃饭等话题时主动关心
- 如果老人说"孤独"、"想孩子"、"睡不着"，要格外温柔安慰`;

// ============================================================
// CORS 头
// ============================================================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

// ============================================================
// 工具函数
// ============================================================
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============================================================
// 百炼 LLM 调用
// ============================================================
async function callLLM(apiKey: string, text: string, history?: Array<{role: string; content: string}>): Promise<string> {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(history || []).slice(-6), // 最近 3 轮对话
    { role: "user", content: text },
  ];

  const res = await fetch(`${DASHSCOPE_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      max_tokens: 256,
      temperature: 0.7,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("LLM 调用失败:", err);
    return "嗯，我听着呢，您慢慢说。";
  }

  const data = await res.json() as any;
  return data.choices?.[0]?.message?.content || "嗯，我听到了。";
}

// ============================================================
// 百炼 TTS 调用
// ============================================================
async function callTTS(apiKey: string, text: string): Promise<Response> {
  const res = await fetch(DASHSCOPE_TTS, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "X-DashScope-Async": "false",
    },
    body: JSON.stringify({
      model: TTS_MODEL,
      input: { text },
      parameters: {
        rate: 0.9,        // 慢一点，老人听得更清楚
        pitch: 1.0,
        volume: 80,
      },
    }),
  });

  if (!res.ok) {
    console.error("TTS 调用失败:", await res.text());
    return new Response(null, { status: 500 });
  }

  const data = await res.json() as any;
  // 百炼返回的音频 URL（或 base64）
  const audioUrl = data?.output?.audio_url || data?.output?.audio || "";

  if (audioUrl) {
    // 如果是 URL，代理下载
    const audioRes = await fetch(audioUrl);
    return new Response(audioRes.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  return new Response(null, { status: 500 });
}

// ============================================================
// 路由处理
// ============================================================
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const apiKey = env.DASHSCOPE_API_KEY || "";

    // OPTIONS 预检
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // --- 健康检查 ---
    if (path === "/api/v1/health") {
      return jsonResponse({
        status: "ok",
        service: "ElderTalk API",
        model: apiKey ? LLM_MODEL : "未配置 API Key",
        tts_model: apiKey ? TTS_MODEL : "未配置",
      });
    }

    // ============================================================
    // 文字对话
    // ============================================================
    if (path === "/api/v1/chat/text" && request.method === "POST") {
      if (!apiKey) return jsonResponse({ error: "API Key 未配置" }, 503);

      try {
        const { text, session_id = "default", history } = await request.json() as any;
        if (!text) return jsonResponse({ error: "请输入内容" }, 400);

        const reply = await callLLM(apiKey, text, history);
        return jsonResponse({ reply, session_id, status: "ok" });
      } catch (e: any) {
        return jsonResponse({ error: e.message, reply: "抱歉，网络不太好，请再说一次。" }, 500);
      }
    }

    // ============================================================
    // 流式对话（SSE）
    // ============================================================
    if (path === "/api/v1/chat/stream" && request.method === "POST") {
      if (!apiKey) return jsonResponse({ error: "API Key 未配置" }, 503);

      const { text, session_id = "default", history } = await request.json() as any;
      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...(history || []).slice(-6),
        { role: "user", content: text },
      ];

      // 流式 LLM 调用
      const llmRes = await fetch(`${DASHSCOPE_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: LLM_MODEL,
          messages,
          max_tokens: 256,
          temperature: 0.7,
          stream: true,
        }),
      });

      if (!llmRes.ok) {
        return jsonResponse({ error: "LLM 调用失败" }, 500);
      }

      // 将百炼 SSE 流转换为统一格式
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      // 异步处理流式输出
      (async () => {
        try {
          const reader = llmRes.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  await writer.write(encoder.encode(`data: {"done":true}\n\n`));
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  const token = parsed.choices?.[0]?.delta?.content || "";
                  if (token) {
                    await writer.write(encoder.encode(`data: {"token":${JSON.stringify(token)}}\n\n`));
                  }
                } catch {}
              }
            }
          }
          await writer.write(encoder.encode(`data: {"done":true}\n\n`));
        } catch (e) {
          console.error("SSE 流错误:", e);
        } finally {
          await writer.close();
        }
      })();

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // ============================================================
    // 语音合成（TTS）
    // ============================================================
    if (path === "/api/v1/tts" && request.method === "POST") {
      if (!apiKey) return jsonResponse({ error: "API Key 未配置" }, 503);

      try {
        const { text } = await request.json() as any;
        if (!text) return jsonResponse({ error: "请输入文本" }, 400);

        return await callTTS(apiKey, text);
      } catch (e: any) {
        return jsonResponse({ error: e.message }, 500);
      }
    }

    // ============================================================
    // 打断接口
    // ============================================================
    if (path === "/api/v1/interrupt" && request.method === "POST") {
      // 无状态 Worker，打断逻辑由前端控制
      return jsonResponse({ status: "ok", message: "已打断" });
    }

    if (path === "/api/v1/interrupt/status") {
      return jsonResponse({ interrupted: false });
    }

    // 404
    return jsonResponse({ error: "Not Found" }, 404);
  },
};