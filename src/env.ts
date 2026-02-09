import { z } from "zod";

const envSchema = z.object({
    // Server
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.string().default("3000"),

    // Database
    DB_USER: z.string().min(1, "DB_USER is required"),
    DB_PASSWORD: z.string().min(1, "DB_PASSWORD is required"),
    DB_SERVER: z.string().min(1, "DB_SERVER is required"),
    DB_PORT: z.string().default("1433"),
    DB_NAME: z.string().min(1, "DB_NAME is required"),
    DB_ENCRYPT: z.enum(["true", "false"]).default("true"),

    // Auth
    NEXTAUTH_URL: z.string().url().optional(), // Optional in Vercel/some envs where it's auto-detected
    NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),

    // Storage
    BLOB_READ_WRITE_TOKEN: z.string().optional(),

    // AI & Analytics
    GOOGLE_GENAI_API_KEY: z.string().optional(),
});

// Validate process.env
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error("❌ Invalid environment variables:", _env.error.format());
    throw new Error("Invalid environment variables");
}

export const env = _env.data;
