/**
 * Cloudflare D1 Storage Manager
 * * Handles the SQLite database connection, automated schema initialization,
 * and groups the sub-repositories (users, sessions, authFactors) together.
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { 
  UserRepository, 
  SessionRepository, 
  AuthFactorRepository,
  User,
  Session,
  PasskeyFactor
} from '../../core/interfaces';

export class D1StorageManager {
  public db: D1Database;
  private isReady: boolean = false;
  private readyPromise: Promise<void> | null = null;
  private onReadyCallbacks: Array<() => void> = [];

  // Sub-repositories exposed to the core engine
  public users: UserRepository;
  public sessions: SessionRepository;
  public authFactors: AuthFactorRepository;

  constructor(db: D1Database) {
    this.db = db;
    
    // Initialize the repositories, passing 'this' so they can wait for the ready() state
    this.users = new D1UserRepository(this);
    this.sessions = new D1SessionRepository(this);
    this.authFactors = new D1AuthFactorRepository(this);
  }

  /**
   * Registers a callback to be fired when the database schemas are fully initialized.
   */
  public onReady(callback: () => void) {
    if (this.isReady) {
      callback();
    } else {
      this.onReadyCallbacks.push(callback);
    }
  }

  /**
   * Checks if the schema is initialized. If not, it safely initializes it.
   * Repositories should await this before running queries.
   */
  public async ready(): Promise<void> {
    if (this.isReady) return;
    if (this.readyPromise) return this.readyPromise;

    this.readyPromise = (async () => {
      // Check if the 'users' table exists as a proxy for initialization
      const check = await this.db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
      ).first();

      if (!check) {
        await this.init();
      }

      this.isReady = true;
      this.onReadyCallbacks.forEach(cb => cb());
    })();

    return this.readyPromise;
  }

  /**
   * Manually initializes the database schemas.
   */
  public async init(): Promise<void> {
    const statements = [
      this.db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY, 
          email TEXT UNIQUE NOT NULL, 
          created_at INTEGER, 
          updated_at INTEGER
        )
      `),
      this.db.prepare(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY, 
          user_id TEXT NOT NULL, 
          expires_at INTEGER, 
          created_at INTEGER
        )
      `),
      this.db.prepare(`
        CREATE TABLE IF NOT EXISTS auth_factors (
          user_id TEXT PRIMARY KEY, 
          password_hash TEXT, 
          recovery_codes TEXT
        )
      `),
      this.db.prepare(`
        CREATE TABLE IF NOT EXISTS passkeys (
          id TEXT PRIMARY KEY, 
          user_id TEXT NOT NULL, 
          credential_id TEXT NOT NULL, 
          public_key TEXT NOT NULL, 
          counter INTEGER
        )
      `)
    ];
    
    await this.db.batch(statements);
    console.log('[D1StorageManager] Schemas initialized successfully.');
  }
}

// ==========================================
// SUB-REPOSITORIES
// ==========================================

class D1UserRepository implements UserRepository {
  constructor(private manager: D1StorageManager) {}

  async createUser(email: string): Promise<User> {
    await this.manager.ready();
    // TODO: Implement SQL INSERT
    throw new Error('Not implemented');
  }

  async getUserById(id: string): Promise<User | null> {
    await this.manager.ready();
    // TODO: Implement SQL SELECT
    throw new Error('Not implemented');
  }

  async getUserByEmail(email: string): Promise<User | null> {
    await this.manager.ready();
    // TODO: Implement SQL SELECT
    throw new Error('Not implemented');
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    await this.manager.ready();
    // TODO: Implement SQL UPDATE
    throw new Error('Not implemented');
  }
}

class D1SessionRepository implements SessionRepository {
  constructor(private manager: D1StorageManager) {}

  async createSession(userId: string, expiresAt: Date): Promise<Session> {
    await this.manager.ready();
    throw new Error('Not implemented');
  }

  async getSession(sessionId: string): Promise<Session | null> {
    await this.manager.ready();
    throw new Error('Not implemented');
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.manager.ready();
    throw new Error('Not implemented');
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.manager.ready();
    throw new Error('Not implemented');
  }
}

class D1AuthFactorRepository implements AuthFactorRepository {
  constructor(private manager: D1StorageManager) {}

  async savePasswordHash(userId: string, hash: string): Promise<void> {
    await this.manager.ready();
    throw new Error('Not implemented');
  }

  async getPasswordHash(userId: string): Promise<string | null> {
    await this.manager.ready();
    throw new Error('Not implemented');
  }

  async savePasskey(userId: string, passkey: PasskeyFactor): Promise<void> {
    await this.manager.ready();
    throw new Error('Not implemented');
  }

  async getPasskeys(userId: string): Promise<PasskeyFactor[]> {
    await this.manager.ready();
    throw new Error('Not implemented');
  }

  async updatePasskeyCounter(credentialId: string, newCounter: number): Promise<void> {
    await this.manager.ready();
    throw new Error('Not implemented');
  }

  async saveRecoveryCodes(userId: string, hashedCodes: string[]): Promise<void> {
    await this.manager.ready();
    throw new Error('Not implemented');
  }

  async consumeRecoveryCode(userId: string, hashedCode: string): Promise<boolean> {
    await this.manager.ready();
    throw new Error('Not implemented');
  }
}