/**
 * Renders one or more JSON-LD schema objects as `<script type="application/ld+json">`.
 *
 * ── Why the escaping below is not paranoia ──────────────────────────────────
 * The previous comment here read "Schema objects are built server-side from our
 * own data — safe to inline." That is true of the *shape* and false of the
 * *content*. These schemas embed operator-entered text: van `description` and
 * `seo_description` from the admin fleet form, testimonial quotes, the company
 * profile in `settings`. `JSON.stringify` escapes for JSON, not for HTML — it
 * has no reason to touch `<`.
 *
 * So a description containing a closing script tag ends this element early and
 * everything after it is parsed as markup — a stored XSS on every page that
 * renders that van. It needs an admin session to plant, which lowers the
 * likelihood, not the impact, and this is the one place in the codebase where
 * operator text reaches the page unescaped.
 *
 * Escaping `<` as its unicode form is the standard fix: the two are identical
 * to a JSON parser, so the structured data is unchanged and Google reads
 * exactly what we meant, but the HTML parser can no longer see a closing tag.
 * `>` and `&` go too, which also covers `<!--` comment tricks.
 */

/**
 * U+2028 and U+2029 are legal inside JSON strings but are *line terminators* in
 * JavaScript source, so any consumer that evaluates rather than parses breaks
 * on them. They are built from char codes rather than written literally for
 * exactly that reason — pasting them into this file would break its own parse.
 */
const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

const ESCAPES: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  [LINE_SEPARATOR]: "\\u2028",
  [PARAGRAPH_SEPARATOR]: "\\u2029",
};

const HTML_UNSAFE = new RegExp(`[<>&${LINE_SEPARATOR}${PARAGRAPH_SEPARATOR}]`, "g");

function serialize(schema: object): string {
  return JSON.stringify(schema).replace(HTML_UNSAFE, (c) => ESCAPES[c]);
}

export function JsonLd({ schema }: { schema: object | object[] }) {
  const data = Array.isArray(schema) ? schema : [schema];
  return (
    <>
      {data.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serialize(s) }}
        />
      ))}
    </>
  );
}
