'use client';
import { ShoppingBag, User, Globe, ChevronDown, LogIn, LogOut, Settings, Heart, Menu, X, ChevronRight, Store, CreditCard, ShieldAlert, MapPin, Search, Clock, Star } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { UserRole, Language } from '../types';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '../providers/TranslationProvider';
import { LanguageSelector } from './LanguageSelector';
import Image from 'next/image';

export const Header = () => {
    const {
        language, setLanguage,
        wishlist, setShowWishlistDrawer,
        currentRole, setCurrentRole,
        // Favorites
        favoritesCount,
        // Auth
        user, isAuthenticated, logout,
        setShowAuthModal, setAuthModalMode,
        // Global Location & Search context
        pincode, setPincode,
        resolvedArea, setResolvedArea,
        locationAccess, setLocationAccess,
        userLat, setUserLat,
        userLng, setUserLng,
        searchQuery, setSearchQuery,
        filterOpenNow, setFilterOpenNow,
        sortByReview, setSortByReview,
        sortByDistance, setSortByDistance
    } = useAppContext();
    const { t } = useTranslation();
    const router = useRouter();
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
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

    // Sync role with pathname to ensure the role switcher bubble matches the current view
    useEffect(() => {
        if (!pathname) return;

        const isVendorPath = pathname.startsWith('/vendor');
        const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/super-admin');

        if (isVendorPath) {
            if (currentRole !== UserRole.VENDOR) setCurrentRole(UserRole.VENDOR);
        } else if (isAdminPath) {
            const isAdminRole = currentRole === UserRole.ADMIN || currentRole === UserRole.SUPER_ADMIN;
            if (!isAdminRole) {
                // Default to user's highest role if we don't know which admin role to show
                setCurrentRole(user?.role === UserRole.SUPER_ADMIN ? UserRole.SUPER_ADMIN : UserRole.ADMIN);
            }
        } else {
            // Consumer view (home, explore, store, etc.)
            if (currentRole !== UserRole.CONSUMER) setCurrentRole(UserRole.CONSUMER);
        }
    }, [pathname, currentRole, setCurrentRole, user?.role]);

    const handleRoleChange = (r: UserRole) => {
        setCurrentRole(r);
        // Allow React state to flush before routing so ProtectedRoute doesn't bounce us
        setTimeout(() => {
            if (r === UserRole.VENDOR) router.push('/vendor');
            else if (r === UserRole.ADMIN || r === UserRole.SUPER_ADMIN) router.push('/admin');
            else router.push('/');
        }, 50);
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
                        className="flex flex-col cursor-pointer group"
                        onClick={() => router.push('/')}
                    >
                        <div className="flex items-center gap-1">
                            <span className="font-serif text-3xl font-bold text-luxury-black tracking-tight group-hover:text-gold-600 transition-colors duration-300">
                                Gocal
                            </span>
                            <span className="text-gold-500 text-4xl font-bold leading-none group-hover:scale-110 transition-transform duration-300">.</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold mt-0.5 group-hover:text-gold-500 transition-colors duration-300">
                            {t('Go local')}
                        </span>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-1">


                    </div>

                    {/* Language Selector - Premium */}
                    <div className="hidden md:flex">
                        <LanguageSelector />
                    </div>

                </div>

                {/* Mobile Top Bar Actions */}
                <div className="flex md:hidden items-center gap-2">
                     <button 
                         onClick={() => {
                             setShowLocationDropdown(!showLocationDropdown);
                             setShowMobileSearch(false);
                         }}
                         className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gold-50/95 border border-gold-200/50 text-luxury-black text-[11px] font-semibold max-w-[120px] sm:max-w-[140px] truncate transition-all active:scale-95"
                     >
                         <MapPin className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                         <span className="truncate">{resolvedArea || t('Vadodara')}</span>
                         <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
                     </button>

                     <button
                         onClick={() => {
                             setShowMobileSearch(!showMobileSearch);
                             setShowLocationDropdown(false);
                         }}
                         className={cn(
                             "p-2 rounded-full hover:bg-gold-50 text-luxury-black transition-all active:scale-95",
                             showMobileSearch && "text-gold-600 bg-gold-50"
                         )}
                         aria-label="Search"
                     >
                         <Search className="w-5 h-5" />
                     </button>

                     <button
                        className="p-2 text-luxury-black hover:text-gold-600 transition-all active:scale-95"
                        onClick={() => {
                            setShowMobileMenu(true);
                            setShowMobileSearch(false);
                            setShowLocationDropdown(false);
                        }}
                        aria-label={t("Menu")}
                     >
                        <Menu className="w-6 h-6" />
                     </button>
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-4">
                    {/* Role Switcher - Restricted to Admins/SuperAdmins (Commented out for Vendors) */}
                    {isAuthenticated && user && (user.role === UserRole.VENDOR || user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
                        <div className="flex items-center bg-gray-100/80 backdrop-blur-md rounded-full p-1 border border-white/40 shadow-inner mr-2 relative">
                            {[
                                { id: UserRole.CONSUMER, label: t('Consumer') },
                                ...((user.role === UserRole.VENDOR || user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) ? [{ id: UserRole.VENDOR, label: t('Vendor') }] : []),
                                ...((user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) ? [{ id: UserRole.ADMIN, label: t('Admin') }] : []),
                            ].map((roleOption) => (
                                <button
                                    key={roleOption.id}
                                    onClick={() => handleRoleChange(roleOption.id)}
                                    className={cn(
                                        "relative px-4 py-1.5 text-xs font-bold rounded-full transition-colors duration-300 z-10",
                                        currentRole === roleOption.id ? "text-luxury-black" : "text-gray-500 hover:text-gray-900"
                                    )}
                                >
                                    {currentRole === roleOption.id && (
                                        <motion.div
                                            layoutId="activeRolePill"
                                            className="absolute inset-0 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100"
                                            initial={false}
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            style={{ zIndex: -1 }}
                                        />
                                    )}
                                    <span className="relative z-10">{roleOption.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

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
                                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gold-100">
                                    <Image
                                        src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                                        alt={user.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
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
                                                    router.push('/request-card');
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                <Store className="w-4 h-4 text-gold-500" />
                                                {t('Request Contact Card')}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowUserMenu(false);
                                                    router.push('/pricing');
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                <CreditCard className="w-4 h-4 text-gold-500" />
                                                {t('Pricing')}
                                            </button>
                                            {/* <button
                                                onClick={() => {
                                                    setShowUserMenu(false);
                                                    // Navigate to profile or show settings
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                <Settings className="w-4 h-4 text-gray-400" />
                                                {t('Settings')}
                                            </button> */}
                                            {user.role === UserRole.VENDOR && (
                                                <button
                                                    onClick={() => {
                                                        setShowUserMenu(false);
                                                        handleRoleChange(UserRole.VENDOR);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gold-700 bg-gold-50 hover:bg-gold-100 transition-colors"
                                                >
                                                    <Store className="w-4 h-4" />
                                                    {t('Vendor Dashboard')}
                                                </button>
                                            )}
                                            {(user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
                                                <button
                                                    onClick={() => {
                                                        setShowUserMenu(false);
                                                        handleRoleChange(user.role as UserRole);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                                                >
                                                    <ShieldAlert className="w-4 h-4" />
                                                    {t('Admin Dashboard')}
                                                </button>
                                            )}
                                        </div>

                                        {/* Logout */}
                                        <div className="border-t border-gray-100 pt-2">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                {t('Sign Out')}
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
                            {t('Sign In')}
                        </Button>
                    )}
                </div>
            </div>

            {/* Location Dropdown - Mobile only */}
            <AnimatePresence>
                {showLocationDropdown && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden bg-white/95 backdrop-blur-md border-t border-gold-100/50 md:hidden"
                    >
                        <div className="p-4 flex flex-col gap-3">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('Select Pincode / Location')}</label>
                            <div className="flex gap-2">
                                <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                                    <MapPin className="text-gold-500 w-4 h-4 mr-2" />
                                    <input 
                                        type="text" 
                                        placeholder={t('Enter 6-digit Pincode')}
                                        value={pincode}
                                        onChange={(e) => setPincode(e.target.value)}
                                        className="bg-transparent outline-none w-full text-sm text-luxury-black placeholder-gray-400 font-medium"
                                        maxLength={6}
                                    />
                                    {pincode && (
                                        <button onClick={() => setPincode('')} className="text-gray-400 hover:text-luxury-black">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <Button 
                                    size="sm"
                                    onClick={() => {
                                        setShowLocationDropdown(false);
                                    }}
                                    className="bg-gold-500 hover:bg-gold-600 text-luxury-black rounded-xl font-bold px-4 h-[38px]"
                                >
                                    {t('Apply')}
                                </Button>
                            </div>
                            
                            {/* Geolocation Request Option */}
                            {locationAccess !== 'granted' && (
                                <button 
                                    onClick={() => {
                                        setShowLocationDropdown(false);
                                        if (navigator.geolocation) {
                                            navigator.geolocation.getCurrentPosition(
                                                (position) => {
                                                    setLocationAccess('granted');
                                                    setUserLat(position.coords.latitude);
                                                    setUserLng(position.coords.longitude);
                                                    // Reverse geocoding lookup
                                                    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json&accept-language=en`)
                                                        .then(res => res.json())
                                                        .then(data => {
                                                            if (data && data.address) {
                                                                const area = data.address.suburb || data.address.neighbourhood || data.address.residential || data.address.village || data.address.city_district;
                                                                if (area) setResolvedArea(area);
                                                            }
                                                        })
                                                        .catch(err => console.warn(err));
                                                },
                                                (err) => {
                                                    console.warn(err);
                                                    setLocationAccess('denied');
                                                }
                                            );
                                        }
                                    }}
                                    className="text-xs text-gold-600 font-bold hover:text-gold-700 text-left flex items-center gap-1.5 mt-1"
                                >
                                    <Globe className="w-3.5 h-3.5" />
                                    {t('Use My Current Location (GPS)')}
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search and Filters Subbar - Mobile only */}
            <AnimatePresence>
                {showMobileSearch && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden bg-white/95 backdrop-blur-md border-t border-gold-100/50 md:hidden"
                    >
                        <div className="p-4 flex flex-col gap-3">
                            {/* Search bar input */}
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                }}
                                className="flex gap-2"
                            >
                                <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                                    <Search className="text-gray-400 w-4 h-4 mr-2" />
                                    <input 
                                        type="text" 
                                        placeholder={t('Search stores & services...')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-transparent outline-none w-full text-sm text-luxury-black placeholder-gray-400 font-medium"
                                    />
                                    {searchQuery && (
                                        <button type="button" onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-luxury-black">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </form>

                            {/* Filter Chips Scrollable */}
                            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                                <button
                                    onClick={() => setFilterOpenNow(!filterOpenNow)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shrink-0 flex items-center gap-1",
                                        filterOpenNow 
                                            ? "bg-gold-500 border-gold-500 text-luxury-black shadow-sm" 
                                            : "bg-white border-gray-200 text-gray-600 hover:border-gold-300"
                                    )}
                                >
                                    <Clock className="w-3.5 h-3.5" />
                                    {t('Open Now')}
                                </button>

                                <button
                                    onClick={() => {
                                        setSortByReview(!sortByReview);
                                        setSortByDistance(false);
                                    }}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shrink-0 flex items-center gap-1",
                                        sortByReview 
                                            ? "bg-gold-500 border-gold-500 text-luxury-black shadow-sm" 
                                            : "bg-white border-gray-200 text-gray-600 hover:border-gold-300"
                                    )}
                                >
                                    <Star className="w-3.5 h-3.5" />
                                    {t('Top Rated')}
                                </button>

                                <button
                                    onClick={() => {
                                        if (locationAccess === 'granted' || pincode) {
                                            setSortByDistance(!sortByDistance);
                                            setSortByReview(false);
                                        }
                                    }}
                                    disabled={locationAccess !== 'granted' && !pincode}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shrink-0 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed",
                                        sortByDistance 
                                            ? "bg-gold-500 border-gold-500 text-luxury-black shadow-sm" 
                                            : "bg-white border-gray-200 text-gray-600 hover:border-gold-300"
                                    )}
                                >
                                    <MapPin className="w-3.5 h-3.5" />
                                    {t('Nearest')}
                                </button>

                                {(filterOpenNow || sortByReview || sortByDistance) && (
                                    <button
                                        onClick={() => {
                                            setFilterOpenNow(false);
                                            setSortByReview(false);
                                            setSortByDistance(false);
                                        }}
                                        className="px-3 py-1.5 rounded-full text-xs font-semibold border border-red-200 bg-red-50 text-red-600 transition-all shrink-0 flex items-center gap-1"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        {t('Clear')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Menu Drawer - Premium Redesign */}
            <AnimatePresence>
                {showMobileMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-luxury-black/60 z-[60] backdrop-blur-sm md:hidden"
                            onClick={() => setShowMobileMenu(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-luxury-cream z-[70] shadow-2xl md:hidden flex flex-col overflow-hidden"
                        >
                            {/* Drawer Header - User Profile */}
                            <div className="p-6 bg-white/50 border-b border-gold-100/50 pt-12">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-12 h-12 rounded-full bg-gold-100 flex items-center justify-center border border-gold-200 overflow-hidden">
                                            {user?.avatar ? (
                                                <Image src={user.avatar} alt={user.name} fill className="object-cover" />
                                            ) : (
                                                <User className="w-6 h-6 text-gold-600" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-serif text-lg font-bold text-luxury-black">
                                                {user ? `${t('Hello')}, ${user.name.split(' ')[0]}` : t('Welcome Guest')}
                                            </h3>
                                            <p className="text-xs text-gray-500">
                                                {user ? t('Member') : t('Sign in to access more')}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowMobileMenu(false)}
                                        className="p-2 hover:bg-black/5 rounded-full transition-colors"
                                    >
                                        <X className="w-6 h-6 text-luxury-black" />
                                    </button>
                                </div>

                                {!isAuthenticated && (
                                    <Button
                                        onClick={() => {
                                            handleSignInClick();
                                            setShowMobileMenu(false);
                                        }}
                                        className="w-full bg-luxury-black text-white hover:bg-gold-600 transition-colors"
                                    >
                                        {t('Sign In / Register')}
                                    </Button>
                                )}
                            </div>

                            {/* Main Navigation */}
                            <div className="flex-1 overflow-y-auto py-6 px-6 space-y-6">
                                <div className="space-y-1">
                                    <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3 pl-2">{t('Menu')}</p>
                                    <button
                                        onClick={() => {
                                            router.push('/');
                                            setShowMobileMenu(false);
                                        }}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white transition-colors group"
                                    >
                                        <span className="font-serif text-xl text-luxury-black group-hover:text-gold-600 transition-colors">{t('Home')}</span>
                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gold-500" />
                                    </button>

                                    <button
                                        onClick={() => {
                                            router.push('/favourites');
                                            setShowMobileMenu(false);
                                        }}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white transition-colors group"
                                    >
                                        <span className="font-serif text-xl text-luxury-black group-hover:text-gold-600 transition-colors">{t('Favorites')}</span>
                                        <div className="flex items-center gap-2">
                                            {favoritesCount > 0 && (
                                                <span className="text-xs font-bold text-white bg-gold-500 px-2 py-0.5 rounded-full">{favoritesCount}</span>
                                            )}
                                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gold-500" />
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setShowWishlistDrawer(true);
                                            setShowMobileMenu(false);
                                        }}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white transition-colors group"
                                    >
                                        <span className="font-serif text-xl text-luxury-black group-hover:text-gold-600 transition-colors">{t('Wishlist')}</span>
                                        <div className="flex items-center gap-2">
                                            {wishlist.length > 0 && (
                                                <span className="text-xs font-bold text-white bg-gold-500 px-2 py-0.5 rounded-full">{wishlist.length}</span>
                                            )}
                                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gold-500" />
                                        </div>
                                    </button>
                                    {isAuthenticated && (
                                        <button
                                            onClick={() => {
                                                router.push('/request-card');
                                                setShowMobileMenu(false);
                                            }}
                                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white transition-colors group"
                                        >
                                            <span className="font-serif text-xl text-luxury-black group-hover:text-gold-600 transition-colors flex items-center gap-2">
                                                <Store className="w-5 h-5 text-gold-500" />
                                                Request Contact Card
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gold-500" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            router.push('/pricing');
                                            setShowMobileMenu(false);
                                        }}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white transition-colors group"
                                    >
                                        <span className="font-serif text-xl text-luxury-black group-hover:text-gold-600 transition-colors flex items-center gap-2">
                                            <CreditCard className="w-5 h-5 text-gold-500" />
                                            {t('Pricing')}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gold-500" />
                                    </button>
                                </div>

                                <div className="h-px bg-gold-100/50" />

                                {/* Settings & Preferences */}
                                <div className="space-y-4">
                                     <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold pl-2">{t('Preferences')}</p>
                                     <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-gold-100/30">
                                        <div className="flex items-center gap-3">
                                            <Globe className="w-5 h-5 text-gold-600" />
                                            <span className="text-sm font-medium text-luxury-black">{t('Language')}</span>
                                        </div>
                                        <select
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value as Language)}
                                            className="bg-transparent text-sm font-semibold text-gray-600 outline-none text-right"
                                        >
                                            <option value="en">English</option>
                                            <option value="hi">Hindi</option>
                                            <option value="gu">Gujarati</option>
                                        </select>
                                     </div>

                                      {/* Switch View - Restricted to Admins/SuperAdmins (Commented out for Vendors) */}
                                      {isAuthenticated && user && (user.role === UserRole.VENDOR || user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
                                          <div className="space-y-2">
                                             <div className="flex items-center gap-3 px-3 mb-2 mt-4 text-xs uppercase tracking-widest text-gray-400 font-semibold">
                                                <User className="w-4 h-4 text-gold-500" />
                                                {t('Switch View')}
                                             </div>
                                             <div className="flex flex-col gap-2 px-1">
                                                 <button
                                                    onClick={() => { handleRoleChange(UserRole.CONSUMER); setShowMobileMenu(false); }}
                                                    className={cn(
                                                        "w-full flex items-center justify-center p-3 rounded-xl transition-all text-sm font-bold",
                                                        currentRole === UserRole.CONSUMER ? "bg-luxury-black text-white shadow-md" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                                                    )}
                                                 >
                                                    {t('Consumer Mode')}
                                                 </button>
                                                 {(user.role === UserRole.VENDOR || user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
                                                    <button
                                                        onClick={() => { handleRoleChange(UserRole.VENDOR); setShowMobileMenu(false); }}
                                                        className={cn(
                                                            "w-full flex items-center justify-center p-3 rounded-xl transition-all text-sm font-bold",
                                                            currentRole === UserRole.VENDOR ? "bg-gold-500 text-white shadow-md" : "bg-gold-50 text-gold-700 hover:bg-gold-100"
                                                        )}
                                                    >
                                                        {t('Vendor Dashboard')}
                                                    </button>
                                                 )}
                                                 {(user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
                                                     <button
                                                        onClick={() => { handleRoleChange(user.role as UserRole); setShowMobileMenu(false); }}
                                                        className={cn(
                                                            "w-full flex items-center justify-center p-3 rounded-xl transition-all text-sm font-bold",
                                                            (currentRole === UserRole.ADMIN || currentRole === UserRole.SUPER_ADMIN) ? "bg-blue-600 text-white shadow-md" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                                        )}
                                                     >
                                                        {t('Admin Dashboard')}
                                                     </button>
                                                 )}
                                             </div>
                                         </div>
                                     )}
                                </div>
                            </div>

                            {/* Drawer Footer */}
                            <div className="p-6 bg-white border-t border-gold-100">
                                {isAuthenticated && (
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setShowMobileMenu(false);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 p-3 rounded-xl transition-colors text-sm font-medium"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        {t('Log Out')}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}

