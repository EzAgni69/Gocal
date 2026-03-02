'use client';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, ExternalLink, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const WishlistDrawer = () => {
    const { wishlist, showWishlistDrawer, setShowWishlistDrawer, removeFromWishlist, requireAuth } = useAppContext();

    const handleSendWishlistToWhatsApp = () => {
        if (!requireAuth('send inquiry to vendor')) return;
        
        const vendorPhone = "919313449825";

        if (wishlist.length === 0) return;

        let message = `Hello! I am interested in the following items from my wishlist:\n\n`;
        
        wishlist.forEach((item, index) => {
            message += `${index + 1}. *${item.name}*\n`;
            message += `   Category: ${item.category}\n`;
            message += `   Price: ₹${item.price.toLocaleString()}\n\n`;
        });
        
        message += `Please let me know about the availability and next steps. Thank you!`;

        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/${vendorPhone}?text=${encodedMessage}`;
        
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <AnimatePresence>
            {showWishlistDrawer && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowWishlistDrawer(false)}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed right-0 top-0 z-[101] h-full w-full max-w-md glass-premium shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gold-100 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-100">
                                    <ShoppingBag className="h-5 w-5 text-gold-600" />
                                </div>
                                <div>
                                    <h2 className="font-serif text-xl font-bold text-luxury-black">Your Wishlist</h2>
                                    <p className="text-sm text-gray-500">{wishlist.length} items saved</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowWishlistDrawer(false)}
                                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                            {wishlist.length > 0 ? (
                                <div className="space-y-4">
                                    <AnimatePresence mode="popLayout">
                                        {wishlist.map((p, index) => (
                                            <motion.div
                                                key={p.id}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="group flex gap-4 rounded-xl bg-white p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                                            >
                                                <div className="relative h-20 w-20 overflow-hidden rounded-lg">
                                                    <img
                                                        src={p.image}
                                                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                                        alt={p.name}
                                                    />
                                                </div>
                                                <div className="flex flex-1 flex-col justify-between py-1">
                                                    <div>
                                                        <h4 className="font-semibold text-luxury-black line-clamp-1">{p.name}</h4>
                                                        <p className="text-sm text-gray-500">{p.category}</p>
                                                    </div>
                                                    <p className="font-bold text-gold-600">₹{p.price.toLocaleString()}</p>
                                                </div>
                                                <button
                                                    onClick={() => removeFromWishlist(p.id)}
                                                    className="self-start p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Remove from wishlist"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center py-16 text-center"
                                >
                                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                                        <ShoppingBag className="h-10 w-10 text-gray-300" />
                                    </div>
                                    <h3 className="font-serif text-lg font-medium text-gray-900">Your wishlist is empty</h3>
                                    <p className="mt-2 text-sm text-gray-500 max-w-[200px]">
                                        Browse our vendors and add items you love to your wishlist.
                                    </p>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer */}
                        {wishlist.length > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 border-t border-gold-100 bg-white/80 backdrop-blur-sm p-6 space-y-3">
                                <Button
                                    onClick={handleSendWishlistToWhatsApp}
                                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4"
                                >
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                    Send Wishlist via WhatsApp
                                </Button>
                                <button
                                    onClick={() => setShowWishlistDrawer(false)}
                                    className="w-full text-sm text-gray-500 hover:text-luxury-black transition-colors py-2"
                                >
                                    Continue Browsing
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
