import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LunchMoneyClient } from "../../src/api/client.js";
import { LunchMoneyAPIError } from "../../src/utils/errors.js";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function createJsonResponse(data: unknown, status = 200, ok = true) {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    headers: new Headers({ "content-type": "application/json" }),
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
  };
}

function createErrorResponse(
  status: number,
  statusText: string,
  errorBody?: { error: string }
) {
  const bodyText = errorBody ? JSON.stringify(errorBody) : statusText;
  return {
    ok: false,
    status,
    statusText,
    headers: new Headers({ "content-type": "application/json" }),
    json: errorBody
      ? vi.fn().mockResolvedValue(errorBody)
      : vi.fn().mockRejectedValue(new Error("Not JSON")),
    text: vi.fn().mockResolvedValue(bodyText),
  };
}

describe("LunchMoneyClient", () => {
  let client: LunchMoneyClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new LunchMoneyClient("test-api-token");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("throws if no access token is provided", () => {
      expect(() => new LunchMoneyClient("")).toThrow(
        "Lunch Money API token is required"
      );
    });

    it("creates client with valid token", () => {
      const c = new LunchMoneyClient("valid-token");
      expect(c).toBeInstanceOf(LunchMoneyClient);
    });
  });

  describe("get", () => {
    it("makes GET request without params", async () => {
      const mockData = { user: { id: 1, name: "Test" } };
      mockFetch.mockResolvedValue(createJsonResponse(mockData));

      const result = await client.get("/me");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://dev.lunchmoney.app/v1/me",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-token",
            "Content-Type": "application/json",
          }),
        })
      );
      expect(result).toEqual(mockData);
    });

    it("makes GET request with params", async () => {
      const mockData = { transactions: [] };
      mockFetch.mockResolvedValue(createJsonResponse(mockData));

      await client.get("/transactions", {
        start_date: "2024-01-01",
        limit: 10,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://dev.lunchmoney.app/v1/transactions?start_date=2024-01-01&limit=10",
        expect.objectContaining({ method: "GET" })
      );
    });

    it("omits null and undefined params", async () => {
      const mockData = { transactions: [] };
      mockFetch.mockResolvedValue(createJsonResponse(mockData));

      await client.get("/transactions", {
        start_date: "2024-01-01",
        end_date: undefined,
        category_id: null,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://dev.lunchmoney.app/v1/transactions?start_date=2024-01-01",
        expect.objectContaining({ method: "GET" })
      );
    });
  });

  describe("post", () => {
    it("makes POST request with body", async () => {
      const mockData = { tag: { id: 1, name: "test" } };
      mockFetch.mockResolvedValue(createJsonResponse(mockData));

      const result = await client.post("/tags", { name: "test" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://dev.lunchmoney.app/v1/tags",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "test" }),
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-token",
            "Content-Type": "application/json",
          }),
        })
      );
      expect(result).toEqual(mockData);
    });

    it("makes POST request without body", async () => {
      mockFetch.mockResolvedValue(createJsonResponse(true));

      await client.post("/plaid_accounts/fetch");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://dev.lunchmoney.app/v1/plaid_accounts/fetch",
        expect.objectContaining({
          method: "POST",
          body: undefined,
        })
      );
    });
  });

  describe("put", () => {
    it("makes PUT request with body", async () => {
      const mockData = { tag: { id: 1, name: "updated" } };
      mockFetch.mockResolvedValue(createJsonResponse(mockData));

      const result = await client.put("/tags/1", { name: "updated" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://dev.lunchmoney.app/v1/tags/1",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ name: "updated" }),
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-token",
            "Content-Type": "application/json",
          }),
        })
      );
      expect(result).toEqual(mockData);
    });

    it("makes PUT request without body", async () => {
      mockFetch.mockResolvedValue(createJsonResponse({}));

      await client.put("/tags/1");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://dev.lunchmoney.app/v1/tags/1",
        expect.objectContaining({
          method: "PUT",
          body: undefined,
        })
      );
    });
  });

  describe("delete", () => {
    it("makes DELETE request", async () => {
      mockFetch.mockResolvedValue(createJsonResponse({}));

      await client.delete("/tags/1");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://dev.lunchmoney.app/v1/tags/1",
        expect.objectContaining({
          method: "DELETE",
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-token",
            "Content-Type": "application/json",
          }),
        })
      );
    });
  });

  describe("error handling", () => {
    it("throws LunchMoneyAPIError with error message from API response", async () => {
      mockFetch.mockResolvedValue(
        createErrorResponse(401, "Unauthorized", {
          error: "Invalid API key",
        })
      );

      await expect(client.get("/me")).rejects.toThrow(LunchMoneyAPIError);
      await expect(client.get("/me")).rejects.toThrow("Invalid API key");
    });

    it("throws LunchMoneyAPIError with statusText when response is not JSON", async () => {
      const response = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: new Headers({ "content-type": "text/plain" }),
        json: vi.fn().mockRejectedValue(new Error("Not JSON")),
        text: vi.fn().mockResolvedValue("Server error"),
      };
      mockFetch.mockResolvedValue(response);

      await expect(client.get("/me")).rejects.toThrow(LunchMoneyAPIError);
      await expect(client.get("/me")).rejects.toThrow(
        "API request failed: Internal Server Error"
      );
    });

    it("throws LunchMoneyAPIError with status code", async () => {
      mockFetch.mockResolvedValue(
        createErrorResponse(429, "Too Many Requests", {
          error: "Rate limited",
        })
      );

      try {
        await client.get("/me");
        expect.unreachable("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(LunchMoneyAPIError);
        expect((err as LunchMoneyAPIError).statusCode).toBe(429);
        expect((err as LunchMoneyAPIError).message).toBe("Rate limited");
      }
    });

    it("wraps network errors in LunchMoneyAPIError", async () => {
      mockFetch.mockRejectedValue(new Error("fetch failed"));

      await expect(client.get("/me")).rejects.toThrow(LunchMoneyAPIError);
      await expect(client.get("/me")).rejects.toThrow("fetch failed");
    });

    it("wraps non-Error throws in LunchMoneyAPIError", async () => {
      mockFetch.mockRejectedValue("unexpected string");

      await expect(client.get("/me")).rejects.toThrow(LunchMoneyAPIError);
      await expect(client.get("/me")).rejects.toThrow(
        "Unknown error occurred"
      );
    });

    it("returns empty object for non-JSON successful response", async () => {
      const response = {
        ok: true,
        status: 204,
        statusText: "No Content",
        headers: new Headers({ "content-type": "text/plain" }),
        json: vi.fn(),
        text: vi.fn().mockResolvedValue(""),
      };
      mockFetch.mockResolvedValue(response);

      const result = await client.delete("/tags/1");

      expect(result).toEqual({});
    });
  });
});
