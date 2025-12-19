
import sql from 'mssql';

// Fix: Use hostname for TLS support instead of IP from env
// Fix: Hardcode credentials to avoid .env parsing issues with special chars
const config = {
    user: 'sa',
    password: 'V3r!fy#92uM@xTq1zR71',
    server: 'static.193.212.55.162.clients.your-server.de',
    port: 14315,
    database: 'PICKPIC',
    options: {
        encrypt: true,
        trustServerCertificate: true,
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
