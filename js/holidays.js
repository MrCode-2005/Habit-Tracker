// ===================================
// Indian National Holidays Module
// ===================================

const Holidays = {
    // Indian national holidays (fixed dates that occur every year)
    // These are gazetted national holidays
    nationalHolidays: [
        { month: 0, day: 26, name: 'Republic Day' },      // January 26
        { month: 7, day: 15, name: 'Independence Day' },  // August 15
        { month: 9, day: 2, name: 'Gandhi Jayanti' }      // October 2
    ],

    /**
     * Get all holidays for a specific year
     * @param {number} year - The year to get holidays for
     * @returns {Object} - Map of date strings (YYYY-MM-DD) to holiday names
     */
    getHolidaysForYear(year) {
        const holidays = {};

        this.nationalHolidays.forEach(holiday => {
            const dateStr = this.formatDate(year, holiday.month, holiday.day);
            holidays[dateStr] = holiday.name;
        });

        return holidays;
    },

    /**
     * Get holiday name for a specific date
     * @param {string} dateStr - Date in YYYY-MM-DD format
     * @returns {string|null} - Holiday name or null if not a holiday
     */
    getHolidayForDate(dateStr) {
        const date = new Date(dateStr);
        const month = date.getMonth();
        const day = date.getDate();

        const holiday = this.nationalHolidays.find(h =>
            h.month === month && h.day === day
        );

        return holiday ? holiday.name : null;
    },

    /**
     * Check if a date is a holiday
     * @param {string} dateStr - Date in YYYY-MM-DD format
     * @returns {boolean}
     */
    isHoliday(dateStr) {
        return this.getHolidayForDate(dateStr) !== null;
    },

    /**
     * Format date to YYYY-MM-DD string
     * @param {number} year
     * @param {number} month - 0-indexed month
     * @param {number} day
     * @returns {string}
     */
    formatDate(year, month, day) {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
};

// Expose globally
window.Holidays = Holidays;
