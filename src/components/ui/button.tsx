import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "press inline-flex items-center justify-center gap-2 rounded-xl font-medium outline-none disabled:opacity-40 disabled:pointer-events-none min-h-11 px-4 text-sm",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground",
        quiet: "bg-card-2 text-foreground shadow-[var(--shadow-border)]",
        ghost: "bg-transparent text-muted",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export function Button({ className, variant, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}
