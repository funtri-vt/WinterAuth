/**
 * Crypto Domain Interfaces
 * Defines the contracts for cryptographic operations (hashing and encryption).
 */

export interface HashProvider {
  /** Hashes a string (e.g., password or backup code) */
  hash(data: string): Promise<string>;
  /** Verifies a string against a hash */
  verify(data: string, hash: string): Promise<boolean>;
}

export interface EncryptionProvider {
  /** Encrypts data at rest (e.g., returning a Base64 ciphertext) */
  encrypt(plaintext: string): Promise<string>;
  /** Decrypts ciphertext back to plaintext */
  decrypt(ciphertext: string): Promise<string>;
}