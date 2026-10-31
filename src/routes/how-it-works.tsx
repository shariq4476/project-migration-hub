import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, meta } from "@/components/site/InfoPage";

export const Route = createFileRoute("/how-it-works")({
  head: () =>
    meta("How it works", "From offer to handover: how a ClicksSpot deal works step by step."),
  component: () => (
    <InfoPage title="How it works">
      <ol className="list-decimal space-y-3 pl-5">
        <li>
          <b className="text-foreground">Agreement</b> — an offer is accepted, a bid wins, or a
          buyer clicks Buy now. A private deal room opens.
        </li>
        <li>
          <b className="text-foreground">Payment</b> — the buyer pays ClicksSpot escrow by JazzCash, Easypaisa, Raast, bank transfer or USDT and submits
          the transaction ID and a screenshot.
        </li>
        <li>
          <b className="text-foreground">Verification</b> — our team checks the payment by hand and
          holds the funds.
        </li>
        <li>
          <b className="text-foreground">Transfer</b> — the seller hands over the domain, hosting, files and
          accounts inside the deal room.
        </li>
        <li>
          <b className="text-foreground">Approval</b> — the buyer confirms everything arrived.
        </li>
        <li>
          <b className="text-foreground">Payout</b> — we send the seller the price minus our 10%
          commission.
        </li>
      </ol>
    </InfoPage>
  ),
});
