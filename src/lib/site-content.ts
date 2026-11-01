export const fontOptions = {
  jakarta: { label: "Plus Jakarta Sans (modern, clean)", sans: "Plus Jakarta Sans", display: "Plus Jakarta Sans" },
  outfit: { label: "Outfit (friendly, rounded)", sans: "Outfit", display: "Outfit" },
  sora: { label: "Sora (tech, geometric)", sans: "Sora", display: "Sora" },
  grotesk: { label: "Space Grotesk + DM Sans (bold startup)", sans: "DM Sans", display: "Space Grotesk" },
  lora: { label: "Lora + Nunito Sans (classic, trustworthy)", sans: "Nunito Sans", display: "Lora" },
  manrope: { label: "Manrope + DM Serif (original)", sans: "Manrope", display: "DM Serif Display" },
} as const;
export type FontId = keyof typeof fontOptions;

export const fontStylesheet =
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700&family=Sora:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=DM+Sans:wght@400;500;700&family=Lora:wght@500;600;700&family=Nunito+Sans:wght@400;600;700&family=Manrope:wght@400;500;600;700&family=DM+Serif+Display&display=swap";

export type Pair = { title: string; text: string };
export interface SiteContent {
  font: FontId;
  siteName: string;
  heroBadge: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  stats: Pair[];
  features: Pair[];
  testimonials: Pair[];
  sellerTitle: string;
  sellerText: string;
  ctaTitle: string;
  ctaText: string;
  footerAbout: string;
  footerNote: string;
  contactPhone: string;
  contactWhatsapp: string;
}

export const defaultContent: SiteContent = {
  font: "jakarta",
  siteName: "ClicksSpot",
  heroBadge: "Pakistan & South Asia's website marketplace",
  heroTitle: "ClicksSpot",
  heroHighlight: "Buy and sell websites safely.",
  heroSubtitle:
    "AdSense blogs, affiliate sites and online stores with verified traffic — and escrow that holds payment until the buyer confirms. No more scams in Facebook and WhatsApp groups.",
  stats: [
    { title: "100%", text: "Escrow-protected deals" },
    { title: "5", text: "Local payment methods" },
    { title: "24h", text: "Listing review time" },
    { title: "0", text: "Fees to list" },
  ],
  features: [
    { title: "Verified listings", text: "Every listing is reviewed by our team. Domain ownership, analytics and revenue proofs are checked before going live." },
    { title: "Manual escrow", text: "Your payment is held by ClicksSpot and only released to the seller after you confirm the transfer." },
    { title: "Local payments", text: "Pay with JazzCash, Easypaisa, Raast, bank transfer or USDT — no international card needed." },
    { title: "Private deal rooms", text: "Chat, share files and track every step of the transfer in a secure room only you, the seller and our team can see." },
    { title: "Seller trust profiles", text: "See ratings, completed deals and ID verification before you make an offer." },
    { title: "Dispute support", text: "If something goes wrong, our team reviews the evidence and refunds when the seller does not deliver." },
  ],
  testimonials: [
    { title: "Hamza R., Lahore", text: "Sold my WooCommerce store in 9 days. The escrow made the buyer comfortable paying upfront." },
    { title: "Sara K., Karachi", text: "Finally a safe place to buy a blog without getting scammed in a Facebook group." },
    { title: "Ali N., Islamabad", text: "The deal room kept everything organised — credentials, files and payment proof in one place." },
  ],
  sellerTitle: "Ready to sell your website?",
  sellerText: "List for free, reach serious buyers across Pakistan and South Asia, and get paid safely through escrow.",
  ctaTitle: "Start your next online business today",
  ctaText: "Browse verified websites, make an offer, and let ClicksSpot handle the safe transfer.",
  footerAbout: "The safe website marketplace for Pakistan & South Asia.",
  footerNote: "© 2026 ClicksSpot. Pay with JazzCash, Easypaisa, Raast, bank transfer or USDT.",
  contactPhone: "",
  contactWhatsapp: "",
};

const isPairs = (v: unknown): v is Pair[] =>
  Array.isArray(v) && v.every((p) => p && typeof p.title === "string" && typeof p.text === "string");

/** Merge saved content over defaults, ignoring malformed or empty values. */
export function mergeContent(saved: unknown): SiteContent {
  const out: SiteContent = { ...defaultContent };
  if (!saved || typeof saved !== "object") return out;
  const s = saved as Record<string, unknown>;
  for (const key of Object.keys(defaultContent) as (keyof SiteContent)[]) {
    const v = s[key];
    if (key === "font") {
      if (typeof v === "string" && v in fontOptions) out.font = v as FontId;
    } else if (key === "stats" || key === "features" || key === "testimonials") {
      if (isPairs(v) && v.length) out[key] = v;
    } else if (typeof v === "string" && (v.trim() || key.startsWith("contact"))) {
      (out as unknown as Record<string, string>)[key] = v;
    }
  }
  return out;
}

export const pairsToText = (p: Pair[]) => p.map((x) => `${x.title} | ${x.text}`).join("\n");
export const textToPairs = (t: string): Pair[] =>
  t
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf("|");
      return i < 0 ? { title: l, text: "" } : { title: l.slice(0, i).trim(), text: l.slice(i + 1).trim() };
    });
