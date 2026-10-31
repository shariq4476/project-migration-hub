import { createFileRoute } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { InfoPage, meta } from "@/components/site/InfoPage";
import { faqs } from "@/lib/content";

export const Route = createFileRoute("/faq")({
  head: () =>
    meta("FAQ", "Answers about payments, fees, verification and deal privacy on ClicksSpot."),
  component: () => (
    <InfoPage title="Frequently asked questions">
      <Accordion type="single" collapsible>
        {faqs.map((f) => (
          <AccordionItem key={f.q} value={f.q}>
            <AccordionTrigger className="text-foreground">{f.q}</AccordionTrigger>
            <AccordionContent>{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </InfoPage>
  ),
});
