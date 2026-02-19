import React, { useState } from 'react';
import { Search, MapPin, Star, Phone, Globe, Lock, CheckCircle, ArrowRight, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Vendor } from '../types';
import { CITIES, CATEGORIES, TRANSLATIONS } from '../constants';
import { useAppContext } from '../context/AppContext';
import { motion, Variants } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ContactCardModal } from './ContactCardModal';

interface DirectoryProps {
  vendors: Vendor[];
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
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
  const { language, requireAuth } = useAppContext();
  const router = useRouter();
  const t = TRANSLATIONS[language];
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const handleCallNow = (e: React.MouseEvent, vendor: Vendor) => {
    e.stopPropagation();
    if (!requireAuth('call this vendor')) return;
    window.location.href = `tel:${vendor.phone}`;
  };

  const filteredVendors = vendors.filter((v) => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = selectedCity ? v.city === selectedCity : true;
    const matchesCategory = selectedCategory ? v.category === selectedCategory : true;
    return matchesSearch && matchesCity && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-luxury-cream">
      {/* Hero Section */}
      <div className="relative h-[450px] sm:h-[500px] md:h-[600px] flex items-center justify-center overflow-hidden">
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
            <Badge variant="premium" className="mb-4 sm:mb-6 px-3 sm:px-4 py-1 text-xs sm:text-sm uppercase tracking-widest border border-gold-500/30">
              Premier B2B Network
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-serif font-bold mb-4 sm:mb-6 text-white leading-tight">
              Curated Excellence <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-600">
                For Your Business
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-200 font-light mb-6 sm:mb-8 md:mb-12 max-w-2xl mx-auto px-2">
              {t.explore}
            </p>
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
                placeholder={t.searchPlaceholder}
                className="w-full bg-transparent outline-none text-white placeholder-gray-400 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex-1 flex items-center bg-white/10 rounded-xl sm:rounded-full px-4 sm:px-6 h-12 sm:h-14 hover:bg-white/20 transition-colors md:border-l border-white/10">
              <MapPin className="text-gold-400 w-5 h-5 mr-3" />
              <select
                className="w-full bg-transparent outline-none text-white cursor-pointer appearance-none [&>option]:text-black"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                <option value="">All Cities</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
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
                <option value="">All Categories</option>
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
              Featured Vendors
            </h2>
            <p className="text-sm sm:text-base text-gray-500">Discover top-rated partners for your supply chain.</p>
          </div>
          <Button variant="outline" className="hidden sm:flex text-sm md:text-base">View Operations Map</Button>
        </div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {filteredVendors.map((vendor) => (
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
                />

                <div className="absolute top-4 left-4 z-20 flex gap-2">
                  <Badge variant={vendor.isOpen ? "success" : "secondary"} className="shadow-lg backdrop-blur-md bg-white/90">
                    {vendor.isOpen ? t.open : t.closed}
                  </Badge>
                </div>

                {vendor.isPremium && (
                  <div className="absolute top-4 right-4 z-20">
                    <Badge variant="premium" className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> VERIFIED
                    </Badge>
                  </div>
                )}

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
                    <h3 className="text-xl sm:text-2xl font-bold text-luxury-charcoal font-serif group-hover:text-gold-600 transition-colors">{vendor.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <MapPin className="w-3 h-3 mr-1 text-gold-500" /> {vendor.city}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1 text-gold-500" /> 10:00 AM - 9:00 PM
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

                <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-grow">
                  {vendor.shortDescription}
                </p>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-auto">
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-200 hover:border-gold-300 hover:bg-gold-50"
                    onClick={(e) => handleCallNow(e, vendor)}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    {t.callNow}
                  </Button>

                  {vendor.isPremium && vendor.websiteUuid ? (
                    <Button
                      onClick={() => router.push(`/store/${vendor.websiteUuid}`)}
                      className="flex-1 bg-luxury-black hover:bg-gold-600 text-white border-none"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      {t.visitWebsite}
                    </Button>
                  ) : (
                    <Button disabled variant="ghost" className="flex-1 cursor-not-allowed bg-gray-50">
                      Listing Only
                    </Button>
                  )}
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
              onClick={() => { setSearchTerm(''); setSelectedCity(''); setSelectedCategory(''); }}
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