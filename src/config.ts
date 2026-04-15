/**
 * WinterAuth Master Configuration
 * * This is the file you edit to customize your Identity Provider.
 * Swap out these modules to change how data is stored, hashed, and displayed.
 */
import type { 
  WinterAuthConfig, 
  UserRepository, 
  SessionRepository, 
  AuthFactorRepository, 
  HashProvider, 
  PresentationHandler 
} from './core/interfaces';
import type { Env } from './adapters/cloudflare';
import { D1StorageManager } from './modules/storage/d1';
import { WebCryptoHashProvider } from './modules/crypto/webcrypto';
import { DefaultUIHandler } from './modules/ui/default-ui';

/**
 * Builds the configuration for the WinterAuth engine.
 * We use a function here so we can access the runtime environment variables (env).
 */
export function buildCloudflareConfig(env: Env): WinterAuthConfig {
  // Initialize the database manager with the Cloudflare binding
  const dbManager = new D1StorageManager(env.DB);

  // Leveraging our new event listener to confirm initialization
  dbManager.onReady(() => {
    console.log('[WinterAuth] Storage Provider is fully initialized and ready!');
  });

  return {
    // 1. Core Identity Settings
    issuerName: env.ISSUER_URL || 'http://localhost:8787',
    jwtSecret: env.JWT_SECRET || 'dev-secret-do-not-use-in-prod',
    
    // Safety flag: Set this to true in your production environment to lock down test endpoints
    isProduction: false, 

    // 2. Storage Modules (Where your data lives)
    storage: {
      init: () => dbManager.init(), // Expose init to the core engine's IAM router
      users: dbManager.users,
      sessions: dbManager.sessions,
      authFactors: dbManager.authFactors,
    },

    // 3. Cryptography Modules (How you hash/encrypt data)
    crypto: {
      hashing: new WebCryptoHashProvider(),
    },

    // 4. Presentation Module (How your UI looks)
    ui: new DefaultUIHandler(),
    
    // 5. Security Policies
    policies: {
      allowPasswordFallback: true,
      requireMFA: false,
      sessionDurationSeconds: 86400 // 24 hours
    }
  };
}