import { cn } from "../../lib/utils";
import type { HTMLAttributes, PropsWithChildren } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}
