'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, Language, Product, User } from '../types';
import { GooglePlaceResponse } from '../services/placesApi';
import { apiClient } from '../services/apiClient';
import { auth } from '../config/firebase';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    ConfirmationResult
} from 'firebase/auth';
type AuthModalMode = 'signin' | 'signup' | 'phone';

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
    loginWithGoogle: () => Promise<boolean>;
    register: (name: string, email: string, password: string, phone?: string) => Promise<boolean>;
    sendPhoneOTP: (phoneNumber: string, appVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
    confirmPhoneOTP: (confirmationResult: ConfirmationResult, otp: string) => Promise<boolean>;
    logout: () => Promise<void>;

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

    // Location state
    pincode: string;
    setPincode: (pin: string) => void;
    resolvedArea: string | null;
    setResolvedArea: (area: string | null) => void;
    locationAccess: 'pending' | 'granted' | 'denied';
    setLocationAccess: (access: 'pending' | 'granted' | 'denied') => void;
    userLat: number | undefined;
    setUserLat: (lat: number | undefined) => void;
    userLng: number | undefined;
    setUserLng: (lng: number | undefined) => void;

    // Search & filters state
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filterOpenNow: boolean;
    setFilterOpenNow: (val: boolean) => void;
    sortByReview: boolean;
    setSortByReview: (val: boolean) => void;
    sortByDistance: boolean;
    setSortByDistance: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'gocal_user';
const FAVORITES_STORAGE_KEY = 'gocal_favorites';

export function AppProvider({ children }: { children: ReactNode }) {
    const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.CONSUMER);
    const [language, setLanguage] = useState<Language>('en');
    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [wishlistId, setWishlistId] = useState<string | null>(null);
    const [showWishlistDrawer, setShowWishlistDrawer] = useState(false);

    // Favorites state
    const [favorites, setFavorites] = useState<GooglePlaceResponse[]>([]);

    // Auth state
    const [user, setUser] = useState<User | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('signin');
    const [showLoginRequiredModal, setShowLoginRequiredModal] = useState(false);
    const [loginRequiredAction, setLoginRequiredAction] = useState('');

    // Location and Search states
    const [pincode, setPincode] = useState('');
    const [resolvedArea, setResolvedArea] = useState<string | null>(null);
    const [locationAccess, setLocationAccess] = useState<'pending' | 'granted' | 'denied'>('pending');
    const [userLat, setUserLat] = useState<number | undefined>();
    const [userLng, setUserLng] = useState<number | undefined>();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOpenNow, setFilterOpenNow] = useState(false);
    const [sortByReview, setSortByReview] = useState(false);
    const [sortByDistance, setSortByDistance] = useState(false);

    // Sync Firebase Auth State and Fetch User Data
    const fetchUserData = async (token: string) => {
        try {
            // fetch favorites
            const favRes = await apiClient('/api/favorites', { headers: { Authorization: `Bearer ${token}` } });
            if (favRes.ok) {
                const favData = await favRes.json();
                setFavorites(favData.favorites.map((f: any) => f.placeData).filter(Boolean));
            }

            // fetch wishlists
            const wlRes = await apiClient('/api/wishlists', { headers: { Authorization: `Bearer ${token}` } });
            if (wlRes.ok) {
                const wlData = await wlRes.json();
                if (wlData.wishlists.length > 0) {
                    const firstWishlist = wlData.wishlists[0];
                    setWishlistId(firstWishlist.id);
                    // Map productData and ensure vendor info is extracted if it was stored inside productData
                    setWishlist(firstWishlist.items.map((i: any) => ({
                        ...i.productData,
                        vendorId: i.productData?.vendorId || i.vendorId,
                        vendorName: i.productData?.vendorName || i.vendor?.name,
                        vendorPhone: i.productData?.vendorPhone || i.vendor?.phone,
                    })).filter(Boolean));
                } else {
                    // Create a new wishlist
                    const createRes = await apiClient('/api/wishlists', { 
                        method: 'POST', 
                        body: JSON.stringify({ name: 'My Wishlist' }), 
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } 
                    });
                    if (createRes.ok) {
                        const createData = await createRes.json();
                        setWishlistId(createData.wishlist.id);
                        setWishlist([]);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const token = await firebaseUser.getIdToken();
                    localStorage.setItem('firebase_token', token);

                    // Sync with our Postgres database via the backend API
                    const res = await apiClient('/api/auth/sync', {
                        method: 'POST'
                    });

                    if (res.ok) {
                        const data = await res.json();
                        setUser({
                            id: data.user.id || firebaseUser.uid,
                            name: data.user.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                            email: data.user.email || firebaseUser.email || '',
                            avatar: data.user.avatarUrl || firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${firebaseUser.email}`,
                            // Additional custom fields from Postgres
                            phone: data.user.phone,
                            role: data.user.role || 'CONSUMER',
                        });
                        // Set global role from DB
                        if (data.user.role) {
                            setCurrentRole(data.user.role as UserRole);

                            // Redirect vendors/admins to their respective dashboards by default
                            if (!sessionStorage.getItem('has_redirected_role')) {
                                sessionStorage.setItem('has_redirected_role', 'true');
                                if ((window.location.pathname === '/' || window.location.pathname === '/vadodara') && !window.location.search) {
                                    if (data.user.role === UserRole.VENDOR) {
                                        window.location.href = '/vendor';
                                    } else if (data.user.role === UserRole.ADMIN || data.user.role === UserRole.SUPER_ADMIN) {
                                        window.location.href = '/admin';
                                    }
                                }
                            }
                        }
                        
                        // Fetch user-specific wishlists and favorites
                        await fetchUserData(token);
                    } else {
                        console.error("Failed to sync user with backend");
                        // Fallback purely on Firebase data if backend fails
                        setUser({
                            id: firebaseUser.uid,
                            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                            email: firebaseUser.email || '',
                            avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${firebaseUser.email}`,
                        });
                    }
                } catch (error) {
                    console.error("Error during auth state sync:", error);
                    // Fallback purely on Firebase data if backend is unreachable
                    setUser({
                        id: firebaseUser.uid,
                        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                        email: firebaseUser.email || '',
                        avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${firebaseUser.email}`,
                    });
                }
            } else {
                setUser(null);
                setCurrentRole(UserRole.CONSUMER);
                localStorage.removeItem('firebase_token');
                sessionStorage.removeItem('has_redirected_role');
                setWishlist([]);
                setFavorites([]);
                setWishlistId(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const isAuthenticated = user !== null;

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setShowAuthModal(false);
            return true;
        } catch (error) {
            console.error("Login Error:", error);
            throw error; // Rethrow to handle in AuthModal
        }
    };

    const loginWithGoogle = async (): Promise<boolean> => {
        try {
            const provider = new GoogleAuthProvider();
            // Force account selection to avoid auto-closing popups
            provider.setCustomParameters({ prompt: 'select_account' });
            
            const result = await signInWithPopup(auth, provider);
            console.log("Google Login Success:", result.user.email);
            setShowAuthModal(false);
            return true;
        } catch (error: any) {
            console.error("Full Google Login Error Object:", error);
            console.error("Google Login Error Code:", error.code);
            console.error("Google Login Error Message:", error.message);
            
            if (error.code === 'auth/unauthorized-domain') {
                console.error("CRITICAL: This domain is not authorized in Firebase Console.");
            }
            
            throw error;
        }
    }

    const register = async (name: string, email: string, password: string, phone?: string): Promise<boolean> => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Update profile with name
            await updateProfile(userCredential.user, {
                displayName: name
            });
            setShowAuthModal(false);
            return true;
        } catch (error) {
            console.error("Registration Error:", error);
            throw error;
        }
    };

    const sendPhoneOTP = async (phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
        try {
            const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            return confirmationResult;
        } catch (error) {
            console.error("Error sending OTP:", error);
            throw error;
        }
    };

    const confirmPhoneOTP = async (confirmationResult: ConfirmationResult, otp: string): Promise<boolean> => {
        try {
            await confirmationResult.confirm(otp);
            setShowAuthModal(false);
            return true;
        } catch (error) {
            console.error("Error confirming OTP:", error);
            throw error;
        }
    };

    const logout = async () => {
        sessionStorage.removeItem('has_redirected_role');
        await signOut(auth);
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

    const addToWishlist = async (product: Product) => {
        if (!requireAuth('add to wishlist')) return;

        if (!wishlist.find(p => p.id === product.id)) {
            setWishlist(prev => [...prev, product]);
            setShowWishlistDrawer(true);

            if (wishlistId) {
                try {
                    const token = localStorage.getItem('firebase_token');
                    await apiClient(`/api/wishlists/${wishlistId}/items`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ 
                            productId: product.id, 
                            productData: product, 
                            quantity: 1,
                            vendorId: product.vendorId
                        })
                    });
                } catch (error) {
                    console.error('Failed to update backend wishlist', error);
                }
            }
        }
    };

    const removeFromWishlist = async (productId: string) => {
        if (!requireAuth('remove from wishlist')) return;

        setWishlist(prev => prev.filter(p => p.id !== productId));
        
        if (wishlistId) {
            try {
                const token = localStorage.getItem('firebase_token');
                await apiClient(`/api/wishlists/${wishlistId}/products/${productId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
                });
            } catch (error) {
                console.error('Failed to update backend wishlist', error);
            }
        }
    };

    // Favorites functions
    const addToFavorites = async (place: GooglePlaceResponse) => {
        if (!requireAuth('add to favorites')) return;

        if (!favorites.find(p => p.id === place.id)) {
            setFavorites(prev => [...prev, place]);
            try {
                const token = localStorage.getItem('firebase_token');
                await apiClient(`/api/favorites/${place.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ placeData: place })
                });
            } catch (error) {
                console.error('Failed to update backend favorites', error);
            }
        }
    };

    const removeFromFavorites = async (placeId: string) => {
        if (!requireAuth('remove from favorites')) return;

        setFavorites(prev => prev.filter(p => p.id !== placeId));
        try {
            const token = localStorage.getItem('firebase_token');
            await apiClient(`/api/favorites/${placeId}`, {
                method: 'POST', // Backend toggle implementation
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            });
        } catch (error) {
            console.error('Failed to update backend favorites', error);
        }
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
            user, isAuthenticated, login, loginWithGoogle, register, sendPhoneOTP, confirmPhoneOTP, logout,
            showAuthModal, setShowAuthModal,
            authModalMode, setAuthModalMode,
            showLoginRequiredModal, setShowLoginRequiredModal,
            loginRequiredAction, setLoginRequiredAction,
            requireAuth,
            // Location
            pincode, setPincode,
            resolvedArea, setResolvedArea,
            locationAccess, setLocationAccess,
            userLat, setUserLat,
            userLng, setUserLng,
            // Search & filters
            searchQuery, setSearchQuery,
            filterOpenNow, setFilterOpenNow,
            sortByReview, setSortByReview,
            sortByDistance, setSortByDistance,
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

