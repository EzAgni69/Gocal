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
    Image as ImageIcon,
    Share2,
    Store,
    Heart
} from 'lucide-react';
import { Vendor } from '../types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from '../providers/TranslationProvider';
import { formatOpeningHours, getAllOpeningHours } from '../utils/openingHours';
import { ReviewModal } from './ReviewModal';
import { ReviewsList } from './ReviewsList';
import { Review } from '../types';
import { apiClient } from '../services/apiClient';
import Image from 'next/image';


interface ContactCardModalProps {
    vendor: Vendor | null;
    isOpen: boolean;
    onClose: () => void;
}

export const ContactCardModal: React.FC<ContactCardModalProps> = ({ vendor, isOpen, onClose }) => {
    const { 
        language, 
        requireAuth, 
        wishlist, 
        addToWishlist, 
        removeFromWishlist,
        isFavorite,
        addToFavorites,
        removeFromFavorites
    } = useAppContext();
    const { t } = useTranslation();
    const [showReviewModal, setShowReviewModal] = React.useState(false);
    const [showAllHours, setShowAllHours] = React.useState(false);
    const [reviews, setReviews] = React.useState<Review[]>([]);
    const [reviewsLoading, setReviewsLoading] = React.useState(false);

    useEffect(() => {
        if (isOpen) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isOpen]);

    // Fetch reviews whenever the modal opens for a vendor
    useEffect(() => {
        if (!isOpen || !vendor?.id) {
            setReviews([]);
            return;
        }

        // Use pre-loaded reviews if available, otherwise fetch from API
        if (vendor.reviews && vendor.reviews.length > 0) {
            setReviews(vendor.reviews);
            return;
        }

        setReviewsLoading(true);
        apiClient(`/api/reviews/vendor/${vendor.id}`)
            .then((res) => res.json())
            .then((data) => setReviews(data.reviews || []))
            .catch((err) => console.error('Failed to fetch reviews:', err))
            .finally(() => setReviewsLoading(false));
    }, [isOpen, vendor?.id]);

    if (!vendor) return null;

    const theme = vendor.miniWebsiteConfig?.theme || {};
    const primaryColor = theme.primaryColor || '#000000';
    const accentColor = theme.accentColor || '#D4AF37';
    
    // Map font name to generic Tailwind classes or allow the font to inherit
    const getFontFamily = () => {
        if (!theme.fontFamily) return '';
        if (theme.fontFamily.includes('Playfair')) return 'font-serif';
        if (theme.fontFamily.includes('Roboto') || theme.fontFamily.includes('Inter') || theme.fontFamily.includes('Outfit')) return 'font-sans';
        return '';
    };
    const fontClass = getFontFamily();

    const handleCall = () => {
        window.location.href = `tel:${vendor.phone}`;
    };

    const handleEmail = () => {
        if (!requireAuth('email this vendor')) return;
        window.location.href = `mailto:${vendor.email}`;
    };

    const handleWhatsApp = () => {
        if (!requireAuth('message this vendor')) return;
        const message = encodeURIComponent(`Hi, I found your store on Gocal.co and would like to inquire about your products.`);
        const phoneNumber = vendor.phone.replace(/\D/g, ''); // Use dynamic phone number and strip non-digits
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    };

    const handleDirections = () => {
        if (!requireAuth('get directions')) return;
        const address = encodeURIComponent(vendor.address);
        window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    };

    const handleShare = async () => {
        const shareData = {
            title: vendor.name,
            url: `${window.location.origin}/?vendor=${vendor.id}`,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            // Fallback for browsers that do not support Web Share API
            copyToClipboard(shareData.url, 'Link');
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        // In a real app, show a toast notification
        alert(`${label} copied to clipboard!`);
    };

    const isFav = vendor ? isFavorite(vendor.id) : false;
    const handleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!vendor) return;
        if (!requireAuth('favorite this vendor')) return;
        
        if (isFav) {
            removeFromFavorites(vendor.id);
        } else {
            addToFavorites(vendor as any);
        }
    };

    const handleWriteReview = () => {
        if (!requireAuth('write a review')) return;
        setShowReviewModal(true);
    };

    const handleSubmitReview = async (rating: number, comment: string) => {
        const response = await apiClient('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                vendorId: vendor!.id,
                rating,
                comment,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to submit review');
        }

        const data = await response.json();
        setReviews((prev) => [data.review, ...prev]);
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
                        className={`fixed inset-x-0 bottom-0 z-[101] max-h-[90vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl md:inset-x-auto md:left-1/2 md:bottom-auto md:top-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl ${fontClass}`}
                        style={{
                            '--theme-primary': primaryColor,
                            '--theme-accent': accentColor,
                        } as React.CSSProperties}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Cover Image Header */}
                        <div className="relative h-48 overflow-hidden">
                            <Image
                                src={vendor.coverImage}
                                alt={vendor.name}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                            {/* Share Button */}
                            <button
                                onClick={handleShare}
                                className="absolute right-28 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors"
                                title="Share Vendor"
                            >
                                <Share2 className="h-4 w-4" />
                            </button>

                            {/* Favorite Button */}
                            <button
                                onClick={handleFavorite}
                                className="absolute right-16 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors"
                                title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                            >
                                <Heart className={`h-4 w-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                            </button>

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
                                    {vendor.isOpen ? t('Open Now') : t('Closed')}
                                </Badge>
                                {vendor.verified && (
                                    <Badge variant="premium" className="flex items-center gap-1 backdrop-blur-md">
                                        <CheckCircle className="h-3 w-3" /> {t('Verified')}
                                    </Badge>
                                )}
                            </div>

                            {/* Vendor Info Overlay */}
                            <div className="absolute bottom-4 left-4 right-4 text-white">
                                <h2 className="text-2xl font-serif font-bold mb-1">{t(vendor.name)}</h2>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="flex items-center gap-1">
                                        <Star className="h-4 w-4 fill-current" style={{ color: accentColor }} />
                                        <span className="font-bold">{vendor.rating}</span>
                                        <span className="opacity-75">({vendor.reviewCount} {t('reviews')})</span>
                                    </span>
                                    <span className="opacity-75">•</span>
                                    <span className="opacity-90">{t(vendor.category)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="max-h-[calc(90vh-12rem)] overflow-y-auto overscroll-contain p-6">
                            {/* Description */}
                            <p className="text-gray-600 mb-6 leading-relaxed">{t(vendor.description)}</p>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-4 gap-3 mb-6">
                                <button
                                    onClick={handleCall}
                                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors group"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white group-hover:scale-110 transition-transform">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-semibold text-green-700">{t('Call')}</span>
                                </button>

                                <button
                                    onClick={handleWhatsApp}
                                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors group"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white group-hover:scale-110 transition-transform">
                                        <MessageCircle className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-semibold text-emerald-700">{t('WhatsApp')}</span>
                                </button>

                                <button
                                    onClick={handleEmail}
                                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white group-hover:scale-110 transition-transform">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-semibold text-blue-700">{t('Email')}</span>
                                </button>

                                <button
                                    onClick={handleDirections}
                                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors group"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white group-hover:scale-110 transition-transform">
                                        <Navigation className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-semibold text-orange-700">{t('Directions')}</span>
                                </button>
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-3 mb-6">
                                <h3 className="font-serif text-lg font-bold text-luxury-black mb-3">{t('Contact Details')}</h3>

                                <div
                                    className="flex items-center gap-3 p-3 rounded-xl bg-luxury-cream border cursor-pointer transition-colors group"
                                    style={{ borderColor: accentColor + '40' }}
                                    onClick={() => copyToClipboard(vendor.phone, 'Phone number')}
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: accentColor + '20' }}>
                                        <Phone className="h-4 w-4" style={{ color: accentColor }} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">{t('Phone')}</p>
                                        <p className="font-medium text-luxury-black">{vendor.phone}</p>
                                    </div>
                                    <Copy className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                <div
                                    className="flex items-center gap-3 p-3 rounded-xl bg-luxury-cream border cursor-pointer transition-colors group"
                                    style={{ borderColor: accentColor + '40' }}
                                    onClick={() => copyToClipboard(vendor.email, 'Email')}
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: accentColor + '20' }}>
                                        <Mail className="h-4 w-4" style={{ color: accentColor }} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">{t('Email')}</p>
                                        <p className="font-medium text-luxury-black">{vendor.email}</p>
                                    </div>
                                    <Copy className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                <div
                                    className="flex items-center gap-3 p-3 rounded-xl bg-luxury-cream border cursor-pointer transition-colors group"
                                    style={{ borderColor: accentColor + '40' }}
                                    onClick={() => copyToClipboard(vendor.address, 'Address')}
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: accentColor + '20' }}>
                                        <MapPin className="h-4 w-4" style={{ color: accentColor }} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">{t('Address')}</p>
                                        <p className="font-medium text-luxury-black">{t(vendor.address)}</p>
                                    </div>
                                    <Copy className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-xl bg-luxury-cream border border-gold-100">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-100">
                                        <Clock className="h-4 w-4 text-gold-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">{t('Business Hours')}</p>
                                        <p className="font-medium text-luxury-black">{formatOpeningHours(vendor.openingHours)}</p>
                                    </div>
                                    {vendor.openingHours && (
                                        <button
                                            onClick={() => setShowAllHours(!showAllHours)}
                                            className="text-xs text-gold-600 hover:text-gold-700 font-medium"
                                        >
                                            {showAllHours ? t('Hide') : t('View All')}
                                        </button>
                                    )}
                                </div>

                                {/* All Hours Dropdown */}
                                {showAllHours && vendor.openingHours && (
                                    <div className="p-4 rounded-xl bg-white border border-gray-200">
                                        <h4 className="text-sm font-semibold text-luxury-black mb-3">{t('Weekly Hours')}</h4>
                                        <div className="space-y-2">
                                            {getAllOpeningHours(vendor.openingHours).map(({ day, hours, isToday }) => (
                                                <div
                                                    key={day}
                                                    className={`flex justify-between text-sm ${
                                                        isToday ? 'font-semibold text-gold-600' : 'text-gray-600'
                                                    }`}
                                                >
                                                    <span>{t(day)}</span>
                                                    <span>{t(hours)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Scan to Pay — QR Code */}
                            {vendor.miniWebsiteConfig?.qrCodeUrl && (
                                <div className="mb-6">
                                    <h3 className="font-serif text-lg font-bold text-luxury-black mb-3">{t('Scan to Pay')}</h3>
                                    <div className="flex justify-center p-4 bg-luxury-cream rounded-xl border" style={{ borderColor: accentColor + '40' }}>
                                        <Image
                                            src={vendor.miniWebsiteConfig.qrCodeUrl}
                                            alt={t("Payment QR Code")}
                                            width={200}
                                            height={200}
                                            className="rounded-lg"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Featured Products Section */}
                            {vendor.products && vendor.products.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-serif text-lg font-bold text-luxury-black mb-4 flex items-center justify-between">
                                        <span>{t('Featured Products')}</span>
                                        <Badge variant="secondary" className="text-[10px]">
                                            {vendor.products.length} {t('Items')}
                                        </Badge>
                                    </h3>
                                    <div className="space-y-4">
                                        {vendor.products.map((product) => (
                                            <div key={product.id} className="flex gap-4 p-3 rounded-2xl bg-gray-50 border border-gray-100 group transition-all hover:bg-white hover:shadow-md hover:border-gold-200">
                                                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100">
                                                    <Image
                                                        src={product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'}
                                                        alt={t(product.name)}
                                                        fill
                                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                </div>
                                                <div className="flex-1 flex flex-col min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className="font-bold text-luxury-black text-sm truncate pr-2">{t(product.name)}</h4>
                                                        <span className="font-bold text-gold-600 text-sm whitespace-nowrap">₹{product.price}</span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-500 line-clamp-2 mb-2 leading-relaxed">
                                                        {t(product.description || '')}
                                                    </p>
                                                    <div className="mt-auto flex justify-between items-center">
                                                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{t(product.category)}</span>
                                                        <button 
                                                            onClick={(e) => {
                                                                 e.stopPropagation();
                                                                 const isInWishlist = wishlist.some((p: any) => p.id === product.id);
                                                                 if (isInWishlist) {
                                                                     removeFromWishlist(product.id);
                                                                 } else {
                                                                     addToWishlist({
                                                                         ...product,
                                                                         vendorId: vendor.id,
                                                                         vendorName: vendor.name,
                                                                         vendorPhone: vendor.phone
                                                                     });
                                                                 }
                                                            }}
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                                                                wishlist.some(p => p.id === product.id)
                                                                    ? 'bg-red-50 text-red-500 border border-red-100'
                                                                    : 'bg-white text-luxury-black border border-gray-200 hover:border-gold-300 hover:bg-gold-50'
                                                            }`}
                                                        >
                                                            <Heart className={`h-3 w-3 ${wishlist.some(p => p.id === product.id) ? 'fill-current' : ''}`} />
                                                            {wishlist.some(p => p.id === product.id) ? t('In Wishlist') : t('Add to Wishlist')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Gallery Section */}
                            {vendor.galleryImages && vendor.galleryImages.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-serif text-lg font-bold text-luxury-black mb-3 flex items-center gap-2">
                                        <ImageIcon className="h-5 w-5" style={{ color: accentColor }} />
                                        {t('Gallery')}
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {vendor.galleryImages.map((img, index) => (
                                            <div
                                                key={index}
                                                className="relative aspect-square rounded-xl overflow-hidden border border-gold-100 hover:border-gold-300 transition-all cursor-pointer group"
                                            >
                                                <Image
                                                    src={img.imageUrl}
                                                    alt={`${t(vendor.name)} gallery ${index + 1}`}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Reviews Section */}
                            <div className="mb-6">
                                <h3 className="font-serif text-lg font-bold text-luxury-black mb-4 flex items-center justify-between">
                                    <span>{t('Reviews')} ({reviews.length})</span>
                                </h3>
                                {reviewsLoading ? (
                                    <div className="text-center py-6 text-gray-400 text-sm">{t('Loading reviews...')}</div>
                                ) : (
                                    <ReviewsList reviews={reviews} />
                                )}
                            </div>

                            {/* Write Review Button */}
                            <Button
                                variant="outline"
                                className="w-full border-gold-200 hover:border-gold-400 hover:bg-gold-50 text-luxury-black py-4 mb-3"
                                onClick={handleWriteReview}
                            >
                                <Edit3 className="mr-2 h-4 w-4" />
                                {t('Write a Review')}
                            </Button>

                            {/* Website Links */}
                            <div className="flex flex-col gap-3">
                                {vendor.planType === 'card_website' && vendor.websiteUrl && (
                                    <Button
                                        className="w-full text-white py-4 hover:opacity-90"
                                        style={{ backgroundColor: primaryColor }}
                                        onClick={() => window.open(vendor.websiteUrl, '_blank')}
                                    >
                                        <Globe className="mr-2 h-4 w-4" />
                                        {t('Visit Website')}
                                        <ExternalLink className="ml-2 h-4 w-4" />
                                    </Button>
                                )}

                                {vendor.planType === 'card_website' && vendor.websiteUuid && (
                                    <Button
                                        variant={vendor.websiteUrl ? "outline" : "primary"}
                                        className={`w-full py-4`}
                                        style={!vendor.websiteUrl ? { backgroundColor: primaryColor, color: 'white' } : { borderColor: accentColor, color: primaryColor }}
                                        onClick={() => window.location.href = `/store/${vendor.websiteUuid}`}
                                    >
                                        <Store className="mr-2 h-4 w-4" />
                                        {t('Visit Website')}
                                        <ExternalLink className="ml-2 h-4 w-4" />
                                    </Button>
                                )}

                                {(vendor.planType !== 'card_website' || (!vendor.websiteUrl && !vendor.websiteUuid)) && (
                                    <Button
                                        disabled
                                        variant="ghost"
                                        className="w-full bg-gray-50 border-gray-200 cursor-not-allowed text-gray-400 py-4"
                                    >
                                        <Store className="mr-2 h-4 w-4" />
                                        {t('Listing Only')}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Bottom Safe Area for Mobile */}
                        <div className="h-safe-area-inset-bottom bg-white" />
                    </motion.div>

                    {/* Review Modal */}
                    <ReviewModal
                        isOpen={showReviewModal}
                        onClose={() => setShowReviewModal(false)}
                        onSubmit={handleSubmitReview}
                        vendorName={vendor.name}
                    />
                </>
            )}
        </AnimatePresence>
    );
};
