import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerUserTools } from "../../src/tools/user.js";
import { LunchMoneyClient } from "../../src/api/client.js";
import { LunchMoneyAPIError } from "../../src/utils/errors.js";
import type { User } from "../../src/types/index.js";

// Capture registered tools via a fake FastMCP server
interface RegisteredTool {
  name: string;
  description: string;
  execute: (args: Record<string, unknown>) => Promise<string>;
}

function createMockServer() {
  const tools: RegisteredTool[] = [];
  return {
    addTool: (tool: RegisteredTool) => {
      tools.push(tool);
    },
    tools,
  };
}

function createMockClient() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  } as unknown as LunchMoneyClient & {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
}

describe("User tools", () => {
  let mockServer: ReturnType<typeof createMockServer>;
  let mockClient: ReturnType<typeof createMockClient>;
  let tools: RegisteredTool[];

  beforeEach(() => {
    mockServer = createMockServer();
    mockClient = createMockClient();
    registerUserTools(mockServer as never, mockClient);
    tools = mockServer.tools;
  });

  it("registers one tool", () => {
    expect(tools).toHaveLength(1);
    expect(tools.map((t) => t.name)).toEqual(["getUser"]);
  });

  describe("getUser", () => {
    it("returns JSON stringified user on success", async () => {
      const mockUser: User = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        currency: "usd",
        budget_display_order: [1, 2, 3],
        date_format: "MM/DD/YYYY",
        first_day_of_week: 0,
        beta_user: false,
        created_at: "2024-01-01T00:00:00.000Z",
      };

      mockClient.get.mockResolvedValue(mockUser);

      const tool = tools.find((t) => t.name === "getUser")!;
      const result = await tool.execute({});

      expect(mockClient.get).toHaveBeenCalledWith("/me");
      expect(result).toBe(JSON.stringify(mockUser, null, 2));
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.get.mockRejectedValue(
        new LunchMoneyAPIError("Unauthorized", 401)
      );

      const tool = tools.find((t) => t.name === "getUser")!;
      const result = await tool.execute({});

      expect(result).toBe(
        "Lunch Money API Error: Unauthorized (Status: 401)"
      );
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.get.mockRejectedValue(new Error("Network failure"));

      const tool = tools.find((t) => t.name === "getUser")!;
      const result = await tool.execute({});

      expect(result).toBe("Error: Network failure");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.get.mockRejectedValue("something unexpected");

      const tool = tools.find((t) => t.name === "getUser")!;
      const result = await tool.execute({});

      expect(result).toBe("An unknown error occurred");
    });
  });
});
