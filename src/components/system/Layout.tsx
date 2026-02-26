import React from 'react';
import { cn } from '@/lib/utils';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
    children: React.ReactNode;
    fullWidth?: boolean;
    spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    id?: string;
}

export const Section = React.forwardRef<HTMLElement, SectionProps>(({
    children,
    fullWidth = false,
    spacing = 'lg',
    className,
    id,
    ...props
}, ref) => {

    const spacingStyles = {
        none: 'py-0',
        sm: 'py-4 md:py-6',
        md: 'py-6 md:py-8',
        lg: 'py-8 md:py-10',
        xl: 'py-10 md:py-12'
    };

    return (
        <section
            ref={ref}
            id={id}
            className={cn(
                "relative w-full",
                spacingStyles[spacing],
                className
            )}
            {...props}
        >
            {children}
        </section>
    );
});

Section.displayName = "Section";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    className?: string;
}

export function Container({
    children,
    width = 'lg',
    className,
    ...props
}: ContainerProps) {

    const widthStyles = {
        sm: 'max-w-2xl',
        md: 'max-w-4xl',
        lg: 'max-w-[980px]', // Matching current site preference
        xl: 'max-w-[1400px]',
        full: 'max-w-full'
    };

    return (
        <div
            className={cn(
                "mx-auto px-6 w-full",
                widthStyles[width],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
