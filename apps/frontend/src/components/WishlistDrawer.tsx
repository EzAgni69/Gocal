'use client';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, ExternalLink, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Image from 'next/image';

export const WishlistDrawer = () => {
    const { wishlist, showWishlistDrawer, setShowWishlistDrawer, removeFromWishlist, requireAuth } = useAppContext();

    const groupedWishlist = wishlist.reduce((acc, item) => {
        const key = item.vendorId || 'unknown';
        
        if (!acc[key]) {
            acc[key] = {
                vendorName: item.vendorName || 'General Items',
                vendorPhone: item.vendorPhone || '',
                items: []
            };
        }
        acc[key].items.push(item);
        return acc;
    }, {} as Record<string, { vendorName: string; vendorPhone: string; items: typeof wishlist }>);

    const handleSendWishlistToWhatsApp = (vendorPhone: string, items: typeof wishlist) => {
        if (!requireAuth('send inquiry to vendor')) return;

        if (items.length === 0) return;

        let message = `Hello! I am interested in the following items from my wishlist:\n\n`;
        
        items.forEach((item, index) => {
            message += `${index + 1}. *${item.name}*\n`;
            message += `   Category: ${item.category}\n`;
            message += `   Price: ₹${item.price.toLocaleString()}\n\n`;
        });
        
        message += `Please let me know about the availability and next steps. Thank you!`;

        const encodedMessage = encodeURIComponent(message);
        const phone = (vendorPhone || "919313449825").replace(/\D/g, '');
        const url = `https://wa.me/${phone}?text=${encodedMessage}`;
        
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
                        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                        className="fixed right-0 top-0 z-[101] h-full w-full max-w-md bg-white shadow-2xl overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 bg-white/90 backdrop-blur-md px-6 py-6 sticky top-0 z-20">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-luxury-cream border border-gold-100">
                                    <ShoppingBag className="h-5 w-5 text-gold-600" />
                                </div>
                                <div>
                                    <h2 className="font-serif text-2xl font-bold text-luxury-black tracking-tight">Your Wishlist</h2>
                                    <p className="text-xs tracking-widest uppercase text-gray-500 font-semibold mt-1">{wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowWishlistDrawer(false)}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 hover:rotate-90 transition-all duration-300"
                            >
                                <X className="h-4 w-4 text-gray-600" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto bg-[#FAFAFA]" style={{ maxHeight: 'calc(100vh - 100px)' }}>
                            {wishlist.length > 0 ? (
                                <div className="p-6 space-y-10 pb-32">
                                    {Object.entries(groupedWishlist).map(([vendorId, { vendorName, vendorPhone, items }]) => (
                                        <div key={vendorId} className="relative rounded-2xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
                                            {/* Vendor Header inside Card */}
                                            <div className="bg-luxury-black px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 decoration-white">
                                                <div>
                                                    <p className="text-[10px] tracking-[0.3em] text-gray-400 uppercase font-bold mb-1">Maison</p>
                                                    <h3 className="font-serif text-xl font-bold text-white tracking-wide">{vendorName}</h3>
                                                </div>
                                                <Badge variant="premium" className="self-start sm:self-auto bg-white/10 text-white border-white/20 whitespace-nowrap">
                                                    {items.length} {items.length === 1 ? 'Piece' : 'Pieces'}
                                                </Badge>
                                            </div>

                                            {/* Items List */}
                                            <div className="p-5 space-y-5">
                                                <AnimatePresence mode="popLayout">
                                                    {items.map((p, index) => (
                                                        <motion.div
                                                            key={p.id}
                                                            layout
                                                            initial={{ opacity: 0, y: 15 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.9, height: 0 }}
                                                            transition={{ delay: index * 0.05 }}
                                                            className="group flex gap-5 items-center relative"
                                                        >
                                                            {/* Product Image */}
                                                            <div className="relative h-24 w-20 overflow-hidden bg-gray-50 shrink-0 shadow-sm border border-gray-100 rounded-sm">
                                                                <Image
                                                                    src={p.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'}
                                                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                                                    alt={p.name || 'Wishlist item'}
                                                                    fill
                                                                />
                                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
                                                            </div>
                                                            
                                                            {/* Product Info */}
                                                            <div className="flex flex-col flex-1 min-w-0 pr-8">
                                                                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1 truncate">{p.category}</p>
                                                                <h4 className="font-serif text-lg text-luxury-black leading-tight mb-2 truncate group-hover:text-gold-600 transition-colors">{p.name}</h4>
                                                                <p className="font-medium tracking-wide text-gray-900">₹{p.price.toLocaleString()}</p>
                                                            </div>

                                                            {/* Remove Button */}
                                                            <button
                                                                onClick={() => removeFromWishlist(p.id)}
                                                                className="absolute right-0 top-1 p-2 text-gray-300 hover:text-red-500 transition-colors"
                                                                title="Remove Piece"
                                                            >
                                                                <X className="h-5 w-5" />
                                                            </button>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>

                                            {/* Vendor Action */}
                                            <div className="p-5 border-t border-gray-50 bg-gray-50/50">
                                                <Button
                                                    onClick={() => handleSendWishlistToWhatsApp(vendorPhone, items)}
                                                    className="w-full bg-white hover:bg-gray-50 text-luxury-black border border-gray-200 shadow-sm py-6 rounded-none group transition-all"
                                                >
                                                    <MessageCircle className="mr-3 h-5 w-5 text-[#25D366] group-hover:scale-110 transition-transform" />
                                                    <span className="text-xs uppercase tracking-widest font-bold">Inquire Selection</span>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center h-full px-6 text-center"
                                >
                                    <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-luxury-cream border border-gold-100">
                                        <ShoppingBag className="h-10 w-10 text-gold-300" />
                                    </div>
                                    <h3 className="font-serif text-2xl text-luxury-black mb-3">Empty Collection</h3>
                                    <p className="text-sm text-gray-500 max-w-[260px] leading-relaxed">
                                        Your curated selection is currently empty. Browse our exclusive boutiques to discover extraordinary pieces.
                                    </p>
                                    <Button 
                                        onClick={() => setShowWishlistDrawer(false)}
                                        className="mt-8 bg-black text-white hover:bg-gray-800 rounded-none px-8 py-6 text-xs uppercase tracking-widest font-semibold"
                                    >
                                        Discover Collections
                                    </Button>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer (Global Action) */}
                        {wishlist.length > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white/95 backdrop-blur-xl p-4 sm:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                                <button
                                    onClick={() => setShowWishlistDrawer(false)}
                                    className="w-full text-xs tracking-[0.2em] font-bold text-gray-400 hover:text-black uppercase transition-colors py-3"
                                >
                                    Continue Exploring
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
