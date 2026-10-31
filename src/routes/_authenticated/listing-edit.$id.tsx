import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ownListingQuery } from "@/lib/marketplace.queries";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { SellForm } from "@/components/site/SellForm";
import { pageMeta } from "@/lib/seo";
export const Route = createFileRoute("/_authenticated/listing-edit/$id")({
  loader: ({ params, context }) => context.queryClient.ensureQueryData(ownListingQuery(params.id)),
  head: () =>
    pageMeta("Edit your listing", "Manage your private ClicksSpot listing and ownership evidence."),
  component: Edit,
});
function Edit() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(ownListingQuery(id));
  return (
    <SiteLayout>
      <PageHeader title="Edit your listing" />
      <div className="workspace">
        {["draft", "pending", "rejected"].includes(data.listing.status) ? (
          <SellForm initial={data.listing} review={data.review} />
        ) : (
          <p>This listing is no longer editable.</p>
        )}
      </div>
    </SiteLayout>
  );
}
