import { LunchMoneyAPIError, handleAPIError } from "../utils/errors.js";

export class LunchMoneyClient {
  private baseURL: string;
  private accessToken: string;

  constructor(accessToken: string) {
    if (!accessToken) {
      throw new Error("Lunch Money API token is required");
    }
    this.baseURL = "https://dev.lunchmoney.app/v1";
    this.accessToken = accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (
            typeof errorData === "object" &&
            errorData !== null &&
            "error" in errorData &&
            typeof errorData.error === "string"
          ) {
            errorMessage = errorData.error;
          }
        } catch {
          // If response is not JSON, use status text
        }

        throw new LunchMoneyAPIError(
          errorMessage,
          response.status,
          await response.text().catch(() => undefined)
        );
      }

      // Handle empty responses
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return data as T;
      }

      return {} as T;
    } catch (error) {
      if (error instanceof LunchMoneyAPIError) {
        throw error;
      }
      handleAPIError(error);
    }
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const queryString = params
      ? `?${new URLSearchParams(
        Object.entries(params).reduce(
          (acc, [key, value]) => {
            if (value !== undefined && value !== null) {
              acc[key] = String(value);
            }
            return acc;
          },
          {} as Record<string, string>
        )
      ).toString()}`
      : "";
    return this.request<T>(`${endpoint}${queryString}`, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}
