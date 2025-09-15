import { cn } from "../../lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-offset-zinc-900",
        className
      )}
      {...props}
    />
  );
}
