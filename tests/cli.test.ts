import { describe, it, expect } from "vitest";
import { parseArgs } from "../src/cli.js";

describe("CLI parseArgs", () => {
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
});
