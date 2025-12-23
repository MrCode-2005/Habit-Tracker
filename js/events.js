// ===================================
// Events Management
// ===================================

const Events = {
    updateInterval: null,

    init() {
        // Setup add event button
        document.getElementById('addEventBtn').addEventListener('click', () => {
            this.showEventModal();
        });

        // Setup event form
        document.getElementById('eventForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEvent();
        });

        // Initial render
        this.render();

        // Update countdowns every second
        this.updateInterval = setInterval(() => {
            this.updateCountdowns();
        }, 1000);
    },

    showEventModal() {
        document.getElementById('eventForm').reset();

        // Set minimum datetime to now
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

        document.getElementById('eventDateTime').setAttribute('min', minDateTime);
        document.getElementById('eventModal').classList.add('active');
    },

    saveEvent() {
        const name = document.getElementById('eventName').value;
        const dateTime = document.getElementById('eventDateTime').value;

        State.addEvent({ name, dateTime });
        document.getElementById('eventModal').classList.remove('active');
        this.render();
    },

    render() {
        const list = document.getElementById('eventsList');
        list.innerHTML = '';

        const events = State.getEvents();

        if (events.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: var(--text-tertiary);">No events scheduled.</p>';
            return;
        }

        events.forEach(event => {
            const card = this.createEventCard(event);
            list.appendChild(card);
        });
    },

    createEventCard(event) {
        const div = document.createElement('div');
        div.className = 'event-card';
        div.dataset.eventId = event.id;

        const eventDate = new Date(event.dateTime);
        const formattedDate = eventDate.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        div.innerHTML = `
            <div class="event-info">
                <h3>${event.name}</h3>
                <div class="event-date">${formattedDate}</div>
            </div>
            <div class="event-countdown">
                <div class="countdown-display" data-event-id="${event.id}">Calculating...</div>
                <div class="countdown-label">Time Remaining</div>
            </div>
            <button class="btn btn-danger" onclick="Events.deleteEvent('${event.id}')" style="margin-left: 1rem;">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;

        // Calculate initial countdown
        this.updateEventCountdown(event.id);

        return div;
    },

    updateCountdowns() {
        const events = State.getEvents();
        events.forEach(event => {
            this.updateEventCountdown(event.id);
        });
    },

    updateEventCountdown(eventId) {
        const event = State.events.find(e => e.id === eventId);
        if (!event) return;

        // Target specifically the countdown-display div, not the whole card
        const display = document.querySelector(`.countdown-display[data-event-id="${eventId}"]`);
        if (!display) return;

        const now = new Date();
        const eventDate = new Date(event.dateTime);
        const diff = eventDate - now;

        if (diff <= 0) {
            display.textContent = 'Event Started!';
            display.style.color = 'var(--success)';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        display.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    },

    deleteEvent(eventId) {
        if (confirm('Are you sure you want to delete this event?')) {
            State.deleteEvent(eventId);
            this.render();
        }
    }
};
