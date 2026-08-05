/**
 * About Us, Our Mission, and the ten competitive advantages — verbatim from
 * `docs/content/supplied-copy.md`.
 *
 * Do not rewrite these words. Headings and layout are ours; the sentences are
 * the client's. Note the em dash with no surrounding spaces (`vehicle—it's`) —
 * that is the client's own punctuation and is preserved deliberately.
 */

/** Paragraphs of "About Us", in order. */
export const ABOUT_US: string[] = [
  "At XPDX Rentals, we believe that renting a vehicle should be simple, reliable, and backed by people who genuinely care.",
  "What started as a small family business has grown into one of Sydney's trusted commercial vehicle rental providers by focusing on one thing above all else: putting our customers first. We know that for many of our clients, a van isn't just a vehicle—it's how they earn a living, support their families, and build their future. That's a responsibility we never take lightly.",
  "Every vehicle in our fleet is prepared with the same level of care and attention we'd expect for our own family. From regular servicing and thorough inspections to fast support whenever you need it, we're committed to keeping you on the road with confidence.",
  "We pride ourselves on building long-term relationships rather than simply completing transactions. Whether you're a courier, tradesperson, contractor, or business owner, our goal is to provide dependable vehicles, honest service, and a team that's always willing to go the extra mile.",
  "As we've grown, our values have remained the same: integrity, transparency, reliability, and genuine customer care. These principles guide every decision we make and have helped us earn the trust of hundreds of customers across New South Wales.",
  "At XPDX Rentals, you're never just another booking. You're part of a community that we are proud to support, and we're committed to helping your business succeed—one kilometre at a time.",
];

/** Paragraphs of "Our Mission", in order. */
export const OUR_MISSION: string[] = [
  "At XPDX Rentals, our mission is to provide reliable, affordable, and professionally maintained commercial vehicles that help individuals and businesses keep moving.",
  "We understand that for many of our customers, a vehicle is more than just transport—it's essential to their livelihood. That's why we're committed to delivering dependable vehicles, transparent service, and genuine customer support that businesses can rely on every day.",
  "By combining quality vehicles with honest advice, flexible rental solutions, and a customer-first approach, we aim to build lasting relationships founded on trust, reliability, and integrity.",
  "Our goal is simple: to remove the stress from commercial vehicle rental so our customers can focus on what matters most—growing their business with confidence.",
];

/**
 * The ten stated advantages, exactly as listed and in the client's order.
 *
 * CLAUDE.md §3: "Do not paraphrase them into something blander, and do not
 * invent an eleventh." The strings below are the copy; the icon names are
 * presentation only and carry no claim.
 */
export const ADVANTAGES: { label: string; icon: string }[] = [
  { label: "Unlimited kilometres", icon: "infinity" },
  { label: "Comprehensive insurance", icon: "shield" },
  { label: "24/7 roadside assistance", icon: "phone" },
  { label: "Well-maintained fleet", icon: "wrench" },
  { label: "Flexible rental terms (28 day minimum)", icon: "calendar" },
  { label: "Fast approvals", icon: "zap" },
  { label: "Family-owned business", icon: "users" },
  { label: "Transparent pricing", icon: "tag" },
  { label: "Dedicated support", icon: "headset" },
  { label: "In-house mechanic", icon: "cog" },
];
