import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, meta } from "@/components/site/InfoPage";

export const Route = createFileRoute("/about")({
  head: () =>
    meta(
      "About ClicksSpot",
      "ClicksSpot is a safe marketplace for buying and selling websites in Pakistan & South Asia.",
    ),
  component: () => (
    <InfoPage title="About ClicksSpot">
      <p>
        ClicksSpot connects buyers and sellers of websites across Pakistan and South Asia — AdSense blogs, affiliate sites, online
        stores and portals — and manages every deal from agreement to handover.
      </p>
      <p>
        We hold the buyer's payment until the transfer is confirmed, so neither side has to trust a
        stranger in a Facebook or WhatsApp group.
      </p>
    </InfoPage>
  ),
});
