'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, LogIn, UserPlus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Button } from '@/components/ui/Button';

export const LoginRequiredModal: React.FC = () => {
    const {
        showLoginRequiredModal,
        setShowLoginRequiredModal,
        loginRequiredAction,
        setShowAuthModal,
        setAuthModalMode
    } = useAppContext();

    const handleSignIn = () => {
        setShowLoginRequiredModal(false);
        setAuthModalMode('signin');
        setShowAuthModal(true);
    };

    const handleSignUp = () => {
        setShowLoginRequiredModal(false);
        setAuthModalMode('signup');
        setShowAuthModal(true);
    };

    const handleClose = () => {
        setShowLoginRequiredModal(false);
    };

    return (
        <AnimatePresence>
            {showLoginRequiredModal && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed left-1/2 top-1/2 z-[201] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-100">
                                <Lock className="h-8 w-8 text-gold-600" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="text-center mb-6">
                            <h3 className="font-serif text-xl font-bold text-luxury-black mb-2">
                                Sign In Required
                            </h3>
                            <p className="text-gray-500 text-sm">
                                {loginRequiredAction
                                    ? `Please sign in to ${loginRequiredAction.toLowerCase()}.`
                                    : 'Please sign in to access this feature.'}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <Button
                                onClick={handleSignIn}
                                className="w-full h-11 bg-luxury-black hover:bg-gold-600 text-white font-semibold"
                            >
                                <LogIn className="h-4 w-4 mr-2" />
                                Sign In
                            </Button>
                            <Button
                                onClick={handleSignUp}
                                variant="outline"
                                className="w-full h-11 font-semibold"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Create Account
                            </Button>
                            <button
                                onClick={handleClose}
                                className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
