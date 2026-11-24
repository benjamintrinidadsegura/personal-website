import "server-only";
import { headers } from "next/headers";
import { canOpenCommunityReview } from "./review-boundary";

export async function isCommunityReviewEnabled(): Promise<boolean> {
  return canOpenCommunityReview(await headers());
}
