"use client";
import * as React from "react";

export type UIButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  loadingText?: string;
};

function UIButtonImpl(
  { isLoading = false, loadingText = "Loading...", type, disabled, className = "", children, ...rest }: UIButtonProps,
  ref: React.Ref<HTMLButtonElement>
) {
  const finalType = type ?? "submit"; // default to submit so forms work
  return (
    <button
      ref={ref}
      type={finalType}
      disabled={disabled || isLoading}
      data-state={isLoading ? "loading" : "idle"}
      className={
        "inline-flex items-center justify-center rounded-2xl px-4 py-3 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
        className
      }
      {...rest}
    >
      {isLoading ? loadingText : children}
    </button>
  );
}

const Button = React.forwardRef<HTMLButtonElement, UIButtonProps>(UIButtonImpl);
export { Button };
export default Button;
