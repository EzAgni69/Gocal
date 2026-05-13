import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, Tag, Image as ImageIcon, MessageCircle, MapPin, Heart, Star, ExternalLink, Edit3, X, Clock, Navigation, Phone, Mail, Copy, Check, Share2, QrCode } from 'lucide-react';
import { Vendor, Product, Language, Review } from '../types';
import { TRANSLATIONS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from '../providers/TranslationProvider';
import { ReviewModal } from './ReviewModal';
import { apiClient } from '../services/apiClient';
import { formatOpeningHours, getAllOpeningHours } from '../utils/openingHours';
import Image from 'next/image';


interface MiniWebsiteProps {
  vendor: Vendor;
  language: Language;
  onBack: () => void;
  addToWishlist: (product: Product) => void;
  wishlist: Product[];
}

const tabContentVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 }
};

export const MiniWebsite: React.FC<MiniWebsiteProps> = ({ vendor, language, onBack, addToWishlist, wishlist }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'products' | 'offers' | 'gallery' | 'reviews'>('home');
  const { t } = useTranslation();
  const { requireAuth } = useAppContext();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(vendor.reviews || []);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Derived display values with fallbacks
  const businessLabel = vendor.miniWebsiteConfig?.businessLabel?.trim() || vendor.name;
  const tagline = vendor.miniWebsiteConfig?.tagline?.trim()
      || vendor.shortDescription?.trim()
      || null;
  const aboutDescription = vendor.miniWebsiteConfig?.aboutDescription?.trim()
      || vendor.description?.trim()
      || vendor.shortDescription?.trim()
      || null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleShare = (e: React.MouseEvent, title: string, text: string, url: string) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title, text, url }).catch((err) => console.log('Error sharing', err));
    } else {
      navigator.clipboard.writeText(url);
      setCopiedItem('link');
      setTimeout(() => setCopiedItem(null), 2000);
    }
  };

  const handleWhatsApp = () => {
    if (!requireAuth('message this vendor')) return;
    const message = encodeURIComponent(`Hi, I found your store on Gocal.co and would like to inquire about your products.`);
    const phoneNumber = (vendor.phone || '').replace(/\D/g, '');
    if (!phoneNumber) {
      alert('Vendor phone number not available');
      return;
    }
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const handleAddToWishlist = (product: Product) => {
    if (!requireAuth('add items to wishlist')) return;
    addToWishlist({
      ...product,
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorPhone: vendor.phone
    });
  };

  const handleWriteReview = () => {
    if (!requireAuth('write a review')) return;
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    const response = await apiClient('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendorId: vendor.id, rating, comment }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to submit review');
    }

    const data = await response.json();
    setReviews((prev) => [data.review, ...prev]);
  };

  // Fetch reviews when switching to reviews tab if not yet loaded
  useEffect(() => {
    if (activeTab !== 'reviews') return;
    if (reviews.length > 0) return;
    setReviewsLoading(true);
    apiClient(`/api/reviews/vendor/${vendor.id}`)
      .then((res) => res.json())
      .then((data) => setReviews(data.reviews || []))
      .catch((err) => console.error('Failed to fetch reviews:', err))
      .finally(() => setReviewsLoading(false));
  }, [activeTab, vendor.id]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20 font-sans text-gray-800">
      {/* Premium Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-[0_4px_30px_rgba(0,0,0,0.03)] transition-all duration-300">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-xs tracking-[0.2em] uppercase font-semibold hidden md:inline-block">Marketplace</span>
            </button>
            <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
            <div className="flex items-center gap-4">
            <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border border-gray-100 shadow-sm flex-shrink-0 bg-white">
                {vendor.coverImage ? (
                  <Image src={vendor.coverImage} alt="logo" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    <span className="text-white font-serif text-lg md:text-xl">{vendor.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-serif font-bold text-black tracking-tight">{t(vendor.name)}</h1>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-10">
            {[
              { id: 'home', label: 'Overview' },
              { id: 'products', label: 'Products' },
              { id: 'offers', label: 'Offers' },
              { id: 'gallery', label: 'Gallery' },
              { id: 'reviews', label: 'Testimonials' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-[11px] tracking-[0.2em] uppercase font-semibold transition-all duration-300 relative ${
                  activeTab === tab.id 
                    ? 'text-black scale-105' 
                    : 'text-gray-400 hover:text-black'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="underline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-black" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {vendor.phone && (
              <a
                href={`tel:${vendor.phone}`}
                className="flex items-center justify-center w-10 h-10 bg-white border border-gray-100 text-black hover:bg-gray-50 transition-all hover:scale-110 shadow-sm rounded-full"
                title="Call Vendor"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
            {(vendor.address || vendor.miniWebsiteConfig?.googleMapsUrl) && (
              <a
                href={vendor.miniWebsiteConfig?.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vendor.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 bg-white border border-gray-100 text-black hover:bg-gray-50 transition-all hover:scale-110 shadow-sm rounded-full"
                title="View on Maps"
              >
                <MapPin className="w-4 h-4" />
              </a>
            )}
            <button
               onClick={handleWhatsApp}
               className="hidden sm:flex items-center px-6 py-2.5 bg-black hover:bg-gray-900 text-white text-xs tracking-widest uppercase font-semibold transition-all hover:scale-105 shadow-xl shadow-black/10 rounded-full"
            >
               <MessageCircle className="w-4 h-4 mr-2 text-[#25D366] fill-[#25D366]/10" />
               WhatsApp
            </button>
            {/* Mobile Inquire Icon */}
            <button
               onClick={handleWhatsApp}
               className="sm:hidden flex items-center justify-center w-10 h-10 bg-black text-white hover:bg-gray-900 transition-all hover:scale-110 shadow-xl shadow-black/10 rounded-full"
            >
               <MessageCircle className="w-4 h-4 text-[#25D366] fill-[#25D366]/10" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="lg:hidden flex justify-between gap-1 px-2 py-3 overflow-x-auto border-t border-gray-100 bg-white/95 backdrop-blur-md">
          {[
            { id: 'home', label: 'Home', icon: MapPin },
            { id: 'products', label: 'Products', icon: ShoppingBag },
            { id: 'offers', label: 'Offers', icon: Tag },
            { id: 'gallery', label: 'Gallery', icon: ImageIcon },
            { id: 'reviews', label: 'Reviews', icon: Star },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center p-2 min-w-[70px] rounded-xl transition-all ${
                activeTab === tab.id ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4 mb-1.5" />
              <span className="text-[9px] uppercase tracking-wider font-bold">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="w-full">
        <AnimatePresence mode="wait">
          {/* HOME TAB */}
          {activeTab === 'home' && (
            <motion.div
              key="home"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              {/* Luxury Hero Banner */}
              <div className="relative w-full h-[60vh] md:h-[75vh] flex items-center justify-center overflow-hidden bg-black">
                <motion.img 
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  src={vendor.coverImage} 
                  alt="Cover" 
                  className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30"></div>
                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto mt-16 md:mt-20">
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-serif text-white mb-6 drop-shadow-2xl tracking-tight leading-tight"
                  >
                    {t(vendor.name)}
                  </motion.h2>
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-lg md:text-xl text-gray-200 font-light tracking-wide max-w-2xl mx-auto leading-relaxed"
                  >
                    {t(vendor.description)}
                  </motion.p>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                  >
                    <button 
                      onClick={() => setActiveTab('products')}
                      className="mt-12 px-10 py-4 bg-white text-black text-xs uppercase tracking-[0.2em] font-bold hover:bg-gray-100 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                    >
                      {t('Discover Products')}
                    </button>
                  </motion.div>
                </div>
              </div>

              {/* Info Section */}
              <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                  <div className="flex flex-col justify-center order-2 lg:order-1">
                    <p className="text-sm tracking-[0.3em] uppercase text-gray-400 mb-4 font-semibold">{businessLabel}</p>
                    {tagline && <h3 className="font-serif text-4xl md:text-5xl mb-8 text-black leading-tight">{tagline}</h3>}
                    {aboutDescription && <p className="text-gray-500 mb-10 leading-relaxed text-lg font-light max-w-lg">
                      {aboutDescription}
                    </p>}
                    <div className="space-y-8 bg-white p-8 md:p-10 border border-gray-100 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
                      <div className="flex items-start gap-5">
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-black group-hover:text-white transition-colors duration-300">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-bold text-black tracking-widest uppercase text-xs">{t('Location')}</p>
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vendor.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-gray-400 hover:text-black uppercase tracking-widest font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <Navigation className="w-3 h-3" />
                              Directions
                            </a>
                          </div>
                          <p className="text-gray-600 font-light leading-relaxed">{t(vendor.address)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-5">
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-black" />
                        </div>
                        <div>
                          <p className="font-bold text-black tracking-widest uppercase text-xs mb-2">Opening Hours</p>
                          <div className="text-gray-600 font-light space-y-1">
                            {getAllOpeningHours(vendor.openingHours).length > 0
                              ? getAllOpeningHours(vendor.openingHours).map(({ day, hours, isToday }) => (
                                  <p key={day} className={isToday ? 'font-semibold text-black' : ''}>
                                    {day}: {hours}
                                  </p>
                                ))
                              : <p>{formatOpeningHours(vendor.openingHours)}</p>
                            }
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-5">
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="w-5 h-5 text-black" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-black tracking-widest uppercase text-xs mb-4">{t('Contact')}</p>
                          <div className="space-y-4">
                            {vendor.phone && (
                              <div className="flex items-center justify-between group/contact">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                                  </div>
                                  <a href={`tel:${vendor.phone}`} className="text-gray-600 font-light hover:text-black transition-colors">{vendor.phone}</a>
                                </div>
                                <button 
                                  onClick={() => handleCopy(vendor.phone, 'phone')}
                                  className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black transition-all flex items-center gap-2"
                                  title="Copy Phone"
                                >
                                  {copiedItem === 'phone' ? (
                                    <Check className="w-3.5 h-3.5 text-green-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            )}
                            {vendor.email && (
                              <div className="flex items-center justify-between group/contact">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                                  </div>
                                  <a href={`mailto:${vendor.email}`} className="text-gray-600 font-light hover:text-black transition-colors">{vendor.email}</a>
                                </div>
                                <button 
                                  onClick={() => handleCopy(vendor.email, 'email')}
                                  className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black transition-all flex items-center gap-2"
                                  title="Copy Email"
                                >
                                  {copiedItem === 'email' ? (
                                    <Check className="w-3.5 h-3.5 text-green-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {vendor.miniWebsiteConfig?.qrCodeUrl && (
                        <div className="flex items-start gap-5">
                          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                            <QrCode className="w-5 h-5 text-black" />
                          </div>
                          <div>
                            <p className="font-bold text-black tracking-widest uppercase text-xs mb-3">Scan to Pay</p>
                            <Image
                              src={vendor.miniWebsiteConfig.qrCodeUrl}
                              alt="Payment QR Code"
                              width={200}
                              height={200}
                              className="rounded-lg border border-gray-100"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="relative h-[500px] lg:h-[700px] overflow-hidden order-1 lg:order-2">
                    <Image 
                      src={vendor.coverImage || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"} 
                      alt="Store front" 
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 border-[1px] border-black/10 m-4 md:m-8 pointer-events-none"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <motion.div
              key="products"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24"
            >
              <div className="text-center mb-20">
                <p className="text-xs tracking-[0.3em] uppercase text-gray-400 mb-4 font-semibold">Exquisite Pieces</p>
                <h3 className="font-serif text-4xl md:text-5xl text-black mb-8">The Products</h3>
                <div className="w-16 h-px bg-black mx-auto mt-6"></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
                {vendor.products?.map((product) => {
                  const isInWishlist = wishlist.some(p => p.id === product.id);
                  return (
                    <div key={product.id} className="group cursor-pointer">
                      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-6">
                        <Image 
                          src={product.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80"} 
                          alt={product.name || 'Product'} 
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" 
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500"></div>
                        <div className="absolute top-4 right-4 flex gap-2 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          <button
                            onClick={(e) => {
                              handleShare(
                                e,
                                product.name,
                                `Check out ${product.name} at ${vendor.name}`,
                                window.location.href
                              );
                            }}
                            className="p-3 rounded-full bg-white/90 backdrop-blur-md shadow-[0_10px_20px_rgba(0,0,0,0.1)] transition-all duration-300 hover:scale-110"
                            title="Share Product"
                          >
                            {copiedItem === 'link' ? (
                              <Check className="w-5 h-5 text-green-500" />
                            ) : (
                              <Share2 className="w-5 h-5 text-black" />
                            )}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAddToWishlist(product); }}
                            className="p-3 rounded-full bg-white/90 backdrop-blur-md shadow-[0_10px_20px_rgba(0,0,0,0.1)] transition-all duration-300 hover:scale-110"
                            title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                          >
                            <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-black stroke-black' : 'stroke-black group-hover:fill-black/10'}`} />
                          </button>
                        </div>
                      </div>
                      <div className="text-center px-2">
                        <p className="text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-3 font-semibold">{t(product.category)}</p>
                        <h4 className="font-serif text-xl text-black mb-3 line-clamp-1 group-hover:text-gray-600 transition-colors">{t(product.name)}</h4>
                        <span className="text-sm font-medium tracking-wide text-gray-900">₹{product.price.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {!vendor.products?.length && (
                <div className="text-center py-32 border border-gray-100 bg-white shadow-sm">
                  <p className="uppercase tracking-[0.2em] text-gray-400 font-semibold mb-2">Products Empty</p>
                  <p className="font-serif text-2xl text-black">No pieces available currently.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* OFFERS TAB */}
          {activeTab === 'offers' && (
            <motion.div
              key="offers"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24"
            >
              <div className="text-center mb-20">
                <p className="text-xs tracking-[0.3em] uppercase text-gray-400 mb-4 font-semibold">Exclusive Rewards</p>
                <h3 className="font-serif text-4xl md:text-5xl text-black mb-8">Offers</h3>
                <div className="w-16 h-px bg-black mx-auto mt-6"></div>
              </div>
              
              <div className="space-y-8">
                {vendor.offers?.map((offer, idx) => (
                  <div key={idx} className="bg-black text-white p-8 md:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.15)] relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div>
                        <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-4 font-semibold">{t('Limited Time')}</p>
                        <h4 className="text-3xl md:text-4xl font-serif font-bold mb-4">{t(offer.title)}</h4>
                        <p className="text-xl md:text-2xl font-light text-gray-300">{t(offer.discount)}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 text-center min-w-[200px]">
                        <p className="text-xs tracking-[0.2em] uppercase text-gray-400 mb-2">Promo Code</p>
                        <p className="font-mono text-2xl font-bold tracking-widest">{offer.code}</p>
                      </div>
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-white/5 to-transparent pointer-events-none transform translate-x-10 group-hover:translate-x-0 transition-transform duration-1000"></div>
                    <div className="absolute inset-0 border border-white/10 m-2 pointer-events-none"></div>
                  </div>
                ))}
              </div>
              {!vendor.offers?.length && (
                <div className="text-center py-32 border border-gray-100 bg-white">
                  <p className="font-serif text-2xl text-black">No exclusive offers active.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* GALLERY TAB */}
          {activeTab === 'gallery' && (
            <motion.div
              key="gallery"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24"
            >
              <div className="text-center mb-20">
                <p className="text-xs tracking-[0.3em] uppercase text-gray-400 mb-4 font-semibold">Visual Journey</p>
                <h3 className="font-serif text-4xl md:text-5xl text-black mb-8">The Gallery</h3>
                <div className="w-16 h-px bg-black mx-auto mt-6"></div>
              </div>

              <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                {vendor.galleryImages?.map((img, idx) => (
                  <div key={idx} className="break-inside-avoid relative group overflow-hidden bg-gray-100">
                    <Image src={img.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80"} alt={img.caption || "Gallery"} width={800} height={800} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    {img.caption && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        {img.caption}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500"></div>
                  </div>
                ))}
              </div>
              {!vendor.galleryImages?.length && (
                <div className="text-center py-32 border border-gray-100 bg-white">
                  <p className="font-serif text-2xl text-black">The gallery is currently empty.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <motion.div
              key="reviews"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24"
            >
              <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                <div>
                  <p className="text-xs tracking-[0.3em] uppercase text-gray-400 mb-4 font-semibold">Client Experiences</p>
                  <h3 className="font-serif text-4xl md:text-5xl text-black">Testimonials</h3>
                  <div className="w-16 h-px bg-black mt-8"></div>
                </div>
                <Button
                  onClick={handleWriteReview}
                  className="bg-black hover:bg-gray-800 text-white rounded-none px-8 py-6 text-xs uppercase tracking-[0.2em] font-semibold"
                >
                  <Edit3 className="w-4 h-4 mr-3" />
                  Leave a Review
                </Button>
              </div>

              {/* Rating Summary */}
              <div className="bg-white p-10 border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] mb-12 flex flex-col md:flex-row items-center gap-12">
                <div className="text-center md:text-left">
                  <p className="text-6xl font-serif text-black leading-none mb-4">{vendor.rating}</p>
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${star <= Math.round(vendor.rating) ? 'fill-black text-black' : 'text-gray-200'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs tracking-[0.2em] uppercase text-gray-400 font-semibold">{vendor.reviewCount} Reviews</p>
                </div>
                <div className="hidden md:block w-px h-24 bg-gray-100"></div>
                <div className="flex-1 text-center md:text-left">
                  <p className="font-serif text-xl md:text-2xl text-gray-800 italic">
                    "A curated experience reflecting true luxury and uncompromising quality."
                  </p>
                </div>
              </div>

              {/* Reviews List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {reviewsLoading ? (
                  <div className="col-span-2 text-center py-20 text-gray-400 text-sm tracking-widest uppercase">Loading reviews...</div>
                ) : reviews.map((review) => (
                  <div key={review.id} className="bg-white p-8 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)] transition-shadow duration-300">
                    <div className="flex items-center gap-1 mb-6">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${star <= review.rating ? 'fill-black text-black' : 'text-gray-200'}`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-600 font-light leading-relaxed mb-6 italic">"{review.comment}"</p>
                    <div className="flex items-center gap-4">
                      <div className="relative w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        {review.user?.avatarUrl ? (
                          <Image src={review.user.avatarUrl} alt={review.user?.name || "User"} fill className="object-cover" />
                        ) : (
                          <span className="font-serif text-black">{(review.user?.name || 'A').charAt(0)}</span>
                        )}
                      </div>
                      <p className="font-semibold text-xs tracking-widest uppercase text-black">{review.user?.name || 'Anonymous'}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {!reviewsLoading && reviews.length === 0 && (
                <div className="text-center py-20 border border-gray-100 bg-white">
                  <Star className="w-12 h-12 text-gray-200 mx-auto mb-6" />
                  <p className="font-serif text-2xl text-black mb-6">Be the first to share your experience.</p>
                  <Button
                    onClick={handleWriteReview}
                    variant="outline"
                    className="rounded-none px-8 py-6 text-xs uppercase tracking-[0.2em] font-semibold border-black text-black hover:bg-black hover:text-white transition-colors"
                  >
                    Write a Review
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleSubmitReview}
        vendorName={vendor.name}
      />
    </div>
  );
};