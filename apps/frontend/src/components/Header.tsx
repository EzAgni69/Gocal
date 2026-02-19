'use client';
import { ShoppingBag, User, Globe, ChevronDown, LogIn, LogOut, Settings, Heart } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { UserRole, Language } from '../types';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export const Header = () => {
    const {
        language, setLanguage,
        wishlist, setShowWishlistDrawer,
        currentRole, setCurrentRole,
        // Favorites
        favoritesCount,
        // Auth
        user, isAuthenticated, logout,
        setShowAuthModal, setAuthModalMode
    } = useAppContext();
    const router = useRouter();
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleRoleChange = (r: UserRole) => {
        setCurrentRole(r);
        if (r === UserRole.VENDOR) router.push('/vendor');
        else if (r === UserRole.SUPER_ADMIN) router.push('/admin');
        else router.push('/');
    };

    const handleSignInClick = () => {
        setAuthModalMode('signin');
        setShowAuthModal(true);
    };

    const handleLogout = () => {
        logout();
        setShowUserMenu(false);
    };

    if (pathname?.startsWith('/store/')) return null;

    return (
        <motion.nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6",
                scrolled
                    ? "py-3 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-gold-200/50 shadow-[0_4px_20px_-4px_rgba(46,108,181,0.15)]"
                    : "py-5 bg-gradient-to-b from-white via-white to-transparent"
            )}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-8">
                    {/* Premium Logo */}
                    <div
                        className="flex items-center gap-1 cursor-pointer group"
                        onClick={() => router.push('/')}
                    >
                        <span className="font-serif text-3xl font-bold text-luxury-black tracking-tight group-hover:text-gold-600 transition-colors duration-300">
                            Vanij
                        </span>
                        <span className="text-gold-500 text-4xl font-bold leading-none group-hover:scale-110 transition-transform duration-300">.</span>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/vadodara')}
                            className={cn(
                                "text-gray-600 font-medium hover:text-gold-600 hover:bg-gold-100/30 transition-all duration-300",
                                pathname === '/vadodara' && "text-gold-600 bg-gold-100/30"
                            )}
                        >
                            Explore Vadodara
                        </Button>
                    </div>

                    {/* Language Selector - Refined */}
                    <div className="hidden md:flex items-center gap-2 group relative">
                        <Button variant="ghost" size="sm" className="text-gray-500 font-medium hover:text-gold-600 hover:bg-gold-100/30 transition-all duration-300">
                            <Globe className="w-4 h-4 mr-2" />
                            {language === 'en' ? 'English' : language === 'hi' ? 'Hindi' : 'Gujarati'}
                            <ChevronDown className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-100" />
                        </Button>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as Language)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        >
                            <option value="en">English</option>
                            <option value="hi">Hindi</option>
                            <option value="gu">Gujarati</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Role Switcher - Elegant Pill */}
                    <div className="flex items-center bg-gradient-to-r from-gold-100/60 to-gold-100/40 rounded-full px-1 sm:px-1.5 py-1 sm:py-1.5 border border-gold-200/50 shadow-inner mr-1">
                        <div className="relative">
                            <select
                                value={currentRole}
                                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                                className="appearance-none bg-transparent text-[10px] sm:text-xs font-semibold text-gold-700 py-1 sm:py-1.5 pl-2 sm:pl-3 pr-6 sm:pr-8 rounded-full outline-none cursor-pointer hover:text-gold-600 transition-colors"
                            >
                                <option value={UserRole.CONSUMER}>Consumer</option>
                                <option value={UserRole.VENDOR}>Vendor</option>
                                <option value={UserRole.SUPER_ADMIN}>Admin</option>
                            </select>
                            <User className="absolute right-1.5 sm:right-2 top-1/2 transform -translate-y-1/2 w-3 sm:w-3.5 h-3 sm:h-3.5 text-gold-500 pointer-events-none" />
                        </div>
                    </div>

                    {/* Favorites - Heart Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative rounded-full hover:bg-red-50 text-luxury-black hover:text-red-500 transition-all duration-300 hover:shadow-md"
                        onClick={() => router.push('/favourites')}
                    >
                        <Heart className="w-5 h-5" />
                        <AnimatePresence>
                            {favoritesCount > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-br from-red-400 to-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                                >
                                    {favoritesCount}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Button>

                    {/* Wishlist - Premium Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative rounded-full hover:bg-gold-100/60 text-luxury-black hover:text-gold-600 transition-all duration-300 hover:shadow-md"
                        onClick={() => setShowWishlistDrawer(true)}
                    >
                        <ShoppingBag className="w-5 h-5" />
                        <AnimatePresence>
                            {wishlist.length > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-br from-gold-500 to-gold-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                                >
                                    {wishlist.length}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Button>

                    {/* Auth Section */}
                    {isAuthenticated && user ? (
                        // User Profile Dropdown
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2 p-1 pr-3 rounded-full bg-gray-100/50 hover:bg-gray-100 border border-white/20 backdrop-blur-sm transition-colors"
                            >
                                <img
                                    src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                                    alt={user.name}
                                    className="w-8 h-8 rounded-full bg-gold-100"
                                />
                                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                                    {user.name.split(' ')[0]}
                                </span>
                                <ChevronDown className={cn(
                                    "w-3 h-3 text-gray-400 transition-transform",
                                    showUserMenu && "rotate-180"
                                )} />
                            </button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {showUserMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
                                    >
                                        {/* User Info */}
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="font-semibold text-luxury-black">{user.name}</p>
                                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                        </div>

                                        {/* Menu Items */}
                                        <div className="py-2">
                                            <button
                                                onClick={() => {
                                                    setShowUserMenu(false);
                                                    // Navigate to profile or show settings
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                <Settings className="w-4 h-4 text-gray-400" />
                                                Settings
                                            </button>
                                        </div>

                                        {/* Logout */}
                                        <div className="border-t border-gray-100 pt-2">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Sign Out
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        // Sign In Button
                        <Button
                            onClick={handleSignInClick}
                            variant="secondary"
                            size="sm"
                            className="font-semibold"
                        >
                            <LogIn className="w-4 h-4 mr-2" />
                            Sign In
                        </Button>
                    )}
                </div>
            </div>
        </motion.nav>
    );
}

