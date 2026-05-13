import { Inbox } from "lucide-react";

interface EmptyStateProps {
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({ message, actionText, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <Inbox className="w-12 h-12 text-gray-400 mb-4" />
      <p className="text-gray-500 mb-4">{message}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-[var(--orange)] text-white rounded-lg hover:bg-[var(--orange)]/90 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
