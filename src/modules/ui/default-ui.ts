/**
 * Default UI Handler
 * Implements the PresentationHandler interface.
 * Returns simple, server-side rendered HTML using standard Web Responses.
 */
import type { PresentationHandler, RenderContext } from '../../core/interfaces';

export class DefaultUIHandler implements PresentationHandler {
  
  private baseTemplate(title: string, content: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} | WinterAuth</title>
        <style>
          :root {
            --bg: #0f172a;
            --surface: #1e293b;
            --text: #f8fafc;
            --primary: #3b82f6;
            --primary-hover: #2563eb;
            --error: #ef4444;
          }
          body {
            background-color: var(--bg);
            color: var(--text);
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .container {
            background: var(--surface);
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            width: 100%;
            max-width: 400px;
          }
          h1 { margin-top: 0; font-size: 1.5rem; text-align: center; }
          .error-box { background: rgba(239, 68, 68, 0.1); border: 1px solid var(--error); color: var(--error); padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.875rem; }
          form { display: flex; flex-direction: column; gap: 1rem; }
          input { padding: 0.75rem; border-radius: 6px; border: 1px solid #475569; background: #0f172a; color: white; font-size: 1rem; }
          button { background: var(--primary); color: white; border: none; padding: 0.75rem; border-radius: 6px; font-size: 1rem; cursor: pointer; font-weight: 600; transition: background 0.2s; }
          button:hover { background: var(--primary-hover); }
        </style>
      </head>
      <body>
        <div class="container">
          ${content}
        </div>
      </body>
      </html>
    `;
  }

  async renderLogin(req: Request, context: RenderContext): Promise<Response> {
    const errorHtml = context.error ? `<div class="error-box">${context.error}</div>` : '';
    
    const content = `
      <h1>Sign In</h1>
      ${errorHtml}
      <form method="POST" action="/auth/login">
        <input type="hidden" name="csrf" value="${context.csrfToken}" />
        <input type="email" name="email" placeholder="Email address" required autofocus />
        <input type="password" name="password" placeholder="Password" required />
        <button type="submit">Continue</button>
      </form>
    `;

    return new Response(this.baseTemplate('Sign In', content), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  async renderMFA(req: Request, context: RenderContext): Promise<Response> {
    const errorHtml = context.error ? `<div class="error-box">${context.error}</div>` : '';
    
    const content = `
      <h1>Two-Factor Authentication</h1>
      <p style="text-align: center; font-size: 0.875rem; color: #94a3b8; margin-bottom: 1.5rem;">
        Enter the 6-digit code from your authenticator app.
      </p>
      ${errorHtml}
      <form method="POST" action="/auth/mfa">
        <input type="hidden" name="csrf" value="${context.csrfToken}" />
        <input type="text" name="code" placeholder="000000" required autocomplete="one-time-code" pattern="\\d{6}" style="text-align: center; letter-spacing: 0.5rem; font-size: 1.25rem;" />
        <button type="submit">Verify</button>
      </form>
    `;

    return new Response(this.baseTemplate('MFA', content), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  async renderError(req: Request, message: string, status: number = 500): Promise<Response> {
    const content = `
      <h1 style="color: var(--error);">Error ${status}</h1>
      <p style="text-align: center; margin-bottom: 1.5rem;">${message}</p>
      <button onclick="window.history.back()">Go Back</button>
    `;

    return new Response(this.baseTemplate('Error', content), {
      status: status,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}