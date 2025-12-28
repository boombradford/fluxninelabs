import { useEffect, useRef } from "react"
import { useInView, useMotionValue, useSpring } from "framer-motion"

export function LiveTicker({ value, className = "" }: { value: number, className?: string }) {
    const ref = useRef<HTMLSpanElement>(null)
    const motionValue = useMotionValue(value)
    const springValue = useSpring(motionValue, { damping: 30, stiffness: 100 })
    const isInView = useInView(ref, { once: true, margin: "-50px" })

    useEffect(() => {
        if (isInView) {
            // Simulate "live" audience growth
            // Add a random amount of views every few seconds
            const interval = setInterval(() => {
                const current = motionValue.get()
                const increment = Math.floor(Math.random() * 5) + 1 // Random 1-5 views
                motionValue.set(current + increment)
            }, 3000)

            return () => clearInterval(interval)
        }
    }, [isInView, motionValue])

    useEffect(() => {
        return springValue.on("change", (latest) => {
            if (ref.current) {
                // Format with commas: 3,600,000
                ref.current.textContent = Math.floor(latest).toLocaleString('en-US') + "+"
            }
        })
    }, [springValue])

    return <span ref={ref} className={className}>{value.toLocaleString('en-US')}+</span>
}
