/**
 * WebCrypto Hash Provider
 * Implements the HashProvider interface using native, standard Web APIs.
 * It uses PBKDF2 with SHA-256 for secure, edge-native password hashing.
 */
import type { HashProvider } from '../../core/interfaces';

export class WebCryptoHashProvider implements HashProvider {
  // OWASP recommended settings for PBKDF2
  private iterations = 600000;
  private hashAlgorithm = 'SHA-256';
  private saltLength = 16; // 128 bits
  private keyLength = 32;  // 256 bits

  /**
   * Hashes a plaintext string (like a password) and returns a formatted string
   * containing the iterations, salt, and derived key.
   */
  async hash(data: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(this.saltLength));
    const derivedKey = await this.deriveKey(data, salt, this.iterations);
    
    // Convert binary data to Base64 strings for storage
    const saltBase64 = this.bufferToBase64(salt);
    const hashBase64 = this.bufferToBase64(derivedKey);

    // Format: algorithm:iterations:salt:hash
    return `pbkdf2:${this.hashAlgorithm.toLowerCase()}:${this.iterations}:${saltBase64}:${hashBase64}`;
  }

  /**
   * Parses the stored hash format and verifies the plaintext string against it.
   */
  async verify(data: string, storedHash: string): Promise<boolean> {
    try {
      const parts = storedHash.split(':');
      if (parts.length !== 5 || parts[0] !== 'pbkdf2') {
        return false; // Invalid hash format
      }

      const [, alg, itersStr, saltBase64, hashBase64] = parts;
      const iterations = parseInt(itersStr, 10);
      const salt = this.base64ToBuffer(saltBase64);

      // Re-derive the key using the exact same salt and iterations
      const testDerivedKey = await this.deriveKey(data, salt, iterations);
      const testHashBase64 = this.bufferToBase64(testDerivedKey);

      // Timing-safe comparison (prevent timing attacks by comparing all characters)
      return this.timingSafeEqual(hashBase64, testHashBase64);
    } catch (error) {
      console.error('[WebCrypto] Verification error:', error);
      return false;
    }
  }

  /**
   * Core WebCrypto logic for PBKDF2 derivation.
   */
  private async deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    return await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: this.hashAlgorithm,
      },
      keyMaterial,
      this.keyLength * 8 // Length is expected in bits
    );
  }

  // --- Utility Functions ---

  private bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Prevents timing attacks by ensuring string comparison always takes the same amount of time,
   * regardless of where the first character mismatch occurs.
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}