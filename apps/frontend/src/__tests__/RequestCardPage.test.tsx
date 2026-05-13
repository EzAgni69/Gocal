/**
 * Unit tests for the StepReview component — Brand Copy section
 *
 * Tests verify:
 * 1. When businessLabel, tagline, and aboutDescription have values, they are displayed
 * 2. When those fields are empty strings, '—' placeholder is shown for each
 * 3. When the Edit button in the Brand Copy section is clicked, it calls handleEdit(3)
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepReview, FormData, initialFormData } from '../app/request-card/page';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../services/apiClient', () => ({
  apiClient: jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })),
}));

jest.mock('../context/AppContext', () => ({
  useAppContext: jest.fn(() => ({
    user: null,
    isAuthenticated: true,
    setShowAuthModal: jest.fn(),
    setAuthModalMode: jest.fn(),
  })),
}));

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

function buildFormData(overrides: Partial<FormData> = {}): FormData {
  return { ...initialFormData, ...overrides };
}

function renderStepReview(
  formDataOverrides: Partial<FormData> = {},
  handleEdit = jest.fn()
) {
  const formData = buildFormData(formDataOverrides);
  render(
    <StepReview
      formData={formData}
      isSubmitting={false}
      handleSubmit={jest.fn()}
      handleEdit={handleEdit}
    />
  );
  return { handleEdit };
}

/** Find the Edit button inside the Brand Copy section */
function getBrandCopyEditButton(): HTMLElement {
  const brandCopyHeading = screen.getByText('Brand Copy');
  // The heading is inside a flex container div; its parent div is the section
  const brandCopySection = brandCopyHeading.closest('div');
  if (!brandCopySection) throw new Error('Brand Copy section not found');
  const editButton = Array.from(brandCopySection.querySelectorAll('button')).find(
    (btn) => btn.textContent?.toLowerCase().includes('edit')
  );
  if (!editButton) throw new Error('Edit button not found in Brand Copy section');
  return editButton as HTMLElement;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('StepReview — Brand Copy section', () => {
  describe('displays values when fields are populated', () => {
    it('displays the businessLabel value', () => {
      renderStepReview({ businessLabel: 'The Grand Emporium' });
      expect(screen.getByText('The Grand Emporium')).toBeInTheDocument();
    });

    it('displays the tagline value', () => {
      renderStepReview({ tagline: 'Quality & Craftsmanship' });
      expect(screen.getByText('Quality & Craftsmanship')).toBeInTheDocument();
    });

    it('displays the aboutDescription value', () => {
      renderStepReview({ aboutDescription: 'We have been serving customers since 1990.' });
      expect(screen.getByText('We have been serving customers since 1990.')).toBeInTheDocument();
    });

    it('displays all three values simultaneously', () => {
      renderStepReview({
        businessLabel: 'The Grand Emporium',
        tagline: 'Quality & Craftsmanship',
        aboutDescription: 'We have been serving customers since 1990.',
      });
      expect(screen.getByText('The Grand Emporium')).toBeInTheDocument();
      expect(screen.getByText('Quality & Craftsmanship')).toBeInTheDocument();
      expect(screen.getByText('We have been serving customers since 1990.')).toBeInTheDocument();
    });
  });

  describe('displays — placeholder when fields are empty', () => {
    it('shows — for businessLabel when empty', () => {
      renderStepReview({ businessLabel: '', tagline: 'Some tagline', aboutDescription: 'Some about' });
      // With only businessLabel empty, at least one — should appear
      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
    });

    it('shows — for tagline when empty', () => {
      renderStepReview({ businessLabel: 'Some label', tagline: '', aboutDescription: 'Some about' });
      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
    });

    it('shows — for aboutDescription when empty', () => {
      renderStepReview({ businessLabel: 'Some label', tagline: 'Some tagline', aboutDescription: '' });
      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
    });

    it('shows three — placeholders when all three Brand Copy fields are empty', () => {
      renderStepReview({
        businessLabel: '',
        tagline: '',
        aboutDescription: '',
        // Populate other fields so only Brand Copy rows show —
        fullName: 'John Doe',
        phone: '+91 9876543210',
        email: 'john@example.com',
        businessName: 'Acme',
        category: 'Retail',
        city: 'Vadodara',
        address: '123 Main St',
      });
      // The Brand Copy section has 3 rows, each showing — when empty
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Brand Copy section structure', () => {
    it('renders the "Brand Copy" heading', () => {
      renderStepReview();
      expect(screen.getByText('Brand Copy')).toBeInTheDocument();
    });

    it('renders the field labels', () => {
      renderStepReview();
      expect(screen.getByText('Business Label:')).toBeInTheDocument();
      expect(screen.getByText('Tagline:')).toBeInTheDocument();
      expect(screen.getByText('About Description:')).toBeInTheDocument();
    });
  });

  describe('Edit button calls handleEdit(3)', () => {
    it('calls handleEdit(3) when the Edit button in the Brand Copy section is clicked', () => {
      const handleEdit = jest.fn();
      renderStepReview({}, handleEdit);

      const editButton = getBrandCopyEditButton();
      fireEvent.click(editButton);

      expect(handleEdit).toHaveBeenCalledWith(3);
    });

    it('calls handleEdit(3) exactly once per click', () => {
      const handleEdit = jest.fn();
      renderStepReview({}, handleEdit);

      const editButton = getBrandCopyEditButton();
      fireEvent.click(editButton);

      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(3);
    });

    it('does not call handleEdit with any other step number', () => {
      const handleEdit = jest.fn();
      renderStepReview({}, handleEdit);

      const editButton = getBrandCopyEditButton();
      fireEvent.click(editButton);

      expect(handleEdit).not.toHaveBeenCalledWith(1);
      expect(handleEdit).not.toHaveBeenCalledWith(2);
      expect(handleEdit).not.toHaveBeenCalledWith(4);
    });
  });
});
