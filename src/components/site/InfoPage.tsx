import type { ReactNode } from "react";
import { PageHeader, SiteLayout } from "./SiteLayout";

export function InfoPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string | undefined;
  children: ReactNode;
}) {
  return (
    <SiteLayout>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12 leading-relaxed text-muted-foreground">
        {children}
      </div>
    </SiteLayout>
  );
}

export const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} | ClicksSpot` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} | ClicksSpot` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});
