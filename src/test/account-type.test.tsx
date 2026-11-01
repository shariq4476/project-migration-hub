import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAccountType } from "@/hooks/use-account-type";

const mocks = vi.hoisted(() => ({ update: vi.fn(), single: vi.fn() }));
vi.mock("@/hooks/use-session", () => ({ useSession: () => ({ user: { id: "member-1" } }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      update: mocks.update,
      select: () => ({ eq: () => ({ single: async () => ({ data: { account_type: "buyer" }, error: null }) }) }),
    }),
  },
}));

describe("Account switching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.update.mockImplementation(() => ({ eq: () => ({ select: () => ({ single: mocks.single }) }) }));
  });

  it.each(["seller", "buyer"] as const)("synchronizes settings and header after switching to %s", async (type) => {
    mocks.single.mockResolvedValue({ data: { account_type: type }, error: null });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(["dashboard"], { profile: { account_type: type === "seller" ? "buyer" : "seller", display_name: "Member" }, isAdmin: true });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useAccountType(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setType(type));
    await waitFor(() => expect(result.current.type).toBe(type));
    await waitFor(() => expect(result.current.switching).toBe(false));
    expect(client.getQueryData(["dashboard"])).toEqual({ profile: { account_type: type, display_name: "Member" }, isAdmin: true });
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ account_type: type }));
  });

  it("does not report a seller account when the profile update fails", async () => {
    mocks.single.mockResolvedValue({ data: null, error: new Error("Update denied") });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useAccountType(), { wrapper });
    await waitFor(() => expect(result.current.type).toBe("buyer"));
    act(() => result.current.setType("seller"));
    await waitFor(() => expect(mocks.single).toHaveBeenCalledOnce());
    await waitFor(() => expect(result.current.switching).toBe(false));
    expect(result.current.type).toBe("buyer");
  });
});