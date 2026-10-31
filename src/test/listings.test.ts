import { describe, expect, it } from "vitest";
import { commissionFor, filterListings, listings, publicStatusLabel } from "@/lib/listings";

describe("listings rules", () => {
  it("takes a 10% commission", () => expect(commissionFor(50000)).toBe(5000));
  it("only exposes Active / Sale in progress / Sold publicly", () =>
    expect(Object.values(publicStatusLabel).sort()).toEqual([
      "Active",
      "Sale in progress",
      "Sold",
    ]));
  it("filters by max price", () =>
    expect(
      filterListings(listings, { maxPrice: 20000 })
        .map((l) => l.id)
        .sort(),
    ).toEqual(["pixeltools-domain", "recipehub-site"]));
  it("filters both minimum and maximum prices", () =>
    expect(
      filterListings(listings, { minPrice: 20000, maxPrice: 40000 })
        .map((l) => l.id)
        .sort(),
    ).toEqual(["cryptobrief-blog", "petnest-store"]));
});
