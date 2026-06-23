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
    <div className="space-y-1 overflow-y-auto">
      {messages.map((msg, i) => (
        <div key={i} className={`text-base ${msg.role === 'user' ? 'text-warm-primary' : 'text-warm-text'}`}>
          {msg.content}
        </div>
      ))}
    </div>
  );
}