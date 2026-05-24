'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface FullScreenImageModalProps {
  src: string | null;
  isOpen: boolean;
  onClose: () => void;
  alt?: string;
}

export const FullScreenImageModal: React.FC<FullScreenImageModalProps> = ({
  src,
  isOpen,
  onClose,
  alt = 'Full screen view'
}) => {
  // Prevent background scroll and handle Escape key
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!src) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          {/* Backdrop with premium blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-zoom-out"
            onClick={onClose}
          />

          {/* Close button with subtle micro-animations */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.1 }}
            onClick={onClose}
            className="absolute right-6 top-6 z-[210] flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all hover:scale-110 active:scale-95 shadow-lg"
            aria-label="Close image view"
          >
            <X className="h-6 w-6" />
          </motion.button>

          {/* Image wrapper & content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="relative z-[205] max-h-[85vh] max-w-[90vw] md:max-h-[90vh] md:max-w-[85vw] select-none pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={src}
              alt={alt}
              className="max-h-[85vh] max-w-[90vw] md:max-h-[90vh] md:max-w-[85vw] object-contain rounded-lg shadow-2xl border border-white/5"
              draggable={false}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
