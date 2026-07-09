'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MiniWebsite } from '@/components/MiniWebsite';
import { useAppContext } from '@/context/AppContext';
import { fetchVendorByUuid } from '@/services/vendorService';
import { Vendor } from '@/types';

export default function GeoVendorPage({
  params,
}: {
  params: Promise<{ geoCode: string; slug: string }>;
}) {
  const { geoCode, slug } = use(params);
  const router = useRouter();
  const { language, addToWishlist, wishlist } = useAppContext();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine whether this route is Mini website (/in390/slug) or Contact card (/in390001/slug)
  const rawCode = (geoCode || '').replace(/^in/i, '').replace(/\D/g, '');
  const isContactCardRoute = rawCode.length >= 5; // e.g. 6-digit pincode like 390001

  useEffect(() => {
    async function loadStore() {
      try {
        const data = await fetchVendorByUuid(slug);
        setVendor(data);
      } catch (err) {
        console.error('Error loading store by slug:', err);
        setError('Store not found or connection error');
      } finally {
        setLoading(false);
      }
    }
    loadStore();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-cream flex flex-col items-center justify-center p-10">
        <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-serif italic">Entering Maison...</p>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-luxury-cream flex flex-col items-center justify-center p-10 text-center">
        <h1 className="text-3xl font-serif text-luxury-black mb-4">
          Store Not Found
        </h1>
        <p className="text-gray-500 mb-8 max-w-md">
          The store or contact card you are looking for might have moved or the link is incorrect.
        </p>
        <button
          onClick={() => router.push('/')}
          className="bg-luxury-black text-white px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-gold-600 transition-colors"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <MiniWebsite
      vendor={vendor}
      language={language}
      onBack={() => router.push('/')}
      addToWishlist={addToWishlist}
      wishlist={wishlist}
      initialContactCardOpen={isContactCardRoute}
    />
  );
}
