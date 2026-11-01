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

export const colorFields = {
  primary: { label: "Main colour (buttons, highlights)", def: "#16a34a" },
  primaryText: { label: "Text on main colour", def: "#ffffff" },
  navy: { label: "Header, footer & hero background", def: "#0f172a" },
  navyText: { label: "Text on header & footer", def: "#ffffff" },
  background: { label: "Page background", def: "#f8fafc" },
  card: { label: "Cards & panels", def: "#ffffff" },
  text: { label: "Body text", def: "#1e293b" },
  heading: { label: "Headings", def: "#0f172a" },
  muted: { label: "Secondary text", def: "#64748b" },
  link: { label: "Links & info colour", def: "#2563eb" },
  border: { label: "Borders", def: "#e2e8f0" },
} as const;
export type ColorId = keyof typeof colorFields;
export type Colors = Record<ColorId, string>;
export const defaultColors = Object.fromEntries(
  Object.entries(colorFields).map(([k, v]) => [k, v.def]),
) as Colors;
const hex = /^#[0-9a-f]{6}$/i;

/** CSS variable values the site theme uses for the chosen colours, sizes and corners. */
export function themeVars(c: Colors, fontScale: number, radius: number): Record<string, string> {
  const mix = (a: string, b: string, pct: number) => `color-mix(in oklab, ${a} ${pct}%, ${b})`;
  return {
    "--primary": c.primary,
    "--primary-hover": mix(c.primary, "black", 85),
    "--primary-foreground": c.primaryText,
    "--ring": c.primary,
    "--success": c.primary,
    "--success-soft": mix(c.primary, "white", 10),
    "--chart-1": c.primary,
    "--sidebar-primary": c.primary,
    "--sidebar-ring": c.primary,
    "--navy": c.navy,
    "--navy-2": mix(c.navy, c.navyText, 88),
    "--navy-foreground": c.navyText,
    "--navy-muted": mix(c.navyText, c.navy, 70),
    "--sidebar": c.navy,
    "--sidebar-accent": mix(c.navy, c.navyText, 88),
    "--sidebar-border": mix(c.navy, c.navyText, 88),
    "--gradient-hero": `linear-gradient(135deg, ${c.navy}, ${mix(c.navy, c.navyText, 85)})`,
    "--background": c.background,
    "--card": c.card,
    "--popover": c.card,
    "--foreground": c.text,
    "--card-foreground": c.text,
    "--popover-foreground": c.text,
    "--heading": c.heading,
    "--muted-foreground": c.muted,
    "--muted": mix(c.border, c.background, 50),
    "--secondary": mix(c.border, c.background, 50),
    "--secondary-foreground": c.heading,
    "--accent": mix(c.link, "white", 8),
    "--accent-foreground": c.link,
    "--info": c.link,
    "--border": c.border,
    "--input": c.border,
    "--radius": `${radius}rem`,
    "--app-font-size": `${fontScale}px`,
  };
}
export interface SiteContent {
  font: FontId;
  colors: Colors;
  fontScale: number;
  radius: number;
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
  colors: defaultColors,
  fontScale: 16.5,
  radius: 0.625,
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
    if (key === "colors") {
      const saved = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
      out.colors = { ...defaultColors };
      for (const id of Object.keys(defaultColors) as ColorId[]) {
        const val = saved[id];
        if (typeof val === "string" && hex.test(val)) out.colors[id] = val;
      }
    } else if (key === "fontScale") {
      if (typeof v === "number" && v >= 14 && v <= 20) out.fontScale = v;
    } else if (key === "radius") {
      if (typeof v === "number" && v >= 0 && v <= 1.5) out.radius = v;
    } else if (key === "font") {
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
