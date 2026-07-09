'use client';
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Phone, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowRight, KeyRound } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Button } from '@/components/ui/Button';
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { auth } from '../config/firebase';

declare global {
    interface Window {
        recaptchaVerifier: any;
    }
}

// ─── Password Strength ────────────────────────────────────────────────
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500' };
    if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' };
    if (score <= 4) return { score, label: 'Strong', color: 'bg-green-500' };
    return { score, label: 'Very Strong', color: 'bg-emerald-600' };
}

// ─── Error Banner Component ───────────────────────────────────────────
interface ErrorBannerProps {
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    type?: 'error' | 'success' | 'info';
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, actionLabel, onAction, type = 'error' }) => {
    const bgColor = type === 'success' ? 'bg-green-50 border-green-200' : type === 'info' ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200';
    const textColor = type === 'success' ? 'text-green-700' : type === 'info' ? 'text-blue-700' : 'text-red-700';
    const iconColor = type === 'success' ? 'text-green-500' : type === 'info' ? 'text-blue-500' : 'text-red-500';
    const Icon = type === 'success' ? CheckCircle2 : AlertCircle;
    const actionTextColor = type === 'success' ? 'text-green-800' : type === 'info' ? 'text-blue-800' : 'text-red-800';

    return (
        <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className={`flex items-start gap-3 p-3.5 rounded-xl border ${bgColor}`}
        >
            <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${iconColor}`} />
            <div className="flex-1 min-w-0">
                <p className={`text-sm ${textColor}`}>{message}</p>
                {actionLabel && onAction && (
                    <button
                        type="button"
                        onClick={onAction}
                        className={`mt-1.5 inline-flex items-center gap-1 text-sm font-semibold ${actionTextColor} hover:underline`}
                    >
                        {actionLabel}
                        <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        </motion.div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────
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
        confirmPhoneOTP,
        updateUserName,
        resetPassword,
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

    // First-time phone user name onboarding state
    const [needsNamePrompt, setNeedsNamePrompt] = useState(false);

    // Error/success state
    const [error, setError] = useState('');
    const [errorAction, setErrorAction] = useState<{ label: string; handler: () => void } | null>(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Forgot password state
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [resetEmailSent, setResetEmailSent] = useState(false);

    const resetForm = useCallback(() => {
        setEmail('');
        setPassword('');
        setName('');
        setPhone('');
        setOtp('');
        setOtpSent(false);
        setConfirmationResult(null);
        setError('');
        setErrorAction(null);
        setSuccessMessage('');
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
        setResetEmailSent(false);
        setNeedsNamePrompt(false);
    }, []);

    const switchToTab = useCallback((mode: 'signin' | 'signup' | 'phone') => {
        setAuthModalMode(mode);
        setError('');
        setErrorAction(null);
        setSuccessMessage('');
    }, [setAuthModalMode]);

    const setupRecaptcha = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible'
            });
        }
    };

    // ─── Forgot Password Handler ──────────────────────────────────────
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotPasswordEmail) {
            setError('Please enter your email address.');
            setErrorAction(null);
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            await resetPassword(forgotPasswordEmail);
            setResetEmailSent(true);
            setSuccessMessage(`Password reset link sent to ${forgotPasswordEmail}. Check your inbox (and spam folder).`);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email. Please try again.');
            setErrorAction(null);
        } finally {
            setIsLoading(false);
        }
    };

    // ─── Save Name for First-Time Phone User ──────────────────────────
    const handleSaveName = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name || !name.trim()) {
            setError('Please enter your name');
            return;
        }
        setIsLoading(true);
        try {
            await updateUserName(name.trim());
            setShowAuthModal(false);
            resetForm();
        } catch (err: any) {
            console.error('Error saving name:', err);
            setError('Failed to save name. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // ─── Main Form Handler ────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setErrorAction(null);
        setSuccessMessage('');
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
                        await confirmPhoneOTP(confirmationResult, otp, name);
                        const currentDisplayName = auth.currentUser?.displayName;
                        const hasValidName = (name && name.trim()) || (currentDisplayName && !currentDisplayName.startsWith('+'));
                        if (!hasValidName) {
                            setNeedsNamePrompt(true);
                            setIsLoading(false);
                            return;
                        }
                        setShowAuthModal(false);
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
                // Sign Up
                if (!name || !email || !password) {
                    setError('Please fill in all required fields');
                    setIsLoading(false);
                    return;
                }
                if (password.length < 6) {
                    setError('Password must be at least 6 characters long.');
                    setIsLoading(false);
                    return;
                }
                await register(name, email, password, phone);
                resetForm();
            }
        } catch (err: any) {
            console.error("Auth Exception:", err);

            // ─── Firebase error code → actionable error messages ──────
            switch (err.code) {
                // Sign In errors
                case 'auth/user-not-found':
                case 'auth/invalid-credential':
                    if (authModalMode === 'signin') {
                        setError('No account found with this email, or the password is incorrect.');
                        setErrorAction({
                            label: 'Create an account instead',
                            handler: () => switchToTab('signup'),
                        });
                    } else {
                        setError('Invalid credentials. Please check and try again.');
                    }
                    break;

                case 'auth/wrong-password':
                    setError('Incorrect password. Please try again or reset it.');
                    setErrorAction({
                        label: 'Reset your password',
                        handler: () => {
                            setForgotPasswordEmail(email);
                            setShowForgotPassword(true);
                            setError('');
                            setErrorAction(null);
                        },
                    });
                    break;

                case 'auth/user-disabled':
                    setError('This account has been disabled. Please contact support.');
                    break;

                // Sign Up errors
                case 'auth/email-already-in-use':
                    setError('An account with this email already exists.');
                    setErrorAction({
                        label: 'Sign in instead',
                        handler: () => switchToTab('signin'),
                    });
                    break;

                case 'auth/weak-password':
                    setError('Password is too weak. Use at least 6 characters with a mix of letters and numbers.');
                    break;

                case 'auth/invalid-email':
                    setError('Please enter a valid email address.');
                    break;

                // Phone errors
                case 'auth/invalid-phone-number':
                    setError('Invalid phone number format. Include country code (e.g., +91).');
                    break;

                case 'auth/invalid-verification-code':
                    setError('The OTP you entered is incorrect. Please check and try again.');
                    break;

                case 'auth/code-expired':
                    setError('The OTP has expired. Please request a new one.');
                    setErrorAction({
                        label: 'Resend OTP',
                        handler: () => {
                            setOtpSent(false);
                            setOtp('');
                            setError('');
                            setErrorAction(null);
                        },
                    });
                    break;

                // Rate limiting
                case 'auth/too-many-requests':
                    setError('Too many attempts. Please wait a few minutes and try again.');
                    break;

                // Network
                case 'auth/network-request-failed':
                    setError('Network error. Please check your internet connection and try again.');
                    break;

                // Google/popup errors
                case 'auth/popup-closed-by-user':
                case 'auth/cancelled-popup-request':
                    // User intentionally cancelled — don't show error
                    break;

                case 'auth/popup-blocked':
                    setError('The sign-in popup was blocked by your browser. Please allow popups for this site.');
                    break;

                case 'auth/account-exists-with-different-credential':
                    setError('An account already exists with this email using a different sign-in method. Try email/password or Google sign-in.');
                    break;

                case 'auth/unauthorized-domain':
                    setError('This domain is not authorized for sign-in. Please contact support.');
                    break;

                default:
                    setError(err.message || 'An unexpected error occurred. Please try again.');
                    break;
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setErrorAction(null);
        setIsLoading(true);
        try {
            await loginWithGoogle();
            resetForm();
        } catch (err: any) {
            console.error("Google Auth Exception:", err);
            switch (err.code) {
                case 'auth/popup-closed-by-user':
                case 'auth/cancelled-popup-request':
                    // User closed it — no error
                    break;
                case 'auth/popup-blocked':
                    setError('The sign-in popup was blocked. Please allow popups for this site and try again.');
                    break;
                case 'auth/account-exists-with-different-credential':
                    setError('An account with this email exists using a different method. Try email/password sign-in.');
                    setErrorAction({
                        label: 'Sign in with email',
                        handler: () => switchToTab('signin'),
                    });
                    break;
                case 'auth/unauthorized-domain':
                    setError('This domain is not authorized for Google sign-in. Please contact support.');
                    break;
                case 'auth/network-request-failed':
                    setError('Network error. Please check your connection and try again.');
                    break;
                default:
                    setError('Google sign-in failed. Please try again or use email/password.');
                    break;
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setShowAuthModal(false);
        resetForm();
    };

    // ─── Header text based on mode ────────────────────────────────────
    const getHeaderText = () => {
        if (showForgotPassword) {
            return { title: 'Reset Password', subtitle: 'Enter your email to receive a reset link' };
        }
        if (needsNamePrompt) {
            return { title: 'Welcome to Gocal!', subtitle: 'Please enter your name for your profile' };
        }
        switch (authModalMode) {
            case 'signin':
                return { title: 'Welcome Back', subtitle: 'Sign in to access your account' };
            case 'signup':
                return { title: 'Create Account', subtitle: 'Join Gocal.co to connect with local vendors' };
            case 'phone':
                return { 
                    title: 'Phone Sign In / Up', 
                    subtitle: otpSent ? 'Enter the OTP sent to your phone' : 'Sign in or register with your phone number' 
                };
        }
    };

    const { title, subtitle } = getHeaderText();
    const passwordStrength = authModalMode === 'signup' && password.length > 0 ? getPasswordStrength(password) : null;

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
                        className="fixed left-1/2 top-1/2 z-[201] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
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
                        <div className="text-center mb-6">
                            <h2 className="font-serif text-3xl font-bold text-luxury-black mb-2">
                                {title}
                            </h2>
                            <p className="text-gray-500">{subtitle}</p>
                        </div>

                        {/* ─── Forgot Password View ──────────────────────────── */}
                        {showForgotPassword ? (
                            <div className="space-y-4">
                                <AnimatePresence mode="wait">
                                    {/* Error/Success Banner */}
                                    {error && (
                                        <ErrorBanner
                                            message={error}
                                            actionLabel={errorAction?.label}
                                            onAction={errorAction?.handler}
                                        />
                                    )}
                                    {successMessage && (
                                        <ErrorBanner message={successMessage} type="success" />
                                    )}
                                </AnimatePresence>

                                {!resetEmailSent ? (
                                    <form onSubmit={handleForgotPassword} className="space-y-4">
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input
                                                type="email"
                                                placeholder="Email Address"
                                                value={forgotPasswordEmail}
                                                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                                className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-luxury-black placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                                                autoFocus
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full h-12 bg-luxury-black hover:bg-gold-600 text-white font-semibold"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                'Send Reset Link'
                                            )}
                                        </Button>
                                    </form>
                                ) : (
                                    <div className="text-center py-4">
                                        <div className="flex justify-center mb-4">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-1">
                                            Check your inbox (and spam folder) for the reset link.
                                        </p>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForgotPassword(false);
                                        setResetEmailSent(false);
                                        setError('');
                                        setSuccessMessage('');
                                    }}
                                    className="w-full text-sm text-gray-500 hover:text-luxury-black py-2 transition-colors font-medium"
                                >
                                    ← Back to Sign In
                                </button>
                            </div>
                        ) : needsNamePrompt ? (
                            <form onSubmit={handleSaveName} className="space-y-4">
                                <p className="text-sm text-gray-600 text-center mb-2">
                                    Welcome! Since this is your first time signing in with your phone number, please enter your name so vendors know who you are.
                                </p>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Enter your full name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-luxury-black placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                                        autoFocus
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 bg-luxury-black hover:bg-gold-600 text-white font-semibold"
                                >
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save & Continue'}
                                </Button>
                            </form>
                        ) : (
                            <>
                                {/* Tabs */}
                                <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                                    <button
                                        onClick={() => { switchToTab('signin'); resetForm(); }}
                                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${authModalMode === 'signin'
                                                ? 'bg-white text-luxury-black shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Email Sign In
                                    </button>
                                    <button
                                        onClick={() => { switchToTab('phone'); resetForm(); }}
                                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${authModalMode === 'phone'
                                                ? 'bg-white text-luxury-black shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Phone Sign In / Up
                                    </button>
                                    <button
                                        onClick={() => { switchToTab('signup'); resetForm(); }}
                                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${authModalMode === 'signup'
                                                ? 'bg-white text-luxury-black shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Sign Up
                                    </button>
                                </div>

                                {/* Error/Success Banners */}
                                <AnimatePresence mode="wait">
                                    {error && (
                                        <div className="mb-4">
                                            <ErrorBanner
                                                message={error}
                                                actionLabel={errorAction?.label}
                                                onAction={errorAction?.handler}
                                            />
                                        </div>
                                    )}
                                    {successMessage && (
                                        <div className="mb-4">
                                            <ErrorBanner message={successMessage} type="success" />
                                        </div>
                                    )}
                                </AnimatePresence>

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
                                                    <div className="space-y-3">
                                                        <div className="relative">
                                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                placeholder="Full Name (Optional for returning users)"
                                                                value={name}
                                                                onChange={(e) => setName(e.target.value)}
                                                                className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-luxury-black placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                                                            />
                                                        </div>
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
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className="relative">
                                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                placeholder="Enter 6-digit OTP"
                                                                value={otp}
                                                                onChange={(e) => setOtp(e.target.value)}
                                                                maxLength={6}
                                                                className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-luxury-black placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors tracking-widest text-center text-lg font-mono"
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setOtpSent(false); setOtp(''); setError(''); setErrorAction(null); }}
                                                            className="text-sm text-gold-600 hover:text-gold-700 font-medium"
                                                        >
                                                            ← Change phone number
                                                        </button>
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

                                            {/* Password Strength Indicator (Sign Up only) */}
                                            {passwordStrength && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="space-y-1.5"
                                                >
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3, 4, 5].map((level) => (
                                                            <div
                                                                key={level}
                                                                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                                                                    level <= passwordStrength.score
                                                                        ? passwordStrength.color
                                                                        : 'bg-gray-200'
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <p className={`text-xs ${
                                                        passwordStrength.score <= 1 ? 'text-red-500' :
                                                        passwordStrength.score <= 2 ? 'text-orange-500' :
                                                        passwordStrength.score <= 3 ? 'text-yellow-600' :
                                                        'text-green-600'
                                                    }`}>
                                                        {passwordStrength.label}
                                                        {passwordStrength.score < 3 && ' — try adding uppercase, numbers, or symbols'}
                                                    </p>
                                                </motion.div>
                                            )}

                                            {/* Forgot Password Link (Sign In only) */}
                                            {authModalMode === 'signin' && (
                                                <div className="flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setForgotPasswordEmail(email);
                                                            setShowForgotPassword(true);
                                                            setError('');
                                                            setErrorAction(null);
                                                        }}
                                                        className="text-sm text-gold-600 hover:text-gold-700 font-medium flex items-center gap-1"
                                                    >
                                                        <KeyRound className="h-3.5 w-3.5" />
                                                        Forgot password?
                                                    </button>
                                                </div>
                                            )}
                                        </>
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
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-white text-gray-400">or continue with</span>
                                    </div>
                                </div>

                                {/* Social Login */}
                                <div className="grid grid-cols-1 gap-3">
                                    <button 
                                        onClick={handleGoogleLogin} 
                                        type="button"
                                        disabled={isLoading}
                                        className="flex items-center justify-center gap-2 h-11 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        <span className="text-sm font-medium text-gray-700">
                                            {isLoading ? 'Signing in...' : 'Google'}
                                        </span>
                                    </button>
                                </div>
                            </>
                        )}

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
