import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'thang',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

export async function getConnection() {
  return await pool.getConnection();
}

export async function query(sql: string, values?: any[]) {
  const connection = await getConnection();
  try {
    const [results] = await connection.execute(sql, values || []);
    return results;
  } finally {
    connection.release();
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const connection = await getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

export async function createOrGetProject(projectName: string): Promise<number> {
  try {
    await query(
      `INSERT INTO projects (project_name) VALUES (?)
       ON DUPLICATE KEY UPDATE project_name = project_name`,
      [projectName]
    );

    const existing: any = await query('SELECT id FROM projects WHERE project_name = ?', [
      projectName,
    ]);

    if (!existing?.[0]?.id) {
      throw new Error(`Could not create or find project: ${projectName}`);
    }

    return existing[0].id as number;
  } catch (error) {
    console.error('Error creating/getting project:', error);
    throw error;
  }
}

export async function closePool() {
  await pool.end();
}

export { pool };
