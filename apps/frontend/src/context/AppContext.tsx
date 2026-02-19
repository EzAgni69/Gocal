'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, Language, Product, User } from '../types';
import { GooglePlaceResponse } from '../services/placesApi';

type AuthModalMode = 'signin' | 'signup';

interface AppContextType {
    // Existing state
    currentRole: UserRole;
    setCurrentRole: (role: UserRole) => void;
    language: Language;
    setLanguage: (lang: Language) => void;
    wishlist: Product[];
    addToWishlist: (product: Product) => void;
    removeFromWishlist: (productId: string) => void;
    showWishlistDrawer: boolean;
    setShowWishlistDrawer: (show: boolean) => void;

    // Favorites state
    favorites: GooglePlaceResponse[];
    addToFavorites: (place: GooglePlaceResponse) => void;
    removeFromFavorites: (placeId: string) => void;
    isFavorite: (placeId: string) => boolean;
    favoritesCount: number;

    // Auth state
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    register: (name: string, email: string, password: string, phone?: string) => Promise<boolean>;
    logout: () => void;

    // Auth modal controls
    showAuthModal: boolean;
    setShowAuthModal: (show: boolean) => void;
    authModalMode: AuthModalMode;
    setAuthModalMode: (mode: AuthModalMode) => void;

    // Login required modal
    showLoginRequiredModal: boolean;
    setShowLoginRequiredModal: (show: boolean) => void;
    loginRequiredAction: string;
    setLoginRequiredAction: (action: string) => void;
    requireAuth: (actionName: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'vanij_user';
const FAVORITES_STORAGE_KEY = 'vanij_favorites';

export function AppProvider({ children }: { children: ReactNode }) {
    const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.CONSUMER);
    const [language, setLanguage] = useState<Language>('en');
    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [showWishlistDrawer, setShowWishlistDrawer] = useState(false);

    // Favorites state
    const [favorites, setFavorites] = useState<GooglePlaceResponse[]>([]);

    // Auth state
    const [user, setUser] = useState<User | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('signin');
    const [showLoginRequiredModal, setShowLoginRequiredModal] = useState(false);
    const [loginRequiredAction, setLoginRequiredAction] = useState('');

    // Load user and favorites from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                localStorage.removeItem(USER_STORAGE_KEY);
            }
        }

        const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (storedFavorites) {
            try {
                setFavorites(JSON.parse(storedFavorites));
            } catch (e) {
                localStorage.removeItem(FAVORITES_STORAGE_KEY);
            }
        }
    }, []);

    // Persist favorites to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    }, [favorites]);

    const isAuthenticated = user !== null;

    const login = async (email: string, password: string): Promise<boolean> => {
        // Mock authentication - in production, call your auth API
        // For demo, we'll accept any email/password and create a user
        const mockUser: User = {
            id: `user_${Date.now()}`,
            name: email.split('@')[0],
            email,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`,
        };
        setUser(mockUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
        setShowAuthModal(false);
        return true;
    };

    const register = async (name: string, email: string, password: string, phone?: string): Promise<boolean> => {
        // Mock registration - in production, call your auth API
        const mockUser: User = {
            id: `user_${Date.now()}`,
            name,
            email,
            phone,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
        };
        setUser(mockUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
        setShowAuthModal(false);
        return true;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem(USER_STORAGE_KEY);
    };

    // Helper function to check auth and show login modal if needed
    const requireAuth = (actionName: string): boolean => {
        if (isAuthenticated) {
            return true;
        }
        setLoginRequiredAction(actionName);
        setShowLoginRequiredModal(true);
        return false;
    };

    const addToWishlist = (product: Product) => {
        if (!wishlist.find(p => p.id === product.id)) {
            setWishlist([...wishlist, product]);
            setShowWishlistDrawer(true);
        }
    };

    const removeFromWishlist = (productId: string) => {
        setWishlist(wishlist.filter(p => p.id !== productId));
    };

    // Favorites functions
    const addToFavorites = (place: GooglePlaceResponse) => {
        if (!favorites.find(p => p.id === place.id)) {
            setFavorites([...favorites, place]);
        }
    };

    const removeFromFavorites = (placeId: string) => {
        setFavorites(favorites.filter(p => p.id !== placeId));
    };

    const isFavorite = (placeId: string): boolean => {
        return favorites.some(p => p.id === placeId);
    };

    const favoritesCount = favorites.length;

    return (
        <AppContext.Provider value={{
            currentRole, setCurrentRole,
            language, setLanguage,
            wishlist, addToWishlist, removeFromWishlist,
            showWishlistDrawer, setShowWishlistDrawer,
            // Favorites
            favorites, addToFavorites, removeFromFavorites, isFavorite, favoritesCount,
            // Auth
            user, isAuthenticated, login, register, logout,
            showAuthModal, setShowAuthModal,
            authModalMode, setAuthModalMode,
            showLoginRequiredModal, setShowLoginRequiredModal,
            loginRequiredAction, setLoginRequiredAction,
            requireAuth,
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}

