import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { requireEnv } from "@/lib/config";
import type { RoofHeight, VanStatus } from "@/lib/van";
import type { PublicVanRow, VanImageEmbedRow, VanSlugRow } from "@/lib/data/rows";
import { withCache, cacheKey } from "@/lib/redis";

/**
 * Public fleet reads.
 *
 * Deliberately uses the ANON client, not the service-role one. RLS on `vans`
 * already restricts the public to `status <> 'draft'`, so letting Postgres
 * enforce it means a draft van cannot leak through a forgotten `.neq()` in
 * application code. The admin client bypasses RLS and has no business on the
 * public site (CLAUDE.md §1.10).
 *
 * It is also cookie-free, so these pages stay statically renderable — see
 * `lib/supabase/public.ts`.
 *
 * If these queries ever return a draft van, that is an RLS bug, and
 * `src/lib/supabase/rls.integration.test.ts` is the test that catches it.
 */

const BUCKET = "van-images";

export type PublicVanImage = { url: string; alt: string };

export type PublicVan = {
  id: string;
  slug: string;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  registration: string | null;
  bodyType: string;
  wheelbaseLabel: string;
  roof: RoofHeight;
  tonnage: number;
  transmission: string;
  fuel: string;
  seats: number | null;
  priceWeeklyFrom: number;
  priceMonthlyFrom: number | null;
  depositAmount: number | null;
  minHireDays: number;
  lengthMm: number | null;
  heightMm: number | null;
  widthMm: number | null;
  wheelbaseMm: number | null;
  loadVolumeM3: number | null;
  payloadKg: number | null;
  features: string[];
  summary: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: VanStatus;
  sortOrder: number;
  updatedAt: string;
  images: PublicVanImage[];
  primaryImage: PublicVanImage | null;
};

/**
 * Memoised storage base URL.
 *
 * `imageUrl` runs once per image per van, so on a ten-van fleet with a gallery
 * each this was doing dozens of `process.env` reads and regex replaces per
 * render. It stays lazy rather than becoming a module constant because
 * `requireEnv` throws, and throwing at import time would break the
 * database-less demo path that the `MOCK_VANS` fallback exists to support.
 */
let storageBase: string | null = null;

function imageUrl(storagePath: string): string {
  storageBase ??= requireEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
  return `${storageBase}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

const SELECT = `
  id, slug, name, make, model, year, registration, body_type, wheelbase_label, roof, tonnage, transmission, fuel, seats,
  price_weekly_from, price_monthly_from, deposit_amount, min_hire_days,
  length_mm, height_mm, width_mm, wheelbase_mm, load_volume_m3, payload_kg,
  features, summary, description, seo_title, seo_description,
  status, sort_order, updated_at,
  van_images ( storage_path, alt, is_primary, sort_order )
`;

function toPublicVan(r: PublicVanRow): PublicVan {
  const images = ((r.van_images ?? []) as VanImageEmbedRow[]).map((img) => ({
    url: imageUrl(img.storage_path),
    alt: img.alt,
  }));

  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    make: r.make,
    model: r.model,
    year: r.year,
    registration: r.registration,
    bodyType: r.body_type,
    wheelbaseLabel: r.wheelbase_label,
    roof: r.roof,
    tonnage: Number(r.tonnage),
    transmission: r.transmission,
    fuel: r.fuel,
    seats: r.seats ?? null,
    priceWeeklyFrom: Number(r.price_weekly_from),
    priceMonthlyFrom: r.price_monthly_from == null ? null : Number(r.price_monthly_from),
    depositAmount: r.deposit_amount == null ? null : Number(r.deposit_amount),
    minHireDays: Number(r.min_hire_days),
    lengthMm: r.length_mm ?? null,
    heightMm: r.height_mm ?? null,
    widthMm: r.width_mm ?? null,
    wheelbaseMm: r.wheelbase_mm ?? null,
    loadVolumeM3: r.load_volume_m3 == null ? null : Number(r.load_volume_m3),
    payloadKg: r.payload_kg ?? null,
    features: (r.features ?? []) as string[],
    summary: r.summary ?? null,
    description: r.description ?? null,
    seoTitle: r.seo_title ?? null,
    seoDescription: r.seo_description ?? null,
    status: r.status as VanStatus,
    sortOrder: Number(r.sort_order ?? 0),
    updatedAt: r.updated_at,
    images,
    primaryImage: images[0] ?? null,
  };
}

/**
 * Demo fleet, served when the database is unreachable or empty.
 *
 * **Module scope, not function scope.** This array literal was declared inside
 * `getPublicVans()`, so roughly 20 KB of object graph — ten vans, each with
 * multi-paragraph prose — was allocated, and thrown away, on every single call
 * to that function, including the calls that hit the cache and never looked at
 * it. As a module constant it is built once per process.
 *
 * `readonly` because it is now shared: a caller that mutated a returned van
 * would corrupt the fallback for every subsequent request on the instance.
 */
const MOCK_VANS: readonly PublicVan[] = [
    {
      id: "mock-1",
      slug: "mercedes-sprinter-313-l2h2",
      name: "Mercedes-Benz Sprinter 313 CDI L2H2",
      make: "Mercedes-Benz",
      model: "Sprinter 313 CDI",
      year: 2022,
      registration: "XPDX-001",
      bodyType: "Panel Van",
      wheelbaseLabel: "MWB",
      roof: "high",
      tonnage: 3.5,
      transmission: "Automatic",
      fuel: "Diesel",
      seats: 3,
      priceWeeklyFrom: 490,
      priceMonthlyFrom: 1750,
      depositAmount: 500,
      minHireDays: 28,
      lengthMm: 5932,
      heightMm: 2751,
      widthMm: 2020,
      wheelbaseMm: 3665,
      loadVolumeM3: 11.0,
      payloadKg: 1300,
      features: ["Apple CarPlay & Android Auto", "Reversing Camera", "Cruise Control", "Cargo Tie-Downs & Rails", "Bluetooth Hands-Free", "Climate Control A/C", "Bulkhead Partition", "GPS Fleet Tracking"],
      summary: "The gold standard of Sydney long-term van hire. Medium-wheelbase, high-roof Sprinter delivering 11 m³ of cargo space and up to 1,300 kg payload — automatic, diesel, and ready to work.",
      description: "XPDX Rentals' Mercedes-Benz Sprinter 313 CDI (L2H2) is the benchmark cargo van for tradespeople, couriers and businesses operating across Greater Sydney. With a cavernous 11 m³ load volume and 1,300 kg payload capacity, it handles everything from flat-pack furniture to industrial equipment with ease.\n\nAs standard, every hire includes unlimited kilometres, comprehensive insurance, 24/7 roadside assistance and GPS fleet tracking — giving you total confidence on the road. The 9-speed automatic gearbox and powerful 130 kW turbodiesel engine make urban driving and motorway runs equally effortless, while Apple CarPlay and a rear-view camera keep you safe and connected.\n\nAvailable from our Condell Park depot with a minimum 28-day hire term.",
      seoTitle: "Hire Mercedes Sprinter 313 L2H2 in Sydney | XPDX Rentals — from $490/wk",
      seoDescription: "Long-term Mercedes-Benz Sprinter 313 CDI hire in Sydney from $490/week. 11 m³ load space, 1,300 kg payload, automatic diesel — unlimited km & insurance included. Pick up at Condell Park.",
      status: "available",
      sortOrder: 1,
      updatedAt: new Date().toISOString(),
      images: [
        { url: "/vans/sprinter-l2h2.jpg", alt: "White Mercedes-Benz Sprinter 313 L2H2 panel van — XPDX Rentals Sydney" },
      ],
      primaryImage: { url: "/vans/sprinter-l2h2.jpg", alt: "White Mercedes-Benz Sprinter 313 L2H2 panel van — XPDX Rentals Sydney" },
    },
    {
      id: "mock-2",
      slug: "toyota-hiace-slwb",
      name: "Toyota HiAce Super LWB Panel Van",
      make: "Toyota",
      model: "HiAce",
      year: 2023,
      registration: "XPDX-002",
      bodyType: "Panel Van",
      wheelbaseLabel: "SLWB",
      roof: "standard",
      tonnage: 2.8,
      transmission: "Automatic",
      fuel: "Diesel",
      seats: 2,
      priceWeeklyFrom: 420,
      priceMonthlyFrom: 1550,
      depositAmount: 500,
      minHireDays: 14,
      lengthMm: 5265,
      heightMm: 1990,
      widthMm: 1950,
      wheelbaseMm: 3210,
      loadVolumeM3: 6.2,
      payloadKg: 1000,
      features: ["Toyota Safety Sense 3.0", "Reversing Camera & Sensors", "Dual Sliding Cargo Doors", "Air Conditioning", "Bluetooth Hands-Free", "Bulkhead Partition", "GPS Fleet Tracking", "Cargo Lashing Rings"],
      summary: "Australia's most trusted commercial van — now available for long-term hire in Sydney. The HiAce Super LWB combines legendary reliability with generous cargo space at an unbeatable weekly rate.",
      description: "The Toyota HiAce Super LWB is the undisputed workhorse of Australian trades and logistics. XPDX Rentals' fleet-maintained examples are available for long-term hire from Condell Park, offering 6.2 m³ of cargo volume and a robust 1,000 kg payload in a package that's easy to drive, simple to load and effortless to park in tight urban spaces.\n\nEquipped with Toyota Safety Sense 3.0 — including autonomous emergency braking, lane departure warning and adaptive cruise control — the HiAce sets the benchmark for driver safety in its class. The smooth 2.8-litre turbodiesel automatic keeps fuel costs predictable on long Sydney routes.\n\nAll hires include unlimited kilometres, full comprehensive insurance and 24/7 roadside assistance.",
      seoTitle: "Toyota HiAce SLWB Hire Sydney | XPDX Rentals — from $395/wk",
      seoDescription: "Hire a Toyota HiAce Super LWB in Sydney from $395/week. 6.2 m³, 1,000 kg payload, automatic diesel with Toyota Safety Sense. Unlimited km & insurance. Condell Park pickup.",
      status: "available",
      sortOrder: 2,
      updatedAt: new Date().toISOString(),
      images: [
        { url: "/vans/hiace-lwb.jpg", alt: "White Toyota HiAce Super LWB panel van — XPDX Rentals Sydney" },
      ],
      primaryImage: { url: "/vans/hiace-lwb.jpg", alt: "White Toyota HiAce Super LWB panel van — XPDX Rentals Sydney" },
    },
    {
      id: "mock-3",
      slug: "mercedes-vito-111-cdi",
      name: "Mercedes-Benz Vito 111 CDI LWB",
      make: "Mercedes-Benz",
      model: "Vito 111 CDI",
      year: 2021,
      registration: "XPDX-005",
      bodyType: "Panel Van",
      wheelbaseLabel: "LWB",
      roof: "low",
      tonnage: 2.8,
      transmission: "Automatic",
      fuel: "Diesel",
      seats: 3,
      priceWeeklyFrom: 380,
      priceMonthlyFrom: 1400,
      depositAmount: 500,
      minHireDays: 14,
      lengthMm: 6945,
      heightMm: 2988,
      widthMm: 2020,
      wheelbaseMm: 4325,
      loadVolumeM3: 17.0,
      payloadKg: 1900,
      features: ["9-Speed Automatic", "Apple CarPlay", "360° Camera System", "Cruise Control with Speed Limiter", "LED Interior Lighting", "Full Bulkhead", "Cargo Tie-Down Rails", "GPS Fleet Tracking"],
      summary: "Sydney's largest cargo van for hire — the Jumbo Sprinter L3H3. A massive 17 m³ of load volume and 1,900 kg payload in a 9-speed automatic diesel that's still manageable on city streets.",
      description: "When you need maximum cargo capacity without stepping up to a truck, XPDX Rentals' Mercedes-Benz Sprinter 519 CDI L3H3 is the answer. This extra-long, extra-high Jumbo Sprinter delivers a massive 17 m³ of enclosed cargo space — enough for a full house move, a large exhibition fit-out or a week's worth of commercial deliveries — all in a single trip.\n\nThe 190 kW V6 turbodiesel paired with a 9-speed automatic transmission gives confident, smooth performance whether navigating inner-city Sydney or heading to regional NSW. A 360° camera system, Blind Spot Assist and Lane Keeping Assist make it safer to pilot than you might expect.\n\nThis is the van for jobs where nothing else is big enough.",
      seoTitle: "Hire Jumbo Sprinter L3H3 in Sydney | XPDX Rentals — 17 m³, from $620/wk",
      seoDescription: "Sydney's largest cargo van for hire — Mercedes-Benz Sprinter 519 L3H3 Jumbo with 17 m³ and 1,900 kg payload. Automatic diesel. Unlimited km & insurance from $620/week.",
      status: "available",
      sortOrder: 3,
      updatedAt: new Date().toISOString(),
      images: [
        { url: "/vans/sprinter-l3h3.jpg", alt: "White Mercedes-Benz Sprinter 519 L3H3 jumbo panel van — XPDX Rentals" },
      ],
      primaryImage: { url: "/vans/sprinter-l3h3.jpg", alt: "White Mercedes-Benz Sprinter 519 L3H3 jumbo panel van — XPDX Rentals" },
    },
    {
      id: "mock-4",
      slug: "ford-transit-custom",
      name: "Ford Transit Custom 340L",
      make: "Ford",
      model: "Transit Custom",
      year: 2022,
      registration: "XPDX-008",
      bodyType: "Panel Van",
      wheelbaseLabel: "LWB",
      roof: "standard",
      tonnage: 3.4,
      transmission: "Automatic",
      fuel: "Diesel",
      seats: 3,
      priceWeeklyFrom: 430,
      priceMonthlyFrom: 1550,
      depositAmount: 500,
      minHireDays: 14,
      lengthMm: 4973,
      heightMm: 1974,
      widthMm: 2034,
      wheelbaseMm: 3300,
      loadVolumeM3: 6.0,
      payloadKg: 1050,
      features: ["8-Speed Automatic", "Ford SYNC 4 Infotainment", "Reversing Camera", "Intelligent Speed Assist", "Heated Front Seats", "Bulkhead", "Cargo Lashing Eyes", "GPS Tracking"],
      summary: "The go-to compact cargo van for inner-city runs. The Transit Custom SWB slips through Sydney traffic, parks in tight spots and still carries over a tonne — at our most competitive rate.",
      description: "For businesses and sole traders who need to move efficiently through Sydney's congested streets, the Ford Transit Custom 340L SWB is the perfect long-term hire solution. Its compact external footprint belies a genuinely practical 6 m³ cargo bay — wide enough for pallets, long enough for most trade materials.\n\nFord SYNC 4 with wireless Apple CarPlay, a full-width bulkhead, and Intelligent Speed Assist make every shift more comfortable and productive. The 2.0-litre EcoBlue diesel and 8-speed automatic combination delivers strong fuel economy on mixed duty cycles.\n\nAvailable from Condell Park with a 28-day minimum hire. Unlimited kilometres, insurance and 24/7 roadside assistance included.",
      seoTitle: "Ford Transit Custom Hire Sydney | XPDX Rentals — from $360/wk",
      seoDescription: "Hire a Ford Transit Custom SWB in Sydney from $360/week. 6 m³, 1,050 kg payload, 8-speed automatic diesel. Perfect for inner-city work. Unlimited km & insurance included.",
      status: "available",
      sortOrder: 4,
      updatedAt: new Date().toISOString(),
      images: [
        { url: "/vans/transit-custom.jpg", alt: "White Ford Transit Custom SWB panel van — XPDX Rentals Sydney" },
      ],
      primaryImage: { url: "/vans/transit-custom.jpg", alt: "White Ford Transit Custom SWB panel van — XPDX Rentals Sydney" },
    },
    {
      id: "mock-5",
      slug: "mercedes-sprinter-313-l1h1",
      name: "Mercedes-Benz Sprinter 313 CDI L1H1",
      bodyType: "Panel Van",
      wheelbaseLabel: "SWB",
      roof: "standard",
      tonnage: 3.5,
      transmission: "Automatic",
      fuel: "Diesel",
      seats: 3,
      priceWeeklyFrom: 430,
      priceMonthlyFrom: 1580,
      minHireDays: 28,
      lengthMm: 5245,
      heightMm: 2360,
      widthMm: 2020,
      wheelbaseMm: 3250,
      loadVolumeM3: 7.0,
      payloadKg: 1250,
      features: ["9-Speed Automatic", "Reversing Camera", "Cruise Control", "Apple CarPlay", "Climate A/C", "Full Bulkhead", "Cargo Tie-Downs", "GPS Fleet Tracking"],
      summary: "The same Sprinter quality in a more manageable footprint. The L1H1 short-wheelbase is ideal for multi-drop routes, tight warehouse access and underground loading docks.",
      description: "Not every job needs the biggest van on the lot. XPDX Rentals' Mercedes-Benz Sprinter 313 CDI in L1H1 (short-wheelbase, standard-roof) configuration is the right tool for multi-drop courier work, frequent urban deliveries, or any application where a long van simply won't fit.\n\nDespite its shorter length, the L1H1 still delivers a strong 7 m³ load bay and a 1,250 kg payload — more than enough for the vast majority of trade and logistics work. The 9-speed automatic gearbox takes the stress out of city driving, and the Sprinter's renowned build quality means you can rely on it every single day.\n\nPick up from Condell Park. 28-day minimum. Unlimited km, full insurance and 24/7 roadside cover included.",
      seoTitle: "Mercedes Sprinter SWB Hire Sydney | XPDX Rentals — from $430/wk",
      seoDescription: "Hire a compact Mercedes-Benz Sprinter 313 L1H1 (SWB) in Sydney from $430/week. 7 m³ cargo, 1,250 kg payload, 9-speed automatic diesel. Great for multi-drop routes.",
      status: "available",
      sortOrder: 5,
      updatedAt: new Date().toISOString(),
      images: [
        { url: "/vans/sprinter-l2h2.jpg", alt: "White Mercedes-Benz Sprinter 313 L1H1 SWB panel van — XPDX Rentals" },
      ],
      primaryImage: { url: "/vans/sprinter-l2h2.jpg", alt: "White Mercedes-Benz Sprinter 313 L1H1 SWB panel van — XPDX Rentals" },
    },
    {
      id: "mock-6",
      slug: "toyota-hiace-lwb-high-roof",
      name: "Toyota HiAce LWB High Roof",
      make: "Toyota",
      model: "HiAce",
      year: 2022,
      registration: "XPDX-007",
      bodyType: "Panel Van",
      wheelbaseLabel: "LWB",
      roof: "high",
      tonnage: 3.0,
      transmission: "Automatic",
      fuel: "Diesel",
      seats: 2,
      priceWeeklyFrom: 420,
      priceMonthlyFrom: 1520,
      depositAmount: 500,
      minHireDays: 28,
      lengthMm: 5380,
      heightMm: 2285,
      widthMm: 1950,
      wheelbaseMm: 3210,
      loadVolumeM3: 8.0,
      payloadKg: 1100,
      features: ["Toyota Safety Sense 3.0", "Reversing Camera", "High-Roof Interior", "Dual Sliding Doors", "Air Conditioning", "Bulkhead Partition", "Cargo Rail System", "GPS Fleet Tracking"],
      summary: "The best of both worlds — Toyota HiAce reliability in a high-roof format that lets you stand upright while loading. Perfect for courier runs, furniture delivery and trade work across Sydney.",
      description: "The Toyota HiAce LWB High Roof is the upgrade for operators who love the HiAce's legendary dependability but need a bit more vertical clearance. The raised roofline boosts load volume to 8 m³ and — critically — lets workers stand fully upright inside the cargo bay when packing or unpacking, dramatically reducing fatigue on long shifts.\n\nThe LWB High Roof retains the Toyota Safety Sense 3.0 suite, smooth 2.8L turbodiesel automatic drivetrain and dual-sliding cargo doors of the standard model, while adding the cargo rail system for secure load management.\n\nA genuine step up from the SLWB at a sharp weekly rate. Available from Condell Park, 28-day minimum.",
      seoTitle: "Toyota HiAce High Roof Hire Sydney | XPDX Rentals — from $420/wk",
      seoDescription: "Hire a Toyota HiAce LWB High Roof van in Sydney from $420/week. 8 m³, stand-up interior, 1,100 kg payload, automatic diesel. Unlimited km & insurance — Condell Park.",
      status: "available",
      sortOrder: 6,
      updatedAt: new Date().toISOString(),
      images: [
        { url: "/vans/hiace-lwb.jpg", alt: "White Toyota HiAce LWB High Roof panel van — XPDX Rentals Sydney" },
      ],
      primaryImage: { url: "/vans/hiace-lwb.jpg", alt: "White Toyota HiAce LWB High Roof panel van — XPDX Rentals Sydney" },
    },
    {
      id: "mock-7",
      slug: "ldv-deliver-9-lwb",
      name: "LDV Deliver 9 LWB High Roof",
      make: "LDV",
      model: "Deliver 9",
      year: 2023,
      registration: "XPDX-003",
      bodyType: "Panel Van",
      wheelbaseLabel: "LWB",
      roof: "high",
      tonnage: 3.5,
      transmission: "Automatic",
      fuel: "Diesel",
      seats: 3,
      priceWeeklyFrom: 450,
      priceMonthlyFrom: 1600,
      depositAmount: 500,
      minHireDays: 28,
      lengthMm: 6170,
      heightMm: 2752,
      widthMm: 2052,
      wheelbaseMm: 3950,
      loadVolumeM3: 13.6,
      payloadKg: 1480,
      features: ["10-Speed Automatic", "Ford SYNC 4", "360° Rear Camera", "Adaptive Cruise Control", "BLIS Blind Spot Detection", "Full Bulkhead + Rails", "LED Cargo Lighting", "GPS Fleet Tracking"],
      summary: "Ford's flagship panel van in its most capable form. The Transit 350 LWB High Roof delivers 13.6 m³ of cargo space and a 1,480 kg payload with a 10-speed automatic — ideal for serious volume work.",
      description: "XPDX Rentals' Ford Transit 350 LWB High Roof is the choice for operators who need Sprinter-class capacity with Ford's reputation for workhorse dependability. At 13.6 m³, it sits comfortably between the mid-size Sprinter L2H2 and the Jumbo L3H3, making it the ideal single-van solution for removalists, building suppliers and large-format retailers.\n\nFord SYNC 4 with wireless Apple CarPlay & Android Auto, Blind Spot Information System and adaptive cruise control are standard. The 10-speed SelectShift automatic delivers smooth, efficient progress whether the van is empty or fully loaded to its 1,480 kg capacity.\n\nCollect from our Condell Park depot. 28-day minimum hire. All inclusive — unlimited kilometres, comprehensive insurance, 24/7 roadside.",
      seoTitle: "Ford Transit 350 LWB High Roof Hire Sydney | XPDX Rentals — from $460/wk",
      seoDescription: "Hire a Ford Transit 350 LWB High Roof in Sydney from $460/week. 13.6 m³, 1,480 kg payload, 10-speed automatic diesel. Unlimited km & insurance. Condell Park pickup.",
      status: "available",
      sortOrder: 7,
      updatedAt: new Date().toISOString(),
      images: [
        { url: "/vans/transit-custom.jpg", alt: "White Ford Transit 350 LWB High Roof panel van — XPDX Rentals Sydney" },
      ],
      primaryImage: { url: "/vans/transit-custom.jpg", alt: "White Ford Transit 350 LWB High Roof panel van — XPDX Rentals Sydney" },
    },
    {
      id: "mock-8",
      slug: "iveco-daily-35s14-pantech",
      name: "Iveco Daily 35S14 Pantech (Tail Lift)",
      make: "Iveco",
      model: "Daily 35S14",
      year: 2022,
      registration: "XPDX-004",
      bodyType: "Pantech",
      wheelbaseLabel: "MWB",
      roof: "standard",
      tonnage: 3.5,
      transmission: "Automatic",
      fuel: "Diesel",
      seats: 3,
      priceWeeklyFrom: 650,
      priceMonthlyFrom: 2400,
      depositAmount: 500,
      minHireDays: 14,
      lengthMm: 5380,
      heightMm: 2200,
      widthMm: 1950,
      wheelbaseMm: 3210,
      loadVolumeM3: 3.8,
      payloadKg: 800,
      features: ["Toyota Safety Sense 3.0", "5-Seat Crew Cab", "Reversing Camera", "Dual Zone A/C", "Privacy Glass", "Side Sliding Cargo Door", "Rear Folding Seats", "GPS Fleet Tracking"],
      summary: "Move your team and your tools in one van. The HiAce Crew Van seats five in comfort up front and still carries 3.8 m³ of cargo behind the rear bulkhead — ideal for trade teams working across Sydney.",
      description: "When you need to transport a crew and still carry equipment, XPDX Rentals' Toyota HiAce Crew Van is the answer. The five-seat front cabin provides comfortable seating for a full trade team, while the separated cargo area behind a full bulkhead carries 3.8 m³ of tools, materials or parts.\n\nDual-zone climate control, privacy glass and Toyota Safety Sense 3.0 keep the whole team comfortable and safe. Fold the rear seats flat and the cargo capacity expands significantly for weekend supply runs or early-morning market trips.\n\nThe MWB Crew Van is a particularly popular choice for plumbing, electrical and HVAC contractors who operate in teams across the Sydney metropolitan area. Available for 28-day minimum hire from Condell Park.",
      seoTitle: "Toyota HiAce Crew Van Hire Sydney | XPDX Rentals — from $410/wk",
      seoDescription: "Hire a Toyota HiAce Crew Van in Sydney from $410/week. Seats 5 with 3.8 m³ cargo bay, automatic diesel with Toyota Safety Sense. Perfect for trade teams. Condell Park.",
      status: "available",
      sortOrder: 8,
      updatedAt: new Date().toISOString(),
      images: [
        { url: "/vans/hiace-lwb.jpg", alt: "White Toyota HiAce Crew Van MWB — XPDX Rentals Sydney" },
      ],
      primaryImage: { url: "/vans/hiace-lwb.jpg", alt: "White Toyota HiAce Crew Van MWB — XPDX Rentals Sydney" },
    },
    {
      id: "mock-9",
      slug: "mercedes-sprinter-416-refrigerated",
      name: "Mercedes-Benz Sprinter 416 CDI Refrigerated",
      bodyType: "Refrigerated Van",
      wheelbaseLabel: "LWB",
      roof: "high",
      tonnage: 4.6,
      transmission: "Automatic",
      fuel: "Diesel",
      seats: 3,
      priceWeeklyFrom: 680,
      priceMonthlyFrom: 2450,
      minHireDays: 28,
      lengthMm: 6945,
      heightMm: 2600,
      widthMm: 2020,
      wheelbaseMm: 4325,
      loadVolumeM3: 11.5,
      payloadKg: 1700,
      features: ["Thermo King Refrigeration Unit", "Temperature Range -18°C to +20°C", "Temperature Data Logger", "Insulated Cargo Body", "Stainless Steel Interior", "Apple CarPlay", "GPS Fleet Tracking", "Pre-Cooling Mode"],
      summary: "Purpose-built cold chain transport for Sydney's food service, pharmaceutical and perishable goods industries. The Sprinter 416 Refrigerated maintains -18°C to +20°C across its full 11.5 m³ cargo body.",
      description: "XPDX Rentals' Mercedes-Benz Sprinter 416 CDI Refrigerated Van is built for operators who cannot afford to break the cold chain. Fitted with a Thermo King refrigeration unit capable of maintaining temperatures from -18°C (frozen) to +20°C (ambient-controlled), it is approved for food service, pharmaceutical distribution and fresh produce transport across New South Wales.\n\nThe stainless steel interior is easy to clean and sanitise. A tamper-proof temperature data logger records the entire journey for compliance and audit purposes. Pre-cooling mode lets you chill the cargo body before loading, maintaining product integrity from the moment the doors close.\n\nThis specialised unit is available on a 28-day minimum hire from our Condell Park depot. All hires include unlimited kilometres, full insurance, 24/7 roadside assistance and refrigeration unit service warranty.",
      seoTitle: "Refrigerated Van Hire Sydney | Sprinter 416 Reefer | XPDX Rentals — from $680/wk",
      seoDescription: "Hire a Mercedes-Benz Sprinter 416 refrigerated van in Sydney from $680/week. -18°C to +20°C, 11.5 m³, compliant cold chain transport. Unlimited km & insurance. Condell Park.",
      status: "available",
      sortOrder: 9,
      updatedAt: new Date().toISOString(),
      images: [
        { url: "/vans/sprinter-l3h3.jpg", alt: "White Mercedes-Benz Sprinter 416 refrigerated van — XPDX Rentals Sydney" },
      ],
      primaryImage: { url: "/vans/sprinter-l3h3.jpg", alt: "White Mercedes-Benz Sprinter 416 refrigerated van — XPDX Rentals Sydney" },
    },
    {
      id: "mock-10",
      slug: "toyota-hiace-commuter",
      name: "Toyota HiAce Commuter (12-Seat Minibus)",
      make: "Toyota",
      model: "HiAce Commuter",
      year: 2022,
      registration: "XPDX-010",
      bodyType: "Minibus",
      wheelbaseLabel: "SLWB",
      roof: "high",
      tonnage: 3.5,
      transmission: "Automatic",
      fuel: "Diesel",
      seats: 12,
      priceWeeklyFrom: 600,
      priceMonthlyFrom: 2200,
      depositAmount: 500,
      minHireDays: 7,
      lengthMm: 5380,
      heightMm: 2285,
      widthMm: 1950,
      wheelbaseMm: 3210,
      loadVolumeM3: 2.0,
      payloadKg: 700,
      features: ["12 Leather-Trimmed Seats", "Individual Reading Lights", "Rear Air Conditioning", "Toyota Safety Sense 3.0", "Reversing Camera", "Bluetooth Audio", "USB Charging Points", "GPS Fleet Tracking"],
      summary: "Transport your whole team or client group in style and safety. The Toyota HiAce Commuter seats 12 and is the most popular long-term minibus hire in our fleet for construction site shuttles, corporate transfers and group logistics.",
      description: "XPDX Rentals' Toyota HiAce Commuter (12-seat) is the benchmark people-mover for businesses managing regular group transport across the Sydney metropolitan area and beyond. Whether you're running a construction site shuttle from a CBD hotel to a western Sydney worksite, managing airport transfers for a corporate event or coordinating group travel for a sporting club, the HiAce Commuter does it with reliability you can set your schedule by.\n\nAll 12 seats are trimmed in durable fabric with individual reading lights and armrests. Dual rear air-conditioning units keep passengers comfortable even on hot Sydney days. Toyota Safety Sense 3.0 — including Pre-Collision System with Pedestrian Detection, Radar Cruise Control and Lane Departure Alert — means you're never without a second set of eyes on the road.\n\nAvailable on a 28-day minimum hire from Condell Park. Unlimited kilometres, comprehensive insurance and 24/7 roadside assistance are included in every hire.",
      seoTitle: "12-Seat Minibus Hire Sydney | Toyota HiAce Commuter | XPDX Rentals — from $540/wk",
      seoDescription: "Hire a 12-seat Toyota HiAce Commuter minibus in Sydney from $540/week. Long-term minibus hire with unlimited km, insurance & 24/7 roadside. Corporate, construction & group transport. Condell Park.",
      status: "available",
      sortOrder: 10,
      updatedAt: new Date().toISOString(),
      images: [
        { url: "/vans/hiace-lwb.jpg", alt: "White Toyota HiAce Commuter 12-seat minibus — XPDX Rentals Sydney" },
      ],
      primaryImage: { url: "/vans/hiace-lwb.jpg", alt: "White Toyota HiAce Commuter 12-seat minibus — XPDX Rentals Sydney" },
    },
] as unknown as readonly PublicVan[];

/**
 * The published fleet, in the operator's display order.
 *
 * Falls back to `MOCK_VANS` rather than throwing when the database is
 * unreachable: a fleet grid that fails to load must not take down the phone
 * number and enquiry form alongside it.
 *
 * Two layers of caching, deliberately:
 *   • `cache()` — React's per-request memo. The homepage alone calls this from
 *     the page body, and `/vans` calls it from both `generateMetadata` and the
 *     component tree; without this each of those is a separate round-trip
 *     inside one render.
 *   • `withCache()` — Redis, shared across requests and instances.
 *
 * Invalidated by name from the admin van actions (see `VANS_CACHE_KEY`), so an
 * operator's edit is live immediately instead of up to an hour later.
 */
export const VANS_CACHE_KEY = cacheKey("vans", "public-list");

export const getPublicVans = cache(async function getPublicVans(): Promise<PublicVan[]> {
  const vans = await withCache(VANS_CACHE_KEY, 3600, async () => {
    try {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("vans")
        .select(SELECT)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error || !data || data.length === 0) return MOCK_VANS;
      return ((data ?? []) as PublicVanRow[]).map(toPublicVan);
    } catch {
      return MOCK_VANS;
    }
  });
  return vans as PublicVan[];
});

export const getPublicVanBySlug = cache(async function getPublicVanBySlug(
  slug: string,
): Promise<PublicVan | null> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("vans").select(SELECT).eq("slug", slug).maybeSingle();
    if (error || !data) {
      // Fall back to the demo fleet so detail pages work without a database.
      const mocks = await getPublicVans();
      return mocks.find((v) => v.slug === slug) ?? null;
    }
    return toPublicVan(data as PublicVanRow);
  } catch {
    const mocks = await getPublicVans();
    return mocks.find((v) => v.slug === slug) ?? null;
  }
});

/** Slugs for `generateStaticParams` and the sitemap. Drafts excluded by RLS. */
export const getPublicVanSlugs = cache(async function getPublicVanSlugs(): Promise<
  { slug: string; updatedAt: string }[]
> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("vans").select("slug, updated_at");
    if (error || !data || data.length === 0) {
      const mocks = await getPublicVans();
      return mocks.map((v) => ({ slug: v.slug, updatedAt: v.updatedAt }));
    }
    return ((data ?? []) as VanSlugRow[]).map((r) => ({ slug: r.slug, updatedAt: r.updated_at }));
  } catch {
    const mocks = await getPublicVans();
    return mocks.map((v) => ({ slug: v.slug, updatedAt: v.updatedAt }));
  }
});
