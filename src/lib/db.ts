
import sql from 'mssql';

const config = "Server=162.55.212.193,14315;Database=pickpic;User Id=sa;Password=V3r!fy#92uM@xTq1zR71;TrustServerCertificate=True;MultipleActiveResultSets=true;Encrypt=False";

let pool: sql.ConnectionPool | null = null;

export const getPool = async () => {
    if (pool) return pool;
    try {
        pool = await sql.connect(config);
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
