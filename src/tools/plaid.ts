import { FastMCP } from "fastmcp";
import { z } from "zod";
import { LunchMoneyClient } from "../api/client.js";
import { formatErrorForMCP } from "../utils/errors.js";
import { PlaidAccountsResponse } from "../types/index.js";

export function registerPlaidTools(
  server: FastMCP,
  client: LunchMoneyClient
) {
  server.addTool({
    name: "getPlaidAccounts",
    description: "List all Plaid-connected accounts with balances",
    parameters: z.object({}),
    execute: async () => {
      try {
        const response =
          await client.get<PlaidAccountsResponse>("/plaid_accounts");
        return JSON.stringify(response, null, 2);
      } catch (error) {
        return formatErrorForMCP(error);
      }
    },
  });

  server.addTool({
    name: "fetchPlaidAccounts",
    description: "Trigger a Plaid sync to update account balances",
    parameters: z.object({}),
    execute: async () => {
      try {
        const response = await client.post<boolean>("/plaid_accounts/fetch");
        return JSON.stringify(response, null, 2);
      } catch (error) {
        return formatErrorForMCP(error);
      }
    },
  });
}
