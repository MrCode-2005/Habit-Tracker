// ===================================
// Heatmap Engine
// Reusable GitHub-style contribution heatmap
// ===================================

const Heatmap = {
    activeTooltip: null,

    // ---- Date Utilities ----

    /**
     * Get the day of week (0=Mon, 6=Sun) for a Date object.
     * GitHub heatmaps use Mon at top, Sun at bottom.
     */
    getDayOfWeek(date) {
        const day = date.getDay(); // 0=Sun, 1=Mon...6=Sat
        return day === 0 ? 6 : day - 1; // Convert to 0=Mon...6=Sun
    },

    /**
     * Format a date as "Tuesday, 17 February 2026"
     */
    formatDateLong(date) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    },

    /**
     * Get a date key string 'YYYY-MM-DD' from a Date object
     */
    toDateKey(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    },

    // ---- Grid Generation ----

    /**
     * Generate the full year grid of date cells.
     * Returns an array of week-columns, each containing up to 7 day cells.
     * Each cell: { date: Date, dateKey: 'YYYY-MM-DD' } or null (empty padding)
     *
     * @param {number} year - The year to generate
     * @returns {{ weeks: Array, monthPositions: Array }}
     */
    generateYearGrid(year) {
        const startDate = new Date(year, 0, 1); // Jan 1
        const endDate = new Date(year, 11, 31); // Dec 31

        const weeks = [];
        let currentWeek = [];
        const monthPositions = []; // { month: 0-11, weekIndex: number }

        // Pad the first week with empty cells if Jan 1 isn't Monday
        const firstDayOfWeek = this.getDayOfWeek(startDate);
        for (let i = 0; i < firstDayOfWeek; i++) {
            currentWeek.push(null);
        }

        let lastMonth = -1;
        const current = new Date(startDate);

        while (current <= endDate) {
            const dayOfWeek = this.getDayOfWeek(current);

            // Track month label positions
            if (current.getMonth() !== lastMonth) {
                monthPositions.push({
                    month: current.getMonth(),
                    weekIndex: weeks.length + (currentWeek.length > 0 ? 0 : 0)
                });
                // If we're mid-week when month changes, offset to current week
                if (currentWeek.length > 0) {
                    monthPositions[monthPositions.length - 1].weekIndex = weeks.length;
                }
                lastMonth = current.getMonth();
            }

            currentWeek.push({
                date: new Date(current),
                dateKey: this.toDateKey(current)
            });

            // If it's Sunday (index 6), finalize this week column
            if (dayOfWeek === 6) {
                weeks.push(currentWeek);
                currentWeek = [];
            }

            current.setDate(current.getDate() + 1);
        }

        // Push any remaining partial week
        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }

        return { weeks, monthPositions };
    },

    /**
     * Generate a single month grid.
     * @param {number} year
     * @param {number} month - 0-indexed
     */
    generateMonthGrid(year, month) {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0); // Last day of month

        const weeks = [];
        let currentWeek = [];
        const monthPositions = [{
            month: month,
            weekIndex: 0
        }];

        // Pad the first week
        const firstDayOfWeek = this.getDayOfWeek(startDate);
        for (let i = 0; i < firstDayOfWeek; i++) {
            currentWeek.push(null);
        }

        const current = new Date(startDate);
        while (current <= endDate) {
            const dayOfWeek = this.getDayOfWeek(current);
            currentWeek.push({
                date: new Date(current),
                dateKey: this.toDateKey(current)
            });

            if (dayOfWeek === 6) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
            current.setDate(current.getDate() + 1);
        }

        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }

        return { weeks, monthPositions };
    },

    // ---- Color Scale ----

    /**
     * Get the intensity level (0-4) for a value.
     * @param {number} value - completion count
     * @param {number} maxValue - maximum possible completions (for overall mode)
     * @param {string} mode - 'individual' or 'overall'
     * @returns {number} 0-4
     */
    getLevel(value, maxValue, mode) {
        if (!value || value === 0) return 0;

        if (mode === 'individual') {
            // Binary: completed or not
            return value >= 1 ? 4 : 0;
        }

        // Overall mode: scale based on how many habits were completed
        if (maxValue <= 0) return 0;
        const ratio = value / maxValue;

        if (ratio <= 0) return 0;
        if (ratio <= 0.25) return 1;
        if (ratio <= 0.5) return 2;
        if (ratio <= 0.75) return 3;
        return 4;
    },

    // ---- Tooltip ----

    showTooltip(cell, text) {
        this.hideTooltip();

        const tooltip = document.createElement('div');
        tooltip.className = 'heatmap-tooltip';
        tooltip.textContent = text;
        document.body.appendChild(tooltip);

        // Position above the cell
        const rect = cell.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        let top = rect.top - tooltipRect.height - 8;

        // Keep within viewport
        if (left < 4) left = 4;
        if (left + tooltipRect.width > window.innerWidth - 4) {
            left = window.innerWidth - tooltipRect.width - 4;
        }
        if (top < 4) {
            top = rect.bottom + 8; // Show below if no room above
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;

        this.activeTooltip = tooltip;
    },

    hideTooltip() {
        if (this.activeTooltip) {
            this.activeTooltip.remove();
            this.activeTooltip = null;
        }
    },

    // ---- Main Render ----

    /**
     * Render a heatmap into a container element.
     *
     * @param {HTMLElement} container - DOM element to render into
     * @param {Object} options
     * @param {Object} options.data - Map of 'YYYY-MM-DD' => count
     * @param {number} options.year - Year to display
     * @param {string} options.mode - 'individual' or 'overall'
     * @param {number} [options.maxValue] - Max possible completions per day (for overall mode color scaling)
     * @param {string} [options.filter] - 'thisYear', 'lastYear', or 'month'
     * @param {number} [options.month] - 0-indexed month (only used when filter='month')
     * @param {Function} [options.onDayClick] - Callback(dateKey, count, formattedDate)
     * @param {string} [options.title] - Title for the heatmap header
     * @param {Function} [options.onFilterChange] - Callback(filterType) when filter button clicked
     * @param {string} [options.activeFilter] - Currently active filter name
     */
    render(container, options) {
        const {
            data = {},
            year,
            mode = 'individual',
            maxValue = 1,
            filter = 'thisYear',
            month = null,
            onDayClick,
            title = '',
            onFilterChange,
            activeFilter = 'thisYear'
        } = options;

        container.innerHTML = '';

        // Build wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'heatmap-wrapper';

        // Header with title and filters
        const header = document.createElement('div');
        header.className = 'heatmap-header';

        if (title) {
            const h3 = document.createElement('h3');
            h3.textContent = title;
            header.appendChild(h3);
        }

        // Filter buttons
        const filtersDiv = document.createElement('div');
        filtersDiv.className = 'heatmap-filters';

        const filters = [
            { key: 'thisYear', label: 'This Year' },
            { key: 'lastYear', label: 'Last Year' },
            { key: 'month', label: 'Month View' }
        ];

        filters.forEach(f => {
            const btn = document.createElement('button');
            btn.className = `heatmap-filter-btn${activeFilter === f.key ? ' active' : ''}`;
            btn.textContent = f.label;
            btn.setAttribute('aria-pressed', activeFilter === f.key ? 'true' : 'false');
            btn.addEventListener('click', () => {
                if (onFilterChange) onFilterChange(f.key);
            });
            filtersDiv.appendChild(btn);
        });

        header.appendChild(filtersDiv);
        wrapper.appendChild(header);

        // Month selector (shown only when filter is 'month')
        if (activeFilter === 'month') {
            const monthSelector = document.createElement('div');
            monthSelector.className = 'heatmap-filters';
            monthSelector.style.marginBottom = '0.75rem';

            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            monthNames.forEach((mName, idx) => {
                const btn = document.createElement('button');
                btn.className = `heatmap-filter-btn${month === idx ? ' active' : ''}`;
                btn.textContent = mName;
                btn.addEventListener('click', () => {
                    if (onFilterChange) onFilterChange('month', idx);
                });
                monthSelector.appendChild(btn);
            });

            wrapper.appendChild(monthSelector);
        }

        // Scroll container
        const scrollContainer = document.createElement('div');
        scrollContainer.className = 'heatmap-scroll-container';

        const gridWrapper = document.createElement('div');
        gridWrapper.className = 'heatmap-grid-wrapper';

        // Generate grid data
        let gridData;
        if (activeFilter === 'month' && month !== null && month !== undefined) {
            gridData = this.generateMonthGrid(year, month);
        } else {
            gridData = this.generateYearGrid(year);
        }

        const { weeks, monthPositions } = gridData;

        // Cell size (used for positioning month labels)
        const cellSize = 14;
        const cellGap = 4;
        const weekWidth = cellSize + cellGap;

        // Month labels
        const monthLabelsDiv = document.createElement('div');
        monthLabelsDiv.className = 'heatmap-month-labels';
        monthLabelsDiv.style.width = `${weeks.length * weekWidth}px`;

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        monthPositions.forEach(mp => {
            const label = document.createElement('span');
            label.className = 'heatmap-month-label';
            label.textContent = monthNames[mp.month];
            label.style.left = `${mp.weekIndex * weekWidth}px`;
            monthLabelsDiv.appendChild(label);
        });

        gridWrapper.appendChild(monthLabelsDiv);

        // Grid area (day labels + cells)
        const gridArea = document.createElement('div');
        gridArea.className = 'heatmap-grid-area';

        // Day labels
        const dayLabelsDiv = document.createElement('div');
        dayLabelsDiv.className = 'heatmap-day-labels';

        const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', ''];
        dayLabels.forEach(label => {
            const span = document.createElement('span');
            span.className = 'heatmap-day-label';
            span.textContent = label;
            span.style.height = `${cellSize}px`;
            span.style.lineHeight = `${cellSize}px`;
            span.style.marginBottom = `${cellGap}px`;
            dayLabelsDiv.appendChild(span);
        });

        gridArea.appendChild(dayLabelsDiv);

        // Grid of cells
        const gridDiv = document.createElement('div');
        gridDiv.className = 'heatmap-grid';
        gridDiv.setAttribute('role', 'grid');
        gridDiv.setAttribute('aria-label', `Habit progress heatmap for ${year}`);

        weeks.forEach((week, weekIdx) => {
            const col = document.createElement('div');
            col.className = 'heatmap-week-column';
            col.setAttribute('role', 'row');

            // Ensure each week has exactly 7 cells (pad at the end if needed)
            for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
                const cellData = week[dayIdx] || null;
                const cell = document.createElement('button');
                cell.className = 'heatmap-cell';
                cell.setAttribute('role', 'gridcell');

                if (!cellData) {
                    cell.classList.add('heatmap-empty');
                    cell.setAttribute('aria-hidden', 'true');
                    cell.tabIndex = -1;
                } else {
                    const count = data[cellData.dateKey] || 0;
                    const level = this.getLevel(count, maxValue, mode);
                    cell.classList.add(`heatmap-level-${level}`);
                    cell.tabIndex = 0;

                    const formattedDate = this.formatDateLong(cellData.date);

                    // Build the tooltip/click text
                    let tooltipText;
                    if (mode === 'individual') {
                        tooltipText = count >= 1
                            ? `1 completion on ${formattedDate}`
                            : `No completion on ${formattedDate}`;
                    } else {
                        tooltipText = `${count} habit${count !== 1 ? 's' : ''} completed on ${formattedDate}`;
                    }

                    cell.setAttribute('aria-label', tooltipText);
                    cell.dataset.dateKey = cellData.dateKey;
                    cell.dataset.tooltip = tooltipText;

                    // Click handler
                    cell.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.showTooltip(cell, tooltipText);
                        if (onDayClick) onDayClick(cellData.dateKey, count, formattedDate);
                    });

                    // Keyboard: Enter/Space to show tooltip
                    cell.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            this.showTooltip(cell, tooltipText);
                            if (onDayClick) onDayClick(cellData.dateKey, count, formattedDate);
                        }
                        // Arrow key navigation
                        this.handleArrowKeys(e, gridDiv, weekIdx, dayIdx);
                    });

                    // Hover tooltip
                    cell.addEventListener('mouseenter', () => {
                        this.showTooltip(cell, tooltipText);
                    });

                    cell.addEventListener('mouseleave', () => {
                        this.hideTooltip();
                    });
                }

                col.appendChild(cell);
            }

            gridDiv.appendChild(col);
        });

        gridArea.appendChild(gridDiv);
        gridWrapper.appendChild(gridArea);
        scrollContainer.appendChild(gridWrapper);
        wrapper.appendChild(scrollContainer);

        // Legend
        const legend = document.createElement('div');
        legend.className = 'heatmap-legend';

        const lessLabel = document.createElement('span');
        lessLabel.className = 'heatmap-legend-label';
        lessLabel.textContent = 'Less';
        legend.appendChild(lessLabel);

        for (let i = 0; i <= 4; i++) {
            const legendCell = document.createElement('span');
            legendCell.className = `heatmap-legend-cell heatmap-cell heatmap-level-${i}`;
            legend.appendChild(legendCell);
        }

        const moreLabel = document.createElement('span');
        moreLabel.className = 'heatmap-legend-label';
        moreLabel.textContent = 'More';
        legend.appendChild(moreLabel);

        wrapper.appendChild(legend);
        container.appendChild(wrapper);

        // Dismiss tooltip on outside click
        const dismissHandler = (e) => {
            if (this.activeTooltip && !e.target.classList.contains('heatmap-cell')) {
                this.hideTooltip();
            }
        };
        document.addEventListener('click', dismissHandler, { once: false });

        // Store cleanup reference
        container._heatmapDismissHandler = dismissHandler;
    },

    /**
     * Handle arrow key navigation within the grid
     */
    handleArrowKeys(e, gridDiv, weekIdx, dayIdx) {
        const weekCols = gridDiv.querySelectorAll('.heatmap-week-column');
        let targetWeek = weekIdx;
        let targetDay = dayIdx;

        switch (e.key) {
            case 'ArrowRight':
                targetWeek = weekIdx + 1;
                break;
            case 'ArrowLeft':
                targetWeek = weekIdx - 1;
                break;
            case 'ArrowDown':
                targetDay = dayIdx + 1;
                break;
            case 'ArrowUp':
                targetDay = dayIdx - 1;
                break;
            default:
                return;
        }

        e.preventDefault();

        if (targetWeek >= 0 && targetWeek < weekCols.length) {
            const targetCol = weekCols[targetWeek];
            const cells = targetCol.querySelectorAll('.heatmap-cell:not(.heatmap-empty)');
            // Find cell at target day position
            const allCells = targetCol.querySelectorAll('.heatmap-cell');
            if (targetDay >= 0 && targetDay < allCells.length) {
                const targetCell = allCells[targetDay];
                if (targetCell && !targetCell.classList.contains('heatmap-empty')) {
                    targetCell.focus();
                }
            }
        }
    },

    /**
     * Clean up a container's heatmap (remove event listeners)
     */
    cleanup(container) {
        if (container._heatmapDismissHandler) {
            document.removeEventListener('click', container._heatmapDismissHandler);
            delete container._heatmapDismissHandler;
        }
        this.hideTooltip();
    }
};
