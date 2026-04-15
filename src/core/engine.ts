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
        return new Response('OIDC Authorize - Not Implemented', { status: 501 });
      case '/oidc/token':
        return new Response('OIDC Token - Not Implemented', { status: 501 });
      case '/oidc/jwks':
        return new Response('OIDC JWKS - Not Implemented', { status: 501 });
      default:
        return new Response('OIDC Endpoint Not Found', { status: 404 });
    }
  }

  private async handleAuthUIRequest(req: Request, url: URL): Promise<Response> {
    switch (url.pathname) {
      case '/auth/login':
        if (req.method === 'GET') {
          const csrfToken = crypto.randomUUID();
          return await this.config.ui.renderLogin(req, { csrfToken });
        } else if (req.method === 'POST') {
          try {
            const formData = await req.formData();
            const email = formData.get('email')?.toString();
            const password = formData.get('password')?.toString();

            if (!email || !password) {
              return await this.config.ui.renderError(req, 'Email and password are required.', 400);
            }

            // 1. Find User by Email
            const user = await this.config.storage.users.getUserByEmail(email);
            if (!user) {
              // We return a generic error to avoid leaking which emails exist in the database
              return await this.config.ui.renderLogin(req, { csrfToken: crypto.randomUUID(), error: 'Invalid email or password.' });
            }

            // 2. Fetch the stored password hash
            const hash = await this.config.storage.authFactors.getPasswordHash(user.id);
            if (!hash) {
              return await this.config.ui.renderLogin(req, { csrfToken: crypto.randomUUID(), error: 'Invalid email or password.' });
            }

            // 3. Verify the password
            const isValid = await this.config.crypto.hashing.verify(password, hash);
            if (!isValid) {
              return await this.config.ui.renderLogin(req, { csrfToken: crypto.randomUUID(), error: 'Invalid email or password.' });
            }

            // 4. Create a new Session
            const sessionDuration = this.config.policies?.sessionDurationSeconds || 86400; // Default 24h
            const expiresAt = new Date(Date.now() + sessionDuration * 1000);
            const session = await this.config.storage.sessions.createSession(user.id, expiresAt);

            // 5. Redirect on Success and set the Session Cookie
            return new Response('Redirecting...', {
              status: 302,
              headers: {
                'Location': '/auth/success',
                // Set the secure session cookie
                'Set-Cookie': `winterauth_session=${session.id}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${sessionDuration}`
              }
            });

          } catch (err: any) {
            console.error('[Login Processing Error]', err);
            return await this.config.ui.renderError(req, 'An error occurred during sign in.', 500);
          }
        }
        return new Response('Method Not Allowed', { status: 405 });
      case '/auth/mfa':
        return new Response('Auth MFA - Not Implemented', { status: 501 });
      case '/auth/recover':
        return new Response('Auth Recovery - Not Implemented', { status: 501 });
      case '/auth/success':
        // A temporary success route so we can verify the login worked before building the OIDC handoff
        return new Response(`
          <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
            <h1 style="color: #10b981;">Login Successful! 🎉</h1>
            <p>Your session cookie has been set. The OIDC handoff will start from here later.</p>
          </div>
        `, {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' } // Added UTF-8 charset
        });
      default:
        return new Response('Auth Page Not Found', { status: 404 });
    }
  }

  private async handleIAMRequest(req: Request, url: URL): Promise<Response> {
    // --------------------------------------------------------
    // Testing Endpoints (Bypass Auth, Disabled in Production)
    // --------------------------------------------------------
    if (url.pathname === '/api/iam/test/register') {
      if (this.config.isProduction) {
        return new Response(JSON.stringify({ error: 'Endpoint disabled in production.' }), { status: 404 });
      }
      if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

      try {
        const body = await req.json() as any;
        if (!body.email || !body.password) {
          return new Response(JSON.stringify({ error: 'Missing email or password' }), { status: 400 });
        }

        // 1. Create the user
        const user = await this.config.storage.users.createUser(body.email);
        
        // 2. Hash the password using our WebCrypto provider
        const hash = await this.config.crypto.hashing.hash(body.password);
        
        // 3. Save the password hash to the Auth Factors repository
        await this.config.storage.authFactors.savePasswordHash(user.id, hash);

        return new Response(JSON.stringify({ success: true, message: 'Test user created.', user }), { 
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: 'Failed to create user', details: e.message }), { status: 500 });
      }
    }

    // --------------------------------------------------------
    // Protected IAM Endpoints
    // --------------------------------------------------------
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Missing Bearer token.' }), { status: 401 });
    }

    switch (url.pathname) {
      case '/api/iam/init':
        if (this.config.storage.init) {
          try {
            await this.config.storage.init();
            return new Response(JSON.stringify({ success: true, message: 'Storage schemas initialized successfully.' }), { status: 200 });
          } catch (e: any) {
            return new Response(JSON.stringify({ error: 'Initialization failed', details: e.message }), { status: 500 });
          }
        }
        return new Response(JSON.stringify({ error: 'Configured storage provider does not support manual initialization.' }), { status: 400 });
        
      case '/api/iam/users':
        return new Response('IAM Users - Not Implemented', { status: 501 });
      case '/api/iam/sessions':
        return new Response('IAM Sessions - Not Implemented', { status: 501 });
      default:
        return new Response('IAM Endpoint Not Found', { status: 404 });
    }
  }
}