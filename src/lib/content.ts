export const faqs = [
  { q: "Who is ClicksSpot for?", a: "Website owners and buyers in Pakistan and South Asia. We focus only on websites: AdSense blogs, affiliate sites, online stores, portals and lead-generation sites." },
  { q: "Why not just sell in a Facebook or WhatsApp group?", a: "Group deals have no protection — buyers pay and sellers vanish, or sellers hand over and never get paid. ClicksSpot holds the payment until the buyer confirms the website, hosting and accounts were transferred." },
  { q: "How does ClicksSpot protect buyers?", a: "Your payment is held by ClicksSpot until you confirm the asset was transferred. If something goes wrong, you can open a dispute and our team steps in." },
  { q: "Which payment methods do you accept?", a: "JazzCash, Easypaisa, Raast, local bank transfer, Binance Pay or USDT (TRC20/BEP20) — no PayPal or Stripe needed. You submit the transaction ID and a screenshot, and an admin verifies it by hand." },
  { q: "What does it cost to sell?", a: "Listing is free. When a deal completes, ClicksSpot keeps a 10% commission from the sale price." },
  { q: "How do sellers get paid?", a: "After the buyer approves the transfer, our team sends your payout to the JazzCash, Easypaisa, Raast, bank or Binance account you saved and records the transaction reference." },
  { q: "Can others see my deal?", a: "No. Deal details are only visible to the buyer, the seller and ClicksSpot admins. Public pages only show Active, Sale in progress or Sold." },
  { q: "How are listings verified?", a: "Sellers can prove ownership via DNS record, meta tag, Google Analytics access or AdSense earnings screenshots, reviewed by our team. Verified items get a badge." },
];

export const legal = {
  terms: { title: "Terms of Service", body: ["These terms govern your use of ClicksSpot. By creating an account you agree to them.", "ClicksSpot acts as an intermediary that holds buyer funds until a deal is approved. Payments are accepted by JazzCash, Easypaisa, Raast, local bank transfer and USDT via Binance.", "Placeholder text — replace with your final legal terms before launch."] },
  privacy: { title: "Privacy Policy", body: ["We collect only what we need to run the marketplace: account details, listing data, deal records and verification documents.", "Sensitive files (IDs, payment proof, transfer details) are stored privately and shown only to the people involved in a deal.", "Placeholder text — replace with your final privacy policy before launch."] },
  refund: { title: "Refund Policy", body: ["If a seller fails to transfer the asset, or a dispute is resolved in the buyer's favour, the held funds are returned to the buyer by the same method they paid with.", "Refunds are processed manually by our team and recorded with a transaction reference.", "Placeholder text — replace with your final refund policy before launch."] },
} satisfies Record<string, { title: string; body: string[] }>;
