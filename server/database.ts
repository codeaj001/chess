import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import ws from "ws";
import * as schema from "@shared/schema";
import { mockAIModels, mockMatches, mockBets } from "./mock-data";
import { AIModel, Match } from "@shared/schema";

// This is the correct way neon config - DO NOT change this
neonConfig.webSocketConstructor = ws;

// Database connection options
interface DatabaseOptions {
  useMockData: boolean;
  connectionString?: string;
}

/**
 * Database service that provides access to the database
 * Can use either a real database connection or mock data
 */
export class Database {
  private pool: Pool | null = null;
  private db: any = null;
  private useMockData: boolean = false;
  
  /**
   * Initialize the database connection
   */
  async initialize(options: DatabaseOptions): Promise<void> {
    this.useMockData = options.useMockData;
    
    if (!this.useMockData) {
      // Use a real database connection
      if (!options.connectionString) {
        throw new Error("Database connection string is required when not using mock data");
      }
      
      try {
        console.log("Initializing database connection...");
        this.pool = new Pool({ connectionString: options.connectionString });
        this.db = drizzle({ client: this.pool, schema });
        
        // Run migrations
        console.log("Running database migrations...");
        await migrate(this.db, { migrationsFolder: "./drizzle" });
        
        console.log("Database connection established successfully");
      } catch (error) {
        console.error("Failed to initialize database connection:", error);
        console.log("Falling back to mock data");
        this.useMockData = true;
      }
    } else {
      console.log("Using mock data instead of a real database connection");
    }
  }
  
  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.db = null;
    }
  }
  
  /**
   * Get all AI models
   */
  async getAllAIModels(): Promise<AIModel[]> {
    if (this.useMockData) {
      return mockAIModels;
    }
    
    try {
      return await this.db.select().from(schema.aiModels);
    } catch (error) {
      console.error("Error getting AI models:", error);
      return mockAIModels; // Fallback to mock data on error
    }
  }
  
  /**
   * Get AI models by style
   */
  async getAIModelsByStyle(style: string): Promise<AIModel[]> {
    if (this.useMockData) {
      return mockAIModels.filter(model => model.style === style);
    }
    
    try {
      return await this.db.select().from(schema.aiModels).where(schema.aiModels.style.equals(style));
    } catch (error) {
      console.error(`Error getting AI models by style ${style}:`, error);
      return mockAIModels.filter(model => model.style === style); // Fallback to mock data on error
    }
  }
  
  /**
   * Get an AI model by ID
   */
  async getAIModelById(id: number): Promise<AIModel | null> {
    if (this.useMockData) {
      return mockAIModels.find(model => model.id === id) || null;
    }
    
    try {
      const models = await this.db.select().from(schema.aiModels).where(schema.aiModels.id.equals(id));
      return models.length > 0 ? models[0] : null;
    } catch (error) {
      console.error(`Error getting AI model by ID ${id}:`, error);
      return mockAIModels.find(model => model.id === id) || null; // Fallback to mock data on error
    }
  }
  
  /**
   * Get random AI models
   */
  async getRandomAIModels(count: number = 2, minElo?: number, maxElo?: number): Promise<AIModel[]> {
    if (this.useMockData) {
      let filteredModels = [...mockAIModels];
      
      if (minElo !== undefined) {
        filteredModels = filteredModels.filter(model => model.elo >= minElo);
      }
      
      if (maxElo !== undefined) {
        filteredModels = filteredModels.filter(model => model.elo <= maxElo);
      }
      
      // Shuffle and take the first 'count' models
      return filteredModels
        .sort(() => Math.random() - 0.5)
        .slice(0, count);
    }
    
    try {
      let query = this.db.select().from(schema.aiModels);
      
      if (minElo !== undefined) {
        query = query.where(schema.aiModels.elo.gte(minElo));
      }
      
      if (maxElo !== undefined) {
        query = query.where(schema.aiModels.elo.lte(maxElo));
      }
      
      const models = await query;
      
      // Shuffle and take the first 'count' models
      return models
        .sort(() => Math.random() - 0.5)
        .slice(0, count);
    } catch (error) {
      console.error(`Error getting random AI models:`, error);
      // Fallback to mock data on error
      let filteredModels = [...mockAIModels];
      
      if (minElo !== undefined) {
        filteredModels = filteredModels.filter(model => model.elo >= minElo);
      }
      
      if (maxElo !== undefined) {
        filteredModels = filteredModels.filter(model => model.elo <= maxElo);
      }
      
      return filteredModels
        .sort(() => Math.random() - 0.5)
        .slice(0, count);
    }
  }
  
  // Add more database methods here...
}

// Create a singleton instance
export const database = new Database();
