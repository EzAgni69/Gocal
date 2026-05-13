'use client';
import { useState, useEffect } from 'react';
import { VendorDashboard } from "@/components/VendorDashboard";
import { fetchMyVendor } from "@/services/vendorService";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { UserRole, Vendor } from "@/types";
import { Loader2, Store, AlertTriangle } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export default function VendorPage() {
    const { user, isAuthenticated } = useAppContext();
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Only attempt to fetch when the user is authenticated and synced with Postgres
        // (The presence of user.id confirms the Postgres record exists)
        if (!isAuthenticated || !user?.id) {
            return;
        }

        const loadVendor = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchMyVendor();
                setVendor(data);
            } catch (err: any) {
                console.error('Failed to load vendor:', err);
                setError(err.message || 'Unable to load your vendor profile. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadVendor();
    }, [isAuthenticated, user?.id]);

    // If still authenticating or syncing, the ProtectedRoute will show its own loader.
    // We only handle the loading state for the vendor data itself here.
    
    return (
        <ProtectedRoute allowedRoles={[UserRole.VENDOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
            {loading ? (
                <div className="flex min-h-screen items-center justify-center bg-[#FDFCFB]">
                    <div className="text-center space-y-6">
                        <Loader2 className="w-10 h-10 animate-spin text-gray-400 mx-auto" />
                        <p className="text-sm tracking-widest uppercase text-gray-400 font-bold">Loading your workspace…</p>
                    </div>
                </div>
            ) : error ? (
                <div className="flex min-h-screen items-center justify-center bg-[#FDFCFB]">
                    <div className="text-center space-y-6 max-w-md">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-10 h-10 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-serif">Something went wrong</h2>
                        <p className="text-gray-500 font-light">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-8 py-3 bg-black text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            ) : !vendor ? (
                <div className="flex min-h-screen items-center justify-center bg-[#FDFCFB]">
                    <div className="text-center space-y-6 max-w-md">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                            <Store className="w-10 h-10 text-gray-300" />
                        </div>
                        <h2 className="text-2xl font-serif">No Vendor Profile</h2>
                        <p className="text-gray-500 font-light">
                            You don&apos;t have a vendor profile yet. Request a contact card to get started.
                        </p>
                    </div>
                </div>
            ) : (
                <VendorDashboard vendor={vendor} />
            )}
        </ProtectedRoute>
    );
}

