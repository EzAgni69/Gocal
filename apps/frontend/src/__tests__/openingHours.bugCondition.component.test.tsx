/**
 * Bug Condition Exploration Tests — Bug B: Invalid Key Path in MiniWebsite
 *
 * Property 1: Bug Condition (Component)
 *
 * CRITICAL: These tests MUST FAIL on unfixed code — failure confirms Bug B exists.
 * DO NOT attempt to fix the test or the code when it fails.
 *
 * Validates: Requirements 1.4, 2.4
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MiniWebsite } from '../components/MiniWebsite';
import { Vendor } from '../types';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../context/AppContext', () => ({
  useAppContext: jest.fn(() => ({
    requireAuth: jest.fn(() => true),
    user: null,
  })),
}));

jest.mock('../providers/TranslationProvider', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
  })),
}));

jest.mock('../services/apiClient', () => ({
  apiClient: jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ reviews: [] }) })),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    img: ({ children, ...props }: any) => <img {...props}>{children}</img>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// ─── Test Vendor ──────────────────────────────────────────────────────────────

/**
 * A vendor with valid abbreviated-key opening hours (Mon–Sun).
 * Bug B: MiniWebsite reads vendor.openingHours?.general?.open which is always undefined,
 * so it falls back to the hardcoded string regardless of this data.
 */
const mockVendorWithAbbreviatedHours: Vendor = {
  id: 'vendor-1',
  name: 'Test Boutique',
  description: 'A test boutique',
  shortDescription: 'Test boutique',
  city: 'Test City',
  category: 'Retail',
  address: '123 Test Street',
  phone: '+91 9876543210',
  email: 'test@boutique.com',
  coverImage: 'https://example.com/cover.jpg',
  isOpen: true,
  rating: 4.5,
  reviewCount: 10,
  isPremium: false,
  planType: 'card_website',
  openingHours: {
    Mon: { open: '09:00', close: '21:00' },
    Tue: { open: '09:00', close: '21:00' },
    Wed: { open: '09:00', close: '21:00' },
    Thu: { open: '09:00', close: '21:00' },
    Fri: { open: '09:00', close: '21:00' },
    Sat: { closed: true },
    Sun: { closed: true },
  },
  products: [],
  galleryImages: [],
  reviews: [],
  offers: [],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Bug B — invalid key path: MiniWebsite "Opening Hours" section', () => {
  /**
   * Concrete failing case:
   * MiniWebsite with a vendor that has valid abbreviated-key hours should display
   * those actual hours, NOT the hardcoded fallback string.
   *
   * On unfixed code: displays 'Mon - Sat: 10:00 AM - 9:00 PM' (hardcoded fallback)
   * On fixed code:   displays actual vendor hours via formatOpeningHours/getAllOpeningHours
   *
   * Validates: Requirements 1.4, 2.4
   */
  it('does NOT display the hardcoded fallback string when vendor has valid opening hours', () => {
    render(
      <MiniWebsite
        vendor={mockVendorWithAbbreviatedHours}
        language="en"
        onBack={() => {}}
        addToWishlist={() => {}}
        wishlist={[]}
      />
    );

    // On unfixed code: this hardcoded string IS present (bug confirmed)
    // On fixed code:   this hardcoded string should NOT be present
    expect(screen.queryByText(/Mon - Sat: 10:00 AM - 9:00 PM/)).not.toBeInTheDocument();
  });

  it('displays actual hours from vendor data in the Boutique Hours section', () => {
    render(
      <MiniWebsite
        vendor={mockVendorWithAbbreviatedHours}
        language="en"
        onBack={() => {}}
        addToWishlist={() => {}}
        wishlist={[]}
      />
    );

    // On unfixed code: the hardcoded fallback is shown, not actual hours
    // On fixed code:   actual hours like '9:00 AM - 9:00 PM' should appear
    // The vendor has Mon-Fri: 09:00-21:00, so we expect to see formatted hours
    // At minimum, the "Opening Hours" label should be present
    expect(screen.getByText('Opening Hours')).toBeInTheDocument();

    // The actual hours from vendor data should appear somewhere in the rendered output
    // Mon-Fri are open 09:00-21:00 → '9:00 AM - 9:00 PM'
    // Sat and Sun are closed → 'Closed'
    // On unfixed code: none of these appear (only the hardcoded fallback)
    // On fixed code:   at least one of these should appear
    const hasActualHours =
      screen.queryAllByText(/9:00 AM - 9:00 PM/).length > 0 ||
      screen.queryAllByText(/Mon:/).length > 0 ||
      screen.queryAllByText(/Tue:/).length > 0;

    expect(hasActualHours).toBe(true);
  });
});
