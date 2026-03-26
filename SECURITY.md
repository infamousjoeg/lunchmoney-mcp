# Security

## Credential Architecture

lunchmoney-mcp uses a two-tier credential architecture designed to keep your financial data secure.

### Tier 1: OS Keychain (Long-lived Secrets)

Your Lunch Money API token and OAuth client credentials are stored in your operating system's native credential manager:

- **macOS:** Keychain Access
- **Linux:** Secret Service (GNOME Keyring / KDE Wallet)
- **Windows:** Windows Credential Manager

These credentials are:
- Encrypted by the OS using your login password
- Never written to disk in plain text
- Stored under the service namespace `lunchmoney-mcp`
- Accessible only to processes running as your user

### Tier 2: Encrypted Disk Store (OAuth Session Tokens)

When running in HTTP mode with OAuth, session tokens (access tokens, refresh tokens, authorization codes) are stored on disk for persistence across server restarts.

- **Encryption:** AES-256-GCM (authenticated encryption)
- **Encryption key:** Stored in the OS keychain (Tier 1) -- the encrypted files are useless without it
- **Location:** Platform-native data directory
  - macOS: `~/Library/Application Support/lunchmoney-mcp/`
  - Linux: `~/.local/share/lunchmoney-mcp/`
  - Windows: `%APPDATA%/lunchmoney-mcp/`
- **TTL:** Tokens expire automatically and are cleaned up periodically

### ENV Variable Fallback

For containerized deployments (Docker, Kubernetes) where no OS keychain is available, credentials can be passed via environment variables:

- `LUNCH_MONEY_API_TOKEN` -- your Lunch Money API key
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` -- for Google OAuth
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` -- for GitHub OAuth
- `CYBERARK_TENANT_URL` / `CYBERARK_CLIENT_ID` / `CYBERARK_CLIENT_SECRET` -- for CyberArk Identity OAuth
- `OAUTH_CLIENT_ID` / `OAUTH_CLIENT_SECRET` / `OAUTH_AUTH_URL` / `OAUTH_TOKEN_URL` -- for custom OAuth

**Important:** When using ENV vars, ensure your deployment platform encrypts environment variables at rest (Railway, Render, and Fly.io all do this by default).

## Threat Model

| Threat | Mitigation |
|--------|-----------|
| API token stolen from disk | Token stored in OS keychain, never in plain text |
| Session tokens stolen from disk | Encrypted with AES-256-GCM; encryption key in keychain |
| Keychain compromised | Requires OS-level compromise (user login password) |
| Token in chat history (configureLunchMoneyToken) | Optional -- users can use `npx lunchmoney-mcp setup` CLI instead |
| ENV var exposure in containers | Use platform-provided secret management; never log ENV vars |
| Man-in-the-middle on API calls | All API calls use HTTPS; OAuth uses PKCE |
| Unauthorized MCP access (HTTP mode) | OAuth 2.1 with PKCE required for all authenticated endpoints |

## Reporting Vulnerabilities

If you discover a security vulnerability, please email joe@joe-garcia.com instead of opening a public issue.
