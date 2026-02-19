"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "rectangle" | "circle" | "text" | "card";
    width?: string | number;
    height?: string | number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
    ({ className, variant = "rectangle", width, height, style, ...props }, ref) => {
        const getVariantClasses = () => {
            switch (variant) {
                case "circle":
                    return "rounded-full";
                case "text":
                    return "rounded h-4";
                case "card":
                    return "rounded-2xl";
                default:
                    return "rounded-lg";
            }
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "skeleton animate-pulse",
                    getVariantClasses(),
                    className
                )}
                style={{
                    width: width,
                    height: height,
                    ...style,
                }}
                {...props}
            />
        );
    }
);
Skeleton.displayName = "Skeleton";

// Pre-built skeleton patterns
const SkeletonCard = ({ className }: { className?: string }) => (
    <div className={cn("rounded-2xl overflow-hidden bg-white border border-gray-100", className)}>
        <Skeleton variant="rectangle" className="w-full h-48" />
        <div className="p-6 space-y-3">
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-1/2" />
            <div className="flex gap-2 pt-2">
                <Skeleton variant="rectangle" className="h-10 flex-1" />
                <Skeleton variant="rectangle" className="h-10 flex-1" />
            </div>
        </div>
    </div>
);

const SkeletonList = ({ count = 3, className }: { count?: number; className?: string }) => (
    <div className={cn("space-y-4", className)}>
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100">
                <Skeleton variant="rectangle" className="w-16 h-16 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" className="w-3/4" />
                    <Skeleton variant="text" className="w-1/2" />
                </div>
            </div>
        ))}
    </div>
);

const SkeletonGrid = ({ count = 6, className }: { count?: number; className?: string }) => (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
        {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={i} />
        ))}
    </div>
);

export { Skeleton, SkeletonCard, SkeletonList, SkeletonGrid };
