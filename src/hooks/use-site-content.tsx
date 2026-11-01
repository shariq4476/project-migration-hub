import { queryOptions, useQuery } from "@tanstack/react-query";
import { defaultContent } from "@/lib/site-content";
import { readSiteContent } from "@/lib/site-content.functions";

export const siteContentKey = ["site-content"] as const;
export const siteContentQuery = queryOptions({ queryKey: siteContentKey, queryFn: () => readSiteContent(), staleTime: 60_000 });

export function useSiteContent() {
  const { data } = useQuery(siteContentQuery);
  return data ?? defaultContent;
}
