/**
 * Storage Domain Interfaces
 * Defines the Repository Pattern contracts for data persistence.
 */
import type { User, Session, PasskeyFactor } from './models';

export interface UserRepository {
  createUser(email: string): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
}

export interface SessionRepository {
  createSession(userId: string, expiresAt: Date): Promise<Session>;
  getSession(sessionId: string): Promise<Session | null>;
  revokeSession(sessionId: string): Promise<void>;
  revokeAllUserSessions(userId: string): Promise<void>;
}

export interface AuthFactorRepository {
  // Passwords
  savePasswordHash(userId: string, hash: string): Promise<void>;
  getPasswordHash(userId: string): Promise<string | null>;
  
  // Passkeys (WebAuthn)
  savePasskey(userId: string, passkey: PasskeyFactor): Promise<void>;
  getPasskeys(userId: string): Promise<PasskeyFactor[]>;
  updatePasskeyCounter(credentialId: string, newCounter: number): Promise<void>;

  // Recovery Codes
  saveRecoveryCodes(userId: string, hashedCodes: string[]): Promise<void>;
  /**
   * Attempts to consume a recovery code. 
   * Returns true if valid (and deletes it), false if invalid.
   */
  consumeRecoveryCode(userId: string, hashedCode: string): Promise<boolean>;
}