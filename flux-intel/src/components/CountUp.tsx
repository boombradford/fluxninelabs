'use client';

import { useEffect, useRef } from 'react';
import { useInView, animate } from 'framer-motion';

interface CountUpProps {
    value: number;
    duration?: number;
    className?: string;
}

export function CountUp({ value, duration = 1.0, className }: CountUpProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: "0px" });

    useEffect(() => {
        const node = ref.current;
        if (!node || !isInView) return;

        const controls = animate(0, value, {
            duration,
            ease: [0.16, 1, 0.3, 1], // easeOutExpo-ish
            onUpdate(v) {
                node.textContent = Math.round(v).toString();
            }
        });

        return () => controls.stop();
    }, [value, duration, isInView]);

    return <span ref={ref} className={className}>0</span>;
}
