type LoadingSpinnerProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-5 w-5 border-2",
  md: "h-9 w-9 border-[3px]",
  lg: "h-12 w-12 border-4",
};

export function LoadingSpinner({
  label = "Loading...",
  size = "md",
}: LoadingSpinnerProps) {
  return (
    <span
      className="inline-flex flex-col items-center justify-center gap-3 text-center"
      role="status"
    >
      <span
        aria-hidden="true"
        className={`${sizeClasses[size]} shrink-0 animate-spin rounded-full border-leaf/20 border-t-leaf motion-reduce:animate-none`}
      />
      <span className="max-w-xs text-sm font-semibold leading-5 text-ink-soft">
        {label}
      </span>
    </span>
  );
}

export function PageLoadingState({
  label = "Loading store data...",
  fullScreen = false,
}: {
  label?: string;
  fullScreen?: boolean;
}) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center bg-paper-dim px-6 text-center ${
        fullScreen ? "min-h-dvh" : "min-h-[24rem]"
      }`}
    >
      <LoadingSpinner label={label} size="lg" />
    </div>
  );
}

export default LoadingSpinner;
