import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerAssetTools } from "../../src/tools/assets.js";
import { LunchMoneyClient } from "../../src/api/client.js";
import { LunchMoneyAPIError } from "../../src/utils/errors.js";
import type { AssetsResponse, Asset } from "../../src/types/index.js";

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

describe("Asset tools", () => {
  let mockServer: ReturnType<typeof createMockServer>;
  let mockClient: ReturnType<typeof createMockClient>;
  let tools: RegisteredTool[];

  beforeEach(() => {
    mockServer = createMockServer();
    mockClient = createMockClient();
    registerAssetTools(mockServer as never, mockClient);
    tools = mockServer.tools;
  });

  it("registers four tools", () => {
    expect(tools).toHaveLength(4);
    expect(tools.map((t) => t.name)).toEqual([
      "getAssets",
      "createAsset",
      "updateAsset",
      "deleteAsset",
    ]);
  });

  describe("getAssets", () => {
    it("returns JSON stringified assets on success", async () => {
      const mockResponse: AssetsResponse = {
        assets: [
          {
            id: 1,
            type_name: "cash",
            name: "Emergency Fund",
            balance: "10000.00",
            currency: "usd",
            institution_name: "Ally Bank",
            created_at: "2024-01-01T00:00:00.000Z",
          },
          {
            id: 2,
            type_name: "investment",
            name: "401k",
            balance: "50000.00",
            currency: "usd",
            institution_name: "Fidelity",
            created_at: "2024-02-01T00:00:00.000Z",
          },
        ],
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const tool = tools.find((t) => t.name === "getAssets")!;
      const result = await tool.execute({});

      expect(mockClient.get).toHaveBeenCalledWith("/assets");
      expect(result).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.get.mockRejectedValue(
        new LunchMoneyAPIError("Unauthorized", 401)
      );

      const tool = tools.find((t) => t.name === "getAssets")!;
      const result = await tool.execute({});

      expect(result).toBe(
        "Lunch Money API Error: Unauthorized (Status: 401)"
      );
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.get.mockRejectedValue(new Error("Network failure"));

      const tool = tools.find((t) => t.name === "getAssets")!;
      const result = await tool.execute({});

      expect(result).toBe("Error: Network failure");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.get.mockRejectedValue("something unexpected");

      const tool = tools.find((t) => t.name === "getAssets")!;
      const result = await tool.execute({});

      expect(result).toBe("An unknown error occurred");
    });
  });

  describe("createAsset", () => {
    it("returns JSON stringified asset on success", async () => {
      const mockResponse: { asset: Asset } = {
        asset: {
          id: 3,
          type_name: "real estate",
          name: "Home",
          balance: "350000.00",
          currency: "usd",
          created_at: "2024-03-01T00:00:00.000Z",
        },
      };

      mockClient.post.mockResolvedValue(mockResponse);

      const tool = tools.find((t) => t.name === "createAsset")!;
      const args = {
        type_name: "real estate",
        name: "Home",
        balance: "350000.00",
      };
      const result = await tool.execute(args);

      expect(mockClient.post).toHaveBeenCalledWith("/assets", args);
      expect(result).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.post.mockRejectedValue(
        new LunchMoneyAPIError("Bad Request", 400)
      );

      const tool = tools.find((t) => t.name === "createAsset")!;
      const result = await tool.execute({
        type_name: "cash",
        name: "Savings",
        balance: "1000.00",
      });

      expect(result).toBe(
        "Lunch Money API Error: Bad Request (Status: 400)"
      );
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.post.mockRejectedValue(new Error("Connection timeout"));

      const tool = tools.find((t) => t.name === "createAsset")!;
      const result = await tool.execute({
        type_name: "cash",
        name: "Savings",
        balance: "1000.00",
      });

      expect(result).toBe("Error: Connection timeout");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.post.mockRejectedValue(42);

      const tool = tools.find((t) => t.name === "createAsset")!;
      const result = await tool.execute({
        type_name: "cash",
        name: "Savings",
        balance: "1000.00",
      });

      expect(result).toBe("An unknown error occurred");
    });
  });

  describe("updateAsset", () => {
    it("returns JSON stringified updated asset on success", async () => {
      const mockResponse: { asset: Asset } = {
        asset: {
          id: 1,
          type_name: "cash",
          name: "Emergency Fund",
          balance: "12000.00",
          currency: "usd",
        },
      };

      mockClient.put.mockResolvedValue(mockResponse);

      const tool = tools.find((t) => t.name === "updateAsset")!;
      const result = await tool.execute({ id: 1, balance: "12000.00" });

      expect(mockClient.put).toHaveBeenCalledWith("/assets/1", {
        balance: "12000.00",
      });
      expect(result).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.put.mockRejectedValue(
        new LunchMoneyAPIError("Not Found", 404)
      );

      const tool = tools.find((t) => t.name === "updateAsset")!;
      const result = await tool.execute({ id: 999, balance: "12000.00" });

      expect(result).toBe(
        "Lunch Money API Error: Not Found (Status: 404)"
      );
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.put.mockRejectedValue(new Error("Server error"));

      const tool = tools.find((t) => t.name === "updateAsset")!;
      const result = await tool.execute({ id: 1, balance: "12000.00" });

      expect(result).toBe("Error: Server error");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.put.mockRejectedValue(undefined);

      const tool = tools.find((t) => t.name === "updateAsset")!;
      const result = await tool.execute({ id: 1, balance: "12000.00" });

      expect(result).toBe("An unknown error occurred");
    });
  });

  describe("deleteAsset", () => {
    it("returns success message on delete", async () => {
      mockClient.delete.mockResolvedValue(undefined);

      const tool = tools.find((t) => t.name === "deleteAsset")!;
      const result = await tool.execute({ id: 2 });

      expect(mockClient.delete).toHaveBeenCalledWith("/assets/2");
      expect(result).toBe("Asset 2 deleted successfully");
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.delete.mockRejectedValue(
        new LunchMoneyAPIError("Forbidden", 403)
      );

      const tool = tools.find((t) => t.name === "deleteAsset")!;
      const result = await tool.execute({ id: 2 });

      expect(result).toBe(
        "Lunch Money API Error: Forbidden (Status: 403)"
      );
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.delete.mockRejectedValue(new Error("Network issue"));

      const tool = tools.find((t) => t.name === "deleteAsset")!;
      const result = await tool.execute({ id: 2 });

      expect(result).toBe("Error: Network issue");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.delete.mockRejectedValue(null);

      const tool = tools.find((t) => t.name === "deleteAsset")!;
      const result = await tool.execute({ id: 2 });

      expect(result).toBe("An unknown error occurred");
    });
  });
});
