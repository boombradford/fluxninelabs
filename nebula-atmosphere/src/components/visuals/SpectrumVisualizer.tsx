import React, { useEffect, useRef } from 'react';
import { audioService } from '../../services/audioEngine';

export const SpectrumVisualizer: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            if (!audioService.analyser) {
                animationFrameRef.current = requestAnimationFrame(draw);
                return;
            }

            const values = audioService.analyser.getValue();
            // Clean canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Setup gradient
            const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
            gradient.addColorStop(0, 'rgba(34, 211, 238, 0.1)'); // Cyan/low
            gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.4)'); // Purple/mid
            gradient.addColorStop(1, 'rgba(236, 72, 153, 0.6)'); // Pink/high

            ctx.fillStyle = gradient;

            const barWidth = canvas.width / values.length;

            ctx.beginPath();
            ctx.moveTo(0, canvas.height);

            // Draw FFT Curve
            for (let i = 0; i < values.length; i++) {
                // value is in dB (usually -100 to 0)
                // Normalize to 0-1 range for height
                // Typical silence is around -100dB
                const db = values[i] as number;
                const normalized = Math.max(0, (db + 100) / 100);

                const x = i * barWidth;
                const y = canvas.height - (normalized * canvas.height);

                ctx.lineTo(x, y);
            }

            ctx.lineTo(canvas.width, canvas.height);
            ctx.closePath();
            ctx.fill();

            // Reflection/Glow line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();

            animationFrameRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    return (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                width={512}
                height={256}
            />
        </div>
    );
};
