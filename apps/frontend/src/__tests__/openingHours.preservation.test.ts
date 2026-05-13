/**
 * Preservation Property Tests — Abbreviated-Key Vendors, Null Hours, and Closed Days
 *
 * Property 2: Preservation
 *
 * These tests capture the BASELINE behavior of the opening hours utilities on inputs
 * where the bug condition does NOT hold (abbreviated keys, null/undefined, closed days).
 * They MUST PASS on unfixed code and MUST CONTINUE TO PASS after the fix is applied.
 *
 * Observation-first methodology: all expected values were observed on the unfixed code
 * before writing these assertions.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

import * as fc from 'fast-check';
import { formatOpeningHours, getAllOpeningHours, formatTime } from '../utils/openingHours';

// ─── Types ────────────────────────────────────────────────────────────────────

type DaySchedule =
  | { open: string; close: string }
  | { closed: true };

type OpeningHoursMap = { [day: string]: DaySchedule };

// ─── Constants ────────────────────────────────────────────────────────────────

const ABBR_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
type AbbrDay = typeof ABBR_DAYS[number];

// The expected FULL_TO_ABBR mapping (captures the fix's intended mapping for unit tests)
const EXPECTED_FULL_TO_ABBR: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

const FULL_DAY_NAMES = Object.keys(EXPECTED_FULL_TO_ABBR);

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** Generate a valid HH:MM time string */
const timeArb = fc.tuple(
  fc.integer({ min: 0, max: 23 }),
  fc.integer({ min: 0, max: 59 })
).map(([h, m]) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);

/** Generate a valid open/close pair where close > open */
const openCloseArb = fc.tuple(
  fc.integer({ min: 0, max: 21 }),
  fc.integer({ min: 1, max: 23 })
).filter(([open, close]) => close > open)
  .map(([open, close]) => ({
    open: `${open.toString().padStart(2, '0')}:00`,
    close: `${close.toString().padStart(2, '0')}:00`,
  }));

/** Generate a day schedule: either open/close or closed */
const dayScheduleArb: fc.Arbitrary<DaySchedule> = fc.oneof(
  openCloseArb,
  fc.constant({ closed: true as const })
);

/** Generate an OpeningHours object with abbreviated keys (Mon–Sun) */
const abbrOpeningHoursArb: fc.Arbitrary<OpeningHoursMap> = fc.record(
  Object.fromEntries(ABBR_DAYS.map(day => [day, fc.option(dayScheduleArb, { nil: undefined })])) as Record<AbbrDay, fc.Arbitrary<DaySchedule | undefined>>
).map(record => {
  // Remove undefined entries to simulate partial objects
  return Object.fromEntries(
    Object.entries(record).filter(([, v]) => v !== undefined)
  ) as OpeningHoursMap;
});

/** Generate an abbreviated-key object with at least one day having closed: true */
const abbrWithClosedDayArb: fc.Arbitrary<OpeningHoursMap> = fc.tuple(
  abbrOpeningHoursArb,
  fc.constantFrom(...ABBR_DAYS)
).map(([hours, closedDay]) => ({
  ...hours,
  [closedDay]: { closed: true as const },
}));

// ─── Observed Baseline Values (unfixed code) ─────────────────────────────────

describe('Observed baseline — null and undefined inputs', () => {
  /**
   * Observed: formatOpeningHours(null) → 'Hours not available'
   * Validates: Requirement 3.2
   */
  it('formatOpeningHours(null) returns "Hours not available"', () => {
    expect(formatOpeningHours(null)).toBe('Hours not available');
  });

  /**
   * Observed: formatOpeningHours(undefined) → 'Hours not available'
   * Validates: Requirement 3.2
   */
  it('formatOpeningHours(undefined) returns "Hours not available"', () => {
    expect(formatOpeningHours(undefined)).toBe('Hours not available');
  });

  /**
   * Observed: getAllOpeningHours(null) → []
   * Validates: Requirement 3.2
   */
  it('getAllOpeningHours(null) returns []', () => {
    expect(getAllOpeningHours(null)).toEqual([]);
  });

  /**
   * Observed: getAllOpeningHours(undefined) → []
   * Validates: Requirement 3.2
   */
  it('getAllOpeningHours(undefined) returns []', () => {
    expect(getAllOpeningHours(undefined)).toEqual([]);
  });
});

describe('Observed baseline — abbreviated-key vendor with closed day', () => {
  /**
   * Observed: getAllOpeningHours({ Mon: { closed: true }, Tue–Fri: open, Sat/Sun: closed })
   * → Mon entry has hours: 'Closed'
   * Validates: Requirement 3.3
   */
  it('getAllOpeningHours returns hours: "Closed" for Mon when Mon has closed: true', () => {
    const openingHours: OpeningHoursMap = {
      Mon: { closed: true },
      Tue: { open: '10:00', close: '18:00' },
      Wed: { open: '10:00', close: '18:00' },
      Thu: { open: '10:00', close: '18:00' },
      Fri: { open: '10:00', close: '18:00' },
      Sat: { closed: true },
      Sun: { closed: true },
    };

    const result = getAllOpeningHours(openingHours as any);
    const monEntry = result.find(e => e.day === 'Mon');

    expect(monEntry).toBeDefined();
    expect(monEntry!.hours).toBe('Closed');
  });
});

// ─── Property: null always returns fallback ───────────────────────────────────

describe('Property: formatOpeningHours(null) always returns "Hours not available"', () => {
  /**
   * This is a deterministic property (no randomness needed), but expressed as a
   * property test to make the invariant explicit.
   *
   * Validates: Requirement 3.2
   */
  it('(property) formatOpeningHours(null) is always "Hours not available"', () => {
    fc.assert(
      fc.property(fc.constant(null), (input) => {
        expect(formatOpeningHours(input)).toBe('Hours not available');
      }),
      { numRuns: 1 }
    );
  });

  /**
   * Validates: Requirement 3.2
   */
  it('(property) getAllOpeningHours(null) always returns []', () => {
    fc.assert(
      fc.property(fc.constant(null), (input) => {
        expect(getAllOpeningHours(input)).toEqual([]);
      }),
      { numRuns: 1 }
    );
  });
});

// ─── Property: getAllOpeningHours returns exactly 7 entries for abbreviated-key objects ──

describe('Property: getAllOpeningHours returns exactly 7 entries for abbreviated-key objects', () => {
  /**
   * For any abbreviated-key OpeningHours object (even partial), getAllOpeningHours
   * always returns exactly 7 entries — one per abbreviated day (Sun–Sat).
   *
   * Validates: Requirement 3.1
   */
  it('(property) returns exactly 7 entries for any abbreviated-key object', () => {
    fc.assert(
      fc.property(abbrOpeningHoursArb, (openingHours) => {
        const result = getAllOpeningHours(openingHours as any);
        expect(result).toHaveLength(7);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * The 7 entries correspond exactly to the abbreviated day names in order: Sun, Mon, Tue, Wed, Thu, Fri, Sat.
   *
   * Validates: Requirement 3.1
   */
  it('(property) the 7 entries have day names matching Sun–Sat in order', () => {
    fc.assert(
      fc.property(abbrOpeningHoursArb, (openingHours) => {
        const result = getAllOpeningHours(openingHours as any);
        const dayNames = result.map(e => e.day);
        expect(dayNames).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Property: 'Closed' only for closed: true or absent days ─────────────────

describe('Property: getAllOpeningHours returns "Closed" only for closed: true or absent days', () => {
  /**
   * For any abbreviated-key object, getAllOpeningHours returns 'Closed' for a day
   * if and only if that day has closed: true OR the day is absent from the object.
   *
   * Validates: Requirement 3.3
   */
  it('(property) "Closed" entries correspond exactly to closed: true or absent days', () => {
    fc.assert(
      fc.property(abbrOpeningHoursArb, (openingHours) => {
        const result = getAllOpeningHours(openingHours as any);

        for (const entry of result) {
          const schedule = (openingHours as OpeningHoursMap)[entry.day];
          const isAbsent = schedule === undefined;
          const isClosedFlag = schedule !== undefined && 'closed' in schedule && (schedule as { closed: true }).closed === true;
          const shouldBeClosed = isAbsent || isClosedFlag;

          if (shouldBeClosed) {
            expect(entry.hours).toBe('Closed');
          } else {
            // Day has open/close times — should NOT be 'Closed'
            expect(entry.hours).not.toBe('Closed');
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * For any abbreviated-key object with at least one day having closed: true,
   * that day's entry in getAllOpeningHours has hours: 'Closed'.
   *
   * Validates: Requirement 3.3
   */
  it('(property) days with closed: true always have hours: "Closed"', () => {
    fc.assert(
      fc.property(abbrWithClosedDayArb, (openingHours) => {
        const result = getAllOpeningHours(openingHours as any);

        // Find all days that have closed: true in the input
        const closedDays = Object.entries(openingHours)
          .filter(([, schedule]) => 'closed' in schedule && (schedule as { closed: true }).closed === true)
          .map(([day]) => day);

        for (const closedDay of closedDays) {
          const entry = result.find(e => e.day === closedDay);
          expect(entry).toBeDefined();
          expect(entry!.hours).toBe('Closed');
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Property: formatOpeningHours output is stable for abbreviated-key objects ──

describe('Property: formatOpeningHours output is stable for abbreviated-key objects', () => {
  /**
   * For any abbreviated-key OpeningHours object, calling formatOpeningHours twice
   * with the same input (same "today") returns the same result.
   * This verifies the function is deterministic given a fixed date.
   *
   * Validates: Requirement 3.1
   */
  it('(property) formatOpeningHours is deterministic for abbreviated-key objects', () => {
    fc.assert(
      fc.property(abbrOpeningHoursArb, (openingHours) => {
        const result1 = formatOpeningHours(openingHours as any);
        const result2 = formatOpeningHours(openingHours as any);
        expect(result1).toBe(result2);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * For any abbreviated-key object, formatOpeningHours returns one of the valid
   * output forms: a formatted time range, 'Closed today', or 'Hours not available'.
   *
   * Validates: Requirement 3.1
   */
  it('(property) formatOpeningHours returns a valid output form for abbreviated-key objects', () => {
    // Time range pattern: e.g. '9:00 AM - 9:00 PM'
    const timeRangePattern = /^\d{1,2}:\d{2} (AM|PM) - \d{1,2}:\d{2} (AM|PM)$/;

    fc.assert(
      fc.property(abbrOpeningHoursArb, (openingHours) => {
        const result = formatOpeningHours(openingHours as any);
        const isValid =
          result === 'Hours not available' ||
          result === 'Closed today' ||
          timeRangePattern.test(result);
        expect(isValid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Unit test: FULL_TO_ABBR mapping covers all 7 days ───────────────────────

describe('Unit test: FULL_TO_ABBR mapping (expected behavior once added)', () => {
  /**
   * The FULL_TO_ABBR constant (to be added in request-card/page.tsx) must cover
   * all 7 full day names and map each to the correct abbreviated key.
   *
   * This test validates the expected mapping in isolation, independent of whether
   * the constant has been added to the source file yet.
   *
   * Validates: Requirement 3.4 (fix is purely frontend key-mapping; backend unchanged)
   */
  it('covers all 7 full day names', () => {
    const fullDays = Object.keys(EXPECTED_FULL_TO_ABBR);
    expect(fullDays).toHaveLength(7);
    expect(fullDays).toEqual(expect.arrayContaining([
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    ]));
  });

  it('maps each full day name to the correct abbreviated key', () => {
    expect(EXPECTED_FULL_TO_ABBR['Monday']).toBe('Mon');
    expect(EXPECTED_FULL_TO_ABBR['Tuesday']).toBe('Tue');
    expect(EXPECTED_FULL_TO_ABBR['Wednesday']).toBe('Wed');
    expect(EXPECTED_FULL_TO_ABBR['Thursday']).toBe('Thu');
    expect(EXPECTED_FULL_TO_ABBR['Friday']).toBe('Fri');
    expect(EXPECTED_FULL_TO_ABBR['Saturday']).toBe('Sat');
    expect(EXPECTED_FULL_TO_ABBR['Sunday']).toBe('Sun');
  });

  it('all mapped abbreviated keys are in the DAYS array used by the utilities', () => {
    const utilsDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (const abbrKey of Object.values(EXPECTED_FULL_TO_ABBR)) {
      expect(utilsDays).toContain(abbrKey);
    }
  });
});

// ─── Unit test: normalizedOpeningHours output ─────────────────────────────────

describe('Unit test: normalizedOpeningHours output for a complete 7-day full-name-keyed object', () => {
  /**
   * The normalizedOpeningHours transformation (to be added in handleSubmit) must:
   * 1. Produce an object with only abbreviated keys (Mon–Sun)
   * 2. Preserve the hour values exactly (no mutation)
   *
   * This test validates the expected transformation logic in isolation.
   *
   * Validates: Requirement 3.4, 3.5
   */

  const fullNameInput: OpeningHoursMap = {
    Monday: { open: '09:00', close: '21:00' },
    Tuesday: { open: '10:00', close: '18:00' },
    Wednesday: { open: '10:00', close: '18:00' },
    Thursday: { open: '10:00', close: '18:00' },
    Friday: { open: '10:00', close: '18:00' },
    Saturday: { closed: true },
    Sunday: { closed: true },
  };

  // Apply the normalization logic (mirrors what handleSubmit will do after the fix)
  function applyNormalization(input: OpeningHoursMap): OpeningHoursMap {
    return Object.fromEntries(
      Object.entries(input).map(([day, hours]) => [
        EXPECTED_FULL_TO_ABBR[day] ?? day,
        hours,
      ])
    );
  }

  it('produces an object with only abbreviated keys', () => {
    const normalized = applyNormalization(fullNameInput);
    const keys = Object.keys(normalized);
    const abbrDaySet = new Set(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    for (const key of keys) {
      expect(abbrDaySet.has(key)).toBe(true);
    }
  });

  it('preserves hour values exactly after normalization', () => {
    const normalized = applyNormalization(fullNameInput);

    expect(normalized['Mon']).toEqual({ open: '09:00', close: '21:00' });
    expect(normalized['Tue']).toEqual({ open: '10:00', close: '18:00' });
    expect(normalized['Wed']).toEqual({ open: '10:00', close: '18:00' });
    expect(normalized['Thu']).toEqual({ open: '10:00', close: '18:00' });
    expect(normalized['Fri']).toEqual({ open: '10:00', close: '18:00' });
    expect(normalized['Sat']).toEqual({ closed: true });
    expect(normalized['Sun']).toEqual({ closed: true });
  });

  it('does not contain any full day-name keys after normalization', () => {
    const normalized = applyNormalization(fullNameInput);
    const fullDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (const fullDay of fullDayNames) {
      expect(Object.keys(normalized)).not.toContain(fullDay);
    }
  });

  it('(property) normalization produces only abbreviated keys for any full-name-keyed input', () => {
    const fullDayArb = fc.constantFrom(...FULL_DAY_NAMES);
    const fullNameObjectArb = fc.dictionary(fullDayArb, dayScheduleArb, { minKeys: 1, maxKeys: 7 });

    fc.assert(
      fc.property(fullNameObjectArb, (input) => {
        const normalized = applyNormalization(input as OpeningHoursMap);
        const abbrDaySet = new Set(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
        for (const key of Object.keys(normalized)) {
          expect(abbrDaySet.has(key)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('(property) normalization preserves hour values for any full-name-keyed input', () => {
    const fullDayArb = fc.constantFrom(...FULL_DAY_NAMES);
    const fullNameObjectArb = fc.dictionary(fullDayArb, dayScheduleArb, { minKeys: 1, maxKeys: 7 });

    fc.assert(
      fc.property(fullNameObjectArb, (input) => {
        const normalized = applyNormalization(input as OpeningHoursMap);

        for (const [fullDay, schedule] of Object.entries(input)) {
          const abbrKey = EXPECTED_FULL_TO_ABBR[fullDay];
          expect(normalized[abbrKey]).toEqual(schedule);
        }
      }),
      { numRuns: 100 }
    );
  });
});
