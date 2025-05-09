import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

/**
 * Wrapper for the Leela Chess Zero engine
 * Handles communication with the engine process using UCI protocol
 */
export class Lc0Engine extends EventEmitter {
  private process: ChildProcess | null = null;
  private networkPath: string;
  private options: Record<string, any>;
  private ready: boolean = false;
  private buffer: string = '';
  private id: number;
  
  /**
   * Create a new Lc0Engine instance
   * @param id Unique identifier for this engine instance
   * @param networkPath Path to the neural network weights file
   * @param options Engine configuration options
   */
  constructor(id: number, networkPath: string, options: Record<string, any> = {}) {
    super();
    this.id = id;
    this.networkPath = networkPath;
    this.options = options;
  }
  
  /**
   * Start the engine process
   */
  start(): void {
    try {
      const args = [
        '--weights=' + this.networkPath,
        '--backend=blas', // Use BLAS backend for CPU computation
        // Add personality-specific options
        ...(this.options.temperature ? [`--temperature=${this.options.temperature}`] : []),
        ...(this.options.cpuct ? [`--cpuct=${this.options.cpuct}`] : []),
        ...(this.options.fpu_reduction ? [`--fpu-reduction=${this.options.fpu_reduction}`] : []),
        ...(this.options.policy_temp ? [`--policy-temp=${this.options.policy_temp}`] : []),
        ...(this.options.nodes ? [`--nodes=${this.options.nodes}`] : []),
        ...(this.options.contempt ? [`--contempt=${this.options.contempt}`] : []),
        ...(this.options.skill_level ? [`--skill-level=${this.options.skill_level}`] : []),
      ];
      
      console.log(`Starting Lc0 engine (ID: ${this.id}) with args:`, args);
      
      this.process = spawn('lc0', args);
      
      this.process.stdout.on('data', (data) => {
        this.buffer += data.toString();
        this.processBuffer();
      });
      
      this.process.stderr.on('data', (data) => {
        console.error(`Lc0 Error (ID: ${this.id}):`, data.toString());
      });
      
      this.process.on('close', (code) => {
        console.log(`Lc0 process (ID: ${this.id}) exited with code ${code}`);
        this.ready = false;
        this.emit('exit', code);
      });
      
      this.process.on('error', (error) => {
        console.error(`Lc0 process error (ID: ${this.id}):`, error);
        this.ready = false;
        this.emit('error', error);
      });
      
      // Initialize UCI
      this.sendCommand('uci');
      this.sendCommand('isready');
    } catch (error) {
      console.error(`Failed to start Lc0 engine (ID: ${this.id}):`, error);
      this.emit('error', error);
    }
  }
  
  /**
   * Process the output buffer from the engine
   */
  private processBuffer(): void {
    const lines = this.buffer.split('\n');
    // Keep the last line if it's incomplete
    this.buffer = lines.pop() || '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.includes('bestmove')) {
        const match = trimmedLine.match(/bestmove\s+(\w+)/);
        if (match && match[1]) {
          this.emit('move', match[1]);
        }
      } else if (trimmedLine.includes('readyok')) {
        this.ready = true;
        this.emit('ready');
      } else if (trimmedLine.startsWith('info')) {
        // Parse info lines for score, depth, etc.
        this.parseInfoLine(trimmedLine);
      }
    }
  }
  
  /**
   * Parse info lines from the engine for additional data
   */
  private parseInfoLine(line: string): void {
    // Extract score
    const scoreMatch = line.match(/score\s+cp\s+(-?\d+)/);
    if (scoreMatch) {
      const score = parseInt(scoreMatch[1]);
      this.emit('score', score);
    }
    
    // Extract depth
    const depthMatch = line.match(/depth\s+(\d+)/);
    if (depthMatch) {
      const depth = parseInt(depthMatch[1]);
      this.emit('depth', depth);
    }
    
    // Extract principal variation
    const pvMatch = line.match(/pv\s+(.*?)(?=\s+bmc|$)/);
    if (pvMatch) {
      const pv = pvMatch[1].trim().split(' ');
      this.emit('pv', pv);
    }
  }
  
  /**
   * Get a move from the engine for a given position
   * @param fen FEN string representing the position
   * @param moveTime Time in milliseconds to think
   * @returns Promise that resolves to the best move in UCI format
   */
  async getMove(fen: string, moveTime: number = 1000): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.process || !this.ready) {
        reject(new Error(`Engine not ready (ID: ${this.id})`));
        return;
      }
      
      const moveListener = (move: string) => {
        this.removeListener('move', moveListener);
        resolve(move);
      };
      
      this.on('move', moveListener);
      
      // Set position and start thinking
      this.sendCommand(`position fen ${fen}`);
      this.sendCommand(`go movetime ${moveTime}`);
      
      // Set a timeout in case the engine doesn't respond
      setTimeout(() => {
        this.removeListener('move', moveListener);
        reject(new Error(`Engine timeout (ID: ${this.id})`));
      }, moveTime + 5000); // Add 5 seconds buffer
    });
  }
  
  /**
   * Send a command to the engine
   * @param command UCI command to send
   */
  sendCommand(command: string): void {
    if (this.process && this.process.stdin.writable) {
      this.process.stdin.write(command + '\n');
    } else {
      console.error(`Cannot send command to engine (ID: ${this.id}): process not available or stdin not writable`);
    }
  }
  
  /**
   * Check if the engine is ready
   */
  isReady(): boolean {
    return this.ready;
  }
  
  /**
   * Stop the engine process
   */
  stop(): void {
    if (this.process) {
      try {
        this.sendCommand('quit');
        
        // Force kill after 1 second if not exited
        setTimeout(() => {
          if (this.process) {
            console.log(`Forcing engine termination (ID: ${this.id})`);
            this.process.kill('SIGKILL');
            this.process = null;
            this.ready = false;
          }
        }, 1000);
      } catch (error) {
        console.error(`Error stopping engine (ID: ${this.id}):`, error);
        if (this.process) {
          this.process.kill('SIGKILL');
          this.process = null;
        }
        this.ready = false;
      }
    }
  }
}
