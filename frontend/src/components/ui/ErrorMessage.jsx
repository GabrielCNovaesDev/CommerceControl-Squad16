export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 border border-red-200">
        <svg
          className="w-6 h-6 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
