/**
 * WinterAuth Core Engine
 * The main entry point for the Identity Provider. This class is completely 
 * agnostic to the host environment (Cloudflare, Node, Deno) and relies 
 * entirely on standard Web APIs (Request, Response).
 */
import type { WinterAuthConfig } from './interfaces';

export class WinterAuth {
  private config: WinterAuthConfig;

  constructor(config: WinterAuthConfig) {
    this.validateConfig(config);
    this.config = config;
  }

  /**
   * Fails fast if the user provided an invalid configuration.
   */
  private validateConfig(config: WinterAuthConfig) {
    if (!config.issuerName) throw new Error("WinterAuth: 'issuerName' is required.");
    if (!config.jwtSecret) throw new Error("WinterAuth: 'jwtSecret' is required.");
    if (!config.storage?.users) throw new Error("WinterAuth: 'storage.users' repository is required.");
    if (!config.ui) throw new Error("WinterAuth: 'ui' PresentationHandler is required.");
  }

  /**
   * The Universal Web Standard Entry Point.
   * Host adapters (like Cloudflare fetch handlers) pass the Request here.
   */
  public async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // ==========================================
      // 1. OIDC PROTOCOL & DISCOVERY
      // Machine-to-machine SSO handoffs
      // ==========================================
      if (path.startsWith('/.well-known/') || path.startsWith('/oidc/')) {
        return await this.handleOIDCRequest(request, url);
      }

      // ==========================================
      // 2. AUTHENTICATION UI
      // Human-to-machine login flows
      // ==========================================
      if (path.startsWith('/auth/')) {
        return await this.handleAuthUIRequest(request, url);
      }

      // ==========================================
      // 3. IAM MANAGEMENT API
      // Admin endpoints for user/session management
      // ==========================================
      if (path.startsWith('/api/iam/')) {
        return await this.handleIAMRequest(request, url);
      }

      // If no route matches, return a standard 404
      return new Response('Not Found', { status: 404 });

    } catch (error: any) {
      console.error('[WinterAuth Engine Error]', error);

      // If it was a human UI request, try to render a pretty error page
      if (path.startsWith('/auth/')) {
        try {
          return await this.config.ui.renderError(request, 'An unexpected internal error occurred.', 500);
        } catch (uiError) {
          // If the UI renderer itself crashes, fall through to plain text
          console.error('[WinterAuth UI Render Error]', uiError);
        }
      }

      // Fallback response for APIs or failed UI renders
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // ==========================================
  // SUB-ROUTERS (To be expanded)
  // ==========================================

  private async handleOIDCRequest(req: Request, url: URL): Promise<Response> {
    switch (url.pathname) {
      case '/.well-known/openid-configuration':
        // The Discovery Document tells Service Providers (like Cloudflare Access)
        // where to find our authorization and token endpoints.
        const discoveryDoc = {
          issuer: this.config.issuerName,
          authorization_endpoint: `${this.config.issuerName}/oidc/authorize`,
          token_endpoint: `${this.config.issuerName}/oidc/token`,
          jwks_uri: `${this.config.issuerName}/oidc/jwks`,
          response_types_supported: ["code"],
          subject_types_supported: ["public"],
          id_token_signing_alg_values_supported: ["RS256"]
        };
        return new Response(JSON.stringify(discoveryDoc), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      case '/oidc/authorize':
        // TODO: Validate client, generate state, redirect to /auth/login
        return new Response('OIDC Authorize - Not Implemented', { status: 501 });
      case '/oidc/token':
        // TODO: Exchange auth code for JWT
        return new Response('OIDC Token - Not Implemented', { status: 501 });
      case '/oidc/jwks':
        // TODO: Expose public keys
        return new Response('OIDC JWKS - Not Implemented', { status: 501 });
      default:
        return new Response('OIDC Endpoint Not Found', { status: 404 });
    }
  }

  private async handleAuthUIRequest(req: Request, url: URL): Promise<Response> {
    switch (url.pathname) {
      case '/auth/login':
        if (req.method === 'GET') {
          // TODO: Generate a cryptographically secure CSRF token and store it in a cookie.
          // Using a UUID temporarily just so the UI renders.
          const csrfToken = crypto.randomUUID();
          return await this.config.ui.renderLogin(req, { csrfToken });
        } else if (req.method === 'POST') {
          // TODO: Parse the form data, hash the password, check against D1, create a session
          return new Response('Login POST - Auth logic coming next', { status: 501 });
        }
        return new Response('Method Not Allowed', { status: 405 });
      case '/auth/mfa':
        // TODO: Render MFA/Passkey challenge
        return new Response('Auth MFA - Not Implemented', { status: 501 });
      case '/auth/recover':
        // TODO: Handle account recovery flow
        return new Response('Auth Recovery - Not Implemented', { status: 501 });
      default:
        return new Response('Auth Page Not Found', { status: 404 });
    }
  }

  private async handleIAMRequest(req: Request, url: URL): Promise<Response> {
    // Basic security check: Ensure API requests are authorized (e.g., Bearer token)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    switch (url.pathname) {
      case '/api/iam/users':
        return new Response('IAM Users - Not Implemented', { status: 501 });
      case '/api/iam/sessions':
        return new Response('IAM Sessions - Not Implemented', { status: 501 });
      default:
        return new Response('IAM Endpoint Not Found', { status: 404 });
    }
  }
}