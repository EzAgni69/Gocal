import { fetchHomeVendors, updateVendor } from './vendorService';
import { apiClient } from './apiClient';

// Mock the apiClient
jest.mock('./apiClient', () => ({
  apiClient: jest.fn(),
}));

const mockVendor = {
  id: '1',
  name: 'Test Vendor',
  category: { name: 'Test Category' },
  shortDescription: 'Short',
  description: 'Long',
  city: 'Test City',
  address: 'Test Address',
  phone: '123456',
  email: 'test@test.com',
  coverImageUrl: 'test-url',
  isOpen: true,
  rating: 4.5,
  reviewCount: 10,
  isPremium: true,
  isVerified: true,
  products: [],
  galleryImages: [],
  reviews: [],
  offers: [],
  miniWebsiteConfig: {},
  websiteUrl: '',
};

describe('vendorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchHomeVendors', () => {
    it('should fetch and map home vendors correctly', async () => {
      (apiClient as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ vendors: [mockVendor] }),
      });

      const vendors = await fetchHomeVendors();

      expect(apiClient).toHaveBeenCalledWith('/api/vendors/home');
      expect(vendors).toHaveLength(1);
      expect(vendors[0].id).toBe('1');
      expect(vendors[0].name).toBe('Test Vendor');
      expect(vendors[0].category).toBe('Test Category'); // Mapped from category.name
    });

    it('should throw an error if fetch fails', async () => {
      (apiClient as jest.Mock).mockResolvedValue({
        ok: false,
      });

      await expect(fetchHomeVendors()).rejects.toThrow('Failed to fetch home vendors');
    });
  });

  describe('updateVendor', () => {
    it('should update vendor and return mapped data', async () => {
      const updateData = { name: 'Updated name' };
      (apiClient as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ vendor: { ...mockVendor, name: 'Updated name' } }),
      });

      const result = await updateVendor('1', updateData);

      expect(apiClient).toHaveBeenCalledWith('/api/vendors/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      expect(result.name).toBe('Updated name');
    });
  });
});
