/**
 * Cloudflare Workers Adapter for WinterAuth
 * * This is the main entry point when deploying to Cloudflare. 
 * It maps Cloudflare's specific environment bindings (like D1 and Secrets)
 * into the agnostic WinterAuthConfig, then boots the core engine.
 */
import { WinterAuth } from '../core/engine';
import type { D1Database, ExecutionContext } from '@cloudflare/workers-types';
import { buildCloudflareConfig } from '../config';

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
    
    // 1. Build the WinterAuth Configuration from the user's config file
    // We pass the Cloudflare 'env' object so the config file can access the DB and secrets.
    const config = buildCloudflareConfig(env);

    // 2. Initialize the Engine
    // The engine doesn't know it's on Cloudflare. It just knows it has a valid config.
    const authEngine = new WinterAuth(config);

    // 3. Handle the Request
    // Pass the standard Web Request in, and return the standard Web Response out.
    return await authEngine.handleRequest(request);
  }
};