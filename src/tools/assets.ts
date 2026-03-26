import { FastMCP } from "fastmcp";
import { z } from "zod";
import { LunchMoneyClient } from "../api/client.js";
import { formatErrorForMCP } from "../utils/errors.js";
import {
  createAssetSchema,
  updateAssetSchema,
  idSchema,
} from "../schemas/index.js";
import { AssetsResponse, Asset } from "../types/index.js";

export function registerAssetTools(
  server: FastMCP,
  client: LunchMoneyClient
) {
  server.addTool({
    name: "getAssets",
    description: "List all manually-managed assets",
    parameters: z.object({}),
    execute: async () => {
      try {
        const response = await client.get<AssetsResponse>("/assets");
        return JSON.stringify(response, null, 2);
      } catch (error) {
        return formatErrorForMCP(error);
      }
    },
  });

  server.addTool({
    name: "createAsset",
    description: "Create a new manually-managed asset",
    parameters: createAssetSchema,
    execute: async (args: z.infer<typeof createAssetSchema>) => {
      try {
        const asset = await client.post<{ asset: Asset }>("/assets", args);
        return JSON.stringify(asset, null, 2);
      } catch (error) {
        return formatErrorForMCP(error);
      }
    },
  });

  server.addTool({
    name: "updateAsset",
    description: "Update an existing asset's properties including balance and metadata",
    parameters: idSchema.merge(updateAssetSchema),
    execute: async (args: z.infer<typeof idSchema> & z.infer<typeof updateAssetSchema>) => {
      try {
        const { id, ...updateData } = args;
        const asset = await client.put<{ asset: Asset }>(
          `/assets/${id}`,
          updateData
        );
        return JSON.stringify(asset, null, 2);
      } catch (error) {
        return formatErrorForMCP(error);
      }
    },
  });

  server.addTool({
    name: "deleteAsset",
    description: "Delete an asset by ID",
    parameters: idSchema,
    execute: async (args: z.infer<typeof idSchema>) => {
      try {
        await client.delete(`/assets/${args.id}`);
        return `Asset ${args.id} deleted successfully`;
      } catch (error) {
        return formatErrorForMCP(error);
      }
    },
  });
}
