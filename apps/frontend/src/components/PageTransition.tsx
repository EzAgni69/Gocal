'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.2, // Snappy blink feel
        ease: "easeInOut",
      }}
      className="flex-1 flex flex-col"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
