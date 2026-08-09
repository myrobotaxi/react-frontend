import { componentName } from '@/lib/status/components';
import { parseIncidentBody } from '@/lib/status/incident-markdown';
import { formatIncidentWindow } from '@/lib/status/presentation';
import type { StatusIncidentRecord } from '@/lib/status/types';

/** Props for the IncidentEntry component. */
export interface IncidentEntryProps {
  incident: StatusIncidentRecord;
}

/**
 * One written incident.
 *
 * Styled as a document, not an alert. A resolved incident from last month is
 * history a reader is skimming to decide whether to trust us; rendering it in
 * red would make the page look like an emergency every time someone reads it,
 * and would cheapen the one colour that should mean "right now".
 *
 * The body is rendered as text nodes from a two-rule parser — nothing in the
 * database can become markup on a public page.
 */
export function IncidentEntry({ incident }: IncidentEntryProps) {
  const blocks = parseIncidentBody(incident.bodyMd);
  const affected = incident.components.map(componentName).join(', ');

  return (
    <article className="border-t border-border-default pt-8 first:border-0 first:pt-0">
      <h3 className="text-base font-semibold leading-7 text-text-primary">{incident.title}</h3>

      <p className="mt-1 text-xs leading-5 text-text-muted">
        <time dateTime={incident.startedAt.toISOString()}>
          {formatIncidentWindow(incident.startedAt, incident.resolvedAt)}
        </time>
        {affected ? <> · {affected}</> : null}
        {' · '}
        <span className={incident.resolvedAt ? 'text-text-secondary' : 'text-status-in-service'}>
          {incident.resolvedAt ? 'Resolved' : 'Ongoing'}
        </span>
      </p>

      <div className="mt-4 space-y-4">
        {blocks.map((block, index) =>
          block.kind === 'paragraph' ? (
            // Incident copy is a fixed document once written — never reordered
            // or filtered at runtime — so the index is a stable key.
            <p key={index} className="text-sm leading-6 text-text-secondary">
              {block.text}
            </p>
          ) : (
            <ul
              key={index}
              className="list-disc space-y-2 pl-5 text-sm leading-6 text-text-secondary marker:text-gold"
            >
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ),
        )}
      </div>
    </article>
  );
}
