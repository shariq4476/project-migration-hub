import { createFileRoute } from "@tanstack/react-router";
import { ManagedPage, managedHead, siteContentQuery } from "@/components/site/ManagedPage";

export const Route = createFileRoute("/refund")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  head: ({ loaderData }) => managedHead("refund", loaderData),
  component: () => <ManagedPage id="refund" />,
});
