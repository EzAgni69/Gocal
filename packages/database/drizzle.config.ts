import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config({ path: '../../apps/backend/.env' });

export default defineConfig({
    schema: './src/schema/index.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL || 'postgresql://localhost:5432/gocal_db',
    },
    verbose: true,
    strict: true,
});
