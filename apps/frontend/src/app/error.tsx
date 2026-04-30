'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-luxury-cream flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-3xl font-serif text-luxury-black mb-4">Something went wrong!</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        An unexpected error has occurred. Our team has been notified. Please try refreshing the page or contact support if the problem persists.
      </p>
      <div className="flex gap-4 justify-center">
        <Button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
          className="bg-gold-500 hover:bg-gold-600 text-luxury-black"
        >
          Try again
        </Button>
        <Button
          onClick={() => window.location.href = '/'}
          variant="outline"
        >
          Go Home
        </Button>
      </div>
    </div>
  );
}
