'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Phone, Globe, Clock, Store, ExternalLink, Loader2, LayoutGrid, List } from 'lucide-react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { searchVadodaraPlaces, GooglePlaceResponse } from '../services/placesApi';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FavoriteButton } from './FavoriteButton';

import { ContactCardModal } from './ContactCardModal';
import { Vendor } from '../types';
import { useAppContext } from '../context/AppContext';
import { TRANSLATIONS } from '../constants';

const SUGGESTED_SEARCHES = [
    'Electronics Shops',
    'Grocery Stores',
    'Restaurants',
    'Services',
    'Fashion',
    'Jewelry',
    'Home Decor',
    'Medical Stores',
];

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08
        }
    }
};

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100
        }
    }
};

const DEFAULT_STORE_IMAGE = 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&q=80';

export const VadodaraPlaces: React.FC = () => {
    const { language } = useAppContext();
    const t = TRANSLATIONS[language];
    const [searchQuery, setSearchQuery] = useState('');
    const [places, setPlaces] = useState<GooglePlaceResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    
    // Location tracking
    const [locationAccess, setLocationAccess] = useState<'pending' | 'granted' | 'denied'>('pending');
    const [userLat, setUserLat] = useState<number | undefined>();
    const [userLng, setUserLng] = useState<number | undefined>();
    const [pincode, setPincode] = useState('');
    
    // For direct linking to a vendor
    const [selectedVendorForModal, setSelectedVendorForModal] = useState<Vendor | null>(null);
    const searchParams = useSearchParams();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const handleSearch = async (query: string, searchPincode: string = pincode) => {
        if (!query.trim()) return;

        setIsLoading(true);
        setError(null);
        setHasSearched(true);

        const result = await searchVadodaraPlaces(query, userLat, userLng, searchPincode);

        if (result.error) {
            setError(result.error);
            setPlaces([]);
        } else {
            // Sort places: Open stores first, then by a popularity score (rating * log(reviews))
            const sortedPlaces = [...result.places].sort((a, b) => {
                const aOpen = a.regularOpeningHours?.openNow ? 1 : 0;
                const bOpen = b.regularOpeningHours?.openNow ? 1 : 0;
                
                if (aOpen !== bOpen) return bOpen - aOpen;

                const aScore = (a.rating || 0) * Math.log10((a.userRatingCount || 0) + 1);
                const bScore = (b.rating || 0) * Math.log10((b.userRatingCount || 0) + 1);
                
                return bScore - aScore;
            });
            setPlaces(sortedPlaces);
        }

        setIsLoading(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(searchQuery, pincode);
    };

    const handleSuggestedSearch = (query: string) => {
        setSearchQuery(query);
        handleSearch(query, pincode);
    };

    // Auto-search on initial load with a default query
    useEffect(() => {
        // Automatically ask for location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocationAccess('granted');
                    setUserLat(position.coords.latitude);
                    setUserLng(position.coords.longitude);
                    handleSearch('popular stores', pincode);
                },
                (err) => {
                    console.warn('Geolocation not available/denied:', err.message || err);
                    setLocationAccess('denied');
                    handleSearch('popular stores', pincode);
                },
                { timeout: 5000 } // Wait at most 5 seconds for location
            );
        } else {
            setLocationAccess('denied');
            handleSearch('popular stores', pincode);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Check for shared vendor ID
    useEffect(() => {
        const vendorId = searchParams.get('vendor');
        if (vendorId && places.length > 0) {
            const place = places.find(p => p.id === vendorId);
            if (place) {
                // Map GooglePlaceResponse to Vendor format for the modal
                const vendorObj: Vendor = {
                    id: place.id,
                    name: place.displayName?.text || 'Unknown',
                    description: place.editorialSummary?.text || '',
                    shortDescription: '',
                    city: 'Vadodara',
                    category: place.primaryTypeDisplayName?.text || 'Store',
                    address: place.formattedAddress || '',
                    phone: place.nationalPhoneNumber || '',
                    email: '',
                    coverImage: place.photoUrl || DEFAULT_STORE_IMAGE,
                    isOpen: place.regularOpeningHours?.openNow || false,
                    rating: place.rating || 0,
                    reviewCount: place.userRatingCount || 0,
                    isPremium: false,
                };
                setSelectedVendorForModal(vendorObj);
            }
        }
    }, [searchParams, places]);

    return (
        <div className="min-h-screen bg-luxury-cream">
            {/* Hero Section */}
            <div className="relative h-[300px] sm:h-[350px] md:h-[380px] flex items-center justify-center overflow-hidden">
                {/* Background with Overlay */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-luxury-black/85 via-luxury-black/60 to-luxury-cream z-10" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=80&w=1974&auto=format&fit=crop"
                        alt="Vadodara City"
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="relative z-20 container mx-auto px-4 sm:px-6 text-center mt-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <Badge variant="premium" className="mb-3 px-4 py-1 text-[10px] sm:text-xs uppercase tracking-[0.2em] border border-gold-500/30">
                            <MapPin className="w-3 h-3 mr-1 inline" />
                            Vadodara, Gujarat
                        </Badge>
                        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-medium mb-3 text-white leading-tight tracking-wide">
                            Discover Local <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-600">Stores & Services</span>
                        </h1>
                        <p className="text-sm sm:text-base text-gray-300 font-light mb-8 max-w-2xl mx-auto tracking-wide">
                            Find the best shops, services, and businesses in Vadodara city
                        </p>
                    </motion.div>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="max-w-2xl mx-auto flex flex-col gap-3"
                    >
                        {locationAccess === 'denied' && (
                            <div className="glass p-2 rounded-xl sm:rounded-2xl shadow-lg flex gap-2 border border-white/20 bg-red-500/10">
                                <div className="flex-1 flex items-center bg-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 h-10 hover:bg-white/20 transition-colors">
                                    <MapPin className="text-gold-400 w-4 h-4 mr-2" />
                                    <input
                                        type="text"
                                        placeholder="Enter PIN code (e.g., 390001) for accurate results nearby"
                                        className="w-full bg-transparent outline-none text-white placeholder-gray-300 font-medium text-xs sm:text-sm"
                                        value={pincode}
                                        onChange={(e) => setPincode(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                        <form
                            className="glass p-2 rounded-2xl sm:rounded-full shadow-2xl flex gap-2 border border-white/20"
                            onSubmit={handleSubmit}
                        >
                            <div className="flex-1 flex items-center bg-white/10 rounded-xl sm:rounded-full px-3 sm:px-6 h-12 sm:h-14 hover:bg-white/20 transition-colors">
                                <Search className="text-gold-400 w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                                <input
                                    type="text"
                                    placeholder="Search stores..."
                                    className="w-full bg-transparent outline-none text-white placeholder-gray-400 font-medium text-sm sm:text-base"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button
                                type="submit"
                                size="icon"
                                className="h-12 sm:h-14 w-12 sm:w-14 rounded-xl sm:rounded-full bg-gold-500 hover:bg-gold-600 text-luxury-black shrink-0"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                ) : (
                                    <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                                )}
                            </Button>
                        </form>
                    </motion.div>
                </div>
            </div>

            {/* Results Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
                {/* Results Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-serif text-luxury-black mb-2">
                            {hasSearched ? (
                                <>
                                    Results for &quot;<span className="text-gold-600">{searchQuery || 'popular stores'}</span>&quot;
                                </>
                            ) : (
                                'Popular Places in Vadodara'
                            )}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {places.length} places found in Vadodara
                        </p>
                    </div>

                    {/* View Toggle */}
                    {!isLoading && !error && places.length > 0 && (
                        <div className="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-lg shadow-sm">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-gold-50 text-gold-600' : 'text-gray-500 hover:bg-gray-100'}`}
                                aria-label="Grid View"
                            >
                                <LayoutGrid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-gold-50 text-gold-600' : 'text-gray-500 hover:bg-gray-100'}`}
                                aria-label="List View"
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
                    
                    {/* Filters Sidebar */}
                    <div className="w-full lg:w-64 shrink-0 top-24 sticky hidden lg:block bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h3 className="font-serif text-lg font-bold text-luxury-black mb-4">Quick Browse</h3>
                        <div className="space-y-2">
                            {SUGGESTED_SEARCHES.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => handleSuggestedSearch(suggestion)}
                                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                        searchQuery === suggestion
                                            ? 'bg-gold-50 text-gold-700 border-l-4 border-gold-500 shadow-sm'
                                            : 'bg-transparent text-gray-600 hover:bg-gray-50 hover:text-luxury-black border-l-4 border-transparent'
                                    }`}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mobile Filters Scroll */}
                    <div className="w-full lg:hidden overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar flex gap-2">
                        {SUGGESTED_SEARCHES.map((suggestion) => (
                            <button
                                key={suggestion}
                                onClick={() => handleSuggestedSearch(suggestion)}
                                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                                    searchQuery === suggestion
                                        ? 'bg-gold-500 text-white border-gold-500 shadow-md'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gold-300'
                                }`}
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>

                    {/* Results Container */}
                    <div className="flex-1 w-full relative min-h-[400px]">
                        {/* Error State */}
                        {error && (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100/50 rounded-full mb-4">
                                    <Store className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-medium text-gray-900">Something went wrong</h3>
                                <p className="text-gray-500 mt-2">{error}</p>
                                <Button
                                    variant="outline"
                                    onClick={() => handleSearch(searchQuery)}
                                    className="mt-4 border-gray-200"
                                >
                                    Try Again
                                </Button>
                            </div>
                        )}

                        {/* Loading State */}
                        {isLoading && (
                            <div className="absolute inset-0 z-10 bg-luxury-cream/50 backdrop-blur-sm flex flex-col items-center justify-center py-20 rounded-2xl">
                                <Loader2 className="w-12 h-12 text-gold-500 animate-spin mb-4" />
                                <p className="text-gray-500 animate-pulse">Finding the best places...</p>
                            </div>
                        )}

                        {/* Empty State */}
                        {!isLoading && !error && places.length === 0 && hasSearched && (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-50 rounded-full mb-6">
                                    <Search className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-medium text-gray-900 mb-2">No places found</h3>
                                <p className="text-gray-500 max-w-md mx-auto">We couldn't find any results for "{searchQuery}". Try exploring our popular categories or adjusting your search.</p>
                            </div>
                        )}

                        {/* Results Grid/List */}
                        {!error && places.length > 0 && (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={viewMode}
                                    className={viewMode === 'grid' 
                                        ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6"
                                        : "flex flex-col gap-4"
                                    }
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                >
                                    {places.map((place) => viewMode === 'grid' ? (
                                        <motion.div
                                            key={`grid-${place.id}`}
                                            layout
                                            variants={itemVariants}
                                            initial="hidden"
                                            whileInView="visible"
                                            viewport={{ once: true, margin: "-50px" }}
                                            className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl border border-gray-100 flex flex-col h-full cursor-pointer hover-lift card-shine"
                                            whileHover={{ y: -8 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        onClick={() => {
                                            const vendorObj: Vendor = {
                                                id: place.id,
                                                name: place.displayName?.text || 'Unknown',
                                                description: place.editorialSummary?.text || '',
                                                shortDescription: '',
                                                city: 'Vadodara',
                                                category: place.primaryTypeDisplayName?.text || 'Store',
                                                address: place.formattedAddress || '',
                                                phone: place.nationalPhoneNumber || '',
                                                email: '',
                                                coverImage: place.photoUrl || DEFAULT_STORE_IMAGE,
                                                isOpen: place.regularOpeningHours?.openNow || false,
                                                rating: place.rating || 0,
                                                reviewCount: place.userRatingCount || 0,
                                                isPremium: false,
                                            };
                                            setSelectedVendorForModal(vendorObj);
                                        }}
                                    >
                                        {/* Image */}
                                        <div className="relative h-[180px] overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent z-10" />
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <motion.img
                                                src={place.photoUrl || DEFAULT_STORE_IMAGE}
                                                alt={place.displayName.text}
                                                className="w-full h-full object-cover"
                                                whileHover={{ scale: 1.1 }}
                                                transition={{ duration: 0.7, ease: "easeOut" }}
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    if (target.src !== DEFAULT_STORE_IMAGE) {
                                                        target.src = DEFAULT_STORE_IMAGE;
                                                    }
                                                }}
                                            />

                                            {/* Status Badge */}
                                            <div className="absolute top-3 left-3 z-20">
                                                <Badge
                                                    variant={place.regularOpeningHours?.openNow ? 'success' : 'secondary'}
                                                    className="shadow-lg backdrop-blur-md bg-white/95"
                                                >
                                                    {place.regularOpeningHours?.openNow ? 'Open Now' : 'Closed'}
                                                </Badge>
                                            </div>

                                            {/* Category Badge */}
                                            {place.primaryTypeDisplayName?.text && (
                                                <div className="absolute top-3 right-3 z-20">
                                                    <Badge variant="premium" className="text-[10px] tracking-wide shadow-lg">
                                                        {place.primaryTypeDisplayName.text}
                                                    </Badge>
                                                </div>
                                            )}

                                            {/* Favorite Button */}
                                            <div className="absolute bottom-3 right-3 z-20 scale-110" onClick={(e) => e.stopPropagation()}>
                                                <FavoriteButton place={place} size="sm" />
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5 flex flex-col flex-grow">
                                            <div className="flex justify-between items-start mb-3 gap-3">
                                                <h3 className="text-xl font-bold text-luxury-charcoal font-serif line-clamp-1 group-hover:text-gold-600 transition-colors">
                                                    {place.displayName.text}
                                                </h3>
                                                {place.rating !== undefined && place.rating > 0 && (
                                                    <div className="flex items-center bg-gold-50 border border-gold-200 px-2 py-1 rounded-lg shrink-0 shadow-sm">
                                                        <Star className="w-3.5 h-3.5 text-gold-500 fill-current" />
                                                        <span className="ml-1 text-sm font-bold text-gold-900">{place.rating}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <p className="text-sm text-gray-500 flex items-start mb-3 line-clamp-2 leading-relaxed">
                                                <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gold-500 shrink-0" />
                                                {place.shortFormattedAddress || place.formattedAddress}
                                            </p>

                                            {place.userRatingCount ? (
                                                <p className="text-xs text-gray-400 mb-4 font-medium tracking-wide uppercase">
                                                    Based on {place.userRatingCount} reviews
                                                </p>
                                            ) : <div className="mb-4"></div>}

                                            <div className="mt-auto pt-4 border-t border-gray-100 flex gap-3">
                                                {place.nationalPhoneNumber && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 h-10 border-gray-200 hover:border-gold-300 hover:bg-gold-50 hover:text-gold-700 transition-all text-sm font-medium rounded-xl"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.location.href = `tel:${place.nationalPhoneNumber}`;
                                                        }}
                                                    >
                                                        <Phone className="w-4 h-4 mr-1.5" />
                                                        Call
                                                    </Button>
                                                )}
                                                {place.websiteUri ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 h-10 border-gray-200 hover:border-gold-300 hover:bg-gold-50 hover:text-gold-700 transition-all text-sm font-medium rounded-xl"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.open(place.websiteUri, '_blank');
                                                        }}
                                                    >
                                                        <ExternalLink className="w-4 h-4 mr-1.5" />
                                                        {t.visitWebsite}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        disabled
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 h-10 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400 font-medium rounded-xl"
                                                    >
                                                        <Store className="w-4 h-4 mr-1.5" />
                                                        {t.listingOnly}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key={`list-${place.id}`}
                                        layout
                                        variants={itemVariants}
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: true, margin: "-50px" }}
                                        className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 cursor-pointer hover-lift"
                                    onClick={() => {
                                        const vendorObj: Vendor = {
                                            id: place.id,
                                            name: place.displayName?.text || 'Unknown',
                                            description: place.editorialSummary?.text || '',
                                            shortDescription: '',
                                            city: 'Vadodara',
                                            category: place.primaryTypeDisplayName?.text || 'Store',
                                            address: place.formattedAddress || '',
                                            phone: place.nationalPhoneNumber || '',
                                            email: '',
                                            coverImage: place.photoUrl || DEFAULT_STORE_IMAGE,
                                            isOpen: place.regularOpeningHours?.openNow || false,
                                            rating: place.rating || 0,
                                            reviewCount: place.userRatingCount || 0,
                                            isPremium: false,
                                        };
                                        setSelectedVendorForModal(vendorObj);
                                    }}
                                >
                                    <div className="flex flex-col w-full sm:w-auto flex-1 pr-4 mb-4 sm:mb-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                                            <h3 className="text-lg font-bold text-luxury-charcoal font-serif group-hover:text-gold-600 transition-colors line-clamp-1">
                                                {place.displayName.text}
                                            </h3>
                                            <div className="flex gap-2 items-center shrink-0">
                                                {place.primaryTypeDisplayName?.text && (
                                                    <Badge variant="premium" className="text-[10px] px-2 py-0.5">
                                                        {place.primaryTypeDisplayName.text}
                                                    </Badge>
                                                )}
                                                <Badge
                                                    variant={place.regularOpeningHours?.openNow ? 'success' : 'secondary'}
                                                    className="text-[10px] px-2 py-0.5"
                                                >
                                                    {place.regularOpeningHours?.openNow ? 'Open Now' : 'Closed'}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-500 mt-1">
                                            <span className="flex items-center line-clamp-1">
                                                <MapPin className="w-3.5 h-3.5 mr-1.5 text-gold-500 shrink-0" /> 
                                                <span className="line-clamp-1">{place.shortFormattedAddress || place.formattedAddress}</span>
                                            </span>
                                            {place.rating !== undefined && place.rating > 0 && (
                                                <span className="flex items-center font-medium text-luxury-black shrink-0">
                                                    <Star className="w-3.5 h-3.5 text-gold-500 mr-1 fill-current" />
                                                    {place.rating} {place.userRatingCount ? <span className="text-gray-400 font-normal ml-1">({place.userRatingCount})</span> : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-row gap-2 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 justify-end sm:justify-start">
                                        {place.nationalPhoneNumber && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 border-gray-200 hover:border-gold-300 hover:bg-gold-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.location.href = `tel:${place.nationalPhoneNumber}`;
                                                }}
                                            >
                                                <Phone className="w-3.5 h-3.5 sm:mr-2" />
                                                <span className="hidden sm:inline">Call</span>
                                            </Button>
                                        )}
                                        {place.websiteUri ? (
                                            <Button
                                                size="sm"
                                                className="h-9 bg-luxury-black hover:bg-gold-600 text-white border-none"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(place.websiteUri, '_blank');
                                                }}
                                            >
                                                <ExternalLink className="w-3.5 h-3.5 sm:mr-2" />
                                                <span className="hidden sm:inline">{t.visitWebsite}</span>
                                            </Button>
                                        ) : (
                                            <Button
                                                disabled
                                                size="sm"
                                                className="h-9 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400"
                                            >
                                                <Store className="w-3.5 h-3.5 sm:mr-2" />
                                                <span className="hidden sm:inline">{t.listingOnly}</span>
                                            </Button>
                                        )}
                                        <div 
                                            className="flex items-center justify-center p-2 rounded-md hover:bg-gray-100 transition-colors ml-1"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <FavoriteButton place={place} size="sm" />
                                        </div>
                                    </div>
                                </motion.div>
                                    ))}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </div>

            </div>

            {/* Contact Card Modal */}
            <ContactCardModal
                vendor={selectedVendorForModal}
                isOpen={!!selectedVendorForModal}
                onClose={() => setSelectedVendorForModal(null)}
            />
        </div>
    );
};
