import keytar from 'keytar';

const SERVICE_NAME = 'lunchmoney-mcp';

export class CredentialStore {
  async getApiToken(): Promise<string | null> {
    // Try keychain first
    try {
      const token = await keytar.getPassword(SERVICE_NAME, 'api-token');
      if (token) return token;
    } catch {
      // Keychain unavailable (Docker, CI, etc.)
    }
    // Fall back to ENV var
    return process.env.LUNCH_MONEY_API_TOKEN || null;
  }

  async setApiToken(token: string): Promise<void> {
    try {
      await keytar.setPassword(SERVICE_NAME, 'api-token', token);
    } catch (error) {
      throw new Error('Failed to store token in keychain. Use LUNCH_MONEY_API_TOKEN env var instead.');
    }
  }

  async deleteApiToken(): Promise<void> {
    try {
      await keytar.deletePassword(SERVICE_NAME, 'api-token');
    } catch {
      // Ignore if keychain unavailable
    }
  }

  async getEncryptionKey(): Promise<string> {
    try {
      let key = await keytar.getPassword(SERVICE_NAME, 'encryption-key');
      if (!key) {
        // Generate and store a new key
        const crypto = await import('crypto');
        key = crypto.randomBytes(32).toString('hex');
        await keytar.setPassword(SERVICE_NAME, 'encryption-key', key);
      }
      return key;
    } catch {
      // Fallback: derive from env or generate ephemeral
      const crypto = await import('crypto');
      return process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    }
  }

  async clear(): Promise<void> {
    try {
      await keytar.deletePassword(SERVICE_NAME, 'api-token');
      await keytar.deletePassword(SERVICE_NAME, 'encryption-key');
    } catch {
      // Ignore
    }
  }
}
