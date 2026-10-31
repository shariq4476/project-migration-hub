import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export type AccountType = "buyer" | "seller";

/** The signed-in member's account type (buyer or seller). */
export function useAccountType() {
  const { user } = useSession();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["account-type", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data.account_type as AccountType;
    },
  });
  const change = useMutation({
    mutationFn: async (type: AccountType) => {
      const { error } = await supabase
        .from("profiles")
        .update({ account_type: type, updated_at: new Date().toISOString() })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: async (_d, type) => {
      await qc.invalidateQueries();
      toast.success(type === "seller" ? "You now have a seller account" : "You now have a buyer account");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not switch account"),
  });
  return { type: query.data, loading: query.isLoading, setType: change.mutate, switching: change.isPending };
}
