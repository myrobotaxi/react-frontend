/**
 * The four shapes the privacy policy is built from.
 *
 * A legal page is a document, not an interface, so its vocabulary is
 * deliberately small: a titled section, a paragraph, a bulleted list, and a
 * pull-out for the handful of statements a reader should not miss. Keeping them
 * here is what lets the policy files below read as prose rather than markup.
 *
 * Typography follows the invite landing (`JoinInviteScreen`): white headings,
 * `text-text-secondary` body at `text-sm leading-6`, gold used sparingly.
 */

/** Props for the PolicySection component. */
export interface PolicySectionProps {
  /** Anchor target, so a section can be linked to directly. */
  id: string;
  /** Section heading. */
  title: string;
  children: React.ReactNode;
}

/**
 * One titled section of the policy.
 *
 * The hairline above each section is the only structural rule on the page; the
 * first section suppresses it via `first:border-0` so the document does not
 * open on a divider.
 */
export function PolicySection({ id, title, children }: PolicySectionProps) {
  return (
    <section
      id={id}
      className="mt-10 scroll-mt-8 border-t border-border-default pt-10 first:mt-0 first:border-0 first:pt-0"
    >
      <h2 className="text-lg font-semibold leading-7 text-text-primary">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

/** Props for the PolicyText component. */
export interface PolicyTextProps {
  children: React.ReactNode;
}

/** A paragraph of policy body copy. */
export function PolicyText({ children }: PolicyTextProps) {
  return <p className="text-sm leading-6 text-text-secondary">{children}</p>;
}

/** Props for the PolicyList component. */
export interface PolicyListProps {
  /**
   * One entry per list item. Nodes rather than strings: most items name a
   * thing in white (`<PolicyTerm>`) and then explain it.
   */
  items: React.ReactNode[];
}

/**
 * A bulleted list.
 *
 * Gold markers are the one brand flourish in the document — the same accent as
 * the lockup's glow, at the scale a wall of text can carry.
 */
export function PolicyList({ items }: PolicyListProps) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-text-secondary marker:text-gold">
      {items.map((item, index) => (
        // Policy copy is a fixed, ordered document — it is never reordered,
        // filtered, or appended to at runtime, so the index is a stable key.
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

/** Props for the PolicyTerm component. */
export interface PolicyTermProps {
  children: React.ReactNode;
}

/** The named thing at the start of a list item, lifted out of the grey. */
export function PolicyTerm({ children }: PolicyTermProps) {
  return <span className="font-medium text-text-primary">{children}</span>;
}

/** Props for the PolicyCallout component. */
export interface PolicyCalloutProps {
  /** What the reader should take away, in a few words. */
  title: string;
  children: React.ReactNode;
}

/**
 * A statement the reader should not skim past.
 *
 * Used three times and no more: for what a viewer of a shared car can see, for
 * the parts of the database that are not column-encrypted yet, and for the two
 * deletion steps that only the account holder can perform. Each is something a
 * reader could reasonably assume the opposite of.
 */
export function PolicyCallout({ title, children }: PolicyCalloutProps) {
  return (
    <div className="rounded-xl border border-border-default bg-bg-surface px-5 py-4">
      <p className="text-sm font-semibold leading-6 text-text-primary">{title}</p>
      <div className="mt-2 space-y-3 text-sm leading-6 text-text-secondary">{children}</div>
    </div>
  );
}
