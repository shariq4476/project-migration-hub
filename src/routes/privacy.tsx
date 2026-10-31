import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, meta } from "@/components/site/InfoPage";
import { legal } from "@/lib/content";

const doc = legal.privacy;
export const Route = createFileRoute("/privacy")({
  head: () => meta(doc.title, doc.title + " for the ClicksSpot marketplace."),
  component: () => (
    <InfoPage title={doc.title}>
      {doc.body.map((p) => (
        <p key={p}>{p}</p>
      ))}
    </InfoPage>
  ),
});
