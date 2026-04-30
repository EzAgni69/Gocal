import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Phone, Globe, Lock, CheckCircle, ArrowRight, Clock, Heart, LayoutGrid, List, Store } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Vendor } from '../types';
import { VADODARA_PINCODES, CATEGORIES, TRANSLATIONS } from '../constants';
import { useAppContext } from '../context/AppContext';
import { motion, Variants } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ContactCardModal } from './ContactCardModal';
import { useTranslation } from '../providers/TranslationProvider';
import { formatOpeningHours } from '../utils/openingHours';


interface DirectoryProps {
  vendors: Vendor[];
}

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPincode, setSelectedPincode] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const vendorId = searchParams.get('vendor');
    if (vendorId) {
      const vendor = vendors.find(v => v.id === vendorId);
      if (vendor) {
        setSelectedVendor(vendor);
      }
    }
  }, [searchParams, vendors]);

  const handleCallNow = (e: React.MouseEvent, vendor: Vendor) => {
    e.stopPropagation();
    if (!requireAuth('call this vendor')) return;
    window.location.href = `tel:${vendor.phone}`;
  };

  const filteredVendors = vendors
    .filter((v) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        v.name.toLowerCase().includes(term) ||
        v.city.toLowerCase().includes(term) ||
        v.phone.toLowerCase().includes(term);
      const matchesPincode = selectedPincode ? v.address?.includes(selectedPincode) : true;
      const matchesCategory = selectedCategory ? v.category === selectedCategory : true;
      return matchesSearch && matchesPincode && matchesCategory;
    })
    .sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="min-h-screen bg-luxury-cream">
      {/* Hero Section */}
      <div className="relative h-[300px] sm:h-[350px] md:h-[380px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-luxury-black/80 via-luxury-black/50 to-luxury-cream z-10" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"
            alt="Hero Background"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-20 container mx-auto px-4 sm:px-6 text-center mt-6 sm:mt-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge variant="premium" className="mb-3 px-4 py-1 text-[10px] sm:text-xs uppercase tracking-[0.2em] border border-gold-500/30">
              Premier B2B Network
            </Badge>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-medium mb-6 sm:mb-8 text-white leading-tight tracking-wide">
              Curated Excellence <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-600">For Your Business</span>
            </h1>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="glass p-2 sm:p-3 rounded-2xl sm:rounded-full shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row gap-2 border border-white/20"
          >
            <div className="flex-1 flex items-center bg-white/10 rounded-xl sm:rounded-full px-4 sm:px-6 h-12 sm:h-14 hover:bg-white/20 transition-colors">
              <Search className="text-gold-400 w-5 h-5 mr-3" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                className="w-full bg-transparent outline-none text-white placeholder-gray-400 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex-1 flex items-center bg-white/10 rounded-xl sm:rounded-full px-4 sm:px-6 h-12 sm:h-14 hover:bg-white/20 transition-colors md:border-l border-white/10">
              <MapPin className="text-gold-400 w-5 h-5 mr-3" />
              <select
                className="w-full bg-transparent outline-none text-white cursor-pointer appearance-none [&>option]:text-black"
                value={selectedPincode}
                onChange={(e) => setSelectedPincode(e.target.value)}
              >
                <option value="">{t('All Pincodes')}</option>
                {VADODARA_PINCODES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 flex items-center bg-white/10 rounded-xl sm:rounded-full px-4 sm:px-6 h-12 sm:h-14 hover:bg-white/20 transition-colors md:border-l border-white/10">
              <Lock className="text-gold-400 w-5 h-5 mr-3" />
              <select
                className="w-full bg-transparent outline-none text-white cursor-pointer appearance-none [&>option]:text-black"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">{t('All Categories')}</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <Button size="icon" className="h-12 sm:h-14 w-full md:w-14 rounded-xl md:rounded-full bg-gold-500 hover:bg-gold-600 text-luxury-black shrink-0">
              <ArrowRight className="w-5 sm:w-6 h-5 sm:h-6" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 md:py-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 sm:mb-12">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-luxury-black mb-2">
              {t('Featured Vendors')}
            </h2>
            <p className="text-sm sm:text-base text-gray-500">{t('Discover our top-rated partners.')}</p>
          </div>
          <div className="flex items-center gap-4">
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
{/* <Button variant="outline" className="hidden sm:flex text-sm md:text-base">View Operations Map</Button> */}
          </div>
        </div>

        <motion.div
          className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
            : "flex flex-col gap-4 max-w-4xl mx-auto"}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredVendors.map((vendor) => viewMode === 'grid' ? (
            <motion.div
              key={vendor.id}
              variants={itemVariants}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col h-full hover-lift card-shine cursor-pointer"
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              onClick={() => setSelectedVendor(vendor)}
            >
              <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent group-hover:from-black/60 transition-colors z-10" />
                <motion.img
                  src={vendor.coverImage}
                  alt={vendor.name}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  fetchPriority="high"
                  decoding="sync"
                />

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

                {/* Favorite Heart Icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!requireAuth('like this vendor')) return;
                    
                    if (isFavorite(vendor.id)) {
                      removeFromFavorites(vendor.id);
                    } else {
                      // Adapt mock vendor to GooglePlaceResponse-like structure if strictly required
                      // but backend stores placeData as jsonb which is flexible.
                      addToFavorites(vendor as any); 
                    }
                  }}
                  className="absolute top-4 right-4 z-20 p-2 rounded-full backdrop-blur-md bg-white/70 hover:bg-white transition-colors duration-300 shadow-sm"
                  aria-label={isFavorite(vendor.id) ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart 
                    className={`w-5 h-5 transition-colors duration-300 ${
                      isFavorite(vendor.id) 
                        ? "fill-red-500 text-red-500" 
                        : "text-gray-600 hover:text-red-500"
                    }`} 
                  />
                </button>

                {/* Quick Stats Overlay */}
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
                    <h3 className="text-xl sm:text-2xl font-bold text-luxury-charcoal font-serif group-hover:text-gold-600 transition-colors">{t(vendor.name)}</h3>
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <MapPin className="w-3 h-3 mr-1 text-gold-500" /> {t(vendor.city)}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1 text-gold-500" /> {formatOpeningHours(vendor.openingHours)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center bg-luxury-cream border border-gold-100 px-2 py-1 rounded-lg">
                      <Star className="w-4 h-4 text-gold-500 fill-current" />
                      <span className="ml-1 text-sm font-bold text-luxury-black">{vendor.rating}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1">{vendor.reviewCount} reviews</span>
                  </div>
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent my-4" />

                <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                  {t(vendor.shortDescription)}
                </p>

                {/* Product Highlights 
                {vendor.products && vendor.products.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] tracking-[0.2em] font-bold text-gray-400 uppercase mb-2">Product Highlights</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {vendor.products.slice(0, 3).map((product) => (
                        <div key={product.id} className="min-w-[100px] max-w-[100px] group/prod">
                          <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 mb-1 shadow-sm group-hover/prod:border-gold-300 transition-colors">
                            <img 
                              src={product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'} 
                              alt={product.name}
                              className="w-full h-full object-cover group-hover/prod:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover/prod:bg-black/5 transition-colors" />
                          </div>
                          <p className="text-[10px] font-medium text-luxury-black truncate">{product.name}</p>
                          <p className="text-[10px] font-bold text-gold-600">₹{product.price}</p>
                        </div>
                      ))}
                      {vendor.products.length > 3 && (
                        <div className="min-w-[40px] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100 text-[10px] font-medium text-gray-400 hover:text-gold-600 hover:bg-gold-50 transition-all cursor-pointer">
                          +{vendor.products.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                */}

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-auto">
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-200 hover:border-gold-300 hover:bg-gold-50"
                    onClick={(e) => handleCallNow(e, vendor)}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    {t('Call Now')}
                  </Button>

                  {vendor.planType === 'card_website' && vendor.websiteUrl && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(vendor.websiteUrl, '_blank');
                      }}
                      className="flex-1 bg-luxury-black hover:bg-gold-600 text-white border-none"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      {t('Visit Website')}
                    </Button>
                  )}
                  
                  {vendor.planType === 'card_website' && vendor.websiteUuid && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/store/${vendor.websiteUuid}`);
                      }}
                      variant={vendor.websiteUrl ? "outline" : "primary"}
                      className={`flex-1 ${!vendor.websiteUrl ? 'bg-luxury-black hover:bg-gold-600 text-white border-none' : 'border-gray-200 hover:border-gold-300 hover:bg-gold-50'}`}
                    >
                      <Store className="w-4 h-4 mr-2" />
                      {t('Visit Website')}
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
              className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 cursor-pointer hover-lift"
              onClick={() => setSelectedVendor(vendor)}
            >
              <div className="flex flex-col w-full sm:w-auto flex-1 pr-4 mb-4 sm:mb-0">
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
                  <span className="flex items-center line-clamp-1">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-gold-500 shrink-0" /> {formatOpeningHours(vendor.openingHours)}
                  </span>
                  {vendor.rating > 0 && (
                    <span className="flex items-center font-medium text-luxury-black shrink-0">
                      <Star className="w-3.5 h-3.5 text-gold-500 mr-1 fill-current" />
                      {vendor.rating} <span className="text-gray-400 font-normal ml-1">({vendor.reviewCount})</span>
                    </span>
                  )}
                  {vendor.products && vendor.products.length > 0 && (
                    <span className="flex items-center text-[10px] bg-gold-50 text-gold-600 px-2 py-0.5 rounded-full font-bold">
                      {vendor.products.length} Products
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-row gap-2 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 justify-end sm:justify-start">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 border-gray-200 hover:border-gold-300 hover:bg-gold-50"
                  onClick={(e) => handleCallNow(e, vendor)}
                >
                  <Phone className="w-3.5 h-3.5 sm:mr-2" />
                  <span className="hidden sm:inline">{t('Call Now')}</span>
                </Button>

                {vendor.planType === 'card_website' && vendor.websiteUrl && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(vendor.websiteUrl, '_blank');
                    }}
                    className="h-9 bg-luxury-black hover:bg-gold-600 text-white border-none"
                  >
                    <Globe className="w-3.5 h-3.5 sm:mr-2" />
                    <span className="hidden sm:inline">{t('Visit Website')}</span>
                  </Button>
                )}

                {vendor.planType === 'card_website' && vendor.websiteUuid && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/store/${vendor.websiteUuid}`);
                    }}
                    variant={vendor.websiteUrl ? "outline" : "primary"}
                    className={`h-9 ${!vendor.websiteUrl ? 'bg-luxury-black hover:bg-gold-600 text-white border-none' : 'border-gray-200 hover:border-gold-300 hover:bg-gold-50'}`}
                  >
                    <Store className="w-3.5 h-3.5 sm:mr-2" />
                    <span className="hidden sm:inline">{t('Visit Website')}</span>
                  </Button>
                )}

                {(vendor.planType !== 'card_website' || (!vendor.websiteUrl && !vendor.websiteUuid)) && (
                  <Button
                    disabled
                    variant="ghost"
                    size="sm"
                    className="h-9 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400"
                  >
                    {t('Listing Only')}
                  </Button>
                )}
                <div className="flex items-center justify-center p-2 rounded-md hover:bg-gray-100 transition-colors ml-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!requireAuth('like this vendor')) return;
                      
                      if (isFavorite(vendor.id)) {
                        removeFromFavorites(vendor.id);
                      } else {
                        addToFavorites(vendor as any); 
                      }
                    }}
                    aria-label={isFavorite(vendor.id) ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart 
                      className={`w-4 h-4 transition-colors ${
                        isFavorite(vendor.id) ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-500"
                      }`} 
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {filteredVendors.length === 0 && (
          <div className="text-center py-32">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900">No vendors found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search or filters to find what you're looking for.</p>
            <Button
              variant="link"
              onClick={() => { setSearchTerm(''); setSelectedPincode(''); setSelectedCategory(''); }}
              className="mt-4 text-gold-600"
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>
      {/* Contact Card Modal */}
      <ContactCardModal
        vendor={selectedVendor}
        isOpen={!!selectedVendor}
        onClose={() => setSelectedVendor(null)}
      />
    </div>
  );
};