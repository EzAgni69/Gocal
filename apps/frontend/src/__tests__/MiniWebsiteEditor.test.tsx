/**
 * Unit tests for MiniWebsiteEditor component
 *
 * Task 9.4: Write unit tests for MiniWebsiteEditor pre-population and save payload
 *
 * Tests verify:
 * - Property 9: Dashboard pre-population
 *   When vendor.miniWebsiteConfig contains businessLabel, tagline, and aboutDescription,
 *   the corresponding input fields are pre-populated with those values when the component mounts.
 *
 * - Property 10: Dashboard save round-trip
 *   When the user saves, the updateVendor call includes the three new keys inside miniWebsiteConfig.
 *
 * Validates: Requirements 5.1, 5.2
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MiniWebsiteEditor } from '../components/vendor/MiniWebsiteEditor';
import { Vendor } from '../types';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock updateVendor from vendorService
const mockUpdateVendor = jest.fn();
jest.mock('../services/vendorService', () => ({
  updateVendor: (...args: any[]) => mockUpdateVendor(...args),
}));

// Mock framer-motion (not used in MiniWebsiteEditor directly, but transitive deps may need it)
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
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
    id: 'vendor-test-id',
    name: 'Test Vendor',
    description: 'Test description',
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

/** Render MiniWebsiteEditor with a vendor */
function renderEditor(vendor: Vendor, onUpdate = jest.fn()) {
  return render(<MiniWebsiteEditor vendor={vendor} onUpdate={onUpdate} />);
}

/** Get the Business Label input field */
function getBusinessLabelInput(): HTMLInputElement {
  return screen.getByPlaceholderText('e.g. The Maison') as HTMLInputElement;
}

/** Get the Tagline input field */
function getTaglineInput(): HTMLInputElement {
  return screen.getByPlaceholderText('e.g. Heritage & Elegance') as HTMLInputElement;
}

/** Get the About Description textarea */
function getAboutDescriptionTextarea(): HTMLTextAreaElement {
  return screen.getByPlaceholderText('Describe your business to customers…') as HTMLTextAreaElement;
}

/** Get the Save Settings button */
function getSaveButton(): HTMLElement {
  return screen.getByRole('button', { name: /save settings/i });
}

// ─── Property 9: Dashboard pre-population ─────────────────────────────────────

describe('Property 9: Dashboard pre-population', () => {
  it('pre-populates businessLabel input from vendor.miniWebsiteConfig.businessLabel', () => {
    const vendor = buildVendor({
      miniWebsiteConfig: {
        businessLabel: 'The Grand Emporium',
        tagline: 'Quality & Craftsmanship',
        aboutDescription: 'We have been serving customers since 1990.',
      },
    });

    renderEditor(vendor);

    expect(getBusinessLabelInput().value).toBe('The Grand Emporium');
  });

  it('pre-populates tagline input from vendor.miniWebsiteConfig.tagline', () => {
    const vendor = buildVendor({
      miniWebsiteConfig: {
        businessLabel: 'The Grand Emporium',
        tagline: 'Quality & Craftsmanship',
        aboutDescription: 'We have been serving customers since 1990.',
      },
    });

    renderEditor(vendor);

    expect(getTaglineInput().value).toBe('Quality & Craftsmanship');
  });

  it('pre-populates aboutDescription textarea from vendor.miniWebsiteConfig.aboutDescription', () => {
    const vendor = buildVendor({
      miniWebsiteConfig: {
        businessLabel: 'The Grand Emporium',
        tagline: 'Quality & Craftsmanship',
        aboutDescription: 'We have been serving customers since 1990.',
      },
    });

    renderEditor(vendor);

    expect(getAboutDescriptionTextarea().value).toBe('We have been serving customers since 1990.');
  });

  it('pre-populates all three fields simultaneously from miniWebsiteConfig', () => {
    const vendor = buildVendor({
      miniWebsiteConfig: {
        businessLabel: 'Heritage House',
        tagline: 'Tradition meets modernity',
        aboutDescription: 'A family business since 1975.',
      },
    });

    renderEditor(vendor);

    expect(getBusinessLabelInput().value).toBe('Heritage House');
    expect(getTaglineInput().value).toBe('Tradition meets modernity');
    expect(getAboutDescriptionTextarea().value).toBe('A family business since 1975.');
  });

  it('shows empty inputs when miniWebsiteConfig is absent', () => {
    const vendor = buildVendor({ miniWebsiteConfig: undefined });

    renderEditor(vendor);

    expect(getBusinessLabelInput().value).toBe('');
    expect(getTaglineInput().value).toBe('');
    expect(getAboutDescriptionTextarea().value).toBe('');
  });

  it('shows empty inputs when miniWebsiteConfig exists but lacks the three fields', () => {
    const vendor = buildVendor({
      miniWebsiteConfig: {
        googleMapsUrl: 'https://maps.google.com/test',
      },
    });

    renderEditor(vendor);

    expect(getBusinessLabelInput().value).toBe('');
    expect(getTaglineInput().value).toBe('');
    expect(getAboutDescriptionTextarea().value).toBe('');
  });

  it('pre-populates only the fields that are present in miniWebsiteConfig', () => {
    const vendor = buildVendor({
      miniWebsiteConfig: {
        businessLabel: 'Only Label Set',
        // tagline and aboutDescription are absent
      },
    });

    renderEditor(vendor);

    expect(getBusinessLabelInput().value).toBe('Only Label Set');
    expect(getTaglineInput().value).toBe('');
    expect(getAboutDescriptionTextarea().value).toBe('');
  });
});

// ─── Property 10: Dashboard save round-trip ───────────────────────────────────

describe('Property 10: Dashboard save round-trip', () => {
  beforeEach(() => {
    mockUpdateVendor.mockReset();
    // Default: resolve with a minimal vendor object
    mockUpdateVendor.mockResolvedValue(buildVendor());
    // Suppress window.alert in tests
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls updateVendor with miniWebsiteConfig containing businessLabel when saved', async () => {
    const vendor = buildVendor({
      miniWebsiteConfig: {
        businessLabel: 'The Grand Emporium',
      },
    });

    renderEditor(vendor);
    fireEvent.click(getSaveButton());

    await waitFor(() => {
      expect(mockUpdateVendor).toHaveBeenCalledTimes(1);
    });

    const [, updateData] = mockUpdateVendor.mock.calls[0];
    expect(updateData.miniWebsiteConfig.businessLabel).toBe('The Grand Emporium');
  });

  it('calls updateVendor with miniWebsiteConfig containing tagline when saved', async () => {
    const vendor = buildVendor({
      miniWebsiteConfig: {
        tagline: 'Quality & Craftsmanship',
      },
    });

    renderEditor(vendor);
    fireEvent.click(getSaveButton());

    await waitFor(() => {
      expect(mockUpdateVendor).toHaveBeenCalledTimes(1);
    });

    const [, updateData] = mockUpdateVendor.mock.calls[0];
    expect(updateData.miniWebsiteConfig.tagline).toBe('Quality & Craftsmanship');
  });

  it('calls updateVendor with miniWebsiteConfig containing aboutDescription when saved', async () => {
    const vendor = buildVendor({
      miniWebsiteConfig: {
        aboutDescription: 'We have been serving customers since 1990.',
      },
    });

    renderEditor(vendor);
    fireEvent.click(getSaveButton());

    await waitFor(() => {
      expect(mockUpdateVendor).toHaveBeenCalledTimes(1);
    });

    const [, updateData] = mockUpdateVendor.mock.calls[0];
    expect(updateData.miniWebsiteConfig.aboutDescription).toBe('We have been serving customers since 1990.');
  });

  it('calls updateVendor with all three new keys in miniWebsiteConfig when all are set', async () => {
    const vendor = buildVendor({
      miniWebsiteConfig: {
        businessLabel: 'Heritage House',
        tagline: 'Tradition meets modernity',
        aboutDescription: 'A family business since 1975.',
      },
    });

    renderEditor(vendor);
    fireEvent.click(getSaveButton());

    await waitFor(() => {
      expect(mockUpdateVendor).toHaveBeenCalledTimes(1);
    });

    const [vendorId, updateData] = mockUpdateVendor.mock.calls[0];
    expect(vendorId).toBe('vendor-test-id');
    expect(updateData.miniWebsiteConfig.businessLabel).toBe('Heritage House');
    expect(updateData.miniWebsiteConfig.tagline).toBe('Tradition meets modernity');
    expect(updateData.miniWebsiteConfig.aboutDescription).toBe('A family business since 1975.');
  });

  it('includes updated values in the save payload after user edits the fields', async () => {
    const vendor = buildVendor({
      miniWebsiteConfig: {
        businessLabel: 'Old Label',
        tagline: 'Old Tagline',
        aboutDescription: 'Old about text.',
      },
    });

    renderEditor(vendor);

    // Simulate user editing the fields
    fireEvent.change(getBusinessLabelInput(), { target: { value: 'New Label' } });
    fireEvent.change(getTaglineInput(), { target: { value: 'New Tagline' } });
    fireEvent.change(getAboutDescriptionTextarea(), { target: { value: 'New about text.' } });

    fireEvent.click(getSaveButton());

    await waitFor(() => {
      expect(mockUpdateVendor).toHaveBeenCalledTimes(1);
    });

    const [, updateData] = mockUpdateVendor.mock.calls[0];
    expect(updateData.miniWebsiteConfig.businessLabel).toBe('New Label');
    expect(updateData.miniWebsiteConfig.tagline).toBe('New Tagline');
    expect(updateData.miniWebsiteConfig.aboutDescription).toBe('New about text.');
  });

  it('calls updateVendor with the correct vendor id', async () => {
    const vendor = buildVendor({
      id: 'specific-vendor-id-123',
      miniWebsiteConfig: { businessLabel: 'Test' },
    });

    renderEditor(vendor);
    fireEvent.click(getSaveButton());

    await waitFor(() => {
      expect(mockUpdateVendor).toHaveBeenCalledTimes(1);
    });

    const [vendorId] = mockUpdateVendor.mock.calls[0];
    expect(vendorId).toBe('specific-vendor-id-123');
  });

  it('preserves other miniWebsiteConfig fields (e.g. googleMapsUrl) in the save payload', async () => {
    const vendor = buildVendor({
      miniWebsiteConfig: {
        businessLabel: 'Test Label',
        tagline: 'Test Tagline',
        aboutDescription: 'Test about.',
        googleMapsUrl: 'https://maps.google.com/test',
        socialLinks: { instagram: 'https://instagram.com/test' },
      },
    });

    renderEditor(vendor);
    fireEvent.click(getSaveButton());

    await waitFor(() => {
      expect(mockUpdateVendor).toHaveBeenCalledTimes(1);
    });

    const [, updateData] = mockUpdateVendor.mock.calls[0];
    expect(updateData.miniWebsiteConfig.businessLabel).toBe('Test Label');
    expect(updateData.miniWebsiteConfig.tagline).toBe('Test Tagline');
    expect(updateData.miniWebsiteConfig.aboutDescription).toBe('Test about.');
    expect(updateData.miniWebsiteConfig.googleMapsUrl).toBe('https://maps.google.com/test');
    expect(updateData.miniWebsiteConfig.socialLinks?.instagram).toBe('https://instagram.com/test');
  });
});
