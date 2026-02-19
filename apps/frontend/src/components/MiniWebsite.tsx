import React, { useState } from 'react';
import { ArrowLeft, ShoppingBag, Tag, Image as ImageIcon, MessageCircle, MapPin, Heart, Star, ExternalLink, Edit3, X, Clock } from 'lucide-react';
import { Vendor, Product, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppContext } from '../context/AppContext';

interface MiniWebsiteProps {
  vendor: Vendor;
  language: Language;
  onBack: () => void;
  addToWishlist: (product: Product) => void;
  wishlist: Product[];
}

const tabContentVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const MiniWebsite: React.FC<MiniWebsiteProps> = ({ vendor, language, onBack, addToWishlist, wishlist }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'products' | 'offers' | 'gallery' | 'reviews'>('home');
  const t = TRANSLATIONS[language];
  const { requireAuth } = useAppContext();

  const handleWhatsApp = () => {
    if (!requireAuth('message this vendor')) return;
    // In a real app, this would open whatsapp://
    alert("Opening WhatsApp with predefined message: 'Hi, I found your store on Vanij.co and would like to inquire about...'");
  };

  const handleAddToWishlist = (product: Product) => {
    if (!requireAuth('add items to wishlist')) return;
    addToWishlist(product);
  };

  const handleWriteReview = () => {
    if (!requireAuth('write a review')) return;
    // In a real app, this would open a review form modal
    alert('Review form would open here. Thank you for your feedback!');
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Floating Exit Button - Bottom Left */}
      <motion.button
        onClick={onBack}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-md text-gray-700 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
      >
        <X className="w-4 h-4" />
        <span className="text-sm font-medium">Exit</span>
      </motion.button>

      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gold-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo Space */}
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gold-200 shadow-sm flex-shrink-0">
              {vendor.coverImage ? (
                <img
                  src={vendor.coverImage}
                  alt={`${vendor.name} logo`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{vendor.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <h1 className="text-lg font-serif font-bold text-luxury-black">{vendor.name}</h1>
          </div>
          <button
            onClick={handleWhatsApp}
            className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-bold shadow-lg transition-transform hover:scale-105"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center gap-6 md:gap-12 mt-2 px-4 overflow-x-auto">
          {[
            { id: 'home', label: 'Home', icon: MapPin },
            { id: 'products', label: t.products, icon: ShoppingBag },
            { id: 'offers', label: 'Offers', icon: Tag },
            { id: 'gallery', label: 'Gallery', icon: ImageIcon },
            { id: 'reviews', label: 'Reviews', icon: Star },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center pb-2 border-b-2 transition-colors min-w-[60px] ${activeTab === tab.id
                ? 'border-gold-500 text-gold-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
            >
              <tab.icon className="w-5 h-5 mb-1" />
              <span className="text-xs uppercase tracking-wider font-semibold">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* HOME TAB */}
          {activeTab === 'home' && (
            <motion.div
              key="home"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl">
                <img src={vendor.coverImage} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                  <div className="text-white">
                    <h2 className="text-3xl font-serif font-bold mb-2">{vendor.name}</h2>
                    <p className="opacity-90 max-w-lg">{vendor.description}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-luxury-cream p-6 rounded-xl border border-stone-200">
                  <h3 className="font-serif text-xl font-bold mb-4 text-gold-700">Visit Us</h3>
                  <p className="text-gray-600 mb-4">{vendor.address}</p>
                  <p className="flex items-center text-gray-600 mb-4">
                    {/* <Clock className="w-4 h-4 mr-2 text-gold-600" /> */}
                    {/* <span>10:00 AM - 9:00 PM</span> */}
                  </p>
                  <div className="h-40 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                    <MapPin className="w-8 h-8 mr-2" /> Google Map Placeholder
                  </div>
                </div>
                <div className="bg-luxury-cream p-6 rounded-xl border border-stone-200">
                  <h3 className="font-serif text-xl font-bold mb-4 text-gold-700">Contact Info</h3>
                  <div className="space-y-3">
                    <p className="flex items-center text-gray-600">
                      <span className="font-bold w-20">Phone:</span> {vendor.phone}
                    </p>
                    <p className="flex items-center text-gray-600">
                      <span className="font-bold w-20">Email:</span> {vendor.email}
                    </p>
                    <p className="flex items-center text-gray-600">
                      <span className="font-bold w-20">Hours:</span> 10:00 AM - 9:00 PM
                    </p>
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
              transition={{ duration: 0.3 }}
            >
              <h3 className="font-serif text-2xl mb-6 text-luxury-black">Exclusive Catalog</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {vendor.products?.map((product) => {
                  const isInWishlist = wishlist.some(p => p.id === product.id);
                  return (
                    <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden group">
                      <div className="relative aspect-square overflow-hidden">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <button
                          onClick={() => handleAddToWishlist(product)}
                          className={`absolute top-2 right-2 p-2 rounded-full shadow-md transition-colors ${isInWishlist ? 'bg-red-50 text-red-500' : 'bg-white text-gray-400 hover:text-red-500'}`}
                        >
                          <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-gray-800 line-clamp-1">{product.name}</h4>
                        <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-gold-600 font-bold">₹{product.price.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {!vendor.products?.length && <p className="text-center text-gray-400 py-10">No products listed yet.</p>}
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
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <h3 className="font-serif text-2xl mb-6 text-luxury-black">Seasonal Offers</h3>
              {vendor.offers?.map((offer, idx) => (
                <div key={idx} className="bg-gradient-to-r from-gold-500 to-gold-600 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                  <div className="relative z-10">
                    <h4 className="text-2xl font-serif font-bold mb-2">{offer.title}</h4>
                    <p className="text-lg opacity-90 mb-4">{offer.discount}</p>
                    <div className="inline-block bg-white text-gold-600 px-4 py-2 rounded font-mono font-bold border-2 border-dashed border-gold-300">
                      CODE: {offer.code}
                    </div>
                  </div>
                  <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform translate-x-10" />
                </div>
              ))}
              {!vendor.offers?.length && <p className="text-center text-gray-400 py-10">No active offers at the moment.</p>}
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
              transition={{ duration: 0.3 }}
            >
              <h3 className="font-serif text-2xl mb-6 text-luxury-black">Store Gallery</h3>
              <div className="columns-2 md:columns-3 gap-4 space-y-4">
                {vendor.gallery?.map((img, idx) => (
                  <img key={idx} src={img} alt="Gallery" className="w-full rounded-lg shadow hover:opacity-90 transition-opacity" />
                ))}
              </div>
              {!vendor.gallery?.length && <p className="text-center text-gray-400 py-10">Gallery is empty.</p>}
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
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-serif text-2xl text-luxury-black">Customer Reviews</h3>
                <Button
                  onClick={handleWriteReview}
                  className="bg-gold-500 hover:bg-gold-600 text-luxury-black"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Write Review
                </Button>
              </div>

              {/* Rating Summary */}
              <div className="bg-luxury-cream p-6 rounded-xl border border-stone-200">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-luxury-black">{vendor.rating}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= Math.round(vendor.rating) ? 'text-gold-500 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{vendor.reviewCount} reviews</p>
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {vendor.reviews?.map((review) => (
                  <div key={review.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-luxury-black">{review.user}</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${star <= review.rating ? 'text-gold-500 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{review.comment}</p>
                  </div>
                ))}
                {!vendor.reviews?.length && (
                  <div className="text-center py-10">
                    <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400">No reviews yet. Be the first to review!</p>
                    <Button
                      onClick={handleWriteReview}
                      variant="outline"
                      className="mt-4"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Write the First Review
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};