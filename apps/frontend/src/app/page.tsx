'use client';
import { Suspense, useEffect, useState } from 'react';
import { Directory } from "@/components/Directory";
import { Vendor } from "@/types";
import { fetchHomeVendors } from "@/services/vendorService";

export default function Home() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchHomeVendors();
        setVendors(data);
      } catch (err: any) {
        console.error('Failed to load vendors:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-luxury-cream flex items-center justify-center">
      <div className="animate-pulse text-gold-600 font-serif text-xl">Loading Excellence...</div>
    </div>;
  }

  if (error) {
    return <div className="min-h-screen bg-luxury-cream flex items-center justify-center">
      <div className="text-red-500 font-medium">Error: {error}</div>
    </div>;
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-luxury-cream">Loading...</div>}>
      <Directory vendors={vendors} />
    </Suspense>
  );
}
