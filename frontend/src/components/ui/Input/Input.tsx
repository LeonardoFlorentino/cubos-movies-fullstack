import { useState } from "react";
import clsx from "clsx";
import "./input.css";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  allowPasswordToggle?: boolean;
};

function EyeIcon({ crossed }: { crossed: boolean }) {
  return crossed ? (
    <svg
      aria-hidden="true"
      className="password-toggle-icon"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 4.5L20 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9.7 9.9C9.23 10.37 8.94 11.02 8.94 11.74C8.94 13.19 10.1 14.35 11.55 14.35C12.27 14.35 12.92 14.06 13.39 13.59"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.47 6.93C4.52 8.1 3.1 9.76 2.4 11.71C2.3 12 2.3 12.31 2.4 12.6C3.97 16.95 7.69 19.7 11.55 19.7C13.17 19.7 14.77 19.21 16.2 18.31"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.55 15.24C20.33 14.42 20.95 13.46 21.4 12.4C21.53 12.11 21.53 11.78 21.4 11.49C19.83 7.14 16.12 4.39 12.25 4.39C11.42 4.39 10.6 4.52 9.8 4.76"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      className="password-toggle-icon"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.4 12C4 7.7 7.7 5 12 5C16.3 5 20 7.7 21.6 12C20 16.3 16.3 19 12 19C7.7 19 4 16.3 2.4 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function Input({
  label,
  className,
  allowPasswordToggle = false,
  type,
  ...props
}: InputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const canTogglePassword = allowPasswordToggle && type === "password";
  const resolvedType = canTogglePassword
    ? isPasswordVisible
      ? "text"
      : "password"
    : type;

  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold text-(--text-primary)">{label}</span>
      <div className={clsx(canTogglePassword && "password-field-wrapper")}>
        <input
          {...props}
          type={resolvedType}
          className={clsx("input-field", className)}
        />
        {canTogglePassword && (
          <button
            type="button"
            className="password-toggle-button"
            onClick={() => setIsPasswordVisible((value) => !value)}
            aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
            title={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
          >
            <EyeIcon crossed={isPasswordVisible} />
          </button>
        )}
      </div>
    </label>
  );
}
