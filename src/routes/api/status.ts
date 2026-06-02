import { createFileRoute } from "@tanstack/react-router";
import { getStatus } from "@/lib/esp";

export const Route = createFileRoute("/api/status")({
  server: {
    handlers: {
      GET: async () => Response.json(await getStatus()),
    },
  },
});
