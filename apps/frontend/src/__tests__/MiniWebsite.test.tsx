/**
 * Tests for MiniWebsite component — Info Section rendering
 *
 * Task 7.3: Property test for Mini Website rendering (Property 8)
 * Task 7.4: Unit tests for each fallback path
 *
 * // Feature: vendor-contact-card-customization, Property 8: Mini Website rendering — correct value or fallback
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
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
  apiClient: jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ reviews: [] }) })
  ),
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

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal valid Vendor with optional overrides */
function buildVendor(overrides: Partial<Vendor> = {}): Vendor {
  return {
    id: 'vendor-test',
    name: 'Test Vendor Name',
    description: 'Test full description',
    shortDescription: 'Test short description',
    city: 'Test City',
    category: 'Retail',
    address: '123 Test Street',
    phone: '+91 9876543210',
    email: 'test@vendor.com',
    coverImage: 'https://example.com/cover.jpg',
    isOpen: true,
    rating: 4.5,
    reviewCount: 10,
    isPremium: false,
    planType: 'card_website',
    products: [],
    galleryImages: [],
    reviews: [],
    offers: [],
    ...overrides,
  };
}

/** Render MiniWebsite with a vendor and return the container */
function renderMiniWebsite(vendor: Vendor) {
  return render(
    <MiniWebsite
      vendor={vendor}
      language="en"
      onBack={() => {}}
      addToWishlist={() => {}}
      wishlist={[]}
    />
  );
}

// ─── Property Test (Task 7.3) ─────────────────────────────────────────────────

// Feature: vendor-contact-card-customization, Property 8: Mini Website rendering — correct value or fallback
describe('Property 8: Mini Website rendering — correct value or fallback', () => {
  it('businessLabel: shows miniWebsiteConfig.businessLabel when present, else vendor.name', () => {
    fc.assert(
      fc.property(
        // businessLabel: either a non-empty string or undefined
        fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), { nil: undefined }),
        // vendor.name: always a non-empty string
        fc.string({ minLength: 1, maxLength: 80 }).filter(s => s.trim().length > 0),
        (configBusinessLabel, vendorName) => {
          const vendor = buildVendor({
            name: vendorName,
            miniWebsiteConfig: configBusinessLabel !== undefined
              ? { businessLabel: configBusinessLabel }
              : undefined,
          });

          const { container, unmount } = renderMiniWebsite(vendor);

          const expectedLabel = configBusinessLabel?.trim() || vendorName;
          expect(container).toHaveTextContent(expectedLabel);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('no hardcoded strings: "The Maison" and "Heritage & Elegance" never appear', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 80 }).filter(s => s.trim().length > 0),
          description: fc.string({ minLength: 0, maxLength: 200 }),
          shortDescription: fc.string({ minLength: 0, maxLength: 150 }),
          businessLabel: fc.option(
            fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            { nil: undefined }
          ),
          tagline: fc.option(
            fc.string({ minLength: 1, maxLength: 150 }).filter(s => s.trim().length > 0),
            { nil: undefined }
          ),
          aboutDescription: fc.option(
            fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
            { nil: undefined }
          ),
        }),
        (data) => {
          const vendor = buildVendor({
            name: data.name,
            description: data.description,
            shortDescription: data.shortDescription,
            miniWebsiteConfig:
              data.businessLabel !== undefined ||
              data.tagline !== undefined ||
              data.aboutDescription !== undefined
                ? {
                    businessLabel: data.businessLabel,
                    tagline: data.tagline,
                    aboutDescription: data.aboutDescription,
                  }
                : undefined,
          });

          const { container, unmount } = renderMiniWebsite(vendor);

          expect(container).not.toHaveTextContent('The Maison');
          expect(container).not.toHaveTextContent('Heritage & Elegance');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Unit Tests (Task 7.4) ────────────────────────────────────────────────────

describe('MiniWebsite — businessLabel fallback', () => {
  it('renders vendor.name when miniWebsiteConfig.businessLabel is absent', () => {
    const vendor = buildVendor({
      name: 'Acme Boutique',
      miniWebsiteConfig: undefined,
    });
    const { container } = renderMiniWebsite(vendor);
    // vendor.name appears in both the header and the info section businessLabel
    expect(container).toHaveTextContent('Acme Boutique');
    // The info section businessLabel <p> should contain vendor.name
    expect(screen.getAllByText('Acme Boutique').length).toBeGreaterThanOrEqual(1);
  });

  it('renders vendor.name when miniWebsiteConfig.businessLabel is an empty string', () => {
    const vendor = buildVendor({
      name: 'Acme Boutique',
      miniWebsiteConfig: { businessLabel: '' },
    });
    const { container } = renderMiniWebsite(vendor);
    expect(container).toHaveTextContent('Acme Boutique');
    expect(screen.getAllByText('Acme Boutique').length).toBeGreaterThanOrEqual(1);
  });

  it('renders vendor.name when miniWebsiteConfig.businessLabel is whitespace only', () => {
    const vendor = buildVendor({
      name: 'Acme Boutique',
      miniWebsiteConfig: { businessLabel: '   ' },
    });
    const { container } = renderMiniWebsite(vendor);
    expect(container).toHaveTextContent('Acme Boutique');
    expect(screen.getAllByText('Acme Boutique').length).toBeGreaterThanOrEqual(1);
  });

  it('renders miniWebsiteConfig.businessLabel when it is a non-empty string', () => {
    const vendor = buildVendor({
      name: 'Acme Boutique',
      miniWebsiteConfig: { businessLabel: 'The Grand Emporium' },
    });
    const { container } = renderMiniWebsite(vendor);
    expect(container).toHaveTextContent('The Grand Emporium');
  });
});

describe('MiniWebsite — tagline fallback', () => {
  it('renders vendor.shortDescription when tagline is absent and shortDescription is present', () => {
    const vendor = buildVendor({
      shortDescription: 'Quality craftsmanship since 1990',
      miniWebsiteConfig: undefined,
    });
    const { container } = renderMiniWebsite(vendor);
    expect(container).toHaveTextContent('Quality craftsmanship since 1990');
  });

  it('renders vendor.shortDescription when tagline is empty and shortDescription is present', () => {
    const vendor = buildVendor({
      shortDescription: 'Quality craftsmanship since 1990',
      miniWebsiteConfig: { tagline: '' },
    });
    const { container } = renderMiniWebsite(vendor);
    expect(container).toHaveTextContent('Quality craftsmanship since 1990');
  });

  it('omits the tagline element when both tagline and shortDescription are absent', () => {
    const vendor = buildVendor({
      shortDescription: '',
      miniWebsiteConfig: { tagline: '' },
    });
    const { container } = renderMiniWebsite(vendor);
    // The tagline is rendered in an <h3> with font-serif class; it should not be present
    const h3Elements = container.querySelectorAll('h3');
    // None of the h3 elements should contain tagline-like content
    // (the component only renders the tagline h3 when tagline is truthy)
    const taglineH3 = Array.from(h3Elements).find(
      (el) => el.classList.contains('font-serif') && el.textContent?.trim() !== ''
    );
    expect(taglineH3).toBeUndefined();
  });

  it('renders miniWebsiteConfig.tagline when it is a non-empty string', () => {
    const vendor = buildVendor({
      shortDescription: 'Short desc',
      miniWebsiteConfig: { tagline: 'Heritage & Craftsmanship' },
    });
    const { container } = renderMiniWebsite(vendor);
    expect(container).toHaveTextContent('Heritage & Craftsmanship');
  });
});

describe('MiniWebsite — aboutDescription fallback', () => {
  it('renders vendor.description when aboutDescription is absent', () => {
    const vendor = buildVendor({
      description: 'Full description of the vendor business.',
      shortDescription: 'Short desc',
      miniWebsiteConfig: undefined,
    });
    const { container } = renderMiniWebsite(vendor);
    expect(container).toHaveTextContent('Full description of the vendor business.');
  });

  it('renders vendor.description when aboutDescription is empty', () => {
    const vendor = buildVendor({
      description: 'Full description of the vendor business.',
      shortDescription: 'Short desc',
      miniWebsiteConfig: { aboutDescription: '' },
    });
    const { container } = renderMiniWebsite(vendor);
    expect(container).toHaveTextContent('Full description of the vendor business.');
  });

  it('renders vendor.shortDescription when both aboutDescription and vendor.description are absent', () => {
    const vendor = buildVendor({
      description: '',
      shortDescription: 'Short fallback description',
      miniWebsiteConfig: { aboutDescription: '' },
    });
    const { container } = renderMiniWebsite(vendor);
    expect(container).toHaveTextContent('Short fallback description');
  });

  it('renders miniWebsiteConfig.aboutDescription when it is a non-empty string', () => {
    const vendor = buildVendor({
      description: 'Full description',
      shortDescription: 'Short desc',
      miniWebsiteConfig: { aboutDescription: 'Custom about text for the vendor.' },
    });
    const { container } = renderMiniWebsite(vendor);
    expect(container).toHaveTextContent('Custom about text for the vendor.');
  });
});
