'use client';
import { AdminDashboard } from "@/components/AdminDashboard";
import { MOCK_REPORTS } from "@/constants";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { UserRole } from "@/types";

export default function AdminPage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
            <AdminDashboard reports={MOCK_REPORTS} />
        </ProtectedRoute>
    );
}
