import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo/metadata";
import { HIRE_TERMS, BRAND, ADDRESS, CONTACT } from "@/lib/business";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = pageMetadata({
  path: "/terms-of-hire",
  title: "Terms of Hire — XPDX Rentals",
  description:
    "The complete terms and conditions governing all vehicle hire agreements with XPDX Rentals. Please read carefully before confirming your hire.",
});

const EFFECTIVE_DATE = "7 August 2026";
const COMPANY_NAME = "XPDX Rentals";
const COMPANY_ABN = ""; // TODO: insert ABN when confirmed by client
const COMPANY_ADDRESS = ADDRESS.full;
const COMPANY_PHONE = CONTACT.phoneDisplay;

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

function Clause({ number, heading, children }: { number: string; heading: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h3 className="font-semibold text-foreground text-lg mb-2">
        {number} {heading}
      </h3>
      <div className="text-body text-[15px] leading-loose space-y-4">{children}</div>
    </div>
  );
}

export default function TermsOfHirePage() {
  return (
    <>
      <JsonLd
        schema={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Terms of hire", path: "/terms-of-hire" },
          ]),
        ]}
      />

      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/[0.06] bg-black/20">
        <div aria-hidden="true" className="ambient-glow -left-40 top-0 size-[32rem] bg-primary/5" />
        <div className="relative mx-auto max-w-3xl px-4 py-24 sm:px-6 sm:py-32">
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            Terms of Hire
          </h1>
          <p className="mt-6 text-lg text-white/60 leading-relaxed max-w-2xl">
            These terms govern every vehicle hire agreement entered into with {COMPANY_NAME}. By
            signing a Hire Agreement or taking possession of a vehicle, you agree to be bound by
            these terms in their entirety.
          </p>
          <div className="mt-8 flex flex-wrap gap-8 text-xs text-primary font-mono tracking-widest uppercase">
            <span>Effective: {EFFECTIVE_DATE}</span>
            <span>Version: 1.0</span>
          </div>

          {/* Quick nav */}
          <nav aria-label="Terms sections" className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Jump to section
            </p>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
              {[
                ["1", "Definitions", "#definitions"],
                ["2", "Formation of Agreement", "#formation"],
                ["3", "Eligibility and Licences", "#eligibility"],
                ["4", "Bond and Payment", "#bond-and-payment"],
                ["5", "Hire Period and Extensions", "#hire-period"],
                ["6", "Permitted Use", "#permitted-use"],
                ["7", "Driver Obligations", "#driver-obligations"],
                ["8", "Insurance and Liability", "#insurance"],
                ["9", "Damage, Loss and Theft", "#damage"],
                ["10", "Tolls, Fines and Infringements", "#tolls-and-fines"],
                ["11", "Servicing and Breakdowns", "#servicing"],
                ["12", "GPS Tracking", "#gps"],
                ["13", "Return of Vehicle", "#return"],
                ["14", "Early Termination", "#early-termination"],
                ["15", "Default and Repossession", "#default"],
                ["16", "Limitation of Liability", "#limitation"],
                ["17", "Governing Law", "#governing-law"],
                ["18", "Disputes", "#disputes"],
                ["19", "Amendments", "#amendments"],
                ["20", "Contact", "#contact"],
              ].map(([num, label, href]) => (
                <li key={href as string}>
                  <a
                    href={href as string}
                    className="text-primary hover:underline"
                  >
                    {num}. {label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 sm:py-32 space-y-24">

        {/* 1. Definitions */}
        <Section id="definitions" title="1. Definitions">
          <p>In these Terms, the following words have the meanings set out below unless the context requires otherwise:</p>
          <dl className="mt-3 space-y-3">
            {[
              ["Agreement", `The Hire Agreement, these Terms of Hire, and any schedule, addendum or written variation signed by the Owner.`],
              ["Bond", `The security deposit payable before collection of the Vehicle, currently A$${HIRE_TERMS.bondAud} (or A$${HIRE_TERMS.bondWithTollAccountAud} where the Hirer connects a registered toll account).`],
              ["Daily Rate / Weekly Rate", "The hire charge per day or per week (7 days) as set out in the Hire Agreement."],
              ["Hirer / You", "The individual or entity named as hirer on the Hire Agreement, and where a company, includes its authorised directors and employees who drive the Vehicle."],
              ["Hire Period", "The period commencing at vehicle collection and ending at vehicle return as agreed in the Hire Agreement, including any authorised extension."],
              ["Owner / We / Us", `${COMPANY_NAME}, ABN ${COMPANY_ABN || "[to be confirmed]"}, of ${COMPANY_ADDRESS}.`],
              ["Vehicle", "The motor vehicle (including any accessories and fitted equipment) described in the Hire Agreement."],
              ["Authorised Driver", "The Hirer and any additional driver approved by the Owner in writing prior to driving."],
              ["Loss Damage Waiver (LDW)", "The optional or included protection that limits the Hirer's financial liability for damage to the Vehicle as specified in the Hire Agreement."],
              ["Excluded Damage", "Damage or loss arising from circumstances that void the LDW and leave the Hirer fully liable, as defined in clause 8."],
              ["Nominated State", "New South Wales, Australia."],
            ].map(([term, def]) => (
              <div key={term as string}>
                <dt className="font-semibold text-foreground">{term as string}</dt>
                <dd className="mt-0.5 text-sm text-body ml-4">{def as string}</dd>
              </div>
            ))}
          </dl>
        </Section>

        {/* 2. Formation */}
        <Section id="formation" title="2. Formation of Agreement">
          <Clause number="2.1" heading="Acceptance">
            <p>
              The Agreement is formed when the Hirer signs the Hire Agreement, pays the Bond and first period's hire charge, and collects the Vehicle. No Agreement is formed until the Owner has countersigned and the Vehicle has been collected.
            </p>
          </Clause>
          <Clause number="2.2" heading="Online enquiries">
            <p>
              Submitting an enquiry form or making contact via the website constitutes an expression of interest only and does not create a binding agreement or guarantee Vehicle availability.
            </p>
          </Clause>
          <Clause number="2.3" heading="Entire agreement">
            <p>
              These Terms, together with the signed Hire Agreement, constitute the entire agreement between the parties and supersede all prior representations, negotiations and understandings (whether oral or written).
            </p>
          </Clause>
        </Section>

        {/* 3. Eligibility */}
        <Section id="eligibility" title="3. Eligibility and Licences">
          <Clause number="3.1" heading="Minimum age">
            <p>
              All Authorised Drivers must be at least {HIRE_TERMS.minDriverAge} years of age at the time of hire. Hirers under 25 years of age may be subject to an additional young driver surcharge as specified in the Hire Agreement.
            </p>
          </Clause>
          <Clause number="3.2" heading="Licence requirements">
            <p>
              All Authorised Drivers must hold a current, full (not learner or provisional) Australian driver's licence that has been held for at least {HIRE_TERMS.minLicenceMonths} months, or an equivalent overseas licence acceptable to the Owner. The Hirer must produce the original licence (not a copy) at the time of vehicle collection. The Owner reserves the right to refuse hire if a licence cannot be verified.
            </p>
          </Clause>
          <Clause number="3.3" heading="Demerit points and disqualifications">
            <p>
              The Hirer warrants that no Authorised Driver is currently disqualified from driving, suspended, or subject to a zero blood-alcohol condition. If any Authorised Driver's licence is cancelled, suspended or subject to conditions during the Hire Period, the Hirer must notify the Owner immediately and cease driving the Vehicle.
            </p>
          </Clause>
          <Clause number="3.4" heading="Additional drivers">
            <p>
              Any person other than the Hirer who drives the Vehicle must be approved by the Owner in writing before driving. Unauthorised drivers void all LDW protection and render the Hirer fully liable for all costs.
            </p>
          </Clause>
          <Clause number="3.5" heading="Right to refuse">
            <p>
              The Owner may refuse or cancel a hire at its absolute discretion where it reasonably believes a driver poses a risk, has provided false information, or where the Vehicle would be used contrary to these Terms.
            </p>
          </Clause>
        </Section>

        {/* 4. Bond and Payment */}
        <Section id="bond-and-payment" title="4. Bond and Payment">
          <Clause number="4.1" heading="Bond">
            <p>
              A refundable bond of A${HIRE_TERMS.bondAud} (or A${HIRE_TERMS.bondWithTollAccountAud} with a registered toll account) is payable before Vehicle collection. The bond is held as security for any amounts owing under the Agreement including damage, fines, tolls, additional hire charges, and cleaning fees. The bond is not an excess or a pre-payment of hire charges.
            </p>
          </Clause>
          <Clause number="4.2" heading="Bond refund">
            <p>
              The bond (or any remaining balance after deductions) will be refunded within 14 business days of Vehicle return, provided the Vehicle is returned on time, in the condition it was collected, with no outstanding charges. The Owner will provide an itemised statement of any deductions.
            </p>
          </Clause>
          <Clause number="4.3" heading="Hire charges">
            <p>
              Hire charges are payable in advance for each hire period as specified in the Hire Agreement. Charges are calculated on a weekly basis. If a hire period does not fall on an exact week multiple, daily rates apply for any additional days.
            </p>
          </Clause>
          <Clause number="4.4" heading="Payment methods">
            <p>
              Payment is accepted by bank transfer, debit card or credit card (surcharges may apply). Cash is not accepted. All amounts are in Australian dollars inclusive of GST where applicable.
            </p>
          </Clause>
          <Clause number="4.5" heading="Late payment">
            <p>
              If any amount is not paid by the due date, the Owner may charge interest at the rate of 10% per annum, calculated daily on the outstanding balance. Persistent non-payment will be treated as a default under clause 15.
            </p>
          </Clause>
          <Clause number="4.6" heading="GST">
            <p>
              All hire charges are subject to GST at the prevailing rate under the A New Tax System (Goods and Services Tax) Act 1999 (Cth). Tax invoices are issued on request.
            </p>
          </Clause>
        </Section>

        {/* 5. Hire Period */}
        <Section id="hire-period" title="5. Hire Period and Extensions">
          <Clause number="5.1" heading="Minimum hire period">
            <p>
              The minimum hire period is {HIRE_TERMS.minHireDays} days. No pro-rata refund will be provided for any early return within the minimum period.
            </p>
          </Clause>
          <Clause number="5.2" heading="Extensions">
            <p>
              Extensions must be requested and confirmed by the Owner in writing at least 48 hours before the scheduled return date. The Owner may decline an extension if the Vehicle is required for another confirmed hire. Extension rates are as agreed in writing; if no rate is agreed, the standard weekly rate applies.
            </p>
          </Clause>
          <Clause number="5.3" heading="Overdue vehicles">
            <p>
              If the Vehicle is not returned by the agreed return date and time, the Hirer will be charged the full daily rate for each additional day until the Vehicle is returned. The Owner may, after giving reasonable notice, treat the overdue hire as a default and repossess the Vehicle at the Hirer's cost.
            </p>
          </Clause>
        </Section>

        {/* 6. Permitted Use */}
        <Section id="permitted-use" title="6. Permitted Use">
          <Clause number="6.1" heading="Approved use">
            <p>
              The Vehicle may be used only for lawful commercial or private purposes within {HIRE_TERMS.stateOfUse}. Interstate travel requires prior written approval from the Owner.
            </p>
          </Clause>
          <Clause number="6.2" heading="Prohibited uses">
            <p>The Vehicle must NOT be used:</p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>to carry passengers for hire or reward (e.g. rideshare, taxi services);</li>
              <li>to tow any trailer, caravan or other vehicle unless specifically authorised in writing;</li>
              <li>in any motor sport, race, rally, trial or speed test;</li>
              <li>off-road or on unsealed roads for which the Vehicle is not designed;</li>
              <li>to transport illegal substances, firearms or controlled goods;</li>
              <li>while the driver is impaired by alcohol, drugs (prescribed or otherwise) or fatigue;</li>
              <li>to carry loads exceeding the Vehicle's manufacturer-rated payload capacity;</li>
              <li>in a reckless, negligent or dangerous manner;</li>
              <li>by any person other than an Authorised Driver;</li>
              <li>outside {HIRE_TERMS.stateOfUse} without prior written consent;</li>
              <li>for any purpose that would void the Vehicle's insurance policy.</li>
            </ul>
          </Clause>
          <Clause number="6.3" heading="Kilometres">
            <p>
              Unlimited kilometres are included in every hire. The Owner reserves the right to review actual usage patterns and may amend future hire offers accordingly, but will not retrospectively charge per-kilometre fees under an existing Agreement.
            </p>
          </Clause>
          <Clause number="6.4" heading="Cargo and loading">
            <p>
              The Hirer is solely responsible for the safe and legal securing of all loads. The Vehicle must not be overloaded. Any damage caused by unsecured or overweight cargo is Excluded Damage.
            </p>
          </Clause>
        </Section>

        {/* 7. Driver Obligations */}
        <Section id="driver-obligations" title="7. Driver Obligations">
          <Clause number="7.1" heading="Care of vehicle">
            <p>
              The Hirer must keep the Vehicle in good order, protect it from unnecessary damage, and ensure it is securely locked and parked when not in use. The Hirer must not make any modifications, additions or alterations to the Vehicle.
            </p>
          </Clause>
          <Clause number="7.2" heading="Fuel">
            <p>
              The Vehicle is diesel-powered. The Hirer must use only the correct fuel type. Using incorrect fuel (e.g. petrol or AdBlue incorrectly) will render the Hirer fully liable for all resulting engine and fuel system damage. The Vehicle must be returned with the same fuel level as at collection, or a refuelling fee of A$3.50 per litre will apply for the shortfall.
            </p>
          </Clause>
          <Clause number="7.3" heading="Fluid levels and tyres">
            <p>
              The Hirer must maintain oil, water and tyre pressure at appropriate levels during the Hire Period. Damage caused by failure to maintain adequate fluid levels (other than mechanical failure unrelated to maintenance) is Excluded Damage.
            </p>
          </Clause>
          <Clause number="7.4" heading="Traffic and parking laws">
            <p>
              All Authorised Drivers must comply with all road traffic laws, parking regulations and load restraint laws. The Hirer is solely responsible for all fines, penalties and enforcement costs incurred during the Hire Period.
            </p>
          </Clause>
          <Clause number="7.5" heading="Accidents — duty to notify">
            <p>
              In the event of any accident, collision or incident involving the Vehicle (regardless of fault or apparent damage), the Hirer must:
            </p>
            <ol className="list-decimal ml-6 space-y-1 mt-2">
              <li>call emergency services if required;</li>
              <li>not admit liability to any third party;</li>
              <li>collect the names, contact details, licence numbers and insurance details of all involved parties and witnesses;</li>
              <li>notify the Owner by phone at {COMPANY_PHONE} within 24 hours;</li>
              <li>complete and return the Owner's accident report form within 48 hours;</li>
              <li>cooperate fully with any insurer or investigation.</li>
            </ol>
            <p className="mt-2">
              Failure to comply with these obligations may void the Hirer's LDW protection and render the Hirer fully liable.
            </p>
          </Clause>
          <Clause number="7.6" heading="Theft">
            <p>
              If the Vehicle is stolen, the Hirer must immediately report the theft to the NSW Police and obtain an event number, then notify the Owner within 4 hours. Failure to report theft promptly may render the Hirer liable for the full replacement value.
            </p>
          </Clause>
          <Clause number="7.7" heading="Keys">
            <p>
              Loss of keys will incur a replacement cost of not less than A$500 (inclusive of locksmith, programming and any towing costs). The Hirer must not copy keys without prior written consent.
            </p>
          </Clause>
        </Section>

        {/* 8. Insurance */}
        <Section id="insurance" title="8. Insurance and Liability">
          <Clause number="8.1" heading="Comprehensive insurance">
            <p>
              The Vehicle is covered by comprehensive motor vehicle insurance arranged by the Owner. The Hirer is not a party to this policy and has no right to make a claim directly against the Owner's insurer.
            </p>
          </Clause>
          <Clause number="8.2" heading="Loss Damage Waiver">
            <p>
              Where LDW is included or purchased, the Hirer's liability for accidental damage is limited to the excess amount specified in the Hire Agreement, provided the damage is not Excluded Damage under clause 8.3.
            </p>
          </Clause>
          <Clause number="8.3" heading="Excluded Damage — full liability applies">
            <p>
              LDW protection is void and the Hirer bears full liability (including the cost of loss of income during repair) where damage or loss arises from:
            </p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>driving under the influence of alcohol (any detectable amount) or prohibited drugs;</li>
              <li>driving by an unauthorised driver;</li>
              <li>use of incorrect fuel type;</li>
              <li>off-road use or driving on roads unsuitable for the Vehicle;</li>
              <li>failure to report an accident or theft as required;</li>
              <li>deliberately caused damage;</li>
              <li>overloading beyond the manufacturer-rated payload;</li>
              <li>breaching clause 6.2 (Prohibited Uses);</li>
              <li>failure to maintain adequate fluid levels resulting in engine or mechanical damage;</li>
              <li>water damage from crossing flooded roads;</li>
              <li>damage to the roof, awning or overhead clearance from height restrictions;</li>
              <li>towing without prior written consent;</li>
              <li>damage incurred outside {HIRE_TERMS.stateOfUse} without prior written consent.</li>
            </ul>
          </Clause>
          <Clause number="8.4" heading="Third-party liability">
            <p>
              Third-party property damage and injury arising from a covered accident is handled via the Owner's policy, subject to the terms of that policy. The Hirer indemnifies the Owner against any claim to the extent caused by the Hirer's breach of these Terms.
            </p>
          </Clause>
          <Clause number="8.5" heading="Personal property">
            <p>
              The Owner is not liable for the loss of, or damage to, any personal property or cargo in or on the Vehicle during the Hire Period.
            </p>
          </Clause>
        </Section>

        {/* 9. Damage */}
        <Section id="damage" title="9. Damage, Loss and Theft">
          <Clause number="9.1" heading="Condition at collection">
            <p>
              The Hirer must inspect the Vehicle at collection and note any pre-existing damage on the Condition Report. Signing the Condition Report (or collecting the Vehicle without objection) constitutes acceptance that the Vehicle was in the described condition at that time.
            </p>
          </Clause>
          <Clause number="9.2" heading="Hirer's liability for damage">
            <p>
              Subject to clause 8.2, the Hirer is liable for all damage to the Vehicle occurring during the Hire Period, including but not limited to: panel damage, glass, tyres, interior, underbody, overhead and mechanical damage caused by driver error.
            </p>
          </Clause>
          <Clause number="9.3" heading="Assessment of damage costs">
            <p>
              Damage costs are assessed by the Owner's repairer or an independent assessor chosen by the Owner. The Hirer may request a copy of any repair quote and has 5 business days to raise a written objection. The Owner may deduct assessed damage costs from the Bond.
            </p>
          </Clause>
          <Clause number="9.4" heading="Loss of use">
            <p>
              Where the Vehicle is off the road for repairs following damage for which the Hirer is liable, the Hirer is also liable for loss-of-use charges at the daily hire rate for each day the Vehicle is unavailable, up to a maximum of 28 days.
            </p>
          </Clause>
        </Section>

        {/* 10. Tolls and Fines */}
        <Section id="tolls-and-fines" title="10. Tolls, Fines and Infringements">
          <Clause number="10.1" heading="Hirer's responsibility">
            <p>
              All toll charges, parking fines, traffic infringement notices, oversize/overweight penalties and any other regulatory charges incurred during the Hire Period are the sole responsibility of the Hirer.
            </p>
          </Clause>
          <Clause number="10.2" heading="Toll accounts">
            <p>
              The Hirer must either use their own registered toll account linked to the Vehicle's plate, or arrange toll payment directly with the relevant road authority. Where the Owner receives a toll notice for which the Hirer has not made payment, the Owner will pass on the toll amount plus an A$25 administration fee per notice.
            </p>
          </Clause>
          <Clause number="10.3" heading="Infringement notices">
            <p>
              Where a fine or infringement notice is received by the Owner during or after the Hire Period, the Owner will nominate the Hirer as the responsible driver as permitted by law. If the Owner is required to pay the fine before recovering from the Hirer, the Hirer must reimburse the Owner within 7 days of demand plus an A$25 administration fee.
            </p>
          </Clause>
          <Clause number="10.4" heading="Deduction from bond">
            <p>
              The Owner may deduct any outstanding tolls, fines and administration fees from the Bond. If the Bond is insufficient, the balance becomes an immediately payable debt.
            </p>
          </Clause>
        </Section>

        {/* 11. Servicing */}
        <Section id="servicing" title="11. Servicing and Breakdowns">
          <Clause number="11.1" heading="Scheduled servicing">
            <p>
              Scheduled servicing and maintenance is arranged and paid for by the Owner. If a service falls due during the Hire Period, the Owner will arrange the service at a time convenient to the Hirer with reasonable notice. The Hirer must allow the Owner access to the Vehicle for servicing.
            </p>
          </Clause>
          <Clause number="11.2" heading="Roadside assistance">
            <p>
              24/7 roadside assistance is included. In the event of a breakdown, the Hirer must call the Owner at {COMPANY_PHONE} before arranging any towing or repairs. Unauthorised repairs or towing will not be reimbursed unless pre-approved.
            </p>
          </Clause>
          <Clause number="11.3" heading="Mechanical failure">
            <p>
              If the Vehicle suffers a mechanical failure that is not caused by the Hirer's misuse or neglect, the Owner will arrange a replacement vehicle where reasonably practicable, or will refund hire charges for the days the Vehicle was unavailable. This is the Hirer's sole remedy for mechanical failure.
            </p>
          </Clause>
        </Section>

        {/* 12. GPS */}
        <Section id="gps" title="12. GPS Tracking">
          <Clause number="12.1" heading="Consent to tracking">
            <p>
              All Vehicles are fitted with GPS tracking devices. By entering into this Agreement, the Hirer and all Authorised Drivers consent to the continuous monitoring of the Vehicle's location, speed, journey history and driving behaviour throughout the Hire Period.
            </p>
          </Clause>
          <Clause number="12.2" heading="Use of data">
            <p>
              GPS data may be used by the Owner to: verify compliance with geographic restrictions; assist in recovery of a stolen or overdue Vehicle; investigate accidents; and assess Excluded Damage claims. GPS data will not be shared with third parties except as required by law or insurance investigation.
            </p>
          </Clause>
          <Clause number="12.3" heading="Tampering">
            <p>
              Tampering with, obscuring, disabling or attempting to circumvent the GPS device is a serious breach of this Agreement. The Hirer will be liable for the cost of repair or replacement and may be liable for criminal charges under applicable legislation.
            </p>
          </Clause>
        </Section>

        {/* 13. Return */}
        <Section id="return" title="13. Return of Vehicle">
          <Clause number="13.1" heading="Return location and time">
            <p>
              The Vehicle must be returned to {COMPANY_ADDRESS} by the date and time specified in the Hire Agreement, unless an extension has been agreed in writing.
            </p>
          </Clause>
          <Clause number="13.2" heading="Condition on return">
            <p>
              The Vehicle must be returned:
            </p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>in the same condition as collected (fair wear and tear excepted);</li>
              <li>with the same fuel level as at collection;</li>
              <li>clean inside and out (a cleaning fee of A$150–A$500 applies for vehicles returned in an unacceptably dirty or contaminated state, including pet hair, chemical spills or biohazards);</li>
              <li>with all keys, accessories and documentation provided at collection.</li>
            </ul>
          </Clause>
          <Clause number="13.3" heading="Out-of-hours return">
            <p>
              The Owner does not accept unsupervised out-of-hours returns. The Hirer remains responsible for the Vehicle until the Owner has inspected it and signed a return acknowledgement. Do not leave the Vehicle unattended at the depot without prior arrangement.
            </p>
          </Clause>
        </Section>

        {/* 14. Early Termination */}
        <Section id="early-termination" title="14. Early Termination">
          <Clause number="14.1" heading="Early return by Hirer">
            <p>
              If the Hirer returns the Vehicle before the end of the minimum hire period or any extended period, no refund of pre-paid hire charges will be provided. Hire charges continue to accrue until the Vehicle is accepted back by the Owner.
            </p>
          </Clause>
          <Clause number="14.2" heading="Termination by Owner">
            <p>
              The Owner may terminate this Agreement immediately and require immediate return of the Vehicle if:
            </p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>the Hirer fails to pay any amount due within 5 business days of the due date;</li>
              <li>the Hirer breaches any material term of this Agreement;</li>
              <li>the Vehicle has been used in a prohibited manner;</li>
              <li>the Hirer is subject to bankruptcy, insolvency or administration proceedings;</li>
              <li>the Owner reasonably believes the Vehicle is at risk of damage, loss or misuse.</li>
            </ul>
          </Clause>
        </Section>

        {/* 15. Default */}
        <Section id="default" title="15. Default and Repossession">
          <Clause number="15.1" heading="Default event">
            <p>
              A default occurs if the Hirer: fails to return the Vehicle at the agreed time; fails to make payment when due; uses the Vehicle in a prohibited manner; or breaches any material term and fails to remedy the breach within 48 hours of written notice.
            </p>
          </Clause>
          <Clause number="15.2" heading="Repossession">
            <p>
              On a default event, the Owner may repossess the Vehicle without notice and without liability to the Hirer. The Hirer authorises the Owner to enter any premises (with the landowner's consent) for this purpose. All costs of repossession, including towing and any legal costs on a solicitor-client basis, are payable by the Hirer.
            </p>
          </Clause>
          <Clause number="15.3" heading="Debt recovery">
            <p>
              Outstanding amounts not recovered from the Bond become immediately payable debts. The Owner may engage debt collection services and report the debt to a credit reporting body. All recovery costs, including collection agency fees and legal costs, are recoverable from the Hirer.
            </p>
          </Clause>
        </Section>

        {/* 16. Limitation */}
        <Section id="limitation" title="16. Limitation of Liability">
          <Clause number="16.1" heading="Consumer guarantees">
            <p>
              Nothing in these Terms limits or excludes any guarantee, right or remedy available to the Hirer under the Australian Consumer Law (Schedule 2 of the Competition and Consumer Act 2010 (Cth)) that cannot be limited or excluded by law.
            </p>
          </Clause>
          <Clause number="16.2" heading="Consequential loss">
            <p>
              Subject to clause 16.1, the Owner is not liable to the Hirer for any indirect, consequential, special or economic loss, including loss of income, loss of profits or business interruption arising out of or in connection with the hire of the Vehicle or any mechanical failure, delay in delivery or repossession.
            </p>
          </Clause>
          <Clause number="16.3" heading="Maximum liability">
            <p>
              Subject to clause 16.1, the Owner's total liability to the Hirer for any claim arising from or in connection with this Agreement is limited to the total hire charges paid by the Hirer in the 28 days immediately preceding the event giving rise to the claim.
            </p>
          </Clause>
        </Section>

        {/* 17. Governing Law */}
        <Section id="governing-law" title="17. Governing Law">
          <p>
            This Agreement is governed by and construed in accordance with the laws of New South Wales, Australia. Each party irrevocably submits to the exclusive jurisdiction of the courts of New South Wales and the Federal Court of Australia sitting in Sydney.
          </p>
        </Section>

        {/* 18. Disputes */}
        <Section id="disputes" title="18. Disputes">
          <Clause number="18.1" heading="Informal resolution">
            <p>
              If a dispute arises, the parties agree to first attempt to resolve it in good faith through direct negotiation. Either party may initiate this process by sending a written notice of dispute to the other party's address on the Hire Agreement.
            </p>
          </Clause>
          <Clause number="18.2" heading="NSW Fair Trading">
            <p>
              If the dispute is not resolved within 14 days of the notice of dispute, either party may refer the matter to NSW Fair Trading for mediation before commencing court proceedings, except where urgent injunctive or declaratory relief is sought.
            </p>
          </Clause>
          <Clause number="18.3" heading="NCAT">
            <p>
              Consumer disputes falling within the jurisdiction of the NSW Civil and Administrative Tribunal (NCAT) may be referred to NCAT at the Hirer's election.
            </p>
          </Clause>
        </Section>

        {/* 19. Amendments */}
        <Section id="amendments" title="19. Amendments">
          <p>
            The Owner may amend these Terms at any time by publishing an updated version on the website and notifying existing Hirers by email or in writing. Amendments do not apply retrospectively to a hire already in progress; they take effect for new hires from the date of publication.
          </p>
        </Section>

        {/* 20. Contact */}
        <Section id="contact" title="20. Contact">
          <p>
            Notices under this Agreement must be sent to:
          </p>
          <address className="not-italic mt-6 p-8 rounded-2xl bg-black/20 border border-white/[0.05] shadow-inner text-[15px] leading-loose text-white/70">
            <strong className="text-foreground text-lg">{COMPANY_NAME}</strong><br />
            {COMPANY_ADDRESS}<br />
            <span className="mt-4 block">Phone: <a href={`tel:${COMPANY_PHONE}`} className="text-primary hover:underline">{COMPANY_PHONE}</a></span>
          </address>
          <p className="mt-3">
            For general enquiries, visit our <Link href="/contact-us" className="text-link hover:underline">contact page</Link>.
          </p>
        </Section>

        {/* Disclaimer */}
        <div className="rounded-2xl border border-white/[0.05] bg-black/20 shadow-inner p-8 text-[15px] leading-loose text-white/50">
          <p className="font-semibold text-white/80 mb-2 uppercase tracking-widest text-xs">⚠️ Notice</p>
          <p>
            These Terms of Hire are published for informational purposes. Your actual hire agreement is the governing document. {COMPANY_NAME} recommends that you read and retain a copy of the signed Hire Agreement for your records. If you have any questions about these terms, please contact us before signing.
          </p>
        </div>
      </div>
    </>
  );
}
