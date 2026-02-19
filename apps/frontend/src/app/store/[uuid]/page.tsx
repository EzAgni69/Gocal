'use client';
import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MiniWebsite } from "@/components/MiniWebsite";
import { useAppContext } from "@/context/AppContext";
import { MOCK_VENDORS } from "@/constants";

export default function StorePage({ params }: { params: Promise<{ uuid: string }> }) {
    // Unwrap params using React.use()
    const { uuid } = use(params);

    const router = useRouter();
    const { language, addToWishlist, wishlist } = useAppContext();

    const vendor = MOCK_VENDORS.find(v => v.websiteUuid === uuid);

    if (!vendor) {
        return <div className="p-10 text-center">Store not found</div>;
    }

    return (
        <MiniWebsite
            vendor={vendor}
            language={language}
            onBack={() => router.push('/')}
            addToWishlist={addToWishlist}
            wishlist={wishlist}
        />
    );
}
