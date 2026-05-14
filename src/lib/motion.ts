export const pageTransition = {
  duration: 0.36,
  ease: 'easeOut',
} as const

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: pageTransition,
} as const

export const fadeIn = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, amount: 0.2 },
  transition: pageTransition,
} as const

export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

export const hoverLift = {
  whileHover: { y: -4 },
  transition: { duration: 0.2 },
} as const
