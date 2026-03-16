'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { UserRole } from '@/types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, currentRole, setShowAuthModal, setLoginRequiredAction, setShowLoginRequiredModal } = useAppContext();

  useEffect(() => {
    // If we've confirmed the user is not authenticated after initial load
    if (user === null && !isAuthenticated) {
        // Quick check if Firebase is still initializing by looking for token
        const token = localStorage.getItem('firebase_token');
        if (!token) {
            setLoginRequiredAction('access this page');
            setShowLoginRequiredModal(true);
            router.push('/');
        }
    } else if (isAuthenticated && currentRole) {
        if (!allowedRoles.includes(currentRole)) {
            // User is authenticated but doesn't have the right role
            router.push('/'); 
        }
    }
  }, [isAuthenticated, user, currentRole, allowedRoles, router, setLoginRequiredAction, setShowLoginRequiredModal]);

  // Loading state while checking auth
  if (user === null || currentRole === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-luxury-cream">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    );
  }

  // Double check before rendering children
  if (isAuthenticated && allowedRoles.includes(currentRole)) {
      return <>{children}</>;
  }

  return null;
}
