import { useRef } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { Button } from "@/components/ui/button"

interface MagneticButtonProps extends React.ComponentProps<typeof Button> {
    children: React.ReactNode
}

export function MagneticButton({ children, className, ...props }: MagneticButtonProps) {
    const ref = useRef<HTMLButtonElement>(null)
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const springX = useSpring(x, { damping: 15, stiffness: 150 })
    const springY = useSpring(y, { damping: 15, stiffness: 150 })

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        x.set((e.clientX - centerX) * 0.15)
        y.set((e.clientY - centerY) * 0.15)
    }

    const handleMouseLeave = () => {
        x.set(0)
        y.set(0)
    }

    return (
        <motion.div style={{ x: springX, y: springY }}>
            <Button
                ref={ref}
                className={className}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                {...props}
            >
                {children}
            </Button>
        </motion.div>
    )
}
