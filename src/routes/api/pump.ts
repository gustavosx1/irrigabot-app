import { createFileRoute } from "@tanstack/react-router";
import { setPump } from "@/lib/esp";

export const Route = createFileRoute("/api/pump")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const state = url.searchParams.get("state") === "1";
        return Response.json(await setPump(state));
      },
    },
  },
});
