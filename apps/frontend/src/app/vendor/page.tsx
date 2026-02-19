'use client';
import { VendorDashboard } from "@/components/VendorDashboard";
import { MOCK_VENDORS, MOCK_ANALYTICS } from "@/constants";

export default function VendorPage() {
    // Demo: Use first vendor
    const vendor = MOCK_VENDORS[3];

    return (
        <VendorDashboard vendor={vendor} analyticsData={MOCK_ANALYTICS} />
    );
}
