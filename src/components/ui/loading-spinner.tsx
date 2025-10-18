
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <svg
        className="animate-spin h-12 w-12 text-primary"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-100"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray="25 15"
          strokeLinecap="round"
        ></circle>
      </svg>
    </div>
  );
}
