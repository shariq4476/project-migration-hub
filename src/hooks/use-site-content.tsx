import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { defaultContent, mergeContent } from "@/lib/site-content";

export const siteContentKey = ["site-content"] as const;

export function useSiteContent() {
  const { data } = useQuery({
    queryKey: siteContentKey,
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("content").eq("id", 1).maybeSingle();
      if (error) throw error;
      return mergeContent(data?.content);
    },
    staleTime: 60_000,
  });
  return data ?? defaultContent;
}
