/**
 * Bug Condition Exploration Tests — Opening Hours Key Mismatch & Invalid Key Path
 *
 * Property 1: Bug Condition
 *
 * CRITICAL: These tests MUST FAIL on unfixed code — failure confirms both bugs exist.
 * DO NOT attempt to fix the test or the code when it fails.
 * NOTE: This test encodes the expected behavior — it will validate the fix when it passes
 *       after implementation.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 */

import * as fc from 'fast-check';
import { formatOpeningHours, getAllOpeningHours, parseGoogleOpeningHours } from '../utils/openingHours';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FULL_DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
type FullDayName = typeof FULL_DAY_NAMES[number];

// Map full day names to the day-of-week index used by Date.getDay()
// Sunday=0, Monday=1, ..., Saturday=6
const FULL_DAY_TO_JS_INDEX: Record<FullDayName, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

/**
 * Returns a Date whose getDay() matches the given full day name.
 * Used to pin "today" so formatOpeningHours looks up the right day.
 */
function dateForFullDay(day: FullDayName): Date {
  const now = new Date();
  const targetIndex = FULL_DAY_TO_JS_INDEX[day];
  const currentIndex = now.getDay();
  const diff = targetIndex - currentIndex;
  const d = new Date(now);
  d.setDate(now.getDate() + diff);
  return d;
}

// ─── Bug A: Full-key mismatch ─────────────────────────────────────────────────

describe('Bug A — full-key mismatch: formatOpeningHours with full day-name keys', () => {
  /**
   * Concrete failing case:
   * formatOpeningHours({ Monday: { open: '09:00', close: '21:00' } }) called on a Monday
   * should return '9:00 AM - 9:00 PM' but returns 'Hours not available' on unfixed code.
   *
   * Validates: Requirements 1.2, 2.2
   */
  it('returns actual hours (not "Hours not available") when called with { Monday: { open: "09:00", close: "21:00" } } on a Monday', () => {
    const openingHours = { Monday: { open: '09:00', close: '21:00' } };

    // Pin Date to a Monday so formatOpeningHours looks up the correct day
    const monday = dateForFullDay('Monday');
    const realDateNow = Date.now;
    const realDate = global.Date;

    // Spy on Date constructor to return a Monday
    jest.spyOn(global, 'Date').mockImplementation((...args: any[]) => {
      if (args.length === 0) return monday;
      return new realDate(...(args as [any]));
    });
    (global.Date as any).now = realDateNow;

    try {
      const result = formatOpeningHours(openingHours as any);
      // On unfixed code: result === 'Hours not available' (bug confirmed)
      // On fixed code:   result === '9:00 AM - 9:00 PM'
      expect(result).toBe('9:00 AM - 9:00 PM');
    } finally {
      jest.restoreAllMocks();
    }
  });
});

describe('Bug A — full-key mismatch: getAllOpeningHours with full day-name keys', () => {
  /**
   * Concrete failing case:
   * getAllOpeningHours with a full-day-name-keyed object should return at least one
   * entry with hours other than 'Closed', but on unfixed code all entries are 'Closed'.
   *
   * Validates: Requirements 1.3, 2.3
   */
  it('returns at least one non-Closed entry when called with a full-day-name-keyed object', () => {
    const openingHours = {
      Monday: { open: '09:00', close: '21:00' },
      Tuesday: { open: '10:00', close: '18:00' },
      Wednesday: { open: '10:00', close: '18:00' },
      Thursday: { open: '10:00', close: '18:00' },
      Friday: { open: '10:00', close: '18:00' },
      Saturday: { closed: true },
      Sunday: { closed: true },
    };

    const result = getAllOpeningHours(openingHours as any);

    // On unfixed code: all entries have hours === 'Closed' (bug confirmed)
    // On fixed code:   Mon–Fri entries have actual hours
    const nonClosedEntries = result.filter(entry => entry.hours !== 'Closed');
    expect(nonClosedEntries.length).toBeGreaterThan(0);
  });

  /**
   * Property-based test:
   * For any full-day-name-keyed object where at least one day has valid open/close times,
   * formatOpeningHours should return the actual formatted hours string (e.g. '9:00 AM - 9:00 PM'),
   * not a fallback string ('Hours not available' or 'Closed today').
   *
   * On unfixed code: returns 'Closed today' (key not found → falls through to closed branch)
   * On fixed code:   returns the actual formatted hours string
   *
   * Validates: Requirements 1.2, 2.2
   */
  it('(property) returns formatted hours (not a fallback) when called with a full-day-name key for today', () => {
    // Generator: pick one full day name as "today" and build an openingHours object
    // with that day having valid open/close times
    const openHourArb = fc.integer({ min: 0, max: 21 }).map(h => h.toString().padStart(2, '0') + ':00');
    const closeHourArb = fc.integer({ min: 1, max: 23 }).map(h => h.toString().padStart(2, '0') + ':00');

    const fullDayArb = fc.constantFrom(...FULL_DAY_NAMES);

    fc.assert(
      fc.property(fullDayArb, openHourArb, closeHourArb, (day, open, close) => {
        // Ensure close > open to have a valid time range
        if (close <= open) return; // skip invalid combos

        const openingHours = { [day]: { open, close } };

        // Pin Date to the chosen day
        const targetDate = dateForFullDay(day);
        const realDateNow = Date.now;
        const realDate = global.Date;

        jest.spyOn(global, 'Date').mockImplementation((...args: any[]) => {
          if (args.length === 0) return targetDate;
          return new realDate(...(args as [any]));
        });
        (global.Date as any).now = realDateNow;

        try {
          const result = formatOpeningHours(openingHours as any);
          // On unfixed code: result === 'Closed today' (key not found, falls to closed branch)
          // On fixed code:   result should be the formatted hours string like '9:00 AM - 9:00 PM'
          // Either fallback string indicates the bug is present
          expect(result).not.toBe('Hours not available');
          expect(result).not.toBe('Closed today');
        } finally {
          jest.restoreAllMocks();
        }
      }),
      { numRuns: 20 }
    );
  });
});

// ─── Bug B: Invalid key path in MiniWebsite ───────────────────────────────────
// Note: The MiniWebsite component test is in the companion .tsx test file
// (openingHours.bugCondition.component.test.tsx) because it requires React rendering.
// The utility-level tests above cover Bug A fully.
// Bug B is validated by the component test file.

describe('parseGoogleOpeningHours', () => {
  it('correctly parses standard Google Places weekdayDescriptions', () => {
    const weekdayDescriptions = [
      'Monday: 9:00 AM – 9:00 PM',
      'Tuesday: 9:00 AM – 9:00 PM',
      'Wednesday: 9:00 AM – 9:00 PM',
      'Thursday: 9:00 AM – 9:00 PM',
      'Friday: 9:00 AM – 9:00 PM',
      'Saturday: 10:00 AM – 6:00 PM',
      'Sunday: Closed'
    ];

    const result = parseGoogleOpeningHours(weekdayDescriptions);
    expect(result).toEqual({
      Mon: { open: '09:00', close: '21:00' },
      Tue: { open: '09:00', close: '21:00' },
      Wed: { open: '09:00', close: '21:00' },
      Thu: { open: '09:00', close: '21:00' },
      Fri: { open: '09:00', close: '21:00' },
      Sat: { open: '10:00', close: '18:00' },
      Sun: { closed: true }
    });
  });

  it('handles 24 hours and missing minutes', () => {
    const weekdayDescriptions = [
      'Monday: Open 24 hours',
      'Tuesday: 9 AM – 9 PM'
    ];

    const result = parseGoogleOpeningHours(weekdayDescriptions);
    expect(result).toEqual({
      Mon: { open: '00:00', close: '24:00' },
      Tue: { open: '09:00', close: '21:00' }
    });
  });
});
