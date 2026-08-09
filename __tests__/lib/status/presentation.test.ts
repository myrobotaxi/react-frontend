import { describe, expect, it } from 'vitest';

import { parseIncidentBody } from '@/lib/status/incident-markdown';
import {
  dayBarTooltip,
  formatDuration,
  formatIncidentWindow,
  formatUptimePct,
  formatUtcTimestamp,
  OVERALL_HEADLINE,
  STATE_LABEL,
} from '@/lib/status/presentation';

describe('formatUptimePct', () => {
  it('shows two decimals', () => {
    expect(formatUptimePct(99.98765)).toBe('99.98%');
    expect(formatUptimePct(100)).toBe('100.00%');
  });

  it('never rounds an imperfect record up to a perfect one', () => {
    expect(formatUptimePct(99.999)).toBe('99.99%');
  });

  it('shows a dash rather than a zero when nothing was measured', () => {
    expect(formatUptimePct(null)).toBe('—');
  });
});

describe('dayBarTooltip', () => {
  it('says a day was not probed rather than implying it was fine', () => {
    expect(
      dayBarTooltip({ date: '2026-07-01', state: 'no_data', total: 0, failed: 0, uptimePct: null }),
    ).toBe('2026-07-01 — no checks recorded');
  });

  it('quotes the day’s uptime and the counts behind it', () => {
    expect(
      dayBarTooltip({
        date: '2026-08-09',
        state: 'outage',
        total: 1440,
        failed: 7,
        uptimePct: 99.5138,
      }),
    ).toBe('2026-08-09 — 99.51% uptime, 1440 checks, 7 failed');
  });

  it('gets the singulars right', () => {
    expect(
      dayBarTooltip({ date: '2026-08-09', state: 'degraded', total: 1, failed: 1, uptimePct: 0 }),
    ).toBe('2026-08-09 — 0.00% uptime, 1 check, 1 failed');
  });
});

describe('formatUtcTimestamp', () => {
  it('is always UTC and always spelled out', () => {
    expect(formatUtcTimestamp(new Date('2026-08-09T04:07:33Z'))).toBe('9 Aug 2026, 04:07 UTC');
  });

  it('is a dash when there is no timestamp', () => {
    expect(formatUtcTimestamp(null)).toBe('—');
  });
});

describe('formatDuration', () => {
  it('rounds to whole minutes', () => {
    expect(formatDuration(new Date('2026-08-09T04:02:00Z'), new Date('2026-08-09T04:09:00Z'))).toBe(
      '7 minutes',
    );
  });

  it('never reports a real incident as zero minutes', () => {
    expect(formatDuration(new Date('2026-08-09T04:02:00Z'), new Date('2026-08-09T04:02:05Z'))).toBe(
      '1 minute',
    );
  });

  it('spells out hours', () => {
    expect(formatDuration(new Date('2026-08-09T01:00:00Z'), new Date('2026-08-09T02:04:00Z'))).toBe(
      '1 hour 4 minutes',
    );
    expect(formatDuration(new Date('2026-08-09T01:00:00Z'), new Date('2026-08-09T03:00:00Z'))).toBe(
      '2 hours',
    );
  });
});

describe('formatIncidentWindow', () => {
  it('collapses a same-day window and adds the duration', () => {
    expect(
      formatIncidentWindow(new Date('2026-08-09T04:02:00Z'), new Date('2026-08-09T04:09:00Z')),
    ).toBe('9 Aug 2026, 04:02–04:09 UTC · 7 minutes');
  });

  it('says ongoing rather than guessing an end', () => {
    expect(formatIncidentWindow(new Date('2026-08-09T04:02:00Z'), null)).toBe(
      '9 Aug 2026, 04:02 UTC — ongoing',
    );
  });

  it('spells both ends out when an incident crosses midnight', () => {
    expect(
      formatIncidentWindow(new Date('2026-08-09T23:50:00Z'), new Date('2026-08-10T00:20:00Z')),
    ).toBe('9 Aug 2026, 23:50 UTC — 10 Aug 2026, 00:20 UTC · 30 minutes');
  });
});

describe('the four words the page may say', () => {
  it('never labels an unmeasured component as healthy', () => {
    expect(STATE_LABEL.no_data).toBe('No data');
    expect(OVERALL_HEADLINE.no_data).toBe('Status unknown');
    expect(Object.values(STATE_LABEL)).not.toContain('Unknown but probably fine');
  });
});

describe('parseIncidentBody', () => {
  it('splits paragraphs on blank lines', () => {
    expect(parseIncidentBody('First para.\n\nSecond para.')).toEqual([
      { kind: 'paragraph', text: 'First para.' },
      { kind: 'paragraph', text: 'Second para.' },
    ]);
  });

  it('joins a hard-wrapped paragraph into one', () => {
    expect(parseIncidentBody('One line\nand its continuation.')).toEqual([
      { kind: 'paragraph', text: 'One line and its continuation.' },
    ]);
  });

  it('reads a run of dashes as a list', () => {
    expect(parseIncidentBody('Intro.\n\n- First\n- Second')).toEqual([
      { kind: 'paragraph', text: 'Intro.' },
      { kind: 'list', items: ['First', 'Second'] },
    ]);
  });

  it('leaves anything it does not understand as literal text', () => {
    expect(parseIncidentBody('<script>alert(1)</script>')).toEqual([
      { kind: 'paragraph', text: '<script>alert(1)</script>' },
    ]);
  });

  it('is empty for an empty body', () => {
    expect(parseIncidentBody('   \n\n  ')).toEqual([]);
  });
});
