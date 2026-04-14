/**
 * Cloudflare Workers Adapter for WinterAuth
 * * This is the main entry point when deploying to Cloudflare. 
 * It maps Cloudflare's specific environment bindings (like D1 and Secrets)
 * into the agnostic WinterAuthConfig, then boots the core engine.
 */
import { WinterAuth } from '../core/engine';
import type { 
  WinterAuthConfig, 
  UserRepository, 
  SessionRepository, 
  AuthFactorRepository, 
  HashProvider, 
  PresentationHandler 
} from '../core/interfaces';

// TODO: These will be imported from our actual module implementations later
// import { D1UserRepository } from '../modules/storage/d1-users';
// import { D1SessionRepository } from '../modules/storage/d1-sessions';
// import { WebCryptoHashProvider } from '../modules/crypto/webcrypto';
// import { DefaultUIHandler } from '../modules/ui/default-ui';

/**
 * Define your Cloudflare bindings here.
 * These match the bindings configured in your wrangler.toml file.
 */
export interface Env {
  DB: D1Database; // Cloudflare D1 SQL Database
  JWT_SECRET: string; // Stored securely in Cloudflare Secrets
  ISSUER_URL: string; // E.g., "https://auth.mycompany.com"
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    
    // 1. Build the WinterAuth Configuration
    // We map the Cloudflare-specific 'env' variables into our agnostic config.
    const config: WinterAuthConfig = {
      issuerName: env.ISSUER_URL || 'http://localhost:8787',
      jwtSecret: env.JWT_SECRET || 'dev-secret-do-not-use-in-prod',
      
      // Injecting the Storage Modules
      storage: {
        // users: new D1UserRepository(env.DB),
        users: {} as UserRepository, // Placeholder until module is built
        
        // sessions: new D1SessionRepository(env.DB),
        sessions: {} as SessionRepository, // Placeholder
        
        // authFactors: new D1AuthFactorRepository(env.DB),
        authFactors: {} as AuthFactorRepository, // Placeholder
      },

      // Injecting the Cryptography Modules
      crypto: {
        // hashing: new WebCryptoHashProvider(),
        hashing: {} as HashProvider, // Placeholder
      },

      // Injecting the Presentation Module
      // ui: new DefaultUIHandler(),
      ui: {} as PresentationHandler, // Placeholder
      
      policies: {
        allowPasswordFallback: true,
        requireMFA: false,
        sessionDurationSeconds: 86400 // 24 hours
      }
    };

    // 2. Initialize the Engine
    // The engine doesn't know it's on Cloudflare. It just knows it has a valid config.
    const authEngine = new WinterAuth(config);

    // 3. Handle the Request
    // Pass the standard Web Request in, and return the standard Web Response out.
    return await authEngine.handleRequest(request);
  }
};