'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Star, Phone, Globe, Lock, CheckCircle, ArrowRight, Clock, Heart, LayoutGrid, List, Store, Share2, Check, ExternalLink, Loader2, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Vendor } from '../types';
import { VADODARA_PINCODES, CATEGORIES } from '../constants';
import { useAppContext } from '../context/AppContext';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ContactCardModal } from './ContactCardModal';
import { ContactCardSelectorModal } from './ContactCardSelectorModal';
import { useTranslation } from '../providers/TranslationProvider';
import { formatOpeningHours, parseGoogleOpeningHours } from '../utils/openingHours';
import Image from 'next/image';
import { searchVadodaraPlaces, GooglePlaceResponse } from '../services/placesApi';
import { FavoriteButton } from './FavoriteButton';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface DirectoryProps {
  vendors: Vendor[];
}

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
      staggerChildren: 0.03
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

export const Directory: React.FC<DirectoryProps> = ({ vendors }) => {
  const {
    language,
    requireAuth,
    addToFavorites,
    removeFromFavorites,
    isFavorite
  } = useAppContext();
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Unified State
  const [searchQuery, setSearchQuery] = useState('');
  const [pincode, setPincode] = useState('');
  // We keep category filter for DB vendors only, although not in Vadodara search bar UI
  // we can keep it out of the main hero since we are replacing it, or add it back if needed. 
  // Let's stick to the simpler VadodaraPlaces search bar as requested: 
  // "replace the seach bar from home screen with 'explore vadodra' search bar"

  // Google Places State
  const [places, setPlaces] = useState<GooglePlaceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Location tracking
  const [locationAccess, setLocationAccess] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [userLat, setUserLat] = useState<number | undefined>();
  const [userLng, setUserLng] = useState<number | undefined>();

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectingGroup, setSelectingGroup] = useState<Vendor[] | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedVendorId, setCopiedVendorId] = useState<string | null>(null);

  const handleShare = (e: React.MouseEvent, vendor: Vendor) => {
    e.stopPropagation();
    const url = `${window.location.origin}/store/${vendor.websiteUuid || vendor.id}`;
    const title = vendor.name;
    const text = `Check out ${vendor.name} on Gocal.co`;

    if (navigator.share) {
      navigator.share({ title, text, url }).catch((err) => console.log('Error sharing', err));
    } else {
      navigator.clipboard.writeText(url);
      setCopiedVendorId(vendor.id);
      setTimeout(() => setCopiedVendorId(null), 2000);
    }
  };

  useEffect(() => {
    const vendorId = searchParams.get('vendor');
    if (vendorId) {
      const dbVendor = vendors.find(v => v.id === vendorId);
      if (dbVendor) {
        setSelectedVendor(dbVendor);
      } else if (places.length > 0) {
        const place = places.find(p => p.id === vendorId);
        if (place) {
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
            websiteUrl: place.websiteUri,
            planType: place.websiteUri ? 'card_website' : 'card_only',
            openingHours: parseGoogleOpeningHours(place.regularOpeningHours?.weekdayDescriptions),
          };
          setSelectedVendor(vendorObj);
        }
      }
    }
  }, [searchParams, vendors, places]);

  const handleCallNow = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    if (phone) window.location.href = `tel:${phone}`;
  };

  // Google Search Trigger
  const handleSearchGoogle = async (query: string, searchPincode: string = pincode) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    const result = await searchVadodaraPlaces(query, userLat, userLng, searchPincode);
    if (result.error) {
      setError(result.error);
      setPlaces([]);
    } else {
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
    handleSearchGoogle(searchQuery, pincode);
  };

  const handleSuggestedSearch = (query: string) => {
    setSearchQuery(query);
    handleSearchGoogle(query, pincode);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setPincode('');
    handleSearchGoogle('popular stores', '');
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationAccess('granted');
          setUserLat(position.coords.latitude);
          setUserLng(position.coords.longitude);
          handleSearchGoogle('popular stores', pincode);
        },
        (err) => {
          console.warn('Geolocation not available/denied:', err.message || err);
          setLocationAccess('denied');
          handleSearchGoogle('popular stores', pincode);
        },
        { timeout: 5000 }
      );
    } else {
      setLocationAccess('denied');
      handleSearchGoogle('popular stores', pincode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // DB Vendors Filtering
  const filteredVendors = vendors
    .filter((v) => {
      const term = searchQuery.toLowerCase();
      const matchesSearch = !term ||
        v.name.toLowerCase().includes(term) ||
        v.city.toLowerCase().includes(term) ||
        v.phone.toLowerCase().includes(term) ||
        (v.category && v.category.toLowerCase().includes(term));
      const matchesPincode = pincode ? v.address?.includes(pincode) : true;
      return matchesSearch && matchesPincode;
    })
    .sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const groupedVendors = useMemo(() => {
    return filteredVendors.reduce((acc, vendor) => {
      const existing = acc.find(g => g.name === vendor.name);
      if (existing) {
        existing.items.push(vendor);
      } else {
        acc.push({ ...vendor, items: [vendor] });
      }
      return acc;
    }, [] as (Vendor & { items: Vendor[] })[]);
  }, [filteredVendors]);

  const handleVendorClick = (vendor: Vendor & { items: Vendor[] }) => {
    if (vendor.items.length > 1) {
      setSelectingGroup(vendor.items);
    } else {
      setSelectedVendor(vendor);
    }
  };

  const handleGooglePlaceClick = (place: GooglePlaceResponse) => {
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
      websiteUrl: place.websiteUri,
      planType: place.websiteUri ? 'card_website' : 'card_only',
      openingHours: parseGoogleOpeningHours(place.regularOpeningHours?.weekdayDescriptions),
    };
    setSelectedVendor(vendorObj);
  };

  return (
    <div className="min-h-screen bg-luxury-cream">
      {/* Hero Section */}
      <div className="relative h-[300px] sm:h-[350px] md:h-[380px] flex items-center justify-center overflow-hidden">
        {/* Background with Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-luxury-black/85 via-luxury-black/60 to-luxury-cream z-10" />
          <Image
            src="https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=80&w=1974&auto=format&fit=crop"
            alt={t("Vadodara City")}
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
            <Badge variant="premium" className="mb-3 px-4 py-1 text-[10px] sm:text-xs uppercase tracking-[0.2em] border border-gold-500/30">
              <MapPin className="w-3 h-3 mr-1 inline" />
              {t('Vadodara, Gujarat')}
            </Badge>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-medium mb-3 text-white leading-tight tracking-wide">
              {t('Discover Best Local')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 font-semibold drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                {t('Stores & Services')}
              </span>
            </h1>
            <p className="text-sm sm:text-base text-gray-300 font-light mb-8 max-w-2xl mx-auto tracking-wide">
              {t('"expand your Business / service  for free" ')}
              <button
                onClick={() => router.push('/request-card')}
                className="text-gold-400 hover:text-gold-300 underline font-medium transition-colors ml-1 inline-flex items-center"
              >
                {t('Register here')}
              </button>
            </p>
          </motion.div>

          {/* Unified Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="max-w-2xl mx-auto flex flex-col gap-3"
          >
            {locationAccess === 'denied' && (
              <div className="glass p-2 rounded-xl sm:rounded-2xl shadow-lg flex gap-2 border border-white/20 bg-red-500/10">
                <div className="flex-1 flex items-center bg-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 h-10 hover:bg-white/20 transition-colors relative">
                  <MapPin className="text-gold-400 w-4 h-4 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder={t("Enter PIN code (e.g., 390001) for accurate results")}
                    className="w-full bg-transparent outline-none text-white placeholder-gray-300 font-medium text-xs sm:text-sm pr-8"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                  />
                  {pincode && (
                    <button
                      type="button"
                      onClick={() => {
                        setPincode('');
                        handleSearchGoogle(searchQuery, '');
                      }}
                      className="absolute right-4 text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
            <form
              className="glass p-2 rounded-2xl sm:rounded-full shadow-2xl flex gap-2 border border-white/20"
              onSubmit={handleSubmit}
            >
              <div className="flex-1 flex items-center bg-white/10 rounded-xl sm:rounded-full px-3 sm:px-6 h-12 sm:h-14 hover:bg-white/20 transition-colors relative">
                <Search className="text-gold-400 w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 shrink-0" />
                <input
                  type="text"
                  placeholder={t("Search stores...")}
                  className="w-full bg-transparent outline-none text-white placeholder-gray-400 font-medium text-sm sm:text-base pr-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      handleSearchGoogle('popular stores', pincode);
                    }}
                    className="absolute right-4 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
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

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-luxury-black mb-2">
              {hasSearched ? (
                <>
                  {t('Results for')} &quot;<span className="text-gold-600">{searchQuery || t('popular stores')}</span>&quot;
                </>
              ) : (
                t('Discover Vadodara')
              )}
            </h2>
            <p className="text-sm sm:text-base text-gray-500">
              {groupedVendors.length + places.length} {t('places found')}
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-lg shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-gold-50 text-gold-600' : 'text-gray-500 hover:bg-gray-100'}`}
              aria-label={t("Grid View")}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-gold-50 text-gold-600' : 'text-gray-500 hover:bg-gray-100'}`}
              aria-label={t("List View")}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
          
          {/* Quick Browse Sidebar */}
          <div className="w-full lg:w-64 shrink-0 top-24 sticky hidden lg:block bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-bold text-luxury-black">{t('Quick Browse')}</h3>
              {(searchQuery || pincode) && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  {t('Clear')}
                </button>
              )}
            </div>
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
                  {t(suggestion)}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Filters Scroll */}
          <div className="w-full lg:hidden overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar flex gap-2 items-center animate-fade-in">
            {(searchQuery || pincode) && (
              <button
                onClick={handleClearFilters}
                className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border bg-red-50 border-red-200 text-red-600 hover:bg-red-100 flex items-center gap-1 shadow-sm shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                {t('Clear Filters')}
              </button>
            )}
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
                {t(suggestion)}
              </button>
            ))}
          </div>

          {/* Results Area */}
          <div className="flex-1 w-full relative min-h-[400px]">
            <ErrorBoundary>
              
              {/* SECTION: Featured Vendors (DB) */}
              {groupedVendors.length > 0 && (
                <div className="mb-12">
                  <h3 className="text-xl font-serif text-luxury-black mb-6 font-bold flex items-center">
                    <Star className="w-5 h-5 text-gold-500 mr-2 fill-current" />
                    {t('Featured Vendors')}
                  </h3>
                  <motion.div
                    className={viewMode === 'grid'
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
                      : "flex flex-col gap-4"}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {groupedVendors.map((vendor) => viewMode === 'grid' ? (
                      <motion.div
                        key={vendor.id}
                        variants={itemVariants}
                        className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col h-full hover-lift card-shine cursor-pointer"
                        whileHover={{ y: -8 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        onClick={() => handleVendorClick(vendor)}
                      >
                        <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent group-hover:from-black/60 transition-colors z-10" />
                          <motion.div
                            className="w-full h-full absolute inset-0"
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                          >
                            <Image
                              src={vendor.coverImage || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"}
                              alt={vendor.name}
                              fill
                              className="object-cover"
                              priority
                            />
                          </motion.div>

                          <div className="absolute top-4 left-4 z-20 flex gap-2">
                            <Badge variant={vendor.isOpen ? "success" : "secondary"} className="shadow-lg backdrop-blur-md bg-white/90">
                              {vendor.isOpen ? t('Open') : t('Closed')}
                            </Badge>
                          </div>

                          {vendor.isPremium && (
                            <div className="absolute top-4 right-16 z-20">
                              <Badge variant="premium" className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> VERIFIED
                              </Badge>
                            </div>
                          )}

                          {vendor.items.length > 1 && (
                            <div className="absolute top-14 left-4 z-20">
                              <Badge variant="premium" className="shadow-lg backdrop-blur-md bg-gold-500/90 text-white border-none">
                                {vendor.items.length} {t('Options')}
                              </Badge>
                            </div>
                          )}

                          <div className="absolute top-4 right-4 z-20 flex gap-2">
                            <button
                              onClick={(e) => handleShare(e, vendor)}
                              className="p-2 rounded-full backdrop-blur-md bg-white/70 hover:bg-white transition-colors duration-300 shadow-sm"
                              title="Share Vendor"
                            >
                              {copiedVendorId === vendor.id ? (
                                <Check className="w-5 h-5 text-green-500" />
                              ) : (
                                <Share2 className="w-5 h-5 text-gray-600" />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!requireAuth('like this vendor')) return;
                                if (isFavorite(vendor.id)) removeFromFavorites(vendor.id);
                                else addToFavorites(vendor as any);
                              }}
                              className="p-2 rounded-full backdrop-blur-md bg-white/70 hover:bg-white transition-colors duration-300 shadow-sm"
                            >
                              <Heart className={`w-5 h-5 transition-colors duration-300 ${isFavorite(vendor.id) ? "fill-red-500 text-red-500" : "text-gray-600 hover:text-red-500"}`} />
                            </button>
                          </div>

                          <motion.div
                            className="absolute bottom-4 left-4 right-4 z-20 flex gap-2"
                            initial={{ opacity: 0, y: 10 }}
                            whileHover={{ opacity: 1, y: 0 }}
                          >
                            <div className="glass px-3 py-1.5 rounded-full flex items-center gap-1.5">
                              <Star className="w-3.5 h-3.5 text-gold-500 fill-current" />
                              <span className="text-xs font-bold text-luxury-black">{vendor.rating}</span>
                            </div>
                            <div className="glass px-3 py-1.5 rounded-full">
                              <span className="text-xs text-gray-600">{vendor.reviewCount} reviews</span>
                            </div>
                          </motion.div>
                        </div>

                        <div className="p-4 sm:p-6 flex flex-col flex-grow relative">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-xl sm:text-2xl font-bold text-luxury-charcoal font-serif group-hover:text-gold-600 transition-colors line-clamp-1">{t(vendor.name)}</h3>
                              <p className="text-sm text-gray-500 flex items-center mt-1 line-clamp-1">
                                <MapPin className="w-3 h-3 mr-1 text-gold-500 shrink-0" /> {t(vendor.city)}
                              </p>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                              <div className="flex items-center bg-luxury-cream border border-gold-100 px-2 py-1 rounded-lg">
                                <Star className="w-4 h-4 text-gold-500 fill-current" />
                                <span className="ml-1 text-sm font-bold text-luxury-black">{vendor.rating}</span>
                              </div>
                            </div>
                          </div>

                          <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent my-4" />
                          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                            {t(vendor.shortDescription || vendor.description)}
                          </p>

                          <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                            <Button
                              variant="outline"
                              className="flex-1 border-gray-200 hover:border-gold-300 hover:bg-gold-50"
                              onClick={(e) => handleCallNow(e, vendor.phone)}
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              {t('Call')}
                            </Button>

                            {vendor.planType === 'card_website' && vendor.websiteUrl && (
                              <Button
                                onClick={(e) => { e.stopPropagation(); window.open(vendor.websiteUrl, '_blank'); }}
                                className="flex-1 bg-luxury-black hover:bg-gold-600 text-white border-none"
                              >
                                <Globe className="w-4 h-4 mr-2" />
                                {t('Website')}
                              </Button>
                            )}

                            {vendor.planType === 'card_website' && vendor.websiteUuid && (
                              <Button
                                onClick={(e) => { e.stopPropagation(); router.push(`/store/${vendor.websiteUuid}`); }}
                                variant={vendor.websiteUrl ? "outline" : "primary"}
                                className={`flex-1 ${!vendor.websiteUrl ? 'bg-luxury-black hover:bg-gold-600 text-white border-none' : 'border-gray-200 hover:border-gold-300 hover:bg-gold-50'}`}
                              >
                                <Store className="w-4 h-4 mr-2" />
                                {t('Store')}
                              </Button>
                            )}

                            {(vendor.planType !== 'card_website' || (!vendor.websiteUrl && !vendor.websiteUuid)) && (
                              <Button disabled variant="ghost" className="flex-1 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400">
                                {t('Listing Only')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={vendor.id}
                        variants={itemVariants}
                        className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-row items-center gap-4 p-4 cursor-pointer hover-lift"
                        onClick={() => handleVendorClick(vendor)}
                      >
                        <div className="relative shrink-0 group-hover:scale-105 transition-transform duration-300">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2px] bg-gradient-to-tr from-gold-400 to-gold-600 shadow-md">
                            <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-gray-50">
                              <Image
                                src={vendor.coverImage || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"}
                                alt={vendor.name}
                                width={80}
                                height={80}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                            <h3 className="text-lg font-bold text-luxury-charcoal font-serif group-hover:text-gold-600 transition-colors line-clamp-1">{t(vendor.name)}</h3>
                            <div className="flex gap-2 items-center shrink-0">
                              <Badge variant={vendor.isOpen ? "success" : "secondary"} className="text-[10px] px-2 py-0.5">
                                {vendor.isOpen ? t('Open') : t('Closed')}
                              </Badge>
                              {vendor.isPremium && (
                                <Badge variant="premium" className="text-[10px] px-2 py-0.5 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> VERIFIED
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center line-clamp-1">
                              <MapPin className="w-3.5 h-3.5 mr-1.5 text-gold-500 shrink-0" /> {t(vendor.city)}
                            </span>
                            {vendor.rating > 0 && (
                              <span className="flex items-center font-medium text-luxury-black shrink-0">
                                <Star className="w-3.5 h-3.5 text-gold-500 mr-1 fill-current" />
                                {vendor.rating}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-row gap-2 shrink-0 items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 border-gray-200 hover:border-gold-300 hover:bg-gold-50"
                            onClick={(e) => handleCallNow(e, vendor.phone)}
                          >
                            <Phone className="w-3.5 h-3.5 sm:mr-2" />
                            <span className="hidden sm:inline">{t('Call')}</span>
                          </Button>
                          {vendor.planType === 'card_website' && vendor.websiteUrl && (
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); window.open(vendor.websiteUrl, '_blank'); }}
                              className="h-9 bg-luxury-black hover:bg-gold-600 text-white border-none"
                            >
                              <Globe className="w-3.5 h-3.5 sm:mr-2" />
                              <span className="hidden sm:inline">{t('Website')}</span>
                            </Button>
                          )}
                          <div className="flex items-center gap-2 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!requireAuth('like this vendor')) return;
                                if (isFavorite(vendor.id)) removeFromFavorites(vendor.id);
                                else addToFavorites(vendor as any);
                              }}
                            >
                              <Heart className={`w-4 h-4 transition-colors ${isFavorite(vendor.id) ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-500"}`} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}

              {/* SECTION: Google Places */}
              <div>
                <h3 className="text-xl font-serif text-luxury-black mb-6 font-bold flex items-center">
                  <Globe className="w-5 h-5 text-blue-500 mr-2" />
                  {t('Found On Google')}
                </h3>

                {error && (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500">{t(error)}</p>
                  </div>
                )}

                {isLoading && (
                  <div className="py-12 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 text-gold-500 animate-spin mb-4" />
                    <p className="text-gray-500 animate-pulse">{t('Searching Google...')}</p>
                  </div>
                )}

                {!isLoading && !error && places.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('No Google places found')}</h3>
                    <p className="text-gray-500 max-w-md mx-auto">{t('Try adjusting your search terms.')}</p>
                  </div>
                )}

                {!error && places.length > 0 && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={viewMode}
                      className={viewMode === 'grid'
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
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
                          onClick={() => handleGooglePlaceClick(place)}
                        >
                          {/* Image */}
                          <div className="relative h-[180px] overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent z-10" />
                            <motion.div
                              className="w-full h-full absolute inset-0"
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.7, ease: "easeOut" }}
                            >
                              <Image
                                src={place.photoUrl || DEFAULT_STORE_IMAGE}
                                alt={t(place.displayName.text)}
                                fill
                                className="object-cover"
                              />
                            </motion.div>

                            <div className="absolute top-3 left-3 z-20">
                              <Badge
                                variant={place.regularOpeningHours?.openNow ? 'success' : 'secondary'}
                                className="shadow-lg backdrop-blur-md bg-white/95"
                              >
                                {place.regularOpeningHours?.openNow ? t('Open Now') : t('Closed')}
                              </Badge>
                            </div>

                            {place.primaryTypeDisplayName?.text && (
                              <div className="absolute top-3 right-3 z-20">
                                <Badge variant="premium" className="text-[10px] tracking-wide shadow-lg">
                                  {t(place.primaryTypeDisplayName.text)}
                                </Badge>
                              </div>
                            )}

                            <div className="absolute bottom-3 right-3 z-20 scale-110" onClick={(e) => e.stopPropagation()}>
                              <FavoriteButton place={place} size="sm" />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-4 sm:p-5 flex flex-col flex-grow">
                            <div className="flex justify-between items-start mb-3 gap-3">
                              <h3 className="text-xl font-bold text-luxury-charcoal font-serif line-clamp-1 group-hover:text-gold-600 transition-colors">
                                {t(place.displayName.text)}
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
                              {t(place.shortFormattedAddress || place.formattedAddress || '')}
                            </p>

                            <div className="mt-auto pt-4 border-t border-gray-100 flex gap-2">
                              {place.nationalPhoneNumber && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 border-gray-200 hover:border-gold-300 hover:bg-gold-50 hover:text-gold-700 transition-all text-sm font-medium rounded-xl"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `tel:${place.nationalPhoneNumber}`;
                                  }}
                                >
                                  <Phone className="w-4 h-4 mr-1.5" />
                                  {t('Call')}
                                </Button>
                              )}
                              {place.websiteUri ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 border-gray-200 hover:border-gold-300 hover:bg-gold-50 hover:text-gold-700 transition-all text-sm font-medium rounded-xl"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(place.websiteUri, '_blank');
                                  }}
                                >
                                  <ExternalLink className="w-4 h-4 mr-1.5" />
                                  {t('Website')}
                                </Button>
                              ) : (
                                <Button
                                  disabled
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400 font-medium rounded-xl"
                                >
                                  <Store className="w-4 h-4 mr-1.5" />
                                  {t('Listing Only')}
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
                          onClick={() => handleGooglePlaceClick(place)}
                        >
                          <div className="flex flex-col w-full sm:w-auto flex-1 pr-4 mb-4 sm:mb-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                              <h3 className="text-lg font-bold text-luxury-charcoal font-serif group-hover:text-gold-600 transition-colors line-clamp-1">
                                {t(place.displayName.text)}
                              </h3>
                              <div className="flex gap-2 items-center shrink-0">
                                {place.primaryTypeDisplayName?.text && (
                                  <Badge variant="premium" className="text-[10px] px-2 py-0.5">
                                    {t(place.primaryTypeDisplayName.text)}
                                  </Badge>
                                )}
                                <Badge
                                  variant={place.regularOpeningHours?.openNow ? 'success' : 'secondary'}
                                  className="text-[10px] px-2 py-0.5"
                                >
                                  {place.regularOpeningHours?.openNow ? t('Open Now') : t('Closed')}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center line-clamp-1">
                                <MapPin className="w-3.5 h-3.5 mr-1.5 text-gold-500 shrink-0" />
                                <span className="line-clamp-1">{t(place.shortFormattedAddress || place.formattedAddress || '')}</span>
                              </span>
                              {place.rating !== undefined && place.rating > 0 && (
                                <span className="flex items-center font-medium text-luxury-black shrink-0">
                                  <Star className="w-3.5 h-3.5 text-gold-500 mr-1 fill-current" />
                                  {place.rating}
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
                                <span className="hidden sm:inline">{t('Call')}</span>
                              </Button>
                            )}
                            {place.websiteUri && (
                              <Button
                                size="sm"
                                className="h-9 bg-luxury-black hover:bg-gold-600 text-white border-none"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(place.websiteUri, '_blank');
                                }}
                              >
                                <ExternalLink className="w-3.5 h-3.5 sm:mr-2" />
                                <span className="hidden sm:inline">{t('Website')}</span>
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

            </ErrorBoundary>
          </div>
        </div>
      </div>
      
      {/* Contact Card Modal */}
      <ContactCardModal
        vendor={selectedVendor}
        isOpen={!!selectedVendor}
        onClose={() => setSelectedVendor(null)}
      />

      {/* Contact Card Selector Modal */}
      <ContactCardSelectorModal
        vendors={selectingGroup || []}
        isOpen={!!selectingGroup}
        onClose={() => setSelectingGroup(null)}
        onSelect={(vendor) => {
          setSelectedVendor(vendor);
          setSelectingGroup(null);
        }}
        vendorName={selectingGroup?.[0]?.name || ''}
      />
    </div>
  );
};
