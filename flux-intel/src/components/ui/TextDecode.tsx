"use client";

import { useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+-=[]{}|;:,.<>?";

interface TextDecodeProps {
    text: string;
    className?: string;
    delay?: number; // Delay in seconds before starting
    duration?: number; // Total duration of shuffle
    revealSpeed?: number; // Speed of revealing characters
}

export const TextDecode = ({ text, className, delay = 0, duration = 1.5 }: TextDecodeProps) => {
    const [displayText, setDisplayText] = useState(text); // Initialize with text to match server
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-10%" });
    const hasStarted = useRef(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isInView || hasStarted.current) return;
        hasStarted.current = true;

        let interval: NodeJS.Timeout;
        let timeout: NodeJS.Timeout;

        // Start delay
        timeout = setTimeout(() => {
            let iteration = 0;
            const steps = text.length;
            const intervalDuration = (duration * 1000) / (steps * 2); // Calibrate speed

            interval = setInterval(() => {
                setDisplayText(() => {
                    return text
                        .split("")
                        .map((char, index) => {
                            if (index < iteration) {
                                return text[index];
                            }
                            // Keep spaces as spaces, don't scramble them
                            if (char === " ") return " ";
                            return CHARS[Math.floor(Math.random() * CHARS.length)];
                        })
                        .join("");
                });

                if (iteration >= text.length) {
                    clearInterval(interval);
                }

                iteration += 1 / 2; // Slower reveal
            }, intervalDuration);
        }, delay * 1000);

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [isInView, text, delay, duration]);

    return (
        <motion.span
            ref={ref}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            className={className}
        >
            {displayText}
        </motion.span>
    );
};
