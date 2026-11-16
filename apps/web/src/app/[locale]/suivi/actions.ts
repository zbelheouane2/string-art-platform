"use server";

import { trackOrder, type TrackResult } from "@/lib/tracking";

export type TrackState = { result: TrackResult | null; values: { number: string; phone: string } };

export async function trackAction(_prev: TrackState, form: FormData): Promise<TrackState> {
  const number = String(form.get("number") ?? "").slice(0, 20);
  const phone = String(form.get("phone") ?? "").slice(0, 30);
  return { result: await trackOrder(number, phone), values: { number, phone } };
}
