import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Create a singleton Neon SQL client with connection pooling
let sqlClient: ReturnType<typeof neon> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

const getSqlClient = () => {
  if (!sqlClient) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined');
    }
    sqlClient = neon(process.env.DATABASE_URL);
  }
  return sqlClient;
};

const getDb = () => {
  if (!dbInstance) {
    try {
      const sql = getSqlClient();
      dbInstance = drizzle(sql, {
        // Optimize for serverless environment
        logger: process.env.NODE_ENV === 'development',
      });
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }
  return dbInstance;
};

// Export singleton instances with error handling
export const db = (() => {
  try {
    return getDb();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // Return a mock db that throws on any operation
    return {
      select: () => {
        throw new Error('Database not configured');
      },
      insert: () => {
        throw new Error('Database not configured');
      },
      update: () => {
        throw new Error('Database not configured');
      },
      delete: () => {
        throw new Error('Database not configured');
      },
    } as any;
  }
})();

// Cleanup function for graceful shutdown
export const cleanupDb = async () => {
  // Neon serverless connections are automatically managed
  // No explicit cleanup needed, but we can clear our references
  sqlClient = null;
  dbInstance = null;
};
