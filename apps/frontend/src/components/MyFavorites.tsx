'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Heart, MapPin, Star, Phone, ExternalLink, Store, Filter } from 'lucide-react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FavoriteButton } from './FavoriteButton';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '../providers/TranslationProvider';
import { Vendor } from '../types';

const DEFAULT_STORE_IMAGE = 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&q=80';

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

export const MyFavorites: React.FC = () => {
    const { favorites, isAuthenticated } = useAppContext();
    const { t } = useTranslation();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const categories = useMemo(() => {
        const cats = favorites.map(place => place.primaryTypeDisplayName?.text || (place as unknown as Vendor).category).filter(Boolean) as string[];
        return Array.from(new Set(cats)).sort();
    }, [favorites]);

    const filteredFavorites = useMemo(() => {
        if (!selectedCategory) return favorites;
        return favorites.filter(place => (place.primaryTypeDisplayName?.text || (place as unknown as Vendor).category) === selectedCategory);
    }, [favorites, selectedCategory]);

    // Reset category if it doesn't exist anymore
    useEffect(() => {
        if (selectedCategory && !categories.includes(selectedCategory)) {
            setSelectedCategory(null);
        }
    }, [categories, selectedCategory]);

    return (
        <div className="min-h-screen bg-luxury-cream">
            {/* Hero Section */}
            <div className="relative h-[280px] sm:h-[320px] flex items-center justify-center overflow-hidden">
                {/* Background with Overlay */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-luxury-black/85 via-luxury-black/60 to-luxury-cream z-10" />
                    <Image
                        src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1974&auto=format&fit=crop"
                        alt={t('My Favourites')}
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                <div className="relative z-20 container mx-auto px-4 sm:px-6 text-center mt-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <Badge variant="premium" className="mb-4 px-4 py-1 text-xs sm:text-sm uppercase tracking-widest border border-gold-500/30">
                            <Heart className="w-3 h-3 mr-1 inline fill-current" />
                            {t('Your Collection')}
                        </Badge>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-4 text-white leading-tight">
                            {t('My')}{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-600">
                                {t('Favourites')}
                            </span>
                        </h1>
                        <p className="text-base sm:text-lg text-gray-200 font-light max-w-2xl mx-auto">
                            {t('Your curated collection of favorite stores and services')}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
                {/* Results Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-serif text-luxury-black mb-2">
                            {t('Saved Places')}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {filteredFavorites.length} {filteredFavorites.length === 1 ? t('place') : t('places')} {t('saved')}
                        </p>
                    </div>
                    <Link href="/vadodara">
                        <Button variant="outline" className="gap-2">
                            <Store className="w-4 h-4" />
                            {t('Discover More')}
                        </Button>
                    </Link>
                </div>

                {/* Category Filters */}
                {isAuthenticated && categories.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-8 w-full overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar"
                    >
                        <div className="flex gap-3 min-w-max items-center">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedCategory(null)}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border backdrop-blur-sm ${
                                    selectedCategory === null
                                    ? 'bg-luxury-black text-white border-luxury-black shadow-md'
                                    : 'bg-white shadow-sm text-gray-600 border-gray-200 hover:border-gold-300 hover:text-luxury-black hover:bg-gold-50/50'
                                }`}
                            >
                                {t('All Collections')}
                            </motion.button>
                            {categories.map((category) => (
                                <motion.button
                                    key={category}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border backdrop-blur-sm ${
                                        selectedCategory === category
                                        ? 'bg-luxury-black text-white border-luxury-black shadow-md'
                                        : 'bg-white shadow-sm text-gray-600 border-gray-200 hover:border-gold-300 hover:text-luxury-black hover:bg-gold-50/50'
                                    }`}
                                >
                                    {t(category)}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Not Authenticated State */}
                {!isAuthenticated && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                    >
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gold-100 to-gold-200 rounded-full mb-6">
                            <Heart className="w-10 h-10 text-gold-600" />
                        </div>
                        <h3 className="text-2xl font-serif font-medium text-gray-900 mb-3">{t('Sign in to see your favorites')}</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            {t('Create an account or sign in to save your favorite stores and services')}
                        </p>
                        <Link href="/vadodara">
                            <Button className="bg-gold-500 hover:bg-gold-600 text-luxury-black">
                                {t('Explore Stores')}
                            </Button>
                        </Link>
                    </motion.div>
                )}

                {/* Empty State */}
                {isAuthenticated && favorites.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                    >
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                            <Heart className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-serif font-medium text-gray-900 mb-3">{t('No favorites yet')}</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            {t('Start exploring and save your favorite stores and services by clicking the heart icon')}
                        </p>
                        <Link href="/vadodara">
                            <Button className="bg-gold-500 hover:bg-gold-600 text-luxury-black">
                                {t('Discover Stores')}
                            </Button>
                        </Link>
                    </motion.div>
                )}

                {/* Empty Filter State */}
                {isAuthenticated && favorites.length > 0 && filteredFavorites.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                    >
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                            <Filter className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-serif font-medium text-gray-900 mb-3">{t('No places in this collection')}</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            {t("You haven't saved any places matching this category yet.")}
                        </p>
                        <Button 
                            onClick={() => setSelectedCategory(null)}
                            className="bg-gold-500 hover:bg-gold-600 text-luxury-black"
                        >
                            {t('View All Collections')}
                        </Button>
                    </motion.div>
                )}

                {/* Favorites Grid */}
                {isAuthenticated && filteredFavorites.length > 0 && (
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredFavorites.map((place) => (
                                <motion.div
                                    layout
                                    key={place.id}
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3, type: "spring", bounce: 0.4 }}
                                    className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full"
                                    whileHover={{ y: -4 }}
                                >
                                {/* Image */}
                                <div className="relative h-44 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />
                                    <Image
                                        src={place.photoUrl || (place as unknown as Vendor).coverImage || DEFAULT_STORE_IMAGE}
                                        alt={place.displayName?.text || (place as unknown as Vendor).name || t('Store Image')}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />

                                    {/* Status Badge */}
                                    <div className="absolute top-3 left-3 z-20">
                                        <Badge
                                            variant={place.regularOpeningHours?.openNow || (place as unknown as Vendor).isOpen ? 'success' : 'secondary'}
                                            className="shadow-lg backdrop-blur-md bg-white/90"
                                        >
                                            {place.regularOpeningHours?.openNow || (place as unknown as Vendor).isOpen ? t('Open Now') : t('Closed')}
                                        </Badge>
                                    </div>

                                    {/* Category Badge */}
                                    {(place.primaryTypeDisplayName?.text || (place as unknown as Vendor).category) && (
                                        <div className="absolute top-3 right-3 z-20">
                                            <Badge variant="premium" className="text-xs">
                                                {place.primaryTypeDisplayName?.text || (place as unknown as Vendor).category}
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
                                            {place.displayName?.text || (place as unknown as Vendor).name}
                                        </h3>
                                        {(place.rating || (place as unknown as Vendor).rating) && (
                                            <div className="flex items-center bg-luxury-cream border border-gold-100 px-2 py-0.5 rounded-lg shrink-0 ml-2">
                                                <Star className="w-3.5 h-3.5 text-gold-500 fill-current" />
                                                <span className="ml-1 text-sm font-bold text-luxury-black">{place.rating || (place as unknown as Vendor).rating}</span>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-sm text-gray-500 flex items-start mb-2 line-clamp-2">
                                        <MapPin className="w-3.5 h-3.5 mr-1.5 mt-0.5 text-gold-500 shrink-0" />
                                        {place.shortFormattedAddress || place.formattedAddress || (place as unknown as Vendor).address || (place as unknown as Vendor).city}
                                    </p>

                                    {(place.userRatingCount || (place as unknown as Vendor).reviewCount) && (
                                        <p className="text-xs text-gray-400 mb-3">
                                            {place.userRatingCount || (place as unknown as Vendor).reviewCount} reviews
                                        </p>
                                    )}

                                    <div className="mt-auto pt-3 border-t border-gray-100 flex gap-2">
                                        {(place.nationalPhoneNumber || (place as unknown as Vendor).phone) && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-xs h-9"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.location.href = `tel:${place.nationalPhoneNumber || (place as unknown as Vendor).phone}`;
                                                }}
                                            >
                                                <Phone className="w-3.5 h-3.5 mr-1" />
                                                Call
                                            </Button>
                                        )}
                                        {(place.websiteUri || (place as unknown as Vendor).websiteUuid) && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-xs h-9"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if(place.websiteUri) window.open(place.websiteUri, '_blank');
                                                    else window.open(`/store/${(place as unknown as Vendor).websiteUuid}`, '_blank');
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
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default MyFavorites;
