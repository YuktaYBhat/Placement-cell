"use client"

import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import * as React from "react"

interface PageTransitionProps {
    children: React.ReactNode
    className?: string
}

// Fade in/out transition
export function FadeTransition({ children, className }: PageTransitionProps) {
    const pathname = usePathname()

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={className}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    )
}

// Slide up transition
export function SlideUpTransition({ children, className }: PageTransitionProps) {
    const pathname = usePathname()

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={className}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    )
}

// Stagger children animation
interface StaggerContainerProps {
    children: React.ReactNode
    className?: string
    staggerDelay?: number
}

export function StaggerContainer({
    children,
    className,
    staggerDelay = 0.1
}: StaggerContainerProps) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// Individual stagger item
interface StaggerItemProps {
    children: React.ReactNode
    className?: string
}

export function StaggerItem({ children, className }: StaggerItemProps) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                        duration: 0.4,
                        ease: "easeOut"
                    }
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// Scale in animation for modals/popovers
export function ScaleIn({ children, className }: PageTransitionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// Collapse animation for accordion-like elements
interface CollapseProps {
    isOpen: boolean
    children: React.ReactNode
    className?: string
}

export function Collapse({ isOpen, children, className }: CollapseProps) {
    return (
        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={className}
                    style={{ overflow: "hidden" }}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    )
}

// Hover card animation
export function HoverCard({ children, className }: PageTransitionProps) {
    return (
        <motion.div
            whileHover={{
                y: -4,
                transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// Progress bar animation
interface AnimatedProgressProps {
    value: number
    className?: string
}

export function AnimatedProgress({ value, className }: AnimatedProgressProps) {
    return (
        <div className={`h-2 bg-neutral-100 rounded-full overflow-hidden ${className}`}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-primary rounded-full"
            />
        </div>
    )
}

// Number counter animation
interface CounterProps {
    value: number
    duration?: number
    className?: string
}

export function Counter({ value, duration = 1, className }: CounterProps) {
    const [displayValue, setDisplayValue] = React.useState(0)

    React.useEffect(() => {
        const startTime = Date.now()
        const endValue = value

        const updateCounter = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / (duration * 1000), 1)

            // Easing function
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplayValue(Math.floor(eased * endValue))

            if (progress < 1) {
                requestAnimationFrame(updateCounter)
            }
        }

        requestAnimationFrame(updateCounter)
    }, [value, duration])

    return <span className={className}>{displayValue.toLocaleString()}</span>
}

// Shimmer effect for loading
export function Shimmer({ className }: { className?: string }) {
    return (
        <motion.div
            className={`bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%] ${className}`}
            animate={{
                backgroundPosition: ["200% 0", "-200% 0"],
            }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
            }}
        />
    )
}
