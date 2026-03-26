import { FastMCP } from "fastmcp";
import { z } from "zod";
import { LunchMoneyClient } from "../api/client.js";
import { formatErrorForMCP } from "../utils/errors.js";
import { User } from "../types/index.js";

export function registerUserTools(server: FastMCP, client: LunchMoneyClient) {
    server.addTool({
        name: "getUser",
        description: "Get the current user's account details including email, name, currency preferences, and settings",
        parameters: z.object({}),
        execute: async () => {
            try {
                const user = await client.get<User>("/me");
                return JSON.stringify(user, null, 2);
            } catch (error) {
                return formatErrorForMCP(error);
            }
        },
    });
}
