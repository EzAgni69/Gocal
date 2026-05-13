'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, ChevronRight, Phone, Clock, Star, Building2 } from 'lucide-react';
import { Vendor } from '../types';
import { Badge } from '@/components/ui/Badge';
import { formatOpeningHours } from '../utils/openingHours';
import { useTranslation } from '../providers/TranslationProvider';

interface ContactCardSelectorModalProps {
    vendors: Vendor[];
    isOpen: boolean;
    onClose: () => void;
    onSelect: (vendor: Vendor) => void;
    vendorName: string;
}

export const ContactCardSelectorModal: React.FC<ContactCardSelectorModalProps> = ({
    vendors,
    isOpen,
    onClose,
    onSelect,
    vendorName
}) => {
    const { t } = useTranslation();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-luxury-cream">
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-luxury-black">{t(vendorName)}</h2>
                                <p className="text-sm text-gray-500 mt-1">{vendors.length} {t('locations available')}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-black/5 transition-colors"
                            >
                                <X className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>

                        {/* Options List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {vendors.map((vendor) => (
                                <motion.button
                                    key={vendor.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onSelect(vendor)}
                                    className="w-full text-left p-4 rounded-2xl border border-gray-100 bg-white hover:border-gold-300 hover:shadow-lg transition-all flex items-start gap-4 group"
                                >
                                    <div className="h-12 w-12 rounded-xl bg-gold-50 flex items-center justify-center shrink-0 group-hover:bg-gold-100 transition-colors">
                                        <MapPin className="h-6 w-6 text-gold-600" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-bold text-luxury-black truncate pr-2">
                                                {vendor.address?.split(',')[0] || t('Main Location')}
                                            </h3>
                                            <Badge variant={vendor.isOpen ? 'success' : 'secondary'} className="text-[10px]">
                                                {vendor.isOpen ? t('Open') : t('Closed')}
                                            </Badge>
                                        </div>
                                        
                                        <p className="text-sm text-gray-500 line-clamp-1 mb-2">
                                            {t(vendor.address || '')}
                                        </p>
                                        
                                        <div className="flex items-center gap-3 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Phone className="h-3 w-3" /> {vendor.phone}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Star className="h-3 w-3 text-gold-500 fill-current" /> {vendor.rating}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="self-center">
                                        <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gold-500 transition-colors" />
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100">
                            <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest font-bold">
                                Select a location to view contact card
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
