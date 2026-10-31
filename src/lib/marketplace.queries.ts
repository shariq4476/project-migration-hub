import { queryOptions } from "@tanstack/react-query";
import {
  readMarketplace,
  readDashboard,
  readAdmin,
  readDeal,
  readOwnListing,
} from "./marketplace.functions";
export const marketplaceQuery = queryOptions({
  queryKey: ["marketplace"],
  queryFn: () => readMarketplace(),
  staleTime: 60000,
});
export const dashboardQuery = queryOptions({
  queryKey: ["dashboard"],
  queryFn: () => readDashboard(),
});
export const adminQuery = queryOptions({ queryKey: ["admin"], queryFn: () => readAdmin() });
export const dealQuery = (id: string) =>
  queryOptions({ queryKey: ["deal", id], queryFn: () => readDeal({ data: { id } }) });
export const ownListingQuery = (id: string) =>
  queryOptions({ queryKey: ["own-listing", id], queryFn: () => readOwnListing({ data: { id } }) });
