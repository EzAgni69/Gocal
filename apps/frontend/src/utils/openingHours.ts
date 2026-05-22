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

function convert12hTo24h(time12h: string): string {
    try {
        const match = time12h.match(/^(\d+)(?::(\d+))?\s*(AM|PM)$/i);
        if (!match) return '09:00';
        
        let hours = parseInt(match[1], 10);
        const minutes = match[2] || '00';
        const ampm = match[3].toUpperCase();
        
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    } catch (e) {
        return '09:00';
    }
}

/**
 * Parse Google Places weekdayDescriptions to database OpeningHours format
 */
export function parseGoogleOpeningHours(weekdayDescriptions: string[] | null | undefined): OpeningHoursType {
    const openingHours: OpeningHoursType = {};
    if (!weekdayDescriptions) return openingHours;
    
    const dayMap: Record<string, string> = {
        'monday': 'Mon',
        'tuesday': 'Tue',
        'wednesday': 'Wed',
        'thursday': 'Thu',
        'friday': 'Fri',
        'saturday': 'Sat',
        'sunday': 'Sun'
    };

    weekdayDescriptions.forEach(desc => {
        const parts = desc.split(':');
        if (parts.length < 2) return;
        
        const dayName = parts[0].trim().toLowerCase();
        const dayKey = dayMap[dayName];
        if (!dayKey) return;
        
        const hoursStr = parts.slice(1).join(':').trim();
        
        if (hoursStr.toLowerCase().includes('closed')) {
            openingHours[dayKey] = { closed: true };
        } else if (hoursStr.toLowerCase().includes('24 hours')) {
            openingHours[dayKey] = { open: '00:00', close: '24:00' };
        } else {
            // Google uses en-dash (\u2013) or hyphen or double-hyphen for separator
            const times = hoursStr.split(/[\u2013\u2014-]/);
            if (times.length === 2) {
                const openVal = convert12hTo24h(times[0].trim());
                const closeVal = convert12hTo24h(times[1].trim());
                openingHours[dayKey] = { open: openVal, close: closeVal };
            } else {
                openingHours[dayKey] = { closed: true };
            }
        }
    });

    return openingHours;
}
