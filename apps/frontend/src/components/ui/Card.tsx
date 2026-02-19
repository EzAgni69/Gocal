"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "glass" | "elevated" | "interactive";
    children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = "default", children, ...props }, ref) => {
        const variants = {
            default: "bg-white border border-gray-100 shadow-sm",
            glass: "glass-premium",
            elevated: "bg-white shadow-lg hover:shadow-xl transition-shadow",
            interactive: "bg-white border border-gray-100 shadow-sm hover-lift card-shine",
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-2xl overflow-hidden",
                    variants[variant],
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);
Card.displayName = "Card";

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ className, children, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("p-6 border-b border-gray-100", className)}
            {...props}
        >
            {children}
        </div>
    )
);
CardHeader.displayName = "CardHeader";

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
    ({ className, children, ...props }, ref) => (
        <div ref={ref} className={cn("p-6", className)} {...props}>
            {children}
        </div>
    )
);
CardContent.displayName = "CardContent";

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
    ({ className, children, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("p-6 pt-0 flex items-center gap-3", className)}
            {...props}
        >
            {children}
        </div>
    )
);
CardFooter.displayName = "CardFooter";

interface CardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    overlay?: boolean;
}

const CardImage = React.forwardRef<HTMLDivElement, CardImageProps>(
    ({ className, src, alt, overlay = false, ...props }, ref) => (
        <div ref={ref} className="relative overflow-hidden">
            <img
                src={src}
                alt={alt}
                className={cn(
                    "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
                    className
                )}
                {...props}
            />
            {overlay && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            )}
        </div>
    )
);
CardImage.displayName = "CardImage";

export { Card, CardHeader, CardContent, CardFooter, CardImage };
