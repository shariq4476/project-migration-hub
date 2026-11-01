import { createFileRoute } from "@tanstack/react-router";
import { ManagedPage, managedHead, siteContentQuery } from "@/components/site/ManagedPage";

export const Route = createFileRoute("/faq")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  head: ({ loaderData }) => managedHead("faq", loaderData),
  component: () => <ManagedPage id="faq" />,
});
