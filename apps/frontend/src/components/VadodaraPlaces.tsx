'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Phone, Globe, Clock, Store, ExternalLink, Loader2 } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { searchVadodaraPlaces, GooglePlaceResponse } from '../services/placesApi';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FavoriteButton } from './FavoriteButton';

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
            setPlaces(result.places);
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

    return (
        <div className="min-h-screen bg-luxury-cream">
            {/* Hero Section */}
            <div className="relative h-[400px] sm:h-[450px] flex items-center justify-center overflow-hidden">
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
                        <Badge variant="premium" className="mb-4 px-4 py-1 text-xs sm:text-sm uppercase tracking-widest border border-gold-500/30">
                            <MapPin className="w-3 h-3 mr-1 inline" />
                            Vadodara, Gujarat
                        </Badge>
                        <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 text-white leading-tight">
                            Discover Local<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-600">
                                Stores & Services
                            </span>
                        </h1>
                        <p className="text-base sm:text-lg text-gray-200 font-light mb-8 max-w-2xl mx-auto">
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

                    {/* Suggested Searches */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-wrap justify-center gap-2 mt-4 max-w-2xl mx-auto"
                    >
                        {SUGGESTED_SEARCHES.slice(0, 5).map((suggestion) => (
                            <button
                                key={suggestion}
                                onClick={() => handleSuggestedSearch(suggestion)}
                                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-medium transition-colors"
                            >
                                {suggestion}
                            </button>
                        ))}
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
                </div>

                {/* Error State */}
                {error && (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                            <Store className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900">Something went wrong</h3>
                        <p className="text-gray-500 mt-2">{error}</p>
                        <Button
                            variant="outline"
                            onClick={() => handleSearch(searchQuery)}
                            className="mt-4"
                        >
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 text-gold-500 animate-spin mb-4" />
                        <p className="text-gray-500">Searching places in Vadodara...</p>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && places.length === 0 && hasSearched && (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900">No places found</h3>
                        <p className="text-gray-500 mt-2">Try adjusting your search to find stores and services.</p>
                    </div>
                )}

                {/* Results Grid */}
                {!isLoading && !error && places.length > 0 && (
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {places.map((place) => (
                            <motion.div
                                key={place.id}
                                variants={itemVariants}
                                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col h-full cursor-pointer hover-lift card-shine"
                                whileHover={{ y: -8 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                                {/* Image */}
                                <div className="relative h-44 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <motion.img
                                        src={place.photoUrl || DEFAULT_STORE_IMAGE}
                                        alt={place.displayName.text}
                                        className="w-full h-full object-cover"
                                        whileHover={{ scale: 1.1 }}
                                        transition={{ duration: 0.7, ease: "easeOut" }}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = DEFAULT_STORE_IMAGE;
                                        }}
                                    />

                                    {/* Status Badge */}
                                    <div className="absolute top-3 left-3 z-20">
                                        <Badge
                                            variant={place.regularOpeningHours?.openNow ? 'success' : 'secondary'}
                                            className="shadow-lg backdrop-blur-md bg-white/90"
                                        >
                                            {place.regularOpeningHours?.openNow ? 'Open Now' : 'Closed'}
                                        </Badge>
                                    </div>

                                    {/* Category Badge */}
                                    {place.primaryTypeDisplayName?.text && (
                                        <div className="absolute top-3 right-3 z-20">
                                            <Badge variant="premium" className="text-xs">
                                                {place.primaryTypeDisplayName.text}
                                            </Badge>
                                        </div>
                                    )}

                                    {/* Favorite Button */}
                                    <div className="absolute bottom-3 right-3 z-20">
                                        <FavoriteButton place={place} size="sm" />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 flex flex-col flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-luxury-charcoal font-serif line-clamp-1 group-hover:text-gold-600 transition-colors">
                                            {place.displayName.text}
                                        </h3>
                                        {place.rating && (
                                            <div className="flex items-center bg-luxury-cream border border-gold-100 px-2 py-0.5 rounded-lg shrink-0 ml-2">
                                                <Star className="w-3.5 h-3.5 text-gold-500 fill-current" />
                                                <span className="ml-1 text-sm font-bold text-luxury-black">{place.rating}</span>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-sm text-gray-500 flex items-start mb-2 line-clamp-2">
                                        <MapPin className="w-3.5 h-3.5 mr-1.5 mt-0.5 text-gold-500 shrink-0" />
                                        {place.shortFormattedAddress || place.formattedAddress}
                                    </p>

                                    {place.userRatingCount && (
                                        <p className="text-xs text-gray-400 mb-3">
                                            {place.userRatingCount} reviews
                                        </p>
                                    )}

                                    <div className="mt-auto pt-3 border-t border-gray-100 flex gap-2">
                                        {place.nationalPhoneNumber && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-xs h-9"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.location.href = `tel:${place.nationalPhoneNumber}`;
                                                }}
                                            >
                                                <Phone className="w-3.5 h-3.5 mr-1" />
                                                Call
                                            </Button>
                                        )}
                                        {place.websiteUri && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-xs h-9"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(place.websiteUri, '_blank');
                                                }}
                                            >
                                                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                                                Website
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* More Suggestions */}
                {!isLoading && places.length > 0 && (
                    <div className="mt-12 text-center">
                        <p className="text-gray-500 mb-4">Try searching for more categories</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {SUGGESTED_SEARCHES.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => handleSuggestedSearch(suggestion)}
                                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${searchQuery === suggestion
                                        ? 'bg-gold-500 text-white border-gold-500'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-gold-300 hover:bg-gold-50'
                                        }`}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
