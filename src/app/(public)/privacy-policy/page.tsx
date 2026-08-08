import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo/metadata";
import { BRAND, ADDRESS, CONTACT } from "@/lib/business";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = pageMetadata({
  path: "/privacy-policy",
  title: "Privacy Policy — XPDX Rentals",
  description:
    "How XPDX Rentals collects, uses, stores and discloses your personal information, and your rights under the Australian Privacy Act 1988.",
});

const EFFECTIVE_DATE = "7 August 2026";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24">
      <h2
        id={`${id}-heading`}
        className="font-heading text-2xl font-extrabold tracking-tight text-foreground mb-6"
      >
        {title}
      </h2>
      <div className="text-body text-[15px] leading-loose space-y-5 text-white/70">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <JsonLd
        schema={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Privacy Policy", path: "/privacy-policy" },
          ]),
        ]}
      />

      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/[0.06] bg-black/20">
        <div aria-hidden="true" className="ambient-glow -left-40 top-0 size-[32rem] bg-primary/5" />
        <div className="relative mx-auto max-w-3xl px-4 py-24 sm:px-6 sm:py-32">
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            Privacy Policy
          </h1>
          <p className="mt-6 text-lg text-white/60 leading-relaxed max-w-2xl">
            {BRAND.name} is committed to protecting your personal information in accordance with the{" "}
            <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles (APPs). This
            Policy explains what personal information we collect, how we use it, and your rights.
          </p>
          <div className="mt-8 flex flex-wrap gap-8 text-xs text-primary font-mono tracking-widest uppercase">
            <span>Effective: {EFFECTIVE_DATE}</span>
            <span>Version: 1.0</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 sm:py-32 space-y-24">

        <Section id="who-we-are" title="1. Who We Are">
          <p>
            <strong className="text-foreground">{BRAND.name}</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a commercial vehicle hire business operating from {ADDRESS.full}, Australia. We are the entity responsible for handling your personal information collected through our website (xpdxrentals.com.au) and in the course of providing vehicle hire services.
          </p>
        </Section>

        <Section id="what-we-collect" title="2. Personal Information We Collect">
          <p>
            We collect personal information that is reasonably necessary for our business functions. This may include:
          </p>

          <h3 className="font-semibold text-foreground mt-4">2.1 Identity and contact information</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li>Full name and date of birth</li>
            <li>Residential and business address</li>
            <li>Phone number and email address</li>
            <li>Driver&apos;s licence number, state of issue, expiry date and licence class</li>
            <li>Business name and ABN (for business hirers)</li>
          </ul>

          <h3 className="font-semibold text-foreground mt-4">2.2 Financial information</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li>Payment card type and last four digits (we do not store full card numbers)</li>
            <li>Bank account details (where payment is made by direct transfer)</li>
            <li>Transaction records and hire charge history</li>
          </ul>

          <h3 className="font-semibold text-foreground mt-4">2.3 Vehicle use data</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li>GPS location, journey history, speed and driving behaviour data collected via in-vehicle tracking devices during the Hire Period</li>
            <li>Odometer readings at collection and return</li>
            <li>Fuel levels and servicing records</li>
            <li>Incident and accident reports</li>
          </ul>

          <h3 className="font-semibold text-foreground mt-4">2.4 Website and enquiry data</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li>Name and contact details submitted via enquiry forms</li>
            <li>IP address, browser type, device information and pages visited (collected automatically via server logs and analytics tools)</li>
            <li>Cookies and similar tracking technologies (see section 9)</li>
          </ul>

          <h3 className="font-semibold text-foreground mt-4">2.5 Sensitive information</h3>
          <p>
            We do not intentionally collect sensitive information (as defined in the Privacy Act, including health information, racial or ethnic origin, or criminal record). If you voluntarily disclose sensitive information (for example, a medical condition affecting driving), we will handle it in accordance with APP 3.
          </p>
        </Section>

        <Section id="how-we-collect" title="3. How We Collect Personal Information">
          <p>We collect personal information:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong className="text-foreground">Directly from you</strong> — when you submit an enquiry, complete a hire agreement, or communicate with us by phone, email or in person;</li>
            <li><strong className="text-foreground">Through your use of our website</strong> — including forms, cookies and server logs;</li>
            <li><strong className="text-foreground">Via GPS tracking devices</strong> — automatically during the Hire Period as described in section 8;</li>
            <li><strong className="text-foreground">From third parties</strong> — including licence verification services, insurance providers, credit reporting bodies (where permitted), and government authorities such as NSW Police or Service NSW.</li>
          </ul>
          <p className="mt-3">
            Where practicable, we collect personal information directly from you. If we collect information from a third party, we will take reasonable steps to notify you.
          </p>
        </Section>

        <Section id="how-we-use" title="4. How We Use Personal Information">
          <p>
            We use personal information for purposes that are reasonably necessary for our business, including:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Processing hire applications and verifying eligibility (licence and identity verification);</li>
            <li>Administering and managing hire agreements, payments and the Bond;</li>
            <li>Communicating with you about your hire, invoices, renewals and service matters;</li>
            <li>Investigating accidents, damage, theft, traffic infringements and insurance claims;</li>
            <li>Recovering overdue payments and debts;</li>
            <li>Monitoring Vehicle use for compliance with the Hire Agreement;</li>
            <li>Complying with our legal obligations under Australian law (e.g. responding to regulatory notices, court orders or law enforcement requests);</li>
            <li>Improving our services and website;</li>
            <li>Sending you service-related communications and, where you have opted in, promotional material.</li>
          </ul>
          <p className="mt-3">
            We will not use your personal information for any purpose that is not related to the above without your consent.
          </p>
        </Section>

        <Section id="disclosure" title="5. Disclosure of Personal Information">
          <p>
            We may disclose personal information to:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong className="text-foreground">Insurance providers</strong> — to process claims, verify coverage and investigate incidents;</li>
            <li><strong className="text-foreground">Government and law enforcement authorities</strong> — including NSW Police, NSW Roads and Maritime Services, Revenue NSW and local councils, to respond to official requests or nominate infringement holders as required by law;</li>
            <li><strong className="text-foreground">Debt collection and credit reporting agencies</strong> — where authorised under the Privacy Act to recover amounts owed to us;</li>
            <li><strong className="text-foreground">Our service providers</strong> — including IT providers, GPS platform operators, accounting software providers and legal advisers, who are bound by confidentiality obligations;</li>
            <li><strong className="text-foreground">Successors in business</strong> — in connection with a sale, merger or acquisition of all or part of our business;</li>
            <li><strong className="text-foreground">You or your authorised representative</strong> — on request.</li>
          </ul>
          <p className="mt-3">
            We do not sell personal information to third parties. We do not disclose personal information for the purposes of third-party direct marketing without your express consent.
          </p>

          <h3 className="font-semibold text-foreground mt-4">5.1 Overseas disclosure</h3>
          <p>
            Some of our service providers (e.g. cloud hosting, analytics, GPS platform) may process or store data on servers located outside Australia. Before disclosing information to an overseas recipient, we take reasonable steps to ensure the recipient&apos;s privacy practices are consistent with the Australian Privacy Principles. By using our services, you consent to this transfer where it is reasonably necessary for our operations.
          </p>
        </Section>

        <Section id="storage" title="6. Storage and Security">
          <p>
            We store personal information in electronic and physical records. We take reasonable steps to protect personal information from misuse, interference and loss, and from unauthorised access, modification or disclosure. These steps include:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Encrypted storage of electronic records;</li>
            <li>Access controls limiting staff access to personal information on a need-to-know basis;</li>
            <li>Secure disposal of physical documents;</li>
            <li>Regular review of our security practices.</li>
          </ul>
          <p className="mt-3">
            No data transmission over the internet is completely secure. While we take reasonable precautions, we cannot guarantee absolute security.
          </p>
          <h3 className="font-semibold text-foreground mt-4">6.1 Retention</h3>
          <p>
            We retain personal information for as long as necessary to fulfil the purposes for which it was collected, and as required by law (e.g. 7 years for financial records under taxation law). GPS journey data is retained for a maximum of 2 years from the end of the relevant hire.
          </p>
        </Section>

        <Section id="your-rights" title="7. Your Rights">
          <h3 className="font-semibold text-foreground">7.1 Access</h3>
          <p>
            You have the right to request access to personal information we hold about you. We will respond within 30 days. We may charge a reasonable fee for providing access. We may refuse access where the Privacy Act permits us to do so (e.g. information relating to legal proceedings).
          </p>

          <h3 className="font-semibold text-foreground mt-4">7.2 Correction</h3>
          <p>
            If you believe information we hold about you is inaccurate, incomplete or out of date, you may request correction. We will correct or annotate the record within 30 days of a verified request.
          </p>

          <h3 className="font-semibold text-foreground mt-4">7.3 Complaints</h3>
          <p>
            If you believe we have breached the Australian Privacy Principles, you may lodge a complaint in writing to us using the contact details in section 11. We will acknowledge your complaint within 5 business days and investigate within 30 days, responding to you with the outcome.
          </p>
          <p className="mt-2">
            If you are not satisfied with our response, you may complain to the <strong className="text-foreground">Office of the Australian Information Commissioner (OAIC)</strong> at{" "}
            <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" className="text-link hover:underline">
              www.oaic.gov.au
            </a>{" "}
            or by calling 1300 363 992.
          </p>

          <h3 className="font-semibold text-foreground mt-4">7.4 Opting out of marketing</h3>
          <p>
            You may opt out of marketing communications at any time by contacting us (section 11) or using the unsubscribe link in any email we send. We will process opt-outs within 5 business days.
          </p>

          <h3 className="font-semibold text-foreground mt-4">7.5 Anonymity</h3>
          <p>
            Where practicable and lawful, you may deal with us anonymously or using a pseudonym. However, we are unable to process a hire application or enter into a hire agreement without verifying your identity and licence.
          </p>
        </Section>

        <Section id="gps" title="8. GPS Tracking and Vehicle Monitoring">
          <p>
            All Vehicles are fitted with GPS tracking devices. During the Hire Period, the GPS system continuously records:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Real-time location of the Vehicle;</li>
            <li>Journey history, routes and distances;</li>
            <li>Speed, acceleration and braking patterns;</li>
            <li>Ignition status and idle times.</li>
          </ul>
          <p className="mt-3">
            This data is collected and used for the purposes described in section 4 and is disclosed only as described in section 5. Hirers consent to GPS monitoring by entering into the Hire Agreement and collecting the Vehicle. GPS data relating to your hire is available to you on written request.
          </p>
        </Section>

        <Section id="cookies" title="9. Cookies and Website Analytics">
          <h3 className="font-semibold text-foreground">9.1 What we use</h3>
          <p>
            Our website uses cookies and similar technologies to operate effectively and improve user experience. Types of cookies used include:
          </p>
          <ul className="list-disc ml-6 space-y-1 mt-2">
            <li><strong className="text-foreground">Strictly necessary cookies</strong> — required for the website to function (e.g. form session tokens). Cannot be disabled.</li>
            <li><strong className="text-foreground">Analytics cookies</strong> — used to understand how visitors use the site (page views, session duration, device type). Data is aggregated and anonymised where possible.</li>
          </ul>

          <h3 className="font-semibold text-foreground mt-4">9.2 Your choices</h3>
          <p>
            You can disable non-essential cookies through your browser settings. Disabling analytics cookies will not affect your ability to use the site. Note that disabling strictly necessary cookies may impair site functionality.
          </p>

          <h3 className="font-semibold text-foreground mt-4">9.3 Third-party analytics</h3>
          <p>
            We may use third-party analytics services (such as Vercel Analytics or similar). These services may collect anonymised usage data in accordance with their own privacy policies. We do not share personally identifiable information with analytics providers.
          </p>
        </Section>

        <Section id="children" title="10. Children's Privacy">
          <p>
            Our services are directed at adults (18 years and over). We do not knowingly collect personal information from persons under 18 years of age. If you believe we have inadvertently collected information from a minor, please contact us immediately.
          </p>
        </Section>

        <Section id="contact-privacy" title="11. Contact Us">
          <p>
            For access requests, corrections, complaints or any privacy-related enquiry, please contact us:
          </p>
          <address className="not-italic mt-6 p-8 rounded-2xl bg-black/20 border border-white/[0.05] shadow-inner text-[15px] leading-loose text-white/70">
            <strong className="text-foreground text-lg">Privacy Officer</strong><br />
            {BRAND.name}<br />
            {ADDRESS.full}<br />
            <span className="mt-4 block">Phone: <a href={`tel:${CONTACT.phoneDisplay}`} className="text-primary hover:underline">{CONTACT.phoneDisplay}</a></span>
          </address>
          <p className="mt-3">
            Or use our <Link href="/contact-us" className="text-link hover:underline">contact page</Link>.
          </p>
        </Section>

        <Section id="updates" title="12. Updates to This Policy">
          <p>
            We may update this Privacy Policy at any time. The updated version will be published on our website with a revised effective date. Where changes are material, we will notify existing customers by email or notice on our website. Continued use of our services after the effective date constitutes acceptance of the updated Policy.
          </p>
          <p className="mt-3">
            The current version is always available at:{" "}
            <Link href="/privacy-policy" className="text-link hover:underline">
              xpdxrentals.com.au/privacy-policy
            </Link>
          </p>
        </Section>

        {/* Legal disclaimer */}
        <div className="rounded-2xl border border-white/[0.05] bg-black/20 shadow-inner p-8 text-[15px] leading-loose text-white/50">
          <p className="font-semibold text-white/80 mb-2 uppercase tracking-widest text-xs">⚠️ Notice</p>
          <p>
            This Privacy Policy is designed to comply with the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles. If you have questions about how we handle your personal information, please contact us before providing it. You can also obtain information about privacy rights from the Office of the Australian Information Commissioner at{" "}
            <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              oaic.gov.au
            </a>.
          </p>
        </div>
      </div>
    </>
  );
}
