"use client";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "../../lib/utils";

export function Switch({ className, ...props }: React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>) {
  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-zinc-900 data-[state=unchecked]:bg-zinc-300 dark:data-[state=checked]:bg-zinc-100",
        className
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb className="pointer-events-none block h-5 w-5 rounded-full bg-white dark:bg-zinc-900 shadow-lg ring-0 transition-transform translate-x-0 data-[state=checked]:translate-x-5" />
    </SwitchPrimitives.Root>
  );
}
