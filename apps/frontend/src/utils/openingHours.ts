import { OpeningHours as OpeningHoursType } from '../types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Map full day names to abbreviated keys used by the utilities and DB schema
const FULL_TO_ABBR: Record<string, string> = {
  Sunday: 'Sun', Monday: 'Mon', Tuesday: 'Tue',
  Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat',
};

/**
 * Normalize an OpeningHours object so all keys are abbreviated (Mon–Sun).
 * If the object already uses abbreviated keys, it is returned unchanged.
 * Full day-name keys (Monday–Sunday) are remapped to their abbreviated equivalents.
 */
function normalizeKeys(openingHours: OpeningHoursType): OpeningHoursType {
  const entries = Object.entries(openingHours);
  const hasFullKeys = entries.some(([key]) => key in FULL_TO_ABBR);
  if (!hasFullKeys) return openingHours;
  return Object.fromEntries(
    entries.map(([day, hours]) => [FULL_TO_ABBR[day] ?? day, hours])
  ) as OpeningHoursType;
}

export interface OpeningHoursStatus {
    isOpen: boolean;
    currentDay: string;
    todayHours: { open: string; close: string } | null;
    nextOpenDay?: string;
    nextOpenTime?: string;
}

/**
 * Get the current opening hours status for a vendor
 */
export function getOpeningHoursStatus(openingHours: OpeningHoursType | null | undefined): OpeningHoursStatus {
    if (!openingHours) {
        return {
            isOpen: false,
            currentDay: DAYS[new Date().getDay()],
            todayHours: null,
        };
    }

    const normalized = normalizeKeys(openingHours);
    const now = new Date();
    const currentDay = DAYS[now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

    const todaySchedule = normalized[currentDay];

    if (!todaySchedule || ('closed' in todaySchedule && todaySchedule.closed)) {
        // Find next open day
        const { nextDay, nextTime } = findNextOpenDay(normalized, now.getDay());
        return {
            isOpen: false,
            currentDay,
            todayHours: null,
            nextOpenDay: nextDay,
            nextOpenTime: nextTime,
        };
    }

    if (!('open' in todaySchedule) || !('close' in todaySchedule)) {
        return {
            isOpen: false,
            currentDay,
            todayHours: null,
        };
    }

    const openTime = parseTime(todaySchedule.open);
    const closeTime = parseTime(todaySchedule.close);

    const isOpen = currentTime >= openTime && currentTime < closeTime;

    return {
        isOpen,
        currentDay,
        todayHours: { open: todaySchedule.open, close: todaySchedule.close },
    };
}

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
function parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Find the next open day and time
 */
function findNextOpenDay(openingHours: OpeningHoursType, currentDayIndex: number): { nextDay?: string; nextTime?: string } {
    for (let i = 1; i <= 7; i++) {
        const dayIndex = (currentDayIndex + i) % 7;
        const day = DAYS[dayIndex];
        const schedule = openingHours[day];

        if (schedule && !('closed' in schedule && schedule.closed) && 'open' in schedule) {
            return { nextDay: day, nextTime: schedule.open };
        }
    }

    return {};
}

/**
 * Format opening hours for display
 */
export function formatOpeningHours(openingHours: OpeningHoursType | null | undefined): string {
    if (!openingHours) return 'Hours not available';

    const normalized = normalizeKeys(openingHours);
    const now = new Date();
    const currentDay = DAYS[now.getDay()];
    const todaySchedule = normalized[currentDay];

    if (!todaySchedule || ('closed' in todaySchedule && todaySchedule.closed)) {
        return 'Closed today';
    }

    if ('open' in todaySchedule && 'close' in todaySchedule) {
        return `${formatTime(todaySchedule.open)} - ${formatTime(todaySchedule.close)}`;
    }

    return 'Hours not available';
}

/**
 * Format time from 24h to 12h format
 */
export function formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get all opening hours formatted for display
 */
export function getAllOpeningHours(openingHours: OpeningHoursType | null | undefined): Array<{ day: string; hours: string; isToday: boolean }> {
    if (!openingHours) return [];

    const normalized = normalizeKeys(openingHours);
    const today = new Date().getDay();

    return DAYS.map((day, index) => {
        const schedule = normalized[day];
        if (!schedule || ('closed' in schedule && schedule.closed)) {
            return { day, hours: 'Closed', isToday: index === today };
        }
        if ('open' in schedule && 'close' in schedule) {
            return { 
                day, 
                hours: `${formatTime(schedule.open)} - ${formatTime(schedule.close)}`,
                isToday: index === today
            };
        }
        return { day, hours: 'Closed', isToday: index === today };
    });
}
