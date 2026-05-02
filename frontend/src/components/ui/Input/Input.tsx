import clsx from "clsx";
import "./input.css";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ label, className, ...props }: InputProps) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold text-[#f0f0f7]">{label}</span>
      <input {...props} className={clsx("input-field", className)} />
    </label>
  );
}
