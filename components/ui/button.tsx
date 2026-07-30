import type { ComponentPropsWithoutRef } from "react";

type ButtonProps = ComponentPropsWithoutRef<"button">;

export function Button({ className = "", type = "button", ...props }: ButtonProps) {
  return (
    <button className={`button ${className}`.trim()} type={type} {...props} />
  );
}
