import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import type { Listing } from "@/lib/listings";
import { paymentMethodIds } from "@/lib/payment-methods";

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
const optional = <T>(result: { data: T; error: { message: string } | null }) => {
  if (result.error) throw new Error(result.error.message);
  return result.data;
};
const unwrap = <T>(result: { data: T; error: { message: string } | null }): NonNullable<T> => {
  const data = optional(result);
  if (data === null || data === undefined) throw new Error("Requested record was not found.");
  return data;
};
type SellerProfile = { display_name: string; created_at: string; country: string | null; id_verified: boolean; phone_verified: boolean; payment_verified: boolean };
function mapListing(row: ListingRow, profile?: SellerProfile): Listing {
  const name = profile?.display_name;
  return {
    id: row.slug,
    databaseId: row.id,
    sellerId: row.seller_id,
    title: row.title,
    category: row.category as Listing["category"],
    type: row.sale_type as Listing["type"],
    price: Number(row.price),
    monthlyRevenue: Number(row.monthly_revenue),
    monthlyProfit: Number(row.monthly_profit),
    monthlyTraffic: row.monthly_traffic,
    ageYears: row.age_years,
    status: row.status === "approved" ? "active" : row.status === "sold" ? "sold" : "in_progress",
    featured: row.featured,
    createdAt: row.created_at,
    endsAt: row.ends_at ?? undefined,
    summary: row.summary,
    description: row.description,
    verified: row.verified,
    images: row.images,
    url: row.url ?? undefined,
    seller: {
      name: name ?? row.seller_name ?? "Member",
      rating: 0,
      reviews: 0,
      deals: 0,
      verified: Boolean(profile?.id_verified),
      memberSince: profile?.created_at,
      country: profile?.country ?? undefined,
      idVerified: Boolean(profile?.id_verified),
      phoneVerified: Boolean(profile?.phone_verified),
      paymentVerified: Boolean(profile?.payment_verified),
    },
  };
}

export const readMarketplace = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Marketplace connection is unavailable.");
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`)
          headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
  const rows = unwrap(
    await client
      .from("listings")
      .select("*")
      .in("status", ["approved", "in_progress", "sold"])
      .order("created_at", { ascending: false })
      .limit(1000),
  );
  const ids = [...new Set(rows.map((r) => r.seller_id).filter((id): id is string => Boolean(id)))];
  const names = ids.length
    ? unwrap(await client.from("profiles").select("id,display_name,created_at,country,id_verified,phone_verified,payment_verified").in("id", ids))
    : [];
  const listings = rows.map((row) =>
    mapListing(row, names.find((p) => p.id === row.seller_id)),
  );
  for (const listing of listings) {
    if (listing.sellerId) {
      const summary = unwrap(await client.rpc("seller_summary", { _seller: listing.sellerId }))[0];
      listing.seller.rating = Number(summary?.rating ?? 0);
      listing.seller.reviews = summary?.reviews ?? 0;
      listing.seller.deals = summary?.deals ?? 0;
    }
    if (listing.images?.length) {
      const images = await client.storage
        .from("listing-images")
        .createSignedUrls(listing.images, 3600);
      if (!images.error)
        listing.imageUrls = (images.data ?? [])
          .map((image) => image.signedUrl)
          .filter((url): url is string => Boolean(url));
    }
    if (listing.type === "auction" && listing.databaseId) {
      const summary = unwrap(await client.rpc("auction_summary", { _listing: listing.databaseId }));
      listing.bidCount = summary[0]?.bid_count ?? 0;
      listing.price = Number(summary[0]?.highest_bid ?? listing.price);
    }
  }
  return listings;
});

export const readDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const c = context.supabase;
    const uid = context.userId;
    const [profile, listings, deals, offers, bids, watchlist, payout, tickets, roles] =
      await Promise.all([
        c.from("profiles").select("id,display_name,bio,account_type,country,id_verified,phone_verified,payment_verified").eq("id", uid).single(),
        c
          .from("listings")
          .select("*")
          .eq("seller_id", uid)
          .order("created_at", { ascending: false }),
        c
          .from("deals")
          .select("*,listings(title,slug)")
          .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
          .order("created_at", { ascending: false }),
        c
          .from("offers")
          .select("*,listings(title,slug,seller_id)")
          .order("created_at", { ascending: false }),
        c
          .from("bids")
          .select("*,listings(title,slug,ends_at,status)")
          .eq("buyer_id", uid)
          .order("created_at", { ascending: false }),
        c.from("watchlist").select("*,listings(*)").eq("user_id", uid),
        c.from("payout_details").select("*").eq("user_id", uid).maybeSingle(),
        c
          .from("support_tickets")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
        c.from("user_roles").select("role").eq("user_id", uid),
      ]);
    return {
      userId: uid,
      profile: unwrap(profile),
      listings: unwrap(listings),
      deals: unwrap(deals),
      offers: unwrap(offers),
      bids: unwrap(bids),
      watchlist: unwrap(watchlist),
      payout: optional(payout),
      tickets: unwrap(tickets),
      isAdmin: unwrap(roles).some((r) => r.role === "admin"),
    };
  });

const listingInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(5).max(180),
  category: z.enum(["adsense", "affiliate", "ecommerce", "directory", "service"]),
  sale_type: z.enum(["fixed", "auction"]),
  price: z.number().positive().max(1e12),
  monthly_revenue: z.number().min(0),
  monthly_profit: z.number(),
  monthly_traffic: z.number().int().min(0),
  age_years: z.number().int().min(0),
  summary: z.string().trim().min(15).max(500),
  description: z.string().trim().min(30).max(10000),
  url: z.string().url().max(500),
  images: z.array(z.string().max(500)).max(6),
  status: z.enum(["draft", "pending"]),
  ends_at: z.string().nullable(),
  ownership_method: z.enum(["dns", "meta", "email", "analytics"]),
  ownership_evidence: z.string().trim().min(5).max(4000),
});
export const saveListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(listingInput)
  .handler(async ({ data, context }) => {
    if (
      data.sale_type === "auction" &&
      (!data.ends_at || new Date(data.ends_at).getTime() <= Date.now())
    )
      throw new Error("Auction closing time must be in the future.");
    if (data.images.some((path) => path.split("/")[0] !== context.userId))
      throw new Error("You can only use your own uploaded images.");
    const { id, ownership_method, ownership_evidence, ...fields } = data;
    if (id) {
      unwrap(
        await context.supabase
          .from("listings")
          .update({ ...fields, updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("seller_id", context.userId)
          .select("id")
          .single(),
      );
      const old = optional(
        await context.supabase
          .from("listing_reviews")
          .select("listing_id")
          .eq("listing_id", id)
          .maybeSingle(),
      );
      if (!old)
        optional(
          await context.supabase
            .from("listing_reviews")
            .insert({ listing_id: id, ownership_method, ownership_evidence }),
        );
      else
        optional(
          await context.supabase.rpc("update_ownership", {
            _listing: id,
            _method: ownership_method,
            _evidence: ownership_evidence,
          }),
        );
      return id;
    }
    const row = unwrap(
      await context.supabase
        .from("listings")
        .insert({ ...fields, seller_id: context.userId })
        .select("id")
        .single(),
    );
    try {
      optional(
        await context.supabase
          .from("listing_reviews")
          .insert({ listing_id: row.id, ownership_method, ownership_evidence }),
      );
    } catch (e) {
      await context.supabase.from("listings").delete().eq("id", row.id);
      throw e;
    }
    return row.id;
  });

export const readOwnListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => ({
    listing: unwrap(
      await context.supabase
        .from("listings")
        .select("*")
        .eq("id", data.id)
        .eq("seller_id", context.userId)
        .single(),
    ),
    review: optional(
      await context.supabase
        .from("listing_reviews")
        .select("*")
        .eq("listing_id", data.id)
        .maybeSingle(),
    ),
  }));

const commandInput = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("buy"), id: z.string().uuid() }),
  z.object({
    kind: z.literal("offer"),
    id: z.string().uuid(),
    amount: z.number().positive(),
    message: z.string().max(1000),
  }),
  z.object({ kind: z.literal("bid"), id: z.string().uuid(), amount: z.number().positive() }),
  z.object({ kind: z.literal("close_auction"), id: z.string().uuid() }),
  z.object({ kind: z.literal("respond"), id: z.string().uuid(), accept: z.boolean() }),
  z.object({ kind: z.literal("withdraw"), id: z.string().uuid() }),
  z.object({ kind: z.literal("delete_listing"), id: z.string().uuid() }),
  z.object({ kind: z.literal("watch"), id: z.string().uuid(), saved: z.boolean() }),
  z.object({
    kind: z.literal("report"),
    id: z.string().uuid(),
    reason: z.string().trim().min(5).max(2000),
  }),
  z.object({
    kind: z.literal("support"),
    subject: z.string().trim().min(3).max(180),
    body: z.string().trim().min(10).max(4000),
  }),
  z.object({
    kind: z.literal("profile"),
    name: z.string().trim().min(2).max(100),
    bio: z.string().max(1000),
    country: z.string().trim().max(60).optional(),
    method: z.enum(paymentMethodIds),
    account: z.string().trim().min(3).max(200),
  }),
]);
export const marketplaceCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(commandInput)
  .handler(async ({ data, context }) => {
    const c = context.supabase;
    const uid = context.userId;
    switch (data.kind) {
      case "buy":
        return unwrap(await c.rpc("buy_now", { _listing: data.id }));
      case "offer":
        return unwrap(
          await c.rpc("make_offer", {
            _listing: data.id,
            _amount: data.amount,
            _message: data.message,
          }),
        );
      case "bid":
        return unwrap(await c.rpc("place_bid", { _listing: data.id, _amount: data.amount }));
      case "close_auction":
        return unwrap(await c.rpc("finalize_auction", { _listing: data.id }));
      case "respond":
        return optional(await c.rpc("respond_offer", { _offer: data.id, _accept: data.accept }));
      case "withdraw":
        optional(await c.rpc("withdraw_offer", { _offer: data.id }));
        break;
      case "delete_listing":
        unwrap(
          await c
            .from("listings")
            .delete()
            .eq("id", data.id)
            .eq("seller_id", uid)
            .select("id")
            .single(),
        );
        break;
      case "watch":
        if (data.saved)
          optional(await c.from("watchlist").upsert({ user_id: uid, listing_id: data.id }));
        else
          optional(await c.from("watchlist").delete().eq("user_id", uid).eq("listing_id", data.id));
        break;
      case "report":
        optional(
          await c
            .from("reports")
            .insert({ user_id: uid, listing_id: data.id, reason: data.reason }),
        );
        break;
      case "support":
        optional(
          await c
            .from("support_tickets")
            .insert({ user_id: uid, subject: data.subject, body: data.body }),
        );
        break;
      case "profile":
        optional(
          await c
            .from("profiles")
            .update({
              display_name: data.name,
              bio: data.bio,
              ...(data.country !== undefined ? { country: data.country || null } : {}),
              updated_at: new Date().toISOString(),
            })
            .eq("id", uid),
        );
        optional(
          await c
            .from("payout_details")
            .upsert({
              user_id: uid,
              method: data.method,
              account: data.account,
              updated_at: new Date().toISOString(),
            }),
        );
        break;
    }
    return null;
  });

export const readDeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const c = context.supabase;
    const [deal, events, files, settings, isAdmin] = await Promise.all([
      c.from("deals").select("*,listings(title,slug,url)").eq("id", data.id).single(),
      c
        .from("deal_events")
        .select("*,profiles(display_name)")
        .eq("deal_id", data.id)
        .order("created_at"),
      c.from("deal_files").select("*").eq("deal_id", data.id).order("created_at"),
      c.rpc("deal_payment_settings", { _deal: data.id }),
      c.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    ]);
    const d = unwrap(deal);
    const payout = optional(
      await c.from("payout_details").select("*").eq("user_id", d.seller_id).maybeSingle(),
    );
    const review = optional(
      await c.from("seller_reviews").select("*").eq("deal_id", data.id).maybeSingle(),
    );
    return {
      deal: d,
      events: unwrap(events),
      files: unwrap(files),
      settings: unwrap(settings),
      userId: context.userId,
      isAdmin: unwrap(isAdmin),
      payout,
      review,
    };
  });
export const dealCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      action: z.enum([
        "message",
        "submit_payment",
        "verify_payment",
        "reject_payment",
        "start_transfer",
        "mark_delivered",
        "approve",
        "dispute",
        "resolve_complete",
        "resolve_refund",
        "cancel",
        "mark_paid",
      ]),
      text: z.string().max(4000).default(""),
      method: z.string().max(100).default(""),
    }),
  )
  .handler(async ({ data, context }) => {
    if (data.action === "message")
      optional(
        await context.supabase
          .from("deal_events")
          .insert({ deal_id: data.id, author_id: context.userId, body: data.text.trim() }),
      );
    else
      optional(
        await context.supabase.rpc("deal_action", {
          _deal: data.id,
          _action: data.action,
          _text1: data.text,
          _text2: data.method,
        }),
      );
    return true;
  });

export const reviewSeller = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      dealId: z.string().uuid(),
      rating: z.number().int().min(1).max(5),
      body: z.string().trim().min(5).max(2000),
    }),
  )
  .handler(async ({ data, context }) => {
    const deal = unwrap(
      await context.supabase
        .from("deals")
        .select("seller_id,buyer_id,stage")
        .eq("id", data.dealId)
        .single(),
    );
    if (deal.buyer_id !== context.userId || deal.stage !== "completed")
      throw new Error("Only the buyer may review a completed deal.");
    optional(
      await context.supabase
        .from("seller_reviews")
        .insert({
          deal_id: data.dealId,
          reviewer_id: context.userId,
          seller_id: deal.seller_id,
          rating: data.rating,
          body: data.body,
        }),
    );
    return true;
  });

export const readAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (
      !unwrap(await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }))
    )
      throw new Error("Administrator access is required.");
    const c = context.supabase;
    const [listings, reviews, deals, reports, tickets, settings, payment, users, audit, suspended, verification] = await Promise.all([
      c.from("listings").select("*").order("created_at", { ascending: false }),
      c.from("listing_reviews").select("*"),
      c.from("deals").select("*,listings(title,slug)").order("created_at", { ascending: false }),
      c.from("reports").select("*,listings(title)").order("created_at", { ascending: false }),
      c
        .from("support_tickets")
        .select("*,profiles(display_name)")
        .order("created_at", { ascending: false }),
      c.from("site_settings").select("*").single(),
      c.from("payment_settings").select("*").single(),
      c.rpc("admin_list_users"),
      c.from("admin_audit").select("*").order("created_at", { ascending: false }).limit(100),
      c.from("profiles").select("id").eq("suspended", true),
      c.from("profiles").select("id,id_verified,phone_verified,payment_verified"),
    ]);
    return {
      userId: context.userId,
      users: optional(users) ?? [],
      listings: unwrap(listings),
      reviews: unwrap(reviews),
      deals: unwrap(deals),
      reports: unwrap(reports),
      tickets: unwrap(tickets),
      settings: unwrap(settings),
      payment: unwrap(payment),
      audit: optional(audit) ?? [],
      suspendedIds: (optional(suspended) ?? []).map((p) => p.id),
      verification: optional(verification) ?? [],
    };
  });
export const adminCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.discriminatedUnion("kind", [
      z.object({
        kind: z.literal("moderate"),
        id: z.string().uuid(),
        status: z.enum(["approved", "rejected", "suspended"]),
        note: z.string().max(4000),
        verified: z.array(z.enum(["Domain", "Analytics", "Revenue"])),
        featured: z.boolean(),
      }),
      z.object({ kind: z.literal("report"), id: z.string().uuid() }),
      z.object({
        kind: z.literal("reply"),
        id: z.string().uuid(),
        reply: z.string().trim().min(5).max(4000),
      }),
      z.object({
        kind: z.literal("role"),
        id: z.string().uuid(),
        role: z.enum(["admin", "moderator"]),
        grant: z.boolean(),
      }),
      z.object({ kind: z.literal("delete_listing"), id: z.string().uuid() }),
      z.object({ kind: z.literal("suspend"), id: z.string().uuid(), suspended: z.boolean() }),
      z.object({
        kind: z.literal("verify"),
        id: z.string().uuid(),
        check: z.enum(["id", "phone", "payment"]),
        value: z.boolean(),
      }),
      z.object({ kind: z.literal("announcement"), text: z.string().max(300) }),
      z.object({ kind: z.literal("commission"), rate: z.number().min(0).max(50) }),
      z.object({
        kind: z.literal("settings"),
        email: z.string().email(),
        pay: z.string().max(200),
        trc: z.string().max(200),
        bep: z.string().max(200),
        jazzcash: z.string().max(200),
        easypaisa: z.string().max(200),
        raast: z.string().max(200),
        bank: z.string().max(1000),
      }),
    ]),
  )
  .handler(async ({ data, context }) => {
    const c = context.supabase;
    if (!unwrap(await c.rpc("has_role", { _user_id: context.userId, _role: "admin" })))
      throw new Error("Administrator access is required.");
    if (data.kind === "moderate")
      optional(
        await c.rpc("moderate_listing", {
          _listing: data.id,
          _status: data.status,
          _note: data.note,
          _verified: data.verified,
          _featured: data.featured,
        }),
      );
    if (data.kind === "role")
      optional(
        await c.rpc("admin_set_role", { _user: data.id, _role: data.role, _grant: data.grant }),
      );
    if (data.kind === "delete_listing")
      optional(await c.rpc("admin_delete_listing", { _listing: data.id }));
    if (data.kind === "commission")
      optional(await c.rpc("admin_set_commission", { _rate: data.rate / 100 }));
    if (data.kind === "report")
      optional(await c.from("reports").update({ status: "resolved" }).eq("id", data.id));
    if (data.kind === "reply")
      optional(
        await c
          .from("support_tickets")
          .update({ reply: data.reply, status: "resolved" })
          .eq("id", data.id),
      );
    if (data.kind === "suspend")
      optional(await c.rpc("admin_set_suspended", { _user: data.id, _suspended: data.suspended }));
    if (data.kind === "verify")
      optional(await c.rpc("admin_set_verification", { _user: data.id, _kind: data.check, _value: data.value }));
    if (data.kind === "announcement")
      optional(await c.rpc("admin_set_announcement", { _text: data.text.trim() }));
    const logged: Record<string, string> = {
      moderate: "moderate listing",
      role: "change role",
      delete_listing: "delete listing",
      commission: "change commission",
      report: "resolve report",
      reply: "reply to support",
      settings: "update receiving details",
    };
    if (logged[data.kind])
      await c.rpc("admin_log", {
        _action: logged[data.kind] ?? data.kind,
        _target: "id" in data ? data.id : "",
        _detail:
          data.kind === "moderate"
            ? data.status
            : data.kind === "role"
              ? `${data.grant ? "grant" : "remove"} ${data.role}`
              : data.kind === "commission"
                ? `${data.rate}%`
                : "",
      });
    if (data.kind === "settings") {
      optional(await c.from("site_settings").update({ support_email: data.email }).eq("id", 1));
      optional(
        await c
          .from("payment_settings")
          .upsert({
            id: 1,
            binance_pay_id: data.pay.trim(),
            usdt_trc20_address: data.trc.trim(),
            usdt_bep20_address: data.bep.trim(),
            jazzcash_account: data.jazzcash.trim(),
            easypaisa_account: data.easypaisa.trim(),
            raast_id: data.raast.trim(),
            bank_transfer_details: data.bank.trim(),
            updated_at: new Date().toISOString(),
          }),
      );
    }
    return true;
  });
