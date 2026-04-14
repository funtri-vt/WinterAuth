/**
 * Communication Domain Interfaces
 * Defines the contracts for out-of-band communication (like Email or SMS).
 */

export interface EmailProvider {
  sendRecoveryEmail(toEmail: string, recoveryLink: string): Promise<boolean>;
  sendSecurityAlert(toEmail: string, eventName: string, details?: string): Promise<boolean>;
}