"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "link";
    size?: "sm" | "md" | "lg" | "icon";
    isLoading?: boolean;
}

// Separate the ref forwarding from the motion component wrapping
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-luxury-gold disabled:pointer-events-none disabled:opacity-50 font-sans tracking-wide";

        const variants = {
            primary: "bg-luxury-black text-white hover:bg-luxury-charcoal shadow-md hover:shadow-lg hover:shadow-gold-500/10 border border-transparent",
            secondary: "bg-gold-500 text-luxury-black hover:bg-gold-600 shadow-sm",
            outline: "border border-gray-200 bg-transparent hover:bg-gray-50 text-luxury-black",
            ghost: "hover:bg-gray-100/50 text-luxury-charcoal",
            link: "text-luxury-black underline-offset-4 hover:underline",
        };

        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "h-10 px-4 py-2 text-sm",
            lg: "h-12 px-8 text-base",
            icon: "h-10 w-10",
        };

        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: 0.98 }}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={isLoading || disabled}
                {...(props as HTMLMotionProps<"button">)}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </motion.button>
        );
    }
);
Button.displayName = "Button";

export { Button };
