import { Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { ContactLink } from "@/components/public/contact-link";
import { telHref, waHref } from "@/lib/lead";
import { INCLUSIONS, HIRE_TERMS } from "@/lib/business";

/**
 * The conversion path, identical on every programmatic page.
 *
 * `hasConversionPath` is a HARD prerequisite in the quality gate — a landing
 * page with no way to enquire scores zero and is never generated. This
 * component is what makes that guarantee true rather than aspirational: every
 * template ends with it, so no generated page can ship without a phone number,
 * a WhatsApp link and a form.
 *
 * The heading and lead-in are passed in so the block reads as part of its page
 * rather than as the same paragraph forty times. The inclusions list and the
 * 28-day term are deliberately repeated everywhere — they are the terms of the
 * offer, and a visitor should never have to leave a landing page to find them.
 */
export function ConversionBlock({
  heading,
  lead,
  phone,
  whatsapp,
  whatsappMessage,
}: {
  heading: string;
  lead: string;
  phone: string | null;
  whatsapp: string | null;
  whatsappMessage: string;
}) {
  return (
    <section className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {heading}
        </h2>
        <p className="mt-3 text-body">{lead}</p>

        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {INCLUSIONS.map((item) => (
            <li key={item} className="flex items-center gap-2 text-muted-foreground">
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          Minimum hire {HIRE_TERMS.minHireDays} days. A ${HIRE_TERMS.bondAud} security bond applies, reduced
          to ${HIRE_TERMS.bondWithTollAccountAud} if you connect your own toll account.
        </p>

        {phone || whatsapp ? (
          <div className="mt-7 flex flex-wrap gap-3">
            {phone ? (
              <ContactLink
                href={telHref(phone)}
                channel="call"
                className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-5 font-bold text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Phone className="size-5" aria-hidden="true" /> Call {phone}
              </ContactLink>
            ) : null}
            {whatsapp ? (
              <ContactLink
                href={waHref(whatsapp, whatsappMessage)}
                channel="whatsapp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-border px-5 font-bold text-foreground hover:border-primary hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <WhatsAppIcon className="size-5" aria-hidden="true" /> WhatsApp
              </ContactLink>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 rounded-3xl border border-border bg-background p-7 shadow-sm sm:p-9">
          <EnquiryForm phone={phone} />
        </div>
      </div>
    </section>
  );
}
