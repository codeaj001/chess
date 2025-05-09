import { Lc0Engine } from './lc0-wrapper';
import { enginePersonalities, EnginePersonality } from './personalities';
import { Chess } from 'chess.js';
import path from 'path';
import fs from 'fs';

/**
 * Manages multiple instances of the Leela Chess Zero engine
 * Handles engine creation, move generation, and resource management
 */
class EngineManager {
  private engines: Map<number, Lc0Engine> = new Map();
  private activeEngines: Set<number> = new Set();
  private engineQueue: number[] = [];
  private maxConcurrentEngines: number = 4; // Limit concurrent engines based on system resources
  private initialized: boolean = false;
  private networkBasePath: string;
  
  constructor() {
    // Determine the base path for network files
    this.networkBasePath = process.env.LC0_NETWORKS_PATH || path.join(process.cwd(), 'networks');
    
    // Ensure the networks directory exists
    this.ensureNetworksDirectory();
  }
  
  /**
   * Ensure the networks directory exists
   */
  private ensureNetworksDirectory(): void {
    try {
      if (!fs.existsSync(this.networkBasePath)) {
        fs.mkdirSync(this.networkBasePath, { recursive: true });
        console.log(`Created networks directory at ${this.networkBasePath}`);
      }
    } catch (error) {
      console.error('Failed to create networks directory:', error);
    }
  }
  
  /**
   * Initialize the engine manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Check if Leela Chess Zero is installed
      await this.checkLc0Installation();
      
      // Check if network files exist, download if needed
      await this.checkNetworkFiles();
      
      // Pre-initialize engines for faster response
      this.initializeEngines();
      
      this.initialized = true;
      console.log('Engine manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize engine manager:', error);
      throw error;
    }
  }
  
  /**
   * Check if Leela Chess Zero is installed
   */
  private async checkLc0Installation(): Promise<void> {
    return new Promise((resolve, reject) => {
      const { exec } = require('child_process');
      exec('lc0 --version', (error: any, stdout: string, stderr: string) => {
        if (error) {
          console.error('Leela Chess Zero is not installed or not in PATH');
          reject(new Error('Leela Chess Zero is not installed or not in PATH'));
          return;
        }
        console.log('Leela Chess Zero version:', stdout.trim());
        resolve();
      });
    });
  }
  
  /**
   * Check if network files exist, download if needed
   */
  private async checkNetworkFiles(): Promise<void> {
    const requiredNetworks = [
      { name: 'beginner.pb.gz', url: 'https://training.lczero.org/get_network?sha=00af53b081e80147172e6f281c01daf5290b4d67b0013027d582aed7d7bc29ff' },
      { name: 'intermediate.pb.gz', url: 'https://training.lczero.org/get_network?sha=fd28dc61c1c446bc718db6bd9e1d3e1f33a7925c1da56091e60c93af9563f9b7' },
      { name: 'advanced.pb.gz', url: 'https://training.lczero.org/get_network?sha=b30e742bcfd905815e0e7dbd4e1bafb41ade748f85d006b8e28758f1a3107ae3' },
      { name: 'best.pb.gz', url: 'https://training.lczero.org/get_network?sha=latest' }
    ];
    
    for (const network of requiredNetworks) {
      const filePath = path.join(this.networkBasePath, network.name);
      
      if (!fs.existsSync(filePath)) {
        console.log(`Network file ${network.name} not found, downloading...`);
        try {
          await this.downloadNetwork(network.url, filePath);
          console.log(`Downloaded ${network.name} successfully`);
        } catch (error) {
          console.error(`Failed to download ${network.name}:`, error);
          throw error;
        }
      } else {
        console.log(`Network file ${network.name} already exists`);
      }
    }
  }
  
  /**
   * Download a network file
   */
  private async downloadNetwork(url: string, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const https = require('https');
      const file = fs.createWriteStream(filePath);
      
      https.get(url, (response: any) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download network: ${response.statusCode}`));
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (error: Error) => {
        fs.unlink(filePath, () => {}); // Delete the file if download failed
        reject(error);
      });
    });
  }
  
  /**
   * Initialize engines for common personalities
   */
  private initializeEngines(): void {
    // Initialize only a subset of engines to save resources
    const priorityEngines = [1, 2, 10, 12]; // IDs of most commonly used engines
    
    for (const id of priorityEngines) {
      this.queueEngine(id);
    }
  }
  
  /**
   * Queue an engine for initialization
   */
  private queueEngine(id: number): void {
    if (this.engines.has(id) || this.engineQueue.includes(id)) {
      return;
    }
    
    this.engineQueue.push(id);
    this.processEngineQueue();
  }
  
  /**
   * Process the engine queue
   */
  private processEngineQueue(): void {
    // Process queue if we have capacity
    while (this.engineQueue.length > 0 && this.engines.size < this.maxConcurrentEngines) {
      const id = this.engineQueue.shift();
      if (id !== undefined) {
        this.initializeEngine(id);
      }
    }
  }
  
  /**
   * Initialize a specific engine
   */
  private initializeEngine(id: number): Lc0Engine | null {
    const personality = enginePersonalities.find(p => p.id === id);
    if (!personality) {
      console.error(`Personality ID ${id} not found`);
      return null;
    }
    
    try {
      // Get full path to network file
      const networkPath = path.join(this.networkBasePath, personality.networkPath);
      
      // Create and start the engine
      const engine = new Lc0Engine(id, networkPath, personality.options);
      
      // Set up event listeners
      engine.on('ready', () => {
        console.log(`Engine ${id} (${personality.name}) is ready`);
      });
      
      engine.on('error', (error) => {
        console.error(`Engine ${id} (${personality.name}) error:`, error);
        this.engines.delete(id);
        this.processEngineQueue();
      });
      
      engine.on('exit', (code) => {
        console.log(`Engine ${id} (${personality.name}) exited with code ${code}`);
        this.engines.delete(id);
        this.processEngineQueue();
      });
      
      // Start the engine
      engine.start();
      this.engines.set(id, engine);
      
      return engine;
    } catch (error) {
      console.error(`Failed to initialize engine ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Generate a chess move using the specified personality
   */
  async generateMove(fen: string, personalityId: number): Promise<string> {
    try {
      // Get or initialize the engine
      let engine = this.engines.get(personalityId);
      if (!engine) {
        // Queue the engine for initialization if not already in queue
        this.queueEngine(personalityId);
        
        // Wait for the engine to be initialized
        let attempts = 0;
        while (!this.engines.has(personalityId) && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }
        
        engine = this.engines.get(personalityId);
        if (!engine) {
          throw new Error(`Failed to initialize engine for personality ${personalityId}`);
        }
      }
      
      // Wait for the engine to be ready
      if (!engine.isReady()) {
        let attempts = 0;
        while (!engine.isReady() && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }
        
        if (!engine.isReady()) {
          throw new Error(`Engine for personality ${personalityId} is not ready`);
        }
      }
      
      // Mark engine as active
      this.activeEngines.add(personalityId);
      
      try {
        // Get the personality to determine move time
        const personality = enginePersonalities.find(p => p.id === personalityId);
        const moveTime = this.calculateMoveTime(personality?.elo || 1500);
        
        // Get move from engine
        const uciMove = await engine.getMove(fen, moveTime);
        
        // Convert UCI move to SAN format
        const chess = new Chess(fen);
        const moveObj = {
          from: uciMove.substring(0, 2),
          to: uciMove.substring(2, 4),
          promotion: uciMove.length > 4 ? uciMove.substring(4, 5) : undefined
        };
        
        const sanMove = chess.move(moveObj);
        
        // Mark engine as inactive
        this.activeEngines.delete(personalityId);
        
        return sanMove.san;
      } catch (error) {
        // Mark engine as inactive
        this.activeEngines.delete(personalityId);
        throw error;
      }
    } catch (error) {
      console.error(`Error generating move for personality ${personalityId}:`, error);
      
      // Fallback to random move
      const chess = new Chess(fen);
      const moves = chess.moves();
      if (moves.length === 0) return null;
      
      return moves[Math.floor(Math.random() * moves.length)];
    }
  }
  
  /**
   * Calculate move time based on ELO rating
   */
  private calculateMoveTime(elo: number): number {
    // Scale move time based on ELO
    // Lower ELO = faster moves (less calculation)
    // Higher ELO = slower moves (more calculation)
    const baseTime = 500; // 500ms base
    const maxTime = 3000; // 3000ms max
    
    // Scale from 500ms at 1000 ELO to 3000ms at 2800 ELO
    const scaleFactor = (elo - 1000) / 1800;
    const clampedFactor = Math.max(0, Math.min(1, scaleFactor));
    
    return Math.round(baseTime + clampedFactor * (maxTime - baseTime));
  }
  
  /**
   * Get all personalities
   */
  getPersonalities(): EnginePersonality[] {
    return enginePersonalities;
  }
  
  /**
   * Get a specific personality by ID
   */
  getPersonality(id: number): EnginePersonality | undefined {
    return enginePersonalities.find(p => p.id === id);
  }
  
  /**
   * Shutdown all engines
   */
  shutdown(): void {
    console.log('Shutting down all engines...');
    // Stop all engines
    for (const [id, engine] of this.engines.entries()) {
      console.log(`Stopping engine ${id}...`);
      engine.stop();
    }
    this.engines.clear();
    this.activeEngines.clear();
    this.engineQueue = [];
  }
}

// Singleton instance
export const engineManager = new EngineManager();
