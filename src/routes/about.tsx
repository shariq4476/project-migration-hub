import { createFileRoute } from "@tanstack/react-router";
import { ManagedPage, managedHead, siteContentQuery } from "@/components/site/ManagedPage";

export const Route = createFileRoute("/about")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  head: ({ loaderData }) => managedHead("about", loaderData),
  component: () => <ManagedPage id="about" />,
});
