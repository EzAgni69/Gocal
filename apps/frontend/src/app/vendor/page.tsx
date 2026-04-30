'use client';
import { VendorDashboard } from "@/components/VendorDashboard";
import { MOCK_VENDORS, MOCK_ANALYTICS } from "@/constants";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { UserRole } from "@/types";

export default function VendorPage() {
    // Demo: Use first vendor
    const vendor = MOCK_VENDORS[3];

    return (
        <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
            <VendorDashboard vendor={vendor} analyticsData={MOCK_ANALYTICS} />
        </ProtectedRoute>
    );
}
