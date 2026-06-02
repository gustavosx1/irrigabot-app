import { createFileRoute } from "@tanstack/react-router";
import { setConfig } from "@/lib/esp";

export const Route = createFileRoute("/api/config")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const min = Number(url.searchParams.get("min") ?? 40);
        const max = Number(url.searchParams.get("max") ?? 65);
        const auto = url.searchParams.get("auto") === "1";
        return Response.json(await setConfig(min, max, auto));
      },
    },
  },
});
