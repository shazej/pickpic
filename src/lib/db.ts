
import { env } from "@/env";

const config = {
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    server: env.DB_SERVER,
    port: parseInt(env.DB_PORT),
    database: env.DB_NAME,
    options: {
        encrypt: env.DB_ENCRYPT === 'true',
        trustServerCertificate: true,
    }
};

// Use global to preserve pool across HMR in dev
let pool: any = (global as any).mssqlPool || null;

export const getPool = async () => {
    // Prevent DB connection during build phase
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        return null;
    }

    if (pool) return pool;
    try {
        console.log('Connecting to MSSQL...');
        const sql = require('mssql');
        pool = await sql.connect(config);
        (global as any).mssqlPool = pool;
        console.log('Database connected successfully');
        return pool;
    } catch (err) {
        console.error('Database connection failed:', err);
        throw err;
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const query = async (text: string, params: { name: string, value: any, type?: any }[] = []) => {
    // Prevent DB queries during build phase
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        return { recordset: [], rowsAffected: [0], output: {} };
    }

    const pool = await getPool();
    const request = pool.request();

    params.forEach(p => {
        if (p.type) {
            request.input(p.name, p.type, p.value);
        } else {
            request.input(p.name, p.value);
        }
    });

    return await request.query(text);
};

export const getSql = () => {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        return {
            NVarChar: 'nvarchar',
            Int: 'int',
            UniqueIdentifier: 'uniqueidentifier',
            DateTime2: 'datetime2',
            Decimal: () => 'decimal',
            Char: () => 'char',
            VarBinary: () => 'varbinary',
            MAX: 'max'
        };
    }
    return require('mssql');
};

export const sql = getSql();
