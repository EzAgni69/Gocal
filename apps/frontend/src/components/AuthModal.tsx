'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Phone, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Button } from '@/components/ui/Button';
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { auth } from '../config/firebase';

declare global {
    interface Window {
        recaptchaVerifier: any;
    }
}

export const AuthModal: React.FC = () => {
    const {
        showAuthModal,
        setShowAuthModal,
        authModalMode,
        setAuthModalMode,
        login,
        loginWithGoogle,
        register,
        sendPhoneOTP,
        confirmPhoneOTP
    } = useAppContext();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setName('');
        setPhone('');
        setOtp('');
        setOtpSent(false);
        setConfirmationResult(null);
        setError('');
    };

    const setupRecaptcha = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible'
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (authModalMode === 'phone') {
                if (otpSent) {
                    if (!otp) {
                        setError('Please enter the OTP');
                        setIsLoading(false);
                        return;
                    }
                    if (confirmationResult) {
                        await confirmPhoneOTP(confirmationResult, otp);
                        resetForm();
                    }
                } else {
                    if (!phone) {
                        setError('Please enter a phone number');
                        setIsLoading(false);
                        return;
                    }
                    setupRecaptcha();
                    const appVerifier = window.recaptchaVerifier;
                    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
                    const result = await sendPhoneOTP(formattedPhone, appVerifier);
                    setConfirmationResult(result);
                    setOtpSent(true);
                }
            } else if (authModalMode === 'signin') {
                if (!email || !password) {
                    setError('Please fill in all fields');
                    setIsLoading(false);
                    return;
                }
                await login(email, password);
                resetForm();
            } else {
                if (!name || !email || !password) {
                    setError('Please fill in all required fields');
                    setIsLoading(false);
                    return;
                }
                await register(name, email, password, phone);
                resetForm();
            }
        } catch (err: any) {
            console.error("Auth Exception:", err);
            // Firebase specific error mapping
            if (err.code === 'auth/email-already-in-use') {
                setError('Email is already registered. Please sign in.');
            } else if (err.code === 'auth/invalid-credential') {
                setError('Invalid credentials or OTP.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
            } else if (err.code === 'auth/invalid-phone-number') {
                setError('Invalid phone number format. Include country code (e.g., +91).');
            } else {
                setError('An error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        try {
            await loginWithGoogle();
        } catch (err: any) {
            console.error("Google Auth Exception:", err);
            setError('Google sign-in failed. Please try again.');
        }
    };

    const handleClose = () => {
        setShowAuthModal(false);
        resetForm();
    };

    return (
        <AnimatePresence>
            {showAuthModal && (
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
                        className="fixed left-1/2 top-1/2 z-[201] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-8 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Header */}
                        <div className="text-center mb-8">
                            <h2 className="font-serif text-3xl font-bold text-luxury-black mb-2">
                                {authModalMode === 'signin' ? 'Welcome Back' : 'Create Account'}
                            </h2>
                            <p className="text-gray-500">
                                {authModalMode === 'signin'
                                    ? 'Sign in to access all features'
                                    : 'Join Gocal.co to connect with vendors'}
                            </p>
                        </div>

                        {/* Tabs */}
                        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                            <button
                                onClick={() => { setAuthModalMode('signin'); resetForm(); }}
                                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${authModalMode === 'signin'
                                        ? 'bg-white text-luxury-black shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Email Sign In
                            </button>
                            <button
                                onClick={() => { setAuthModalMode('phone'); resetForm(); }}
                                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${authModalMode === 'phone'
                                        ? 'bg-white text-luxury-black shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Phone Sign In
                            </button>
                            <button
                                onClick={() => { setAuthModalMode('signup'); resetForm(); }}
                                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${authModalMode === 'signup'
                                        ? 'bg-white text-luxury-black shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Sign Up
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div id="recaptcha-container"></div>
                            
                            {authModalMode === 'phone' ? (
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-4"
                                    >
                                        {!otpSent ? (
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <input
                                                    type="tel"
                                                    placeholder="Phone Number (e.g., +91...)"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-luxury-black placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                                                />
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Enter OTP"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-luxury-black placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                                                />
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            ) : (
                                <>
                                    {/* Name Field (Sign Up only) */}
                                    <AnimatePresence mode="wait">
                                        {authModalMode === 'signup' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div className="relative">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Full Name"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-luxury-black placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Email Field */}
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-luxury-black placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                                        />
                                    </div>

                                    {/* Phone Field (Sign Up only) */}
                                    <AnimatePresence mode="wait">
                                        {authModalMode === 'signup' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div className="relative">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                    <input
                                                        type="tel"
                                                        placeholder="Phone Number (Optional)"
                                                        value={phone}
                                                        onChange={(e) => setPhone(e.target.value)}
                                                        className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-luxury-black placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Password Field */}
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full h-12 pl-12 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-luxury-black placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Error Message */}
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-500 text-sm text-center"
                                >
                                    {error}
                                </motion.p>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 bg-luxury-black hover:bg-gold-600 text-white font-semibold"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : authModalMode === 'phone' ? (
                                    otpSent ? 'Verify OTP' : 'Send OTP'
                                ) : authModalMode === 'signin' ? (
                                    'Sign In'
                                ) : (
                                    'Create Account'
                                )}
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            {/* <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-400">or continue with</span>
                            </div> */}
                        </div>

                        {/* Social Login */}
                        <div className="grid grid-cols-1 gap-3">
                            <button 
                                onClick={handleGoogleLogin} 
                                type="button"
                                className="flex items-center justify-center gap-2 h-11 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700">Google</span>
                            </button>
                            {/* <button className="flex items-center justify-center gap-2 h-11 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700">Facebook</span>
                            </button> */}
                        </div>

                        {/* Footer */}
                        <p className="text-center text-xs text-gray-400 mt-6">
                            By continuing, you agree to our{' '}
                            <a href="#" className="text-gold-600 hover:underline">Terms of Service</a>
                            {' '}and{' '}
                            <a href="#" className="text-gold-600 hover:underline">Privacy Policy</a>
                        </p>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
