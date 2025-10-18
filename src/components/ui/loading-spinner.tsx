
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <svg
        className="animate-spin h-10 w-10 text-primary"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 42 42"
      >
        <path
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="8 8"
          d="M21 3.5C31.2269 3.5 39.5 11.7731 39.5 22"
        ></path>
      </svg>
    </div>
  );
}
