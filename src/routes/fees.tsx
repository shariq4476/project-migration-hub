import { createFileRoute } from "@tanstack/react-router";
import { ManagedPage, managedHead, siteContentQuery } from "@/components/site/ManagedPage";

export const Route = createFileRoute("/fees")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  head: ({ loaderData }) => managedHead("fees", loaderData),
  component: () => <ManagedPage id="fees" />,
});
