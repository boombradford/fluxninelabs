import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Premium typography system - Bold, large, clear hierarchy
 * Inspired by Apple, Stripe, Vercel design standards
 */

export function H1({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h1
            className={cn(
                "text-[clamp(56px,10vw,84px)] leading-[1.1] tracking-[-0.03em] font-black",
                "text-[var(--text-primary)]",
                className
            )}
            {...props}
        >
            {children}
        </h1>
    );
}

export function H2({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h2
            className={cn(
                "text-[clamp(36px,7vw,56px)] leading-[1.2] tracking-[-0.025em] font-extrabold",
                "text-[var(--text-primary)]",
                className
            )}
            {...props}
        >
            {children}
        </h2>
    );
}

export function H3({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3
            className={cn(
                "text-[clamp(22px,5vw,32px)] leading-[1.3] tracking-[-0.015em] font-bold",
                "text-[var(--text-primary)]",
                className
            )}
            {...props}
        >
            {children}
        </h3>
    );
}

export function Text({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p
            className={cn(
                "text-[18px] leading-[1.7] tracking-[-0.01em] font-medium",
                "text-[var(--text-secondary)]",
                className
            )}
            {...props}
        >
            {children}
        </p>
    );
}

export function Label({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "section-label",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
