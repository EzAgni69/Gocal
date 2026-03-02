import { db, vendors, products } from 'database';

async function checkDb() {
    const v = await db.select().from(vendors);
    const p = await db.select().from(products);
    console.log('Vendors:', v.length);
    console.log('Products:', p.length);
    if (v.length > 0) console.log('Sample Vendor:', v[0].id, v[0].name);
    if (p.length > 0) console.log('Sample Product:', p[0].id, p[0].name);
    process.exit(0);
}

checkDb().catch(console.error);
