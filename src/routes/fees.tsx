import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, meta } from "@/components/site/InfoPage";
import { commissionFor, usd } from "@/lib/listings";
export const Route = createFileRoute("/fees")({
  head: () => meta("Fees", "Free to list. 10% commission on completed deals only."),
  component: () => (
    <InfoPage title="Fees">
      <p className="font-display text-4xl font-bold text-foreground">10%</p>
      <p>
        Listing is free. When a deal completes, ClicksSpot keeps 10% of the sale price. Example: on
        a {usd(50000)} sale, the commission is {usd(commissionFor(50000))} and the seller receives{" "}
        {usd(50000 - commissionFor(50000))}.
      </p>
      <p>Buyers pay no commission. Bank, wallet and network fees are paid by the sender.</p>
    </InfoPage>
  ),
});
