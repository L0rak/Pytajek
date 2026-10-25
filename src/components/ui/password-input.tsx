import { useState, InputHTMLAttributes, forwardRef } from "react";
import { Input } from "./input";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  showToggle?: boolean;
  onToggle?: () => void;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showToggle, onToggle, className, ...props }, ref) => {
    return (
      <div className={className}>
        <Input
          {...props}
          type={showToggle ? "text" : "password"}
          ref={ref}
        />
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
          >
            {showToggle ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
