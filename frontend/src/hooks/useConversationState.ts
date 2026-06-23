import { useState, useCallback, useRef } from 'react';

// ============================================
// 对话五态状态机
// IDLE → LISTENING → THINKING → SPEAKING → IDLE
// SPEAKING + 用户开口 → INTERRUPTING → LISTENING
// ============================================

export type ConversationState =
  | 'IDLE'         // 空闲等待
  | 'LISTENING'    // 正在听用户说话
  | 'THINKING'     // 思考中（LLM 生成）
  | 'SPEAKING'     // 正在说话（TTS + Avatar 播放）
  | 'INTERRUPTING'; // 被打断中

export type ConversationEvent =
  | 'START_LISTENING'   // 用户开始说话 / 按下语音按钮
  | 'FINISH_LISTENING'  // 用户停止说话
  | 'START_THINKING'    // LLM 开始生成
  | 'FINISH_THINKING'   // LLM 生成完毕 / TTS 开始播放
  | 'START_SPEAKING'    // 开始播报
  | 'FINISH_SPEAKING'   // 播报完毕
  | 'INTERRUPT';        // 用户打断

// 状态机转移表
const TRANSITIONS: Record<ConversationState, Partial<Record<ConversationEvent, ConversationState>>> = {
  IDLE: {
    START_LISTENING: 'LISTENING',
  },
  LISTENING: {
    FINISH_LISTENING: 'THINKING',
    INTERRUPT: 'IDLE',  // 打断时回到空闲
  },
  THINKING: {
    FINISH_THINKING: 'SPEAKING',
    INTERRUPT: 'INTERRUPTING',
  },
  SPEAKING: {
    FINISH_SPEAKING: 'IDLE',
    INTERRUPT: 'INTERRUPTING',
  },
  INTERRUPTING: {
    START_LISTENING: 'LISTENING',
    FINISH_LISTENING: 'IDLE',
    INTERRUPT: 'IDLE',
  },
};

// 状态对应的 UI 提示文字
export const STATE_LABELS: Record<ConversationState, string> = {
  IDLE: '就绪',
  LISTENING: '听您说话...',
  THINKING: '思考中...',
  SPEAKING: '正在说话',
  INTERRUPTING: '好的，您说',
};

// 状态对应的按钮样式
export const STATE_BUTTON_CLASSES: Record<ConversationState, string> = {
  IDLE: 'bg-warm-primary hover:bg-warm-primary-hover',
  LISTENING: 'bg-red-500 scale-110 shadow-lg shadow-red-300 animate-pulse',
  THINKING: 'bg-yellow-500',
  SPEAKING: 'bg-warm-primary opacity-60',
  INTERRUPTING: 'bg-yellow-400',
};

interface UseConversationStateReturn {
  state: ConversationState;
  label: string;
  buttonClass: string;

  /** 开始监听（用户按下语音按钮或 VAD 检测到语音） */
  startListening: () => void;
  /** 结束监听（用户松开按钮或 VAD 检测到静音超时） */
  finishListening: () => void;
  /** 开始思考（LLM 开始生成回复） */
  startThinking: () => void;
  /** 结束思考（LLM 生成完毕，开始播报） */
  finishThinking: () => void;
  /** 开始播报（TTS + Avatar 播放） */
  startSpeaking: () => void;
  /** 结束播报（播放完毕） */
  finishSpeaking: () => void;
  /** 打断（用户开口打断数字人） */
  interrupt: () => void;
  /** 重置到 IDLE */
  reset: () => void;

  /** 是否正在侦听用户输入 */
  isListening: boolean;
  /** 是否正在处理（THINKING 或 SPEAKING） */
  isProcessing: boolean;
  /** 是否正在说话 */
  isSpeaking: boolean;
}

export function useConversationState(): UseConversationStateReturn {
  const [state, setState] = useState<ConversationState>('IDLE');
  const stateRef = useRef<ConversationState>('IDLE');

  const transition = useCallback((event: ConversationEvent) => {
    const current = stateRef.current;
    const nextState = TRANSITIONS[current]?.[event];
    
    if (nextState) {
      stateRef.current = nextState;
      setState(nextState);
      return true;
    }
    
    // 非法转移：记录日志
    console.warn(`状态机: 从 ${current} 接收 ${event} 无效`);
    return false;
  }, []);

  return {
    state,
    label: STATE_LABELS[state],
    buttonClass: STATE_BUTTON_CLASSES[state],

    startListening: () => transition('START_LISTENING'),
    finishListening: () => transition('FINISH_LISTENING'),
    startThinking: () => transition('START_THINKING'),
    finishThinking: () => transition('FINISH_THINKING'),
    startSpeaking: () => transition('START_SPEAKING'),
    finishSpeaking: () => transition('FINISH_SPEAKING'),
    interrupt: () => transition('INTERRUPT'),

    reset: () => {
      stateRef.current = 'IDLE';
      setState('IDLE');
    },

    isListening: state === 'LISTENING',
    isProcessing: state === 'THINKING' || state === 'SPEAKING',
    isSpeaking: state === 'SPEAKING',
  };
}