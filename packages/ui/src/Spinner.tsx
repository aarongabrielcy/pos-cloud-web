import type { SVGAttributes } from "react";

export interface SpinnerProps extends SVGAttributes<SVGSVGElement> {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const SIZE_CLASSES: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function Spinner({ size = "md", label = "Loading", className = "", ...rest }: SpinnerProps) {
  return (
    <svg
      className={`animate-spin ${SIZE_CLASSES[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label={label}
      {...rest}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
