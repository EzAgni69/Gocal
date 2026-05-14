import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// In serverless (Vercel), env vars are injected by the platform — .env file may not exist
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const envSchema = z.object({
    PORT: z.string().optional(),
    DATABASE_URL: z.string().min(1).optional(),
    POSTGRES_URL: z.string().min(1).optional(),
    // other critical vars can be added here
}).refine(data => data.DATABASE_URL || data.POSTGRES_URL, {
    message: 'Either DATABASE_URL or POSTGRES_URL must be set',
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
    // NEVER call process.exit() in serverless — it kills the function and returns 500
    console.error('⚠️ Environment variable validation failed:', JSON.stringify(env.error.format()));
    console.error('⚠️ DATABASE_URL present:', !!process.env.DATABASE_URL);
    console.error('⚠️ POSTGRES_URL present:', !!process.env.POSTGRES_URL);
}
