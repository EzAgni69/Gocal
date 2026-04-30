import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const envSchema = z.object({
    PORT: z.string().optional(),
    DATABASE_URL: z.string().min(1),
    // other critical vars can be added here
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
    console.error('❌ Invalid environment variables:', env.error.format());
    process.exit(1);
}
