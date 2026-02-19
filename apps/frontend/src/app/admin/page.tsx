'use client';
import { AdminDashboard } from "@/components/AdminDashboard";
import { MOCK_REPORTS } from "@/constants";

export default function AdminPage() {
    return (
        <AdminDashboard reports={MOCK_REPORTS} />
    );
}
