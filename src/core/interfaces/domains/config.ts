/**
 * Master Configuration Interface
 * Ties all domains together into a single configuration object used to boot the engine.
 */
import type { UserRepository, SessionRepository, AuthFactorRepository } from './storage';
import type { HashProvider, EncryptionProvider } from './crypto';
import type { EmailProvider } from './communication';
import type { PresentationHandler } from './presentation';

export interface WinterAuthConfig {
  // Required identity settings
  issuerName: string; // e.g., "https://auth.mycompany.com"
  jwtSecret: string;  // Secret used to sign outgoing OIDC tokens
  
  // Environment Flag
  isProduction?: boolean; // Disables testing endpoints and enforces strict security
  
  // Storage layer
  storage: {
    init?: () => Promise<void>; // Optional: Exposes manual schema initialization for API triggers
    users: UserRepository;
    sessions: SessionRepository;
    authFactors: AuthFactorRepository;
  };

  // Cryptography layer
  crypto: {
    hashing: HashProvider;
    encryption?: EncryptionProvider; // Optional: If missing, data isn't encrypted at rest
  };

  // Presentation layer
  ui: PresentationHandler;

  // Communications layer
  email?: EmailProvider; // Optional: If missing, email recovery is disabled
  
  // Security Policies
  policies?: {
    allowPasswordFallback?: boolean; // Default true
    sessionDurationSeconds?: number; // Default 86400 (24h)
    requireMFA?: boolean;            // Default false
  };
}