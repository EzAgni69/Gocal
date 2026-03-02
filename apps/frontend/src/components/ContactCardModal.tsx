'use client';
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Phone,
    Mail,
    MapPin,
    MessageCircle,
    Star,
    Clock,
    Globe,
    CheckCircle,
    Navigation,
    Copy,
    ExternalLink,
    Edit3,
    Image
} from 'lucide-react';
import { Vendor } from '../types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppContext } from '../context/AppContext';

interface ContactCardModalProps {
    vendor: Vendor | null;
    isOpen: boolean;
    onClose: () => void;
}

export const ContactCardModal: React.FC<ContactCardModalProps> = ({ vendor, isOpen, onClose }) => {
    const { requireAuth } = useAppContext();

    useEffect(() => {
        if (isOpen) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isOpen]);

    if (!vendor) return null;

    const handleCall = () => {
        if (!requireAuth('call this vendor')) return;
        window.location.href = `tel:${vendor.phone}`;
    };

    const handleEmail = () => {
        if (!requireAuth('email this vendor')) return;
        window.location.href = `mailto:${vendor.email}`;
    };

    const handleWhatsApp = () => {
        if (!requireAuth('message this vendor')) return;
        const message = encodeURIComponent(`Hi, I found your store on Vanij.co and would like to inquire about your products.`);
        const phoneNumber = vendor.phone.replace(/\D/g, ''); // Use dynamic phone number and strip non-digits
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    };

    const handleDirections = () => {
        if (!requireAuth('get directions')) return;
        const address = encodeURIComponent(vendor.address);
        window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        // In a real app, show a toast notification
        alert(`${label} copied to clipboard!`);
    };

    const handleWriteReview = () => {
        if (!requireAuth('write a review')) return;
        // In a real app, this would open a review form modal
        alert('Review form would open here. Thank you for your feedback!');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                        className="fixed inset-x-0 bottom-0 z-[101] max-h-[90vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl md:inset-x-auto md:left-1/2 md:bottom-auto md:top-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Cover Image Header */}
                        <div className="relative h-48 overflow-hidden">
                            <img
                                src={vendor.coverImage}
                                alt={vendor.name}
                                className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            {/* Badges */}
                            <div className="absolute left-4 top-4 flex gap-2">
                                <Badge variant={vendor.isOpen ? "success" : "secondary"} className="backdrop-blur-md">
                                    {vendor.isOpen ? 'Open Now' : 'Closed'}
                                </Badge>
                                {vendor.verified && (
                                    <Badge variant="premium" className="flex items-center gap-1 backdrop-blur-md">
                                        <CheckCircle className="h-3 w-3" /> Verified
                                    </Badge>
                                )}
                            </div>

                            {/* Vendor Info Overlay */}
                            <div className="absolute bottom-4 left-4 right-4 text-white">
                                <h2 className="text-2xl font-serif font-bold mb-1">{vendor.name}</h2>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="flex items-center gap-1">
                                        <Star className="h-4 w-4 text-gold-400 fill-current" />
                                        <span className="font-bold">{vendor.rating}</span>
                                        <span className="opacity-75">({vendor.reviewCount} reviews)</span>
                                    </span>
                                    <span className="opacity-75">•</span>
                                    <span className="opacity-90">{vendor.category}</span>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="max-h-[calc(90vh-12rem)] overflow-y-auto overscroll-contain p-6">
                            {/* Description */}
                            <p className="text-gray-600 mb-6 leading-relaxed">{vendor.description}</p>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-4 gap-3 mb-6">
                                <button
                                    onClick={handleCall}
                                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors group"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white group-hover:scale-110 transition-transform">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-semibold text-green-700">Call</span>
                                </button>

                                <button
                                    onClick={handleWhatsApp}
                                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors group"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white group-hover:scale-110 transition-transform">
                                        <MessageCircle className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-semibold text-emerald-700">WhatsApp</span>
                                </button>

                                <button
                                    onClick={handleEmail}
                                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white group-hover:scale-110 transition-transform">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-semibold text-blue-700">Email</span>
                                </button>

                                <button
                                    onClick={handleDirections}
                                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors group"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white group-hover:scale-110 transition-transform">
                                        <Navigation className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-semibold text-orange-700">Directions</span>
                                </button>
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-3 mb-6">
                                <h3 className="font-serif text-lg font-bold text-luxury-black mb-3">Contact Details</h3>

                                <div
                                    className="flex items-center gap-3 p-3 rounded-xl bg-luxury-cream border border-gold-100 cursor-pointer hover:border-gold-300 transition-colors group"
                                    onClick={() => copyToClipboard(vendor.phone, 'Phone number')}
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-100">
                                        <Phone className="h-4 w-4 text-gold-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Phone</p>
                                        <p className="font-medium text-luxury-black">{vendor.phone}</p>
                                    </div>
                                    <Copy className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                <div
                                    className="flex items-center gap-3 p-3 rounded-xl bg-luxury-cream border border-gold-100 cursor-pointer hover:border-gold-300 transition-colors group"
                                    onClick={() => copyToClipboard(vendor.email, 'Email')}
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-100">
                                        <Mail className="h-4 w-4 text-gold-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                                        <p className="font-medium text-luxury-black">{vendor.email}</p>
                                    </div>
                                    <Copy className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                <div
                                    className="flex items-center gap-3 p-3 rounded-xl bg-luxury-cream border border-gold-100 cursor-pointer hover:border-gold-300 transition-colors group"
                                    onClick={() => copyToClipboard(vendor.address, 'Address')}
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-100">
                                        <MapPin className="h-4 w-4 text-gold-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Address</p>
                                        <p className="font-medium text-luxury-black">{vendor.address}</p>
                                    </div>
                                    <Copy className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-xl bg-luxury-cream border border-gold-100">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-100">
                                        <Clock className="h-4 w-4 text-gold-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Business Hours</p>
                                        <p className="font-medium text-luxury-black">10:00 AM - 9:00 PM</p>
                                    </div>
                                </div>
                            </div>

                            {/* Gallery Section */}
                            {vendor.gallery && vendor.gallery.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-serif text-lg font-bold text-luxury-black mb-3 flex items-center gap-2">
                                        <Image className="h-5 w-5 text-gold-600" />
                                        Gallery
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {vendor.gallery.map((image, index) => (
                                            <div
                                                key={index}
                                                className="aspect-square rounded-xl overflow-hidden border border-gold-100 hover:border-gold-300 transition-all cursor-pointer group"
                                            >
                                                <img
                                                    src={image}
                                                    alt={`${vendor.name} gallery ${index + 1}`}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Write Review Button */}
                            <Button
                                variant="outline"
                                className="w-full border-gold-200 hover:border-gold-400 hover:bg-gold-50 text-luxury-black py-4 mb-3"
                                onClick={handleWriteReview}
                            >
                                <Edit3 className="mr-2 h-4 w-4" />
                                Write a Review
                            </Button>

                            {/* Visit Website Button */}
                            {vendor.isPremium && vendor.websiteUuid && (
                                <Button
                                    className="w-full bg-luxury-black hover:bg-gold-600 text-white py-4"
                                    onClick={() => window.location.href = `/store/${vendor.websiteUuid}`}
                                >
                                    <Globe className="mr-2 h-4 w-4" />
                                    Visit Full Website
                                    <ExternalLink className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {/* Bottom Safe Area for Mobile */}
                        <div className="h-safe-area-inset-bottom bg-white" />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
