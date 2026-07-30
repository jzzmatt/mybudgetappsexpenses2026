import type { InputHTMLAttributes } from "react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label: string;
};

export function AuthField({ error, id, label, ...props }: AuthFieldProps) {
  return (
    <label className="auth-field" htmlFor={id}>
      <span>{label}</span>
      <input aria-invalid={Boolean(error)} id={id} {...props} />
      {error ? <small role="alert">{error}</small> : null}
    </label>
  );
}
