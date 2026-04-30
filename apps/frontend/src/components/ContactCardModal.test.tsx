import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContactCardModal } from './ContactCardModal';
import { useAppContext } from '../context/AppContext';

// Mock useAppContext
jest.mock('../context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockVendor = {
  id: '1',
  name: 'Test Vendor',
  description: 'Test Description',
  coverImage: 'test-image.jpg',
  rating: 4.5,
  reviewCount: 10,
  category: 'Test Category',
  phone: '1234567890',
  email: 'test@example.com',
  address: 'Test Address',
  isOpen: true,
  verified: true,
  products: [],
  galleryImages: [],
  planType: 'card_only',
};

const mockContext = {
  language: 'en',
  requireAuth: jest.fn(() => true),
  wishlist: [],
  addToWishlist: jest.fn(),
  removeFromWishlist: jest.fn(),
};

describe('ContactCardModal', () => {
  beforeEach(() => {
    (useAppContext as jest.Mock).mockReturnValue(mockContext);
  });

  it('renders vendor details when open', () => {
    render(
      <ContactCardModal
        vendor={mockVendor as any}
        isOpen={true}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Test Vendor')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Test Category')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ContactCardModal
        vendor={mockVendor as any}
        isOpen={false}
        onClose={() => {}}
      />
    );

    expect(screen.queryByText('Test Vendor')).not.toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = jest.fn();
    const { container } = render(
      <ContactCardModal
        vendor={mockVendor as any}
        isOpen={true}
        onClose={onClose}
      />
    );

    // Find the backdrop by its classes
    const backdrop = container.querySelector('.bg-black\\/60');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    expect(onClose).toHaveBeenCalled();
  });
});
