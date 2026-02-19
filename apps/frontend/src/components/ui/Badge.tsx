import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "premium";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    const variants = {
        default: "border-transparent bg-luxury-black text-white shadow hover:bg-luxury-black/80",
        secondary: "border-transparent bg-gray-100 text-luxury-charcoal hover:bg-gray-100/80",
        destructive: "border-transparent bg-red-500 text-white shadow hover:bg-red-500/80",
        outline: "text-luxury-foreground border-gray-200",
        success: "border-transparent bg-green-50 text-green-700 border border-green-200",
        premium: "border-transparent bg-gradient-to-r from-gold-400 to-gold-600 text-white shadow-md shadow-gold-500/20",
    };

    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 font-sans tracking-wide",
                variants[variant],
                className
            )}
            {...props}
        />
    );
}

export { Badge };
