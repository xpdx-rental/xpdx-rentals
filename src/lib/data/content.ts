import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TestimonialRow } from "@/lib/data/rows";

/**
 * Customer reviews.
 *
 * The client has supplied none yet, so every surface that renders these hides
 * itself when the list is empty rather than showing an empty "what our
 * customers say" heading. CLAUDE.md §1.6 — no invented social proof, and the
 * supplied-copy notes are explicit that the client's own claims must not be
 * extended into figures or awards that were never given.
 *
 * Migration 0019 drops `photo_media_id` and `vehicle_id` from `testimonials`,
 * so this reads only the columns that survive.
 *
 * The FAQ reader that used to live here is gone: the eighteen supplied FAQs
 * are legally operative and now live in `src/lib/content/faqs.ts` under
 * review, not in a CMS table an operator can reword by accident.
 */

export type Testimonial = {
  id: string;
  customerName: string;
  rating: number;
  quote: string;
  source: string;
  reviewDate: string | null;
};

export const getApprovedTestimonials = unstable_cache(
  async (limit = 12): Promise<Testimonial[]> => {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("testimonials")
        .select("id, customer_name, rating, quote, source, review_date")
        .eq("is_approved", true)
        .order("sort_order", { ascending: true })
        .order("review_date", { ascending: false })
        .limit(limit);
      if (error) return [];
      return ((data ?? []) as TestimonialRow[]).map((t) => ({
        id: t.id,
        customerName: t.customer_name,
        rating: t.rating,
        quote: t.quote,
        source: t.source,
        reviewDate: t.review_date ?? null,
      }));
    } catch {
      return [];
    }
  },
  ["testimonials"],
  { revalidate: 3600, tags: ["testimonials", "public"] },
);
