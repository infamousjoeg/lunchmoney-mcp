import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseArgs, resolveAuthProvider } from "../src/cli.js";

describe("CLI parseArgs", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.PORT;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("defaults to stdio mode", () => {
    const options = parseArgs(["node", "cli.js"]);
    expect(options.mode).toBe("stdio");
    expect(options.port).toBe(8080);
  });

  it("parses --version flag", () => {
    const options = parseArgs(["node", "cli.js", "--version"]);
    expect(options.mode).toBe("version");
  });

  it("parses -v flag", () => {
    const options = parseArgs(["node", "cli.js", "-v"]);
    expect(options.mode).toBe("version");
  });

  it("parses setup command", () => {
    const options = parseArgs(["node", "cli.js", "setup"]);
    expect(options.mode).toBe("setup");
  });

  it("parses --http flag", () => {
    const options = parseArgs(["node", "cli.js", "--http"]);
    expect(options.mode).toBe("http");
    expect(options.port).toBe(8080);
  });

  it("parses --http with --port", () => {
    const options = parseArgs(["node", "cli.js", "--http", "--port", "3000"]);
    expect(options.mode).toBe("http");
    expect(options.port).toBe(3000);
  });

  it("ignores invalid port numbers", () => {
    const options = parseArgs(["node", "cli.js", "--http", "--port", "abc"]);
    expect(options.port).toBe(8080);
  });

  it("ignores port 0", () => {
    const options = parseArgs(["node", "cli.js", "--http", "--port", "0"]);
    expect(options.port).toBe(8080);
  });

  it("ignores port above 65535", () => {
    const options = parseArgs(["node", "cli.js", "--http", "--port", "70000"]);
    expect(options.port).toBe(8080);
  });

  it("handles --port without value", () => {
    const options = parseArgs(["node", "cli.js", "--http", "--port"]);
    expect(options.port).toBe(8080);
  });

  it("--version takes priority over other flags", () => {
    const options = parseArgs(["node", "cli.js", "--http", "--version"]);
    expect(options.mode).toBe("version");
  });

  it("setup takes priority over --http but not --version", () => {
    // --version checked first
    const options1 = parseArgs(["node", "cli.js", "setup", "--version"]);
    expect(options1.mode).toBe("version");

    // setup checked before --http
    const options2 = parseArgs(["node", "cli.js", "setup", "--http"]);
    expect(options2.mode).toBe("setup");
  });

  it("reads port from PORT env var when --port not specified", () => {
    process.env.PORT = "9090";
    const options = parseArgs(["node", "cli.js", "--http"]);
    expect(options.port).toBe(9090);
  });

  it("--port flag takes priority over PORT env var", () => {
    process.env.PORT = "9090";
    const options = parseArgs(["node", "cli.js", "--http", "--port", "3000"]);
    expect(options.port).toBe(3000);
  });

  it("ignores invalid PORT env var", () => {
    process.env.PORT = "not-a-number";
    const options = parseArgs(["node", "cli.js", "--http"]);
    expect(options.port).toBe(8080);
  });

  it("ignores PORT=0 env var", () => {
    process.env.PORT = "0";
    const options = parseArgs(["node", "cli.js", "--http"]);
    expect(options.port).toBe(8080);
  });
});

describe("resolveAuthProvider", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.AUTH_PROVIDER;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("defaults to google when AUTH_PROVIDER is not set", () => {
    expect(resolveAuthProvider()).toBe("google");
  });

  it("returns google when AUTH_PROVIDER=google", () => {
    process.env.AUTH_PROVIDER = "google";
    expect(resolveAuthProvider()).toBe("google");
  });

  it("returns github when AUTH_PROVIDER=github", () => {
    process.env.AUTH_PROVIDER = "github";
    expect(resolveAuthProvider()).toBe("github");
  });

  it("throws for invalid AUTH_PROVIDER value", () => {
    process.env.AUTH_PROVIDER = "okta";
    expect(() => resolveAuthProvider()).toThrow(
      'Invalid AUTH_PROVIDER="okta". Supported: google, github'
    );
  });

  it("throws for empty AUTH_PROVIDER (uses default)", () => {
    // Empty string is falsy, so || "google" applies
    process.env.AUTH_PROVIDER = "";
    expect(resolveAuthProvider()).toBe("google");
  });
});
