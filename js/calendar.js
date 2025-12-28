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

        // Keyboard navigation for months
        document.addEventListener('keydown', (e) => {
            // Only respond to arrow keys when calendar view is active
            const calendarView = document.getElementById('calendar-view');
            const isCalendarActive = calendarView?.classList.contains('active');

            // Don't navigate if a modal is open or user is typing in an input
            const activeModal = document.querySelector('.modal.active');
            const isTyping = document.activeElement?.tagName === 'INPUT' ||
                document.activeElement?.tagName === 'TEXTAREA';

            if (!isCalendarActive || activeModal || isTyping) return;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.render();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.render();
            }
        });

        // Note: Calendar events are added by clicking on calendar days, not via addEventBtn
        // The addEventBtn is for the Events section (countdown events)
    },

    async loadEvents() {
        // Load from localStorage first
        const stored = localStorage.getItem('calendarEvents');
        this.events = stored ? JSON.parse(stored) : {};

        // If user is logged in, also fetch from Supabase and merge
        if (typeof SupabaseDB !== 'undefined' && typeof Auth !== 'undefined' && Auth.currentUser) {
            try {
                const cloudEvents = await SupabaseDB.getCalendarEvents(Auth.currentUser.id);
                if (cloudEvents && Object.keys(cloudEvents).length > 0) {
                    // Merge cloud events with local (cloud takes precedence)
                    for (const [date, events] of Object.entries(cloudEvents)) {
                        this.events[date] = events;
                    }
                    localStorage.setItem('calendarEvents', JSON.stringify(this.events));
                }
            } catch (e) {
                console.log('Error loading calendar events from cloud:', e);
            }
        }
    },

    async saveEvents() {
        // Save to localStorage
        localStorage.setItem('calendarEvents', JSON.stringify(this.events));

        // If user is logged in, sync all events to Supabase
        if (typeof SupabaseDB !== 'undefined' && typeof Auth !== 'undefined' && Auth.currentUser) {
            try {
                for (const [date, events] of Object.entries(this.events)) {
                    for (const event of events) {
                        await SupabaseDB.upsertCalendarEvent(Auth.currentUser.id, date, event);
                    }
                }
            } catch (e) {
                console.log('Error saving calendar events to cloud:', e);
            }
        }
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

        // If event has time, also create countdown event in Events section
        if (time && typeof State !== 'undefined') {
            // Parse date and time components separately to avoid timezone issues
            const [year, month, day] = date.split('-').map(Number);
            const [hours, minutes] = time.split(':').map(Number);
            const eventDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
            const dateTime = eventDate.toISOString();

            // Check if event already exists (by calendarEventId)
            const existingEvent = State.events?.find(e => e.calendarEventId === event.id);

            if (existingEvent) {
                // Update existing countdown event
                State.updateEvent(existingEvent.id, { name, dateTime });
            } else {
                // Create new countdown event
                const countdownEvent = State.addEvent({
                    name,
                    dateTime,
                    calendarEventId: event.id  // Link to calendar event
                });

                // Sync to Supabase
                if (countdownEvent && typeof State.syncEventToSupabase === 'function') {
                    State.syncEventToSupabase(countdownEvent);
                }
            }

            // Re-render Events list
            if (typeof Events !== 'undefined') {
                Events.render();
            }
        }
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

    async deleteEvent() {
        if (this.selectedEventId && this.selectedEventDate) {
            const events = this.events[this.selectedEventDate];
            if (events) {
                // Delete from cloud first
                if (typeof SupabaseDB !== 'undefined' && typeof Auth !== 'undefined' && Auth.currentUser) {
                    await SupabaseDB.deleteCalendarEvent(this.selectedEventId);
                }

                this.events[this.selectedEventDate] = events.filter(e => e.id !== this.selectedEventId);
                if (this.events[this.selectedEventDate].length === 0) {
                    delete this.events[this.selectedEventDate];
                }
                localStorage.setItem('calendarEvents', JSON.stringify(this.events));
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
