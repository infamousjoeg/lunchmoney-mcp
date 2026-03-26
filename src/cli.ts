#!/usr/bin/env node

import { createServer, startServer } from "./server.js";
import { runSetupWizard } from "./setup.js";
import { createRequire } from "module";

export interface CLIOptions {
  mode: "stdio" | "http" | "setup" | "version";
  port: number;
}

export function parseArgs(argv: string[]): CLIOptions {
  const args = argv.slice(2); // skip node and script path

  // Check for --version
  if (args.includes("--version") || args.includes("-v")) {
    return { mode: "version", port: 8080 };
  }

  // Check for setup command
  if (args.includes("setup")) {
    return { mode: "setup", port: 8080 };
  }

  // Check for --http flag
  const isHttp = args.includes("--http");

  // Check for --port flag
  let port = 8080;
  const portIndex = args.indexOf("--port");
  if (portIndex !== -1 && portIndex + 1 < args.length) {
    const parsedPort = parseInt(args[portIndex + 1], 10);
    if (!isNaN(parsedPort) && parsedPort > 0 && parsedPort <= 65535) {
      port = parsedPort;
    }
  }

  return {
    mode: isHttp ? "http" : "stdio",
    port,
  };
}

async function main() {
  const options = parseArgs(process.argv);

  switch (options.mode) {
    case "version": {
      const require = createRequire(import.meta.url);
      const pkg = require("../package.json");
      console.log(`lunchmoney-mcp v${pkg.version}`);
      break;
    }

    case "setup": {
      await runSetupWizard();
      break;
    }

    case "http": {
      const server = await createServer();
      await startServer(server, "httpStream", options.port);
      break;
    }

    case "stdio":
    default: {
      const server = await createServer();
      await startServer(server, "stdio");
      break;
    }
  }
}

main().catch((error) => {
  console.error("Fatal error:", error.message || error);
  process.exit(1);
});
