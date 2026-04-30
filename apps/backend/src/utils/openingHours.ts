export interface OpeningHours {
    [day: string]: { open: string; close: string; closed?: boolean } | { closed: true };
}

export interface OpeningHoursStatus {
    isOpen: boolean;
    currentDay: string;
    todayHours: { open: string; close: string } | null;
    nextOpenDay?: string;
    nextOpenTime?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Get the current opening hours status for a vendor
 */
export function getOpeningHoursStatus(openingHours: OpeningHours | null | undefined): OpeningHoursStatus {
    if (!openingHours) {
        return {
            isOpen: false,
            currentDay: DAYS[new Date().getDay()],
            todayHours: null,
        };
    }

    const now = new Date();
    const currentDay = DAYS[now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

    const todaySchedule = openingHours[currentDay];

    if (!todaySchedule || ('closed' in todaySchedule && todaySchedule.closed)) {
        // Find next open day
        const { nextDay, nextTime } = findNextOpenDay(openingHours, now.getDay());
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
function findNextOpenDay(openingHours: OpeningHours, currentDayIndex: number): { nextDay?: string; nextTime?: string } {
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
export function formatOpeningHours(openingHours: OpeningHours | null | undefined): string {
    if (!openingHours) return 'Hours not available';

    const now = new Date();
    const currentDay = DAYS[now.getDay()];
    const todaySchedule = openingHours[currentDay];

    if (!todaySchedule || ('closed' in todaySchedule && todaySchedule.closed)) {
        return 'Closed today';
    }

    if ('open' in todaySchedule && 'close' in todaySchedule) {
        return `${todaySchedule.open} - ${todaySchedule.close}`;
    }

    return 'Hours not available';
}

/**
 * Get all opening hours formatted for display
 */
export function getAllOpeningHours(openingHours: OpeningHours | null | undefined): Array<{ day: string; hours: string }> {
    if (!openingHours) return [];

    return DAYS.map(day => {
        const schedule = openingHours[day];
        if (!schedule || ('closed' in schedule && schedule.closed)) {
            return { day, hours: 'Closed' };
        }
        if ('open' in schedule && 'close' in schedule) {
            return { day, hours: `${schedule.open} - ${schedule.close}` };
        }
        return { day, hours: 'Closed' };
    });
}
