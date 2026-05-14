import { db, vendors, users, favorites, wishlistItems, products, eq, and, isNull, ne, sql, inArray } from 'database';
import { logger } from '../config/logger';

export interface DowngradeResult {
  vendor: any;
  roleDowngraded: boolean;
  newRole: string;
  previousRole: string;
}

/**
 * Soft-deletes a vendor card and conditionally downgrades the owner's role
 * from VENDOR to CONSUMER if they have no remaining active cards.
 * All operations are performed atomically within a single DB transaction.
 */
export async function deleteVendorWithDowngrade(
  vendorId: string,
  adminUserId: string
): Promise<DowngradeResult> {
  return await db.transaction(async (tx: any) => {
    // Fetch the vendor (including soft-deleted to detect 409)
    const [vendor] = await tx
      .select()
      .from(vendors)
      .where(eq(vendors.id, vendorId))
      .limit(1);

    if (!vendor) {
      const err: any = new Error('Vendor not found');
      err.statusCode = 404;
      throw err;
    }

    if (vendor.deletedAt !== null) {
      const err: any = new Error('Vendor already deleted');
      err.statusCode = 409;
      throw err;
    }

    // Fetch the owner
    const [owner] = await tx
      .select()
      .from(users)
      .where(eq(users.id, vendor.ownerId))
      .limit(1);

    if (!owner) {
      const err: any = new Error('Owner user not found');
      err.statusCode = 500;
      throw err;
    }

    // Count remaining active cards for the owner (excluding the one being deleted)
    const [countResult] = await tx
      .select({ count: sql<number>`count(*)` })
      .from(vendors)
      .where(
        and(
          eq(vendors.ownerId, owner.id),
          ne(vendors.id, vendorId),
          isNull(vendors.deletedAt)
        )
      );

    const remainingCount = Number(countResult?.count ?? 0);

    // Soft-delete the vendor
    const [deletedVendor] = await tx
      .update(vendors)
      .set({ deletedAt: new Date() })
      .where(eq(vendors.id, vendorId))
      .returning();

    // Clean up favorites referencing this vendor
    await tx
      .delete(favorites)
      .where(eq(favorites.vendorId, vendorId));

    // Clean up wishlist items referencing products from this vendor
    const vendorProducts = await tx
      .select({ id: products.id })
      .from(products)
      .where(eq(products.vendorId, vendorId));

    if (vendorProducts.length > 0) {
      const productIds = vendorProducts.map((p: any) => p.id);
      await tx
        .delete(wishlistItems)
        .where(inArray(wishlistItems.productId, productIds));
    }

    logger.info('Cleaned up favorites and wishlist items for deleted vendor', {
      vendorId,
      favoritesRemoved: true,
      wishlistProductsChecked: vendorProducts.length,
    });

    const previousRole = owner.role;
    let newRole = previousRole;
    let roleDowngraded = false;

    const protectedRoles = ['ADMIN', 'SUPER_ADMIN'];

    if (owner.role === 'VENDOR' && remainingCount === 0) {
      // Downgrade to CONSUMER
      await tx
        .update(users)
        .set({ role: 'CONSUMER' })
        .where(eq(users.id, owner.id));

      newRole = 'CONSUMER';
      roleDowngraded = true;

      logger.info('Role downgrade performed', {
        vendorId,
        userId: owner.id,
        adminUserId,
        previousRole,
        newRole,
        remainingCards: remainingCount,
      });
    } else if (protectedRoles.includes(owner.role)) {
      logger.info('Role downgrade skipped: protected role', {
        vendorId,
        userId: owner.id,
        adminUserId,
        previousRole,
        skipReason: 'protected_role',
      });
    } else if (remainingCount > 0) {
      logger.info('Role downgrade skipped: remaining active cards', {
        vendorId,
        userId: owner.id,
        adminUserId,
        previousRole,
        skipReason: 'remaining_active_cards',
        remainingCards: remainingCount,
      });
    } else {
      // owner.role is CONSUMER (or other non-VENDOR role) with 0 remaining cards
      logger.info('Role downgrade skipped: owner is not VENDOR', {
        vendorId,
        userId: owner.id,
        adminUserId,
        previousRole,
        skipReason: 'not_vendor_role',
      });
    }

    return {
      vendor: deletedVendor,
      roleDowngraded,
      newRole,
      previousRole,
    };
  });
}
