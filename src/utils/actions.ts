"use server";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);

// Initialize database table if it doesn't exist
export async function initializeDatabase() {
  try {
    // Create table with proper constraints
    await sql`
      CREATE TABLE IF NOT EXISTS components (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255),
        code TEXT NOT NULL CHECK (char_length(code) > 0),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_components_created_at ON components(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_components_updated_at ON components(updated_at DESC)`;
    
    console.log('Database table initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Ensure database is initialized on module load
initializeDatabase().catch((error) => {
  console.error('Failed to initialize database:', error);
});

export interface Component {
  id: string;
  name?: string;
  code: string;
  created_at?: string;
  updated_at?: string;
}

// Create a new component
export async function createComponent(code: string, name?: string): Promise<Component> {
  try {
    const result = await sql`
      INSERT INTO components (name, code)
      VALUES (${name || null}, ${code})
      RETURNING *
    `;
    return result[0] as Component;
  } catch (error) {
    console.error('Error creating component:', error);
    throw error;
  }
}

// Get a component by ID
export async function getComponent(id: string): Promise<Component | null> {
  try {
    const result = await sql`
      SELECT * FROM components WHERE id = ${id}
    `;
    return result[0] as Component || null;
  } catch (error) {
    console.error('Error getting component:', error);
    throw error;
  }
}

// Update a component
export async function updateComponent(id: string, code: string, name?: string): Promise<Component | null> {
  try {
    const result = await sql`
      UPDATE components 
      SET code = ${code}, 
          name = ${name || null},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0] as Component || null;
  } catch (error) {
    console.error('Error updating component:', error);
    throw error;
  }
}

// Get all components (optional, for listing)
export async function getAllComponents(): Promise<Component[]> {
  try {
    const result = await sql`
      SELECT * FROM components 
      ORDER BY updated_at DESC
    `;
    return result as Component[];
  } catch (error) {
    console.error('Error getting all components:', error);
    throw error;
  }
}