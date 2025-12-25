// ===================================
// Calendar Management
// ===================================

const Calendar = {
    currentDate: new Date(),
    events: {},
    selectedEventId: null,

    init() {
        this.loadEvents();
        this.render();
        this.setupEventListeners();
        this.renderUpcomingEvents();
    },

    setupEventListeners() {
        document.getElementById('prevMonth')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render();
        });

        document.getElementById('nextMonth')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render();
        });

        document.getElementById('calendarEventForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEvent();
        });

        // Open modal on Add Event button
        document.getElementById('addEventBtn')?.addEventListener('click', () => {
            this.openModal();
        });
    },

    loadEvents() {
        const stored = localStorage.getItem('calendarEvents');
        this.events = stored ? JSON.parse(stored) : {};
    },

    saveEvents() {
        localStorage.setItem('calendarEvents', JSON.stringify(this.events));
    },

    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Update header
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('calendarMonthYear').textContent = `${monthNames[month]} ${year}`;

        // Get first day and total days of month
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Get today for highlighting
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

        // Build calendar grid
        const container = document.getElementById('calendarDays');
        container.innerHTML = '';

        // Empty cells for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            container.appendChild(emptyCell);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = this.formatDate(year, month, day);
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';

            // Highlight today
            if (isCurrentMonth && day === today.getDate()) {
                dayCell.classList.add('today');
            }

            // Check for events
            const dayEvents = this.events[dateStr] || [];
            if (dayEvents.length > 0) {
                dayCell.classList.add('has-events');
            }

            dayCell.innerHTML = `
                <span class="day-number">${day}</span>
                ${dayEvents.length > 0 ? `<div class="event-dots">${dayEvents.slice(0, 3).map(e =>
                `<span class="event-dot" title="${e.name}"></span>`
            ).join('')}</div>` : ''}
            `;

            dayCell.onclick = () => this.onDayClick(dateStr, dayEvents);
            container.appendChild(dayCell);
        }
    },

    formatDate(year, month, day) {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    },

    onDayClick(dateStr, events) {
        if (events.length === 0) {
            // No events - open add modal with date prefilled
            this.openModal(dateStr);
        } else if (events.length === 1) {
            // One event - show details
            this.showEventDetails(events[0], dateStr);
        } else {
            // Multiple events - show list (for now, show first)
            this.showEventDetails(events[0], dateStr);
        }
    },

    openModal(dateStr = null) {
        const modal = document.getElementById('calendarEventModal');
        document.getElementById('calendarEventForm').reset();
        document.getElementById('calendarEventModalTitle').textContent = 'Add Event';

        if (dateStr) {
            document.getElementById('calEventDate').value = dateStr;
        } else {
            // Default to today
            const today = new Date();
            document.getElementById('calEventDate').value = this.formatDate(
                today.getFullYear(), today.getMonth(), today.getDate()
            );
        }

        this.selectedEventId = null;
        modal.classList.add('active');
    },

    closeModal() {
        document.getElementById('calendarEventModal').classList.remove('active');
    },

    saveEvent() {
        const name = document.getElementById('calEventName').value;
        const date = document.getElementById('calEventDate').value;
        const time = document.getElementById('calEventTime').value;
        const link = document.getElementById('calEventLink').value;
        const comments = document.getElementById('calEventComments').value;

        const event = {
            id: this.selectedEventId || Date.now().toString(),
            name,
            time,
            link,
            comments
        };

        if (!this.events[date]) {
            this.events[date] = [];
        }

        // Update or add
        const existingIndex = this.events[date].findIndex(e => e.id === event.id);
        if (existingIndex !== -1) {
            this.events[date][existingIndex] = event;
        } else {
            this.events[date].push(event);
        }

        this.saveEvents();
        this.closeModal();
        this.render();
        this.renderUpcomingEvents();
    },

    showEventDetails(event, dateStr) {
        this.selectedEventId = event.id;
        this.selectedEventDate = dateStr;

        document.getElementById('detailEventName').textContent = event.name;
        document.getElementById('detailEventTime').textContent = event.time || 'All day';

        const linkContainer = document.getElementById('detailEventLinkContainer');
        if (event.link) {
            linkContainer.style.display = 'block';
            document.getElementById('detailEventLink').href = event.link;
            document.getElementById('detailEventLink').textContent = event.link;
        } else {
            linkContainer.style.display = 'none';
        }

        document.getElementById('detailEventComments').textContent = event.comments || '';
        document.getElementById('eventDetailsPopup').classList.add('active');
    },

    closeDetails() {
        document.getElementById('eventDetailsPopup').classList.remove('active');
        this.selectedEventId = null;
    },

    deleteEvent() {
        if (this.selectedEventId && this.selectedEventDate) {
            const events = this.events[this.selectedEventDate];
            if (events) {
                this.events[this.selectedEventDate] = events.filter(e => e.id !== this.selectedEventId);
                if (this.events[this.selectedEventDate].length === 0) {
                    delete this.events[this.selectedEventDate];
                }
                this.saveEvents();
                this.closeDetails();
                this.render();
                this.renderUpcomingEvents();
            }
        }
    },

    renderUpcomingEvents() {
        const container = document.getElementById('upcomingEventsList');
        if (!container) return;

        const today = new Date();
        const upcoming = [];

        // Get events for next 7 days
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            const dateStr = this.formatDate(date.getFullYear(), date.getMonth(), date.getDate());
            const events = this.events[dateStr] || [];
            events.forEach(e => {
                upcoming.push({ ...e, date: dateStr, daysFromNow: i });
            });
        }

        if (upcoming.length === 0) {
            container.innerHTML = '<p class="no-events">No upcoming events in the next 7 days</p>';
            return;
        }

        container.innerHTML = upcoming.map(e => {
            const dayLabel = e.daysFromNow === 0 ? 'Today' :
                e.daysFromNow === 1 ? 'Tomorrow' :
                    `In ${e.daysFromNow} days`;
            return `
                <div class="upcoming-event-item" onclick="Calendar.showEventDetails(${JSON.stringify(e).replace(/"/g, '&quot;')}, '${e.date}')">
                    <span class="upcoming-day">${dayLabel}</span>
                    <span class="upcoming-name">${e.name}</span>
                    <span class="upcoming-time">${e.time || 'All day'}</span>
                </div>
            `;
        }).join('');
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    Calendar.init();
});

// Expose globally
window.Calendar = Calendar;
