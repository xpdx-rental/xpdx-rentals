import { describe, it, expect } from "vitest";
import { telHref, waHref, formatPhoneDisplay } from "@/lib/lead";

/**
 * CLAUDE.md §3 states the contact number and its exact link forms:
 *   Phone:    0433 418 566  →  tel:+61433418566
 *   WhatsApp: https://wa.me/61433418566
 * These are business facts, so they are asserted rather than assumed.
 */
describe("telHref", () => {
  it("renders the §3 number in the §3 form", () => {
    expect(telHref("0433 418 566")).toBe("tel:+61433418566");
  });

  it("normalises AU mobile, landline and 61-prefixed input to E.164", () => {
    expect(telHref("0433418566")).toBe("tel:+61433418566");
    expect(telHref("02 9123 4567")).toBe("tel:+61291234567");
    expect(telHref("61433418566")).toBe("tel:+61433418566");
  });

  it("passes through a number that is already international", () => {
    expect(telHref("+64 21 123 4567")).toBe("tel:+64211234567");
  });
});

describe("waHref", () => {
  it("renders the §3 WhatsApp link, digits only and no plus", () => {
    expect(waHref("61433418566")).toBe("https://wa.me/61433418566");
    expect(waHref("+61 433 418 566")).toBe("https://wa.me/61433418566");
  });

  it("url-encodes a prefilled message", () => {
    expect(waHref("61433418566", "Hi there")).toBe("https://wa.me/61433418566?text=Hi%20there");
  });
});

describe("formatPhoneDisplay", () => {
  it("renders E.164 back as the AU grouping the client uses", () => {
    expect(formatPhoneDisplay("61433418566")).toBe("0433 418 566");
    expect(formatPhoneDisplay("0433418566")).toBe("0433 418 566");
  });
});
