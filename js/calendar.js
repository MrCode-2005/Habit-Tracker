// ===================================
// Calendar Management
// ===================================

const Calendar = {
    currentDate: new Date(),
    events: {},
    selectedEventId: null,
    upcomingFilterDays: 30, // Default filter: 1 month

    init() {
        this.loadEvents();
        this.render();
        this.setupEventListeners();
        this.setupUpcomingFilter();
        this.renderUpcomingEvents();
    },

    // Setup upcoming events filter
    setupUpcomingFilter() {
        const filterSelect = document.getElementById('upcomingFilter');
        if (filterSelect) {
            // Set initial value from stored preference if available
            const stored = localStorage.getItem('upcomingFilterDays');
            if (stored) {
                this.upcomingFilterDays = parseInt(stored);
                filterSelect.value = stored;
            }

            filterSelect.addEventListener('change', (e) => {
                this.upcomingFilterDays = parseInt(e.target.value);
                localStorage.setItem('upcomingFilterDays', e.target.value);
                this.renderUpcomingEvents();
            });
        }
    },

    setupEventListeners() {
        // Previous month button with animation
        document.getElementById('prevMonth')?.addEventListener('click', () => {
            this.navigateMonth(-1);
        });

        // Next month button with animation
        document.getElementById('nextMonth')?.addEventListener('click', () => {
            this.navigateMonth(1);
        });

        // Today button - jump to current date
        document.getElementById('todayBtn')?.addEventListener('click', () => {
            this.goToToday();
        });

        document.getElementById('calendarEventForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEvent();
        });

        // Month selector dropdown
        document.getElementById('monthSelector')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMonthDropdown();
        });

        // Year selector dropdown
        document.getElementById('yearSelector')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleYearDropdown();
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            const monthDropdown = document.getElementById('monthDropdown');
            const yearDropdown = document.getElementById('yearDropdown');
            const monthBtn = document.getElementById('monthSelector');
            const yearBtn = document.getElementById('yearSelector');

            if (!e.target.closest('.calendar-date-selector')) {
                monthDropdown?.classList.remove('active');
                yearDropdown?.classList.remove('active');
                monthBtn?.classList.remove('active');
                yearBtn?.classList.remove('active');
            }
        });

        // Keyboard navigation for months
        document.addEventListener('keydown', (e) => {
            // Close dropdowns on Escape
            if (e.key === 'Escape') {
                this.closeAllDropdowns();
                return;
            }

            // Only respond to arrow keys when calendar view is active
            const calendarView = document.getElementById('calendar');
            const isCalendarActive = calendarView?.classList.contains('active');

            // Don't navigate if a modal is open, dropdown is open, or user is typing
            const activeModal = document.querySelector('.modal.active');
            const activeDropdown = document.querySelector('.calendar-dropdown.active');
            const isTyping = document.activeElement?.tagName === 'INPUT' ||
                document.activeElement?.tagName === 'TEXTAREA';

            if (!isCalendarActive || activeModal || activeDropdown || isTyping) return;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.navigateMonth(-1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.navigateMonth(1);
            }
        });

        // Note: Calendar events are added by clicking on calendar days, not via addEventBtn
        // The addEventBtn is for the Events section (countdown events)
    },

    // Navigate months with animation
    navigateMonth(direction) {
        const container = document.getElementById('calendarDays');
        const animationClass = direction > 0 ? 'slide-left' : 'slide-right';

        container?.classList.add(animationClass);

        this.currentDate.setMonth(this.currentDate.getMonth() + direction);

        // Remove animation class after animation completes
        setTimeout(() => {
            container?.classList.remove(animationClass);
        }, 300);

        this.render();
    },

    // Go to today's date
    goToToday() {
        const today = new Date();
        const container = document.getElementById('calendarDays');

        // Only animate if we're actually changing months
        if (this.currentDate.getMonth() !== today.getMonth() ||
            this.currentDate.getFullYear() !== today.getFullYear()) {
            container?.classList.add('slide-left');
            setTimeout(() => {
                container?.classList.remove('slide-left');
            }, 300);
        }

        this.currentDate = new Date();
        this.render();
    },

    // Toggle month dropdown
    toggleMonthDropdown() {
        const monthDropdown = document.getElementById('monthDropdown');
        const yearDropdown = document.getElementById('yearDropdown');
        const monthBtn = document.getElementById('monthSelector');
        const yearBtn = document.getElementById('yearSelector');

        // Close year dropdown if open
        yearDropdown?.classList.remove('active');
        yearBtn?.classList.remove('active');

        // Toggle month dropdown
        const isActive = monthDropdown?.classList.toggle('active');
        monthBtn?.classList.toggle('active', isActive);

        if (isActive) {
            this.populateMonthDropdown();
        }
    },

    // Toggle year dropdown
    toggleYearDropdown() {
        const monthDropdown = document.getElementById('monthDropdown');
        const yearDropdown = document.getElementById('yearDropdown');
        const monthBtn = document.getElementById('monthSelector');
        const yearBtn = document.getElementById('yearSelector');

        // Close month dropdown if open
        monthDropdown?.classList.remove('active');
        monthBtn?.classList.remove('active');

        // Toggle year dropdown
        const isActive = yearDropdown?.classList.toggle('active');
        yearBtn?.classList.toggle('active', isActive);

        if (isActive) {
            this.populateYearDropdown();
        }
    },

    // Close all dropdowns
    closeAllDropdowns() {
        const monthDropdown = document.getElementById('monthDropdown');
        const yearDropdown = document.getElementById('yearDropdown');
        const monthBtn = document.getElementById('monthSelector');
        const yearBtn = document.getElementById('yearSelector');

        monthDropdown?.classList.remove('active');
        yearDropdown?.classList.remove('active');
        monthBtn?.classList.remove('active');
        yearBtn?.classList.remove('active');
    },

    // Populate month dropdown
    populateMonthDropdown() {
        const container = document.getElementById('monthOptions');
        if (!container) return;

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = this.currentDate.getMonth();

        container.innerHTML = monthNames.map((name, index) => `
            <button class="dropdown-option ${index === currentMonth ? 'current' : ''}" 
                    data-month="${index}"
                    onclick="Calendar.selectMonth(${index})">
                ${name}
            </button>
        `).join('');
    },

    // Populate year dropdown
    populateYearDropdown() {
        const container = document.getElementById('yearOptions');
        if (!container) return;

        const currentYear = this.currentDate.getFullYear();
        const startYear = currentYear - 10;
        const endYear = currentYear + 10;
        const years = [];

        for (let year = startYear; year <= endYear; year++) {
            years.push(year);
        }

        container.innerHTML = years.map(year => `
            <button class="dropdown-option ${year === currentYear ? 'current' : ''}" 
                    data-year="${year}"
                    onclick="Calendar.selectYear(${year})">
                ${year}
            </button>
        `).join('');

        // Scroll to current year
        const currentBtn = container.querySelector('.current');
        if (currentBtn) {
            currentBtn.scrollIntoView({ block: 'center', behavior: 'instant' });
        }
    },

    // Select month from dropdown
    selectMonth(monthIndex) {
        const container = document.getElementById('calendarDays');
        const currentMonth = this.currentDate.getMonth();

        if (monthIndex !== currentMonth) {
            const animationClass = monthIndex > currentMonth ? 'slide-left' : 'slide-right';
            container?.classList.add(animationClass);
            setTimeout(() => {
                container?.classList.remove(animationClass);
            }, 300);
        }

        this.currentDate.setMonth(monthIndex);
        this.closeAllDropdowns();
        this.render();
    },

    // Select year from dropdown
    selectYear(year) {
        const container = document.getElementById('calendarDays');
        const currentYear = this.currentDate.getFullYear();

        if (year !== currentYear) {
            const animationClass = year > currentYear ? 'slide-left' : 'slide-right';
            container?.classList.add(animationClass);
            setTimeout(() => {
                container?.classList.remove(animationClass);
            }, 300);
        }

        this.currentDate.setFullYear(year);
        this.closeAllDropdowns();
        this.render();
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

        // Update header - separate month and year elements
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        const monthEl = document.getElementById('calendarMonth');
        const yearEl = document.getElementById('calendarYear');

        if (monthEl) monthEl.textContent = monthNames[month];
        if (yearEl) yearEl.textContent = year;

        // Get first day and total days of month
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Get today for highlighting
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

        // Build calendar grid
        const container = document.getElementById('calendarDays');
        container.innerHTML = '';

        // Empty cells for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            emptyCell.setAttribute('aria-hidden', 'true');
            container.appendChild(emptyCell);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = this.formatDate(year, month, day);
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';

            // Create date object for this day
            const thisDate = new Date(year, month, day);
            thisDate.setHours(0, 0, 0, 0);

            // Check if day is in the past
            if (thisDate < today) {
                dayCell.classList.add('past');
            }

            // Highlight today
            if (isCurrentMonth && day === today.getDate()) {
                dayCell.classList.add('today');
            }

            // Check for events
            const dayEvents = this.events[dateStr] || [];
            if (dayEvents.length > 0) {
                dayCell.classList.add('has-events');
            }

            // Build event dots HTML with overflow indicator
            let eventDotsHtml = '';
            if (dayEvents.length > 0) {
                const visibleDots = dayEvents.slice(0, 3).map(e =>
                    `<span class="event-dot" title="${e.name}"></span>`
                ).join('');
                const moreIndicator = dayEvents.length > 3 ?
                    `<span class="event-more">+${dayEvents.length - 3}</span>` : '';
                eventDotsHtml = `<div class="event-dots">${visibleDots}${moreIndicator}</div>`;
            }

            dayCell.innerHTML = `
                <span class="day-number">${day}</span>
                ${eventDotsHtml}
            `;

            // Accessibility attributes
            dayCell.setAttribute('role', 'gridcell');
            dayCell.setAttribute('tabindex', '0');
            dayCell.setAttribute('aria-label', `${monthNames[month]} ${day}, ${year}${dayEvents.length > 0 ? `, ${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}` : ''}`);

            dayCell.onclick = () => this.onDayClick(dateStr, dayEvents);

            // Keyboard support for day cells
            dayCell.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.onDayClick(dateStr, dayEvents);
                }
            };

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

        // Clear selection state for new event
        this.selectedEventId = null;
        this.selectedEventDate = null;

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

        // If editing and date changed, remove from old date
        if (this.selectedEventId && this.selectedEventDate && this.selectedEventDate !== date) {
            const oldDateEvents = this.events[this.selectedEventDate];
            if (oldDateEvents) {
                this.events[this.selectedEventDate] = oldDateEvents.filter(e => e.id !== this.selectedEventId);
                if (this.events[this.selectedEventDate].length === 0) {
                    delete this.events[this.selectedEventDate];
                }
            }
        }

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

        // Clear selection state
        this.selectedEventId = null;
        this.selectedEventDate = null;

        this.render();
        this.renderUpcomingEvents();

        // If event has time, also create/update countdown event in Events section
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
                const updated = State.updateEvent(existingEvent.id, { name, dateTime });
                if (updated && typeof State.syncEventToSupabase === 'function') {
                    State.syncEventToSupabase(updated);
                }
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

    closeDetails(preserveSelection = false) {
        document.getElementById('eventDetailsPopup').classList.remove('active');
        if (!preserveSelection) {
            this.selectedEventId = null;
            this.selectedEventDate = null;
        }
    },

    async deleteEvent() {
        if (this.selectedEventId && this.selectedEventDate) {
            const events = this.events[this.selectedEventDate];
            if (events) {
                // Delete from cloud first
                if (typeof SupabaseDB !== 'undefined' && typeof Auth !== 'undefined' && Auth.currentUser) {
                    await SupabaseDB.deleteCalendarEvent(this.selectedEventId);
                }

                // Also delete linked countdown event if exists
                if (typeof State !== 'undefined') {
                    const linkedEvent = State.events?.find(e => e.calendarEventId === this.selectedEventId);
                    if (linkedEvent) {
                        State.deleteEvent(linkedEvent.id);
                        State.deleteEventFromSupabase(linkedEvent.id);
                    }
                }

                this.events[this.selectedEventDate] = events.filter(e => e.id !== this.selectedEventId);
                if (this.events[this.selectedEventDate].length === 0) {
                    delete this.events[this.selectedEventDate];
                }
                localStorage.setItem('calendarEvents', JSON.stringify(this.events));
                this.closeDetails();
                this.render();
                this.renderUpcomingEvents();

                // Re-render Events section if available
                if (typeof Events !== 'undefined') {
                    Events.render();
                }
            }
        }
    },

    // Edit event - opens modal with pre-filled data
    editEvent() {
        if (!this.selectedEventId || !this.selectedEventDate) return;

        const events = this.events[this.selectedEventDate];
        const event = events?.find(e => e.id === this.selectedEventId);

        if (!event) return;

        // Close details popup but PRESERVE selection for editing
        this.closeDetails(true);

        // Open modal in edit mode
        const modal = document.getElementById('calendarEventModal');
        document.getElementById('calendarEventModalTitle').textContent = 'Edit Event';

        // Pre-fill form with existing data
        document.getElementById('calEventName').value = event.name || '';
        document.getElementById('calEventDate').value = this.selectedEventDate;
        document.getElementById('calEventTime').value = event.time || '';
        document.getElementById('calEventLink').value = event.link || '';
        document.getElementById('calEventComments').value = event.comments || '';

        modal.classList.add('active');
    },

    renderUpcomingEvents() {
        const container = document.getElementById('upcomingEventsList');
        if (!container) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate the max date based on filter
        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + this.upcomingFilterDays);

        const upcoming = [];

        // Get future events within the filter range
        for (const [dateStr, events] of Object.entries(this.events)) {
            const eventDate = new Date(dateStr + 'T00:00:00');

            // Only include events from today onwards AND within filter range
            if (eventDate >= today && eventDate <= maxDate) {
                const diffTime = eventDate - today;
                const daysFromNow = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                events.forEach(e => {
                    upcoming.push({
                        ...e,
                        date: dateStr,
                        daysFromNow: daysFromNow,
                        eventDate: eventDate
                    });
                });
            }
        }

        // Sort by date (closest first)
        upcoming.sort((a, b) => a.eventDate - b.eventDate);

        // Limit to first 15 events for display
        const displayEvents = upcoming.slice(0, 15);

        // Get filter label for empty state
        const filterLabels = { 7: '1 week', 10: '10 days', 30: '1 month', 180: '6 months' };
        const filterLabel = filterLabels[this.upcomingFilterDays] || `${this.upcomingFilterDays} days`;

        if (displayEvents.length === 0) {
            container.innerHTML = `
                <div class="no-events">
                    <span>No upcoming events in the next ${filterLabel}</span>
                    <span style="font-size: 0.813rem; opacity: 0.7; margin-top: 0.25rem;">Click on a calendar day to add an event</span>
                </div>`;
            return;
        }

        container.innerHTML = displayEvents.map(e => {
            let dayLabel;
            if (e.daysFromNow === 0) {
                dayLabel = 'Today';
            } else if (e.daysFromNow === 1) {
                dayLabel = 'Tomorrow';
            } else if (e.daysFromNow <= 7) {
                dayLabel = `In ${e.daysFromNow} days`;
            } else if (e.daysFromNow <= 30) {
                dayLabel = `In ${Math.ceil(e.daysFromNow / 7)} weeks`;
            } else {
                // Show actual date for events more than 30 days away
                const eventDate = new Date(e.date + 'T00:00:00');
                dayLabel = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }

            return `
                <div class="upcoming-event-item" 
                     role="listitem"
                     tabindex="0"
                     onclick="Calendar.showEventDetails(${JSON.stringify(e).replace(/"/g, '&quot;')}, '${e.date}')"
                     onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();Calendar.showEventDetails(${JSON.stringify(e).replace(/"/g, '&quot;')}, '${e.date}');}">
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
