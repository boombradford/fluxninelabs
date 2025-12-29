"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface IntelligentTypewriterProps {
    text: string;
    isThinking?: boolean;
    className?: string;
}

const GLITCH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';

const IntelligentTypewriter: React.FC<IntelligentTypewriterProps> = ({
    text,
    isThinking = false,
    className
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const [glitchChars, setGlitchChars] = useState('');
    const isComplete = useRef(false);

    useEffect(() => {
        setDisplayedText('');
        setGlitchChars('');
        isComplete.current = false;

        let currentIndex = 0;
        let timeoutId: NodeJS.Timeout;

        const typeNextChar = () => {
            if (currentIndex >= text.length) {
                isComplete.current = true;
                setGlitchChars('');
                return;
            }

            // Calculate Glitch Effect (Scramble leading text)
            // We simulate the "tip" of the typing stream being unstable
            // Calculate Glitch Effect (Scramble leading text)
            // We simulate the "tip" of the typing stream being unstable
            // TONED DOWN: Reduced from 100ms to 0-10ms to make it much faster
            const scrambleDuration = Math.random() > 0.8 ? 50 : 0; // Only glitch occasionally
            const scrambleInterval = 25; // ms per glitch frame
            const scrambles = Math.floor(scrambleDuration / scrambleInterval);

            let scrambleCount = 0;

            const runScramble = () => {
                if (scrambleCount < scrambles) {
                    // Generate 1-3 random chars to append momentarily
                    const randomChar = () => GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
                    setGlitchChars(randomChar() + (Math.random() > 0.5 ? randomChar() : ''));
                    scrambleCount++;
                    timeoutId = setTimeout(runScramble, scrambleInterval);
                } else {
                    // Resolve character
                    const char = text[currentIndex];
                    setDisplayedText(prev => prev + char);
                    setGlitchChars(''); // Clear glitch for this step
                    currentIndex++;

                    // Determine delay for next char
                    let delay = Math.random() * (20 - 5) + 5; // Much faster: 5ms to 20ms

                    // Pause on punctuation
                    if (['.', ',', '!', '?', ':'].includes(char)) {
                        delay = 300;
                    }

                    timeoutId = setTimeout(typeNextChar, delay);
                }
            };

            runScramble();
        };

        // Start typing
        typeNextChar();

        return () => clearTimeout(timeoutId);
    }, [text]);

    // Markdown Bold Parsing (simple version for **bold**)
    const renderText = (rawText: string) => {
        const parts = rawText.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <div className={clsx("font-mono inline-flex items-center", className)}>
            <span className="whitespace-pre-wrap">
                {renderText(displayedText)}
            </span>

            {/* Glitch/Scramble Block */}
            {!isComplete.current && glitchChars && (
                <span className="text-emerald-400 bg-emerald-500/20 px-0.5 animate-pulse">
                    {glitchChars}
                </span>
            )}

            {/* Blinking Cursor */}
            {(isThinking || !isComplete.current) && (
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                    className="inline-block w-2.5 h-4 bg-emerald-400 ml-0.5 align-middle"
                />
            )}
        </div>
    );
};

export default IntelligentTypewriter;
