export const pageMeta = (title: string, description: string, siteName = "ClicksSpot") => ({
  meta: [
    { title: `${title} | ${siteName}` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} | ${siteName}` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});
