import { cn } from "../../lib/utils";
import type { ButtonHTMLAttributes } from "react";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50 disabled:pointer-events-none h-10 px-4 py-2";

const variants: Record<string, string> = {
  default: "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white",
  outline:
    "border border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800",
  ghost: "hover:bg-zinc-100 dark:hover:bg-zinc-800",
};

export function Button({ className, variant = "default", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}
