interface Message {
  role: string;
  content: string;
  time: string;
}

interface ChatHistoryProps {
  messages: Message[];
}

export default function ChatHistory({ messages }: ChatHistoryProps) {
  return (
    <div className="space-y-2 overflow-y-auto">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={[
            'text-base rounded-2xl px-4 py-2 max-w-[90%]',
            msg.role === 'user'
              ? 'ml-auto bg-purple-primary text-white text-right'
              : 'mr-auto bg-white border border-purple-border text-purple-text',
          ].join(' ')}
        >
          {msg.content}
        </div>
      ))}
    </div>
  );
}
