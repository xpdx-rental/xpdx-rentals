/**
 * The eighteen client-supplied FAQs, verbatim from
 * `docs/content/supplied-copy.md`.
 *
 * These answers are legally operative — bond amounts, age limits, insurance
 * terms, servicing obligations. The supplied-copy notes are explicit: do not
 * compress or reword them to fit a design; if a component cannot hold the
 * text, change the component.
 *
 * They live in code rather than in the `faqs` CMS table on purpose. A
 * published bond figure is not something a non-technical operator should be
 * able to reword by accident, and keeping them here means every change to a
 * legally operative sentence goes through a reviewed diff. See
 * docs/conversion/02-phase4-report.md for the open question about the unused
 * admin FAQ screen.
 *
 * `featured: true` marks the six that CLAUDE.md §8 puts on the home page —
 * bond, minimum period, unlimited km, insurance, who can rent, commercial use.
 * They correspond to the ★ items in the supplied copy.
 */

export type FaqBlock =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

export type Faq = {
  id: string;
  question: string;
  answer: FaqBlock[];
  featured?: boolean;
};

export type FaqGroup = {
  id: string;
  title: string;
  faqs: Faq[];
};

/**
 * Plain-text rendering of an answer, for `FAQPage` JSON-LD.
 * Never mark up a question whose answer is not visible on the page (§8).
 */
export function faqAnswerText(faq: Faq): string {
  return faq.answer
    .map((b) => (b.kind === "p" ? b.text : b.items.join(" ")))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: "your-rental",
    title: "Your rental",
    faqs: [
      {
        id: "whats-included",
        question: "What is included in my rental?",
        featured: true,
        answer: [
          { kind: "p", text: "Every XPDX Rentals vehicle includes:" },
          {
            kind: "ul",
            items: [
              "Comprehensive insurance",
              "Unlimited kilometres",
              "24/7 roadside assistance",
              "Scheduled servicing and maintenance",
              "Ongoing support from our friendly team",
            ],
          },
        ],
      },
      {
        id: "insurance-included",
        question: "Is insurance included?",
        featured: true,
        answer: [
          {
            kind: "p",
            text: "Yes. Comprehensive insurance is included with every rental, subject to the terms and conditions of your rental agreement.",
          },
        ],
      },
      {
        id: "security-bond",
        question: "Is there a security bond?",
        featured: true,
        answer: [
          { kind: "p", text: "Yes. A $750 security bond is required before collecting your vehicle." },
          {
            kind: "p",
            text: "If you connect your own toll account to the vehicle, your bond is reduced to $500.",
          },
          {
            kind: "p",
            text: "The bond is fully refundable once the vehicle has been returned, inspected, and all outstanding charges (if any) have been finalised.",
          },
        ],
      },
      {
        id: "minimum-rental-period",
        question: "What is the minimum rental period?",
        featured: true,
        answer: [
          {
            kind: "p",
            text: "Our minimum rental period is 28 days, making our vehicles ideal for long-term commercial and business use.",
          },
        ],
      },
      {
        id: "return-early",
        question: "Can I return my vehicle early?",
        answer: [
          {
            kind: "p",
            text: "Yes. Once your initial 28-day rental period has been completed, you may return the vehicle at any time by providing the required notice outlined in your rental agreement.",
          },
        ],
      },
      {
        id: "kilometre-limits",
        question: "Are there any kilometre limits?",
        featured: true,
        answer: [
          {
            kind: "p",
            text: "No. Every rental includes unlimited kilometres, so you can focus on your business without worrying about excess kilometre charges.",
          },
        ],
      },
    ],
  },
  {
    id: "eligibility-and-drivers",
    title: "Eligibility and drivers",
    faqs: [
      {
        id: "who-can-rent",
        question: "Who can rent a vehicle?",
        featured: true,
        answer: [
          { kind: "p", text: "To rent with XPDX Rentals you must:" },
          {
            kind: "ul",
            items: [
              "Be at least 21 years old.",
              "Hold a valid Australian driver's licence.",
              "Have held your licence for at least 12 months.",
              "Meet our insurance and identification requirements.",
            ],
          },
        ],
      },
      {
        id: "additional-drivers",
        question: "Can someone else drive the vehicle?",
        answer: [
          {
            kind: "p",
            text: "Additional drivers may be approved, provided they meet our eligibility requirements and are added to the rental agreement before driving the vehicle.",
          },
        ],
      },
      {
        id: "interstate",
        question: "Can I take the vehicle interstate?",
        answer: [
          {
            kind: "p",
            text: "Our vehicles are primarily approved for use within New South Wales. If you require interstate travel, please contact our team before booking to discuss your requirements.",
          },
        ],
      },
      {
        id: "documents",
        question: "What documents do I need?",
        answer: [
          { kind: "p", text: "You'll generally need:" },
          {
            kind: "ul",
            items: [
              "A valid Australian driver's licence.",
              "Proof of identity.",
              "Any additional documents required for insurance or business verification.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "on-the-road",
    title: "On the road",
    faqs: [
      {
        id: "servicing",
        question: "What happens if my vehicle needs servicing?",
        answer: [
          {
            kind: "p",
            text: "If your vehicle is due for servicing or requires mechanical repairs during your rental, it must be taken to one of XPDX Rentals' authorised mechanics. This ensures the vehicle is maintained to our standards and remains covered under our maintenance program.",
          },
        ],
      },
      {
        id: "breakdown",
        question: "What happens if the vehicle breaks down?",
        answer: [
          {
            kind: "p",
            text: "All rentals include 24/7 roadside assistance. Simply contact our team and we'll arrange the appropriate support as quickly as possible.",
          },
        ],
      },
      {
        id: "accident",
        question: "What happens if I'm involved in an accident?",
        answer: [
          { kind: "p", text: "Your safety comes first. If you're involved in an accident:" },
          {
            kind: "ol",
            items: [
              "Ensure everyone is safe.",
              "Contact emergency services if required.",
              "Notify XPDX Rentals as soon as possible.",
              "Follow the instructions provided by our team to assist with the claims process.",
            ],
          },
        ],
      },
      {
        id: "fuel",
        question: "Who is responsible for fuel?",
        answer: [
          {
            kind: "p",
            text: "Vehicles should be returned with the same fuel level they were supplied with. Additional refuelling charges may apply if the vehicle is returned with less fuel.",
          },
        ],
      },
      {
        id: "maintained",
        question: "Are your vehicles maintained?",
        answer: [
          {
            kind: "p",
            text: "Yes. Every vehicle is professionally inspected, serviced, and maintained to ensure reliability, safety, and performance before every rental.",
          },
        ],
      },
    ],
  },
  {
    id: "business-and-payment",
    title: "Business and payment",
    faqs: [
      {
        id: "commercial-use",
        question: "Can I use the vehicle for courier or commercial work?",
        featured: true,
        answer: [
          {
            kind: "p",
            text: "Absolutely. Our fleet is specifically designed for courier drivers, tradespeople, contractors, delivery services, and businesses requiring reliable commercial transport.",
          },
        ],
      },
      {
        id: "payment",
        question: "How do I pay?",
        answer: [
          {
            kind: "p",
            text: "We offer convenient payment options, including direct debit and other approved payment methods. Our team will explain the available options during your booking.",
          },
        ],
      },
      {
        id: "fleet-solutions",
        question: "Do you offer fleet solutions for businesses?",
        answer: [
          {
            kind: "p",
            text: "Yes. Whether you need one vehicle or an entire fleet, XPDX Rentals provides flexible commercial rental solutions tailored to businesses across New South Wales.",
          },
        ],
      },
    ],
  },
];

export const ALL_FAQS: Faq[] = FAQ_GROUPS.flatMap((g) => g.faqs);

/** The six starred items for the home page, in the order §8 lists them. */
export const FEATURED_FAQ_IDS = [
  "security-bond",
  "minimum-rental-period",
  "kilometre-limits",
  "insurance-included",
  "who-can-rent",
  "commercial-use",
] as const;

export const FEATURED_FAQS: Faq[] = FEATURED_FAQ_IDS.map(
  (id) => ALL_FAQS.find((f) => f.id === id)!,
);

/** Closing line from the supplied copy, verbatim. */
export const FAQ_CLOSING =
  "If you can't find the answer you're looking for, our friendly team is here to help. Contact XPDX Rentals today and we'll be happy to assist.";
