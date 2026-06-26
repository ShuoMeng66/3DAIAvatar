import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-lg font-medium text-purple-text mb-2"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={['input-large', className].filter(Boolean).join(' ')}
        {...props}
      />
    </div>
  );
}
