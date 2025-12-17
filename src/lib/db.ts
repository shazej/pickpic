
import sql from 'mssql';

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 1433,
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // For local dev/docker
        trustServerCertificate: true
    }
};

let pool: sql.ConnectionPool | null = null;

export const getPool = async () => {
    if (pool) return pool;
    try {
        pool = await sql.connect(config as any);
        return pool;
    } catch (err) {
        console.error('Database connection failed:', err);
        throw err;
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const query = async (text: string, params: { name: string, value: any, type?: any }[] = []) => {
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

export { sql };
