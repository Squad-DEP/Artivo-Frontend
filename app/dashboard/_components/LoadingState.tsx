interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  className = "",
}: LoadingStateProps) {
  return (
    <div className={`flex justify-center items-center py-8 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF6200]"></div>
        <span className="text-gray-500">{message}</span>
      </div>
    </div>
  );
}
