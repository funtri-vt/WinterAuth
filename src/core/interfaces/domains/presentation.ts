/**
 * Presentation Domain Interfaces
 * Defines how the core engine requests UI rendering from the host environment.
 */

export interface RenderContext {
  csrfToken: string;
  error?: string;
  redirectUri?: string;
}

export interface PresentationHandler {
  /** Returns the standard Login screen / JSON response */
  renderLogin(req: Request, context: RenderContext): Response | Promise<Response>;
  
  /** Returns the MFA/Passkey challenge screen / JSON response */
  renderMFA(req: Request, context: RenderContext): Response | Promise<Response>;
  
  /** Returns a generic error screen / JSON response */
  renderError(req: Request, message: string, status?: number): Response | Promise<Response>;
}