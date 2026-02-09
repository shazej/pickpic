
import path from 'path';
import dotenv from 'dotenv';

console.log("CWD:", process.cwd());
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log("DB_USER:", process.env.DB_USER ? "SET" : "MISSING");
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "SET" : "MISSING");
console.log("NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? "SET" : "MISSING");

import "@/env"; // validation
console.log("Env validated.");
