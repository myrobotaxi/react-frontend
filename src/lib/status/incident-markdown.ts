/**
 * The two shapes an incident write-up needs (MYR-510).
 *
 * `status_incidents.body_md` is Markdown in the sense that a person writing one
 * in a SQL file should not have to think about HTML — blank lines separate
 * paragraphs, `- ` starts a bullet. That is the whole grammar.
 *
 * Deliberately not a Markdown library. A dependency here would let arbitrary
 * HTML into a public page from a text column, and the page renders these blocks
 * as React text nodes, so nothing in the database can become markup.
 */

/** A paragraph, or a bulleted list. */
export type IncidentBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] };

/** Split a body into blocks. Unrecognised syntax stays literal text. */
export function parseIncidentBody(bodyMd: string): IncidentBlock[] {
  return bodyMd
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
    .map(toBlock);
}

function toBlock(chunk: string): IncidentBlock {
  const lines = chunk.split('\n').map((line) => line.trim());

  if (lines.every(isBullet)) {
    return { kind: 'list', items: lines.map((line) => line.slice(2).trim()) };
  }

  // A hard-wrapped paragraph is one paragraph: joining on a space is what the
  // author meant, and it keeps the page's line length the reader's business.
  return { kind: 'paragraph', text: lines.join(' ') };
}

function isBullet(line: string): boolean {
  return line.startsWith('- ') && line.length > 2;
}
