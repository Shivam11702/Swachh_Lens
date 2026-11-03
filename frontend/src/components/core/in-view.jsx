import { motion } from 'framer-motion'

export const InView = ({ children, variants, viewOptions, transition }) => {
  const defaultVariants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
    ...variants,
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={defaultVariants}
      transition={transition}
      style={{
        margin: viewOptions?.margin || '0px',
      }}
    >
      {children}
    </motion.div>
  )
}

InView.Variants = {
  slideInLeft: {
    hidden: { opacity: 0, x: -100 },
    visible: { opacity: 1, x: 0 },
  },
  slideInRight: {
    hidden: { opacity: 0, x: 100 },
    visible: { opacity: 1, x: 0 },
  },
  slideInUp: {
    hidden: { opacity: 0, y: 100 },
    visible: { opacity: 1, y: 0 },
  },
  slideInDown: {
    hidden: { opacity: 0, y: -100 },
    visible: { opacity: 1, y: 0 },
  },
}
