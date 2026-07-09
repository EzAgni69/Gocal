import { Vendor } from '@/types';

/**
 * Extracts a 6-digit Indian PIN code from vendor address or pincode field,
 * or defaults to standard 390001 if not found.
 */
export function getVendorPincode(
  vendor?: { address?: string; city?: string; pincode?: string } | null
): string {
  if (!vendor) return '390001';
  if (vendor.pincode && /^\d{6}$/.test(vendor.pincode)) {
    return vendor.pincode;
  }
  if (vendor.address) {
    const match = vendor.address.match(/\b(\d{6})\b/);
    if (match) {
      return match[1];
    }
  }
  return '390001';
}

/**
 * Returns a clean URL slug for the vendor.
 */
export function getVendorSlug(
  vendor?: { slug?: string; name?: string; websiteUuid?: string; id?: string } | null
): string {
  if (!vendor) return '';
  if (vendor.slug && typeof vendor.slug === 'string' && vendor.slug.trim()) {
    return vendor.slug.trim().toLowerCase();
  }
  if (vendor.name && typeof vendor.name === 'string' && vendor.name.trim()) {
    return vendor.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  return vendor.websiteUuid || vendor.id || '';
}

/**
 * Returns default Mini Website URL:
 * Format: gocal.ai/in+first 3 digit of pincode/business name
 * Example: https://gocal.ai/in390/sharma-sweets
 */
export function getMiniWebsiteUrl(vendor?: any, origin?: string): string {
  if (!vendor) return '';
  const baseOrigin =
    origin || (typeof window !== 'undefined' ? window.location.origin : '');
  const pincode = getVendorPincode(vendor);
  const first3Digits = pincode.slice(0, 3);
  const slug = getVendorSlug(vendor);
  return `${baseOrigin}/in${first3Digits}/${slug}`;
}

/**
 * Returns Contact Card URL:
 * Format: gocal.ai/in+full pincode/business name
 * Example: https://gocal.ai/in390001/sharma-sweets
 */
export function getContactCardUrl(vendor?: any, origin?: string): string {
  if (!vendor) return '';
  const baseOrigin =
    origin || (typeof window !== 'undefined' ? window.location.origin : '');
  const pincode = getVendorPincode(vendor);
  const slug = getVendorSlug(vendor);
  return `${baseOrigin}/in${pincode}/${slug}`;
}
