/**
 * Core Data Models
 * Defines the shape of the primary entities used throughout WinterAuth.
 */

export interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string; // The cryptographically secure session ID
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface PasskeyFactor {
  id: string;
  userId: string;
  credentialId: string; // Base64URL encoded credential ID from WebAuthn
  publicKey: string;    // Base64URL encoded public key
  counter: number;      // Used to prevent replay attacks
}