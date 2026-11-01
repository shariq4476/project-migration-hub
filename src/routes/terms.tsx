import { createFileRoute } from "@tanstack/react-router";
import { ManagedPage, managedHead, siteContentQuery } from "@/components/site/ManagedPage";

export const Route = createFileRoute("/terms")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  head: ({ loaderData }) => managedHead("terms", loaderData),
  component: () => <ManagedPage id="terms" />,
});
