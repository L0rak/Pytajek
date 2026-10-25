import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/src/lib/utils";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 transition disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
