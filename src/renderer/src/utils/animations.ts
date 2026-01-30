import { Variants } from 'framer-motion'

/**
 * Reusable Framer Motion animation variants for ZenFlow
 * Monochrome minimalist animations with clean, subtle movements
 */

// ============================================
// Task Completion Animation
// Elegant strikethrough effect
// ============================================
export const taskCompletionVariants: Variants = {
  incomplete: {
    opacity: 1,
    color: '#FFFFFF',
    textDecoration: 'none'
  },
  complete: {
    opacity: 0.5,
    color: '#737373',
    textDecoration: 'line-through',
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }
  }
}

// Strikethrough line animation (for visual effect)
export const strikethroughVariants: Variants = {
  hidden: {
    scaleX: 0,
    originX: 0
  },
  visible: {
    scaleX: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  }
}

// ============================================
// Card Animations
// ============================================
export const cardHoverVariants: Variants = {
  initial: {
    y: 0,
    scale: 1,
    boxShadow: '0 0 0 rgba(0, 0, 0, 0)'
  },
  hover: {
    y: -4,
    scale: 1.01,
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1
    }
  }
}

export const cardEnterVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2
    }
  }
}

// ============================================
// Sidebar Animations
// ============================================
export const sidebarVariants: Variants = {
  expanded: {
    width: 240,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  collapsed: {
    width: 72,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  }
}

export const sidebarItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -10
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2
    }
  }
}

// ============================================
// Page Transitions
// ============================================
export const pageTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    x: 20
  },
  enter: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.3
    }
  }
}

// ============================================
// List Item Animations (staggered)
// ============================================
export const listContainerVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1]
    }
  }
}

// ============================================
// Button Animations
// ============================================
export const buttonVariants: Variants = {
  initial: {
    scale: 1
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2
    }
  },
  tap: {
    scale: 0.98
  }
}

// ============================================
// Fade Animations
// ============================================
export const fadeVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
}

// ============================================
// Pulse Animation (for focus timer)
// ============================================
export const pulseVariants: Variants = {
  idle: {
    scale: 1
  },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}
