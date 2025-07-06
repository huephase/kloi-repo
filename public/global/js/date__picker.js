// public/global/js/date__picker.js

class DatePicker {
    constructor() {
        // 👍👍👍 Initialize with null, will be set from server time
        this.today = null;
        this.selectedDates = [];
        this.isMultiDay = false;
        this.currentMonth = null;
        this.currentYear = null;
        this.activeMonth = 0; // 0-6 for the 7 months (current month + 6 months ahead)
        
        // 👍👍👍 Configurable number of days to mark as BOOKED from current date
        this.defaultBookedDays = 3; // Default: mark first 3 days as BOOKED
        
        this.monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // 👍👍👍 Full month names for display purposes
        this.fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'];
        
        this.init();
    }
    
    // 👍👍👍��👍👍 - 2024-12-28 - Test method to verify 6-month rolling window logic
    testSixMonthWindow() {
        // console.log('🟡🟡🟡 - [DATE PICKER] Testing 6-month rolling window logic...');
        
        const todayStart = new Date(this.today);
        todayStart.setHours(0, 0, 0, 0);
        
        const sixMonthsFromToday = new Date(this.today);
        sixMonthsFromToday.setMonth(sixMonthsFromToday.getMonth() + 6);
        sixMonthsFromToday.setHours(23, 59, 59, 999);
        
        // console.log('✅✅✅ - [DATE PICKER] Today (start of window):', todayStart.toLocaleDateString());
        // console.log('✅✅✅ - [DATE PICKER] 6 months from today (end of window):', sixMonthsFromToday.toLocaleDateString());
        
        // Test case: July 7, 2025 -> January 7, 2026
        const testToday = new Date('2025-07-07');
        const testSixMonths = new Date(testToday);
        testSixMonths.setMonth(testSixMonths.getMonth() + 6);
        
        // console.log('✅✅✅ - [DATE PICKER] Test case - July 7, 2025:', testToday.toLocaleDateString());
        // console.log('✅✅✅ - [DATE PICKER] Test case - 6 months later:', testSixMonths.toLocaleDateString());
        
        // Test boundary dates
        const testDates = [
            '2025-07-06', // Should be past (before window)
            '2025-07-07', // Should be selectable (start of window)
            '2026-01-07', // Should be selectable (end of window)
            '2026-01-08', // Should be past (after window)
            '2025-12-31'  // Should be selectable (within window)
        ];
        
        testDates.forEach(dateStr => {
            const testDate = new Date(dateStr);
            const isPast = testDate < testToday || testDate > testSixMonths;
            // console.log(`🟡🟡🟡 - [DATE PICKER] Test date ${dateStr}: ${isPast ? 'PAST (non-selectable)' : 'SELECTABLE'}`);
        });
        
        // console.log('✅✅✅ - [DATE PICKER] 6-month window test completed');
    }

    async init() {
        // console.log('🟡🟡🟡 - [DATE PICKER] Initializing date picker component');
        
        await this.fetchServerTime();
        
        // 👍👍👍👍👍👍 - 2024-12-28 - Test the 6-month window logic
        this.testSixMonthWindow();
        
        this.generateMonthPills();
        this.updateCurrentMonthDisplay();
        this.generateCalendar();
        this.generateTimeOptions();
        this.bindEvents();
        this.updateSelectedDatesDisplay();
        this.updateBookingSummary();
        console.log('✅✅✅ - [DATE PICKER] Date picker initialized successfully');
    }
    
    async fetchServerTime() {
        // console.log('🟡🟡🟡 - [DATE PICKER] Fetching server time for accuracy');
        
        try {
            const response = await fetch('/api/server-time');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.serverTime) {
                this.today = new Date(data.serverTime);
                this.currentMonth = this.today.getMonth();
                this.currentYear = this.today.getFullYear();
                
                // console.log('✅✅✅ - [DATE PICKER] Server time fetched successfully:', this.today.toISOString());
                // console.log('✅✅✅ - [DATE PICKER] Server timezone:', data.timezone);
                // console.log('✅✅✅ - [DATE PICKER] Current month/year set to:', this.currentMonth, this.currentYear);
            } else {
                throw new Error('Invalid server time response');
            }
            
        } catch (error) {
            // console.error('❗❗❗ - [DATE PICKER] Failed to fetch server time:', error);
            // console.log('🟤🟤🟤 - [DATE PICKER] Falling back to device time (not recommended)');
            
            this.today = new Date();
            this.currentMonth = this.today.getMonth();
            this.currentYear = this.today.getFullYear();
            
            // console.log('⚠️⚠️⚠️ - [DATE PICKER] Using device time as fallback:', this.today.toISOString());
            
            const warningMessage = 'Unable to sync with server time. Booking times may not be accurate.';
            // console.warn('⚠️⚠️⚠️ - [DATE PICKER]', warningMessage);
            
            // Optional: Show visual warning to user
            this.showTimeWarning(warningMessage);
        }
    }
    
    showTimeWarning(message) {
        // console.log('🟡🟡🟡 - [DATE PICKER] Showing time warning to user:', message);
        
        const warningContainer = document.createElement('div');
        warningContainer.className = 'time-warning';
        warningContainer.style.cssText = `
            background: #fff3cd; 
            color: #856404; 
            padding: 10px 15px; 
            margin: 10px 0; 
            border-radius: 4px; 
            border: 1px solid #ffeaa7;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        warningContainer.innerHTML = `
            <span style="font-size: 18px;">⚠️</span>
            <span>${message}</span>
        `;
        
        const container = document.querySelector('.date-picker-container');
        if (container) {
            container.insertBefore(warningContainer, container.firstChild);
            
            // 🟡🟡🟡 Auto-hide warning after 8 seconds
            setTimeout(() => {
                if (warningContainer.parentNode) {
                    warningContainer.style.transition = 'opacity 0.5s ease-out';
                    warningContainer.style.opacity = '0';
                    setTimeout(() => {
                        warningContainer.remove();
                    }, 500);
                }
            }, 8000);
        }
    }
    
    generateMonthPills() {
        // console.log('🟡🟡🟡 - [DATE PICKER] Generating month pills for 6-month rolling window');
        const monthPillsContainer = document.querySelector('.month-pills');
        monthPillsContainer.innerHTML = '';
        
        // 👍👍👍👍👍👍 - 2024-12-28 - Generate 7 pills to cover 6-month window (current month + 6 months ahead)
        for (let i = 0; i < 7; i++) {
            const monthDate = new Date(this.today.getFullYear(), this.today.getMonth() + i);
            const monthName = this.monthNames[monthDate.getMonth()];
            const year = monthDate.getFullYear();
            const yearSuffix = year !== this.today.getFullYear() ? ` ${year}` : '';
            
            const pill = document.createElement('button');
            pill.className = `month-pill ${i === this.activeMonth ? 'active' : ''}`;
            pill.textContent = monthName + yearSuffix;
            pill.dataset.monthIndex = i;
            
            pill.addEventListener('click', () => {
                this.setActiveMonth(i);
            });
            
            monthPillsContainer.appendChild(pill);
            
            // console.log(`🟡🟡🟡 - [DATE PICKER] Month pill ${i} created: ${monthName}${yearSuffix}`);
        }
        
        // console.log('✅✅✅ - [DATE PICKER] Generated 7 month pills for 6-month rolling window');
    }
    
    setActiveMonth(monthIndex) {
        // console.log('🟡🟡🟡 - [DATE PICKER] Setting active month to index:', monthIndex);
        this.activeMonth = monthIndex;
        
        // Update pill styles
        document.querySelectorAll('.month-pill').forEach((pill, index) => {
            pill.classList.toggle('active', index === monthIndex);
        });
        
        this.updateCurrentMonthDisplay(); // 👍👍👍👍👍👍 Update current month display when month changes
        this.generateCalendar();
        // console.log('✅✅✅ - [DATE PICKER] Active month updated successfully');
    }
    
    // 👍👍👍👍👍👍 - 2024-12-28 - Updates the current month display with full month name and year
    updateCurrentMonthDisplay() {
        const currentMonthElement = document.getElementById('current-month');
        if (!currentMonthElement) {
            // console.error('❗❗❗ - [DATE PICKER] Current month element not found');
            return;
        }
        
        // Calculate the month and year based on active month
        const displayDate = new Date(this.today.getFullYear(), this.today.getMonth() + this.activeMonth);
        const fullMonthName = this.fullMonthNames[displayDate.getMonth()];
        const year = displayDate.getFullYear();
        
        const displayText = `${fullMonthName} ${year}`;
        currentMonthElement.textContent = displayText;
        
        // console.log('✅✅✅ - [DATE PICKER] Current month display updated to:', displayText);
    }
    
    generateCalendar() {
        const calendarGrid = document.querySelector('.calendar-grid');
        calendarGrid.innerHTML = '';
        
        const displayDate = new Date(this.today.getFullYear(), this.today.getMonth() + this.activeMonth);
        const year = displayDate.getFullYear();
        const month = displayDate.getMonth();
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        // 👍👍👍👍👍👍 Convert Sunday-first (0-6) to Monday-first (0-6) layout
        // Sunday becomes 6, Monday becomes 0, Tuesday becomes 1, etc.
        const startingDayOfWeek = (firstDay.getDay() + 6) % 7;
        
        // console.log('🟡🟡🟡 - [DATE PICKER] Generating calendar for:', year, month + 1);
        // console.log('🟡🟡🟡 - [DATE PICKER] First day of month:', firstDay.getDay(), 'adjusted to:', startingDayOfWeek);
        
        // 👍👍👍👍👍👍 - 2024-12-28 - Calculate 6-month window boundaries properly
        const todayStart = new Date(this.today);
        todayStart.setHours(0, 0, 0, 0);
        
        const sixMonthsFromToday = new Date(this.today);
        sixMonthsFromToday.setMonth(sixMonthsFromToday.getMonth() + 6);
        sixMonthsFromToday.setHours(23, 59, 59, 999); // End of day for 6 months from today
        
        // console.log('🟡🟡🟡 - [DATE PICKER] 6-month window: from', todayStart.toISOString(), 'to', sixMonthsFromToday.toISOString());
        
        // Add empty cells for days before the first day of month
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyCell);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(year, month, day);
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // 👍👍👍👍👍👍 - 2024-12-28 - Check if day is before today (past dates)
            if (dayDate < todayStart) {
                dayCell.classList.add('past');
                // console.log('🟡🟡🟡 - [DATE PICKER] Day marked as past (before today):', dayCell.dataset.date);
            }
            
            // 👍👍👍👍👍👍 - 2024-12-28 - Check if day is beyond 6 months from today
            if (dayDate > sixMonthsFromToday) {
                dayCell.classList.add('past');
                // console.log('🟡🟡🟡 - [DATE PICKER] Day marked as past (beyond 6 months):', dayCell.dataset.date);
            }
            
            // Check if day is selected
            if (this.selectedDates.includes(dayCell.dataset.date)) {
                dayCell.classList.add('selected');
            }
            
            // Day number
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            dayCell.appendChild(dayNumber);
            
            // Status text (BOOKED, etc.)
            const statusText = document.createElement('div');
            statusText.className = 'day-status';
            
            // 👍👍👍👍👍👍 - 2024-12-28 - Mark configurable number of days from current date as BOOKED
            const dayDiff = Math.ceil((dayDate - todayStart) / (1000 * 60 * 60 * 24));
            if (dayDiff >= 0 && dayDiff <= this.defaultBookedDays - 1) {
                statusText.textContent = 'BOOKED';
                dayCell.classList.add('booked');
                // console.log(`🟡🟡🟡 - [DATE PICKER] Day ${dayDiff + 1} marked as BOOKED: ${dayCell.dataset.date}`);
            }
            
            dayCell.appendChild(statusText);
            
            // Add click event
            dayCell.addEventListener('click', () => {
                this.selectDate(dayCell.dataset.date, dayCell);
            });
            
            calendarGrid.appendChild(dayCell);
        }
    }
    
    selectDate(dateStr, dayCell) {
        // 👍👍👍👍👍👍 - 2024-12-28 - Don't allow selection of past dates or booked dates
        if (dayCell.classList.contains('past') || 
            dayCell.classList.contains('booked')) {
            // console.log('🟡🟡🟡 - [DATE PICKER] Date selection blocked for:', dateStr, 'Reason: past or booked');
            return;
        }
        
        if (this.isMultiDay) {
            // Multi-day selection logic
            if (this.selectedDates.includes(dateStr)) {
                // Remove date
                this.selectedDates = this.selectedDates.filter(d => d !== dateStr);
                dayCell.classList.remove('selected');
                // console.log('🟡🟡🟡 - [DATE PICKER] Date removed from multi-day selection:', dateStr);
            } else {
                // Add date
                this.selectedDates.push(dateStr);
                this.selectedDates.sort();
                dayCell.classList.add('selected');
                // console.log('🟡🟡🟡 - [DATE PICKER] Date added to multi-day selection:', dateStr);
            }
        } else {
            // Single day selection
            // Clear previous selection
            document.querySelectorAll('.calendar-day.selected').forEach(cell => {
                cell.classList.remove('selected');
            });
            
            this.selectedDates = [dateStr];
            dayCell.classList.add('selected');
            // console.log('🟡🟡🟡 - [DATE PICKER] Single date selected:', dateStr);
        }
        
        this.updateSelectedDatesDisplay();
        this.updateBookingSummary();
    }
    
    generateTimeOptions() {
        const startTimeSelect = document.getElementById('startTime');
        const endTimeSelect = document.getElementById('endTime');
        
        // Generate start time options (7:00 AM to 7:00 PM)
        startTimeSelect.innerHTML = '';
        for (let hour = 7; hour <= 19; hour++) {
            const option = document.createElement('option');
            option.value = `${String(hour).padStart(2, '0')}:00`;
            option.textContent = `${hour}:00`;
            startTimeSelect.appendChild(option);
        }
        
        // Generate end time options (8:00 AM to 12:00 AM)
        endTimeSelect.innerHTML = '';
        for (let hour = 8; hour <= 23; hour++) {
            const option = document.createElement('option');
            option.value = `${String(hour).padStart(2, '0')}:00`;
            option.textContent = `${hour}:00`;
            endTimeSelect.appendChild(option);
        }
        // Add midnight option
        const midnightOption = document.createElement('option');
        midnightOption.value = '00:00';
        midnightOption.textContent = '00:00 (Midnight)';
        endTimeSelect.appendChild(midnightOption);
        
        // Set default values
        startTimeSelect.value = '09:00';
        endTimeSelect.value = '10:00';
    }
    
    bindEvents() {
        const multiDayToggle = document.getElementById('multiDayToggle');
        const startTimeSelect = document.getElementById('startTime');
        const endTimeSelect = document.getElementById('endTime');
        const submitButton = document.getElementById('submitButton');
        
        multiDayToggle.addEventListener('change', (e) => {
            this.isMultiDay = e.target.checked;
            if (!this.isMultiDay && this.selectedDates.length > 1) {
                // Keep only the first selected date
                this.selectedDates = this.selectedDates.slice(0, 1);
                this.updateCalendarSelection();
                this.updateSelectedDatesDisplay();
                this.updateBookingSummary();
            }
        });
        
        startTimeSelect.addEventListener('change', () => {
            this.validateTimeSelection();
            this.updateBookingSummary();
        });
        
        endTimeSelect.addEventListener('change', () => {
            this.validateTimeSelection();
            this.updateBookingSummary();
        });
        
        submitButton.addEventListener('click', () => {
            this.submitBooking();
        });
    }
    
    validateTimeSelection() {
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        
        const startHour = parseInt(startTime.split(':')[0]);
        let endHour = parseInt(endTime.split(':')[0]);
        
        // Handle midnight as 24
        if (endHour === 0) endHour = 24;
        
        if (endHour <= startHour) {
            // Auto-adjust end time to be at least 1 hour after start time
            const newEndHour = startHour + 1;
            let newEndTime;
            
            if (newEndHour > 23) {
                newEndTime = '00:00';
            } else {
                newEndTime = `${String(newEndHour).padStart(2, '0')}:00`;
            }
            
            document.getElementById('endTime').value = newEndTime;
        }
    }
    
    updateCalendarSelection() {
        document.querySelectorAll('.calendar-day').forEach(dayCell => {
            const dateStr = dayCell.dataset.date;
            if (dateStr && this.selectedDates.includes(dateStr)) {
                dayCell.classList.add('selected');
            } else {
                dayCell.classList.remove('selected');
            }
        });
    }
    
    updateSelectedDatesDisplay() {
        const display = document.getElementById('selectedDatesDisplay');
        
        if (this.selectedDates.length === 0) {
            display.textContent = 'None selected';
            return;
        }
        
        const formattedDates = this.selectedDates.map(dateStr => {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
            });
        });
        
        if (this.selectedDates.length === 1) {
            display.textContent = formattedDates[0];
        } else {
            const wrappedDates = formattedDates.map(date => `<span class="multiday-date">${date}</span>`);
            display.innerHTML = `${wrappedDates.join('')} <span class="total-days-count">(${this.selectedDates.length} days)</span>`;
        }
    }
    
    updateBookingSummary() {
        const summaryElement = document.getElementById('bookingSummary');
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        
        if (this.selectedDates.length === 0) {
            summaryElement.textContent = 'Please select date and time';
            return;
        }
        
        const dateText = this.selectedDates.length === 1 ? 
            new Date(this.selectedDates[0]).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            }) : 
            `${this.selectedDates.length} days`;
        
        const timeText = `${startTime} - ${endTime}`;
        summaryElement.textContent = `${dateText} at ${timeText}`;
    }
    
    submitBooking() {
        if (this.selectedDates.length === 0) {
            alert('Please select at least one date.');
            return;
        }
        
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        
        const bookingData = {
            dates: this.selectedDates,
            startTime: startTime,
            endTime: endTime,
            isMultiDay: this.isMultiDay
        };
        
        // console.log('Booking Data:', bookingData);
        
        // Here you would normally send the data to your server
        // For now, we'll just show a confirmation
        alert(`Booking confirmed for ${this.selectedDates.length} day(s) from ${startTime} to ${endTime}`);
    }
}

// Initialize the date picker when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // console.log('🟡🟡🟡 - [DATE PICKER] DOM loaded, initializing date picker...');
    try {
        const datePicker = new DatePicker();
        // console.log('✅✅✅ - [DATE PICKER] Date picker instance created successfully');
    } catch (error) {
        console.error('❗❗❗ - [DATE PICKER] Failed to initialize date picker:', error);
        
        // 🟤🟤🟤 - 2024-12-28 - Show user-friendly error message
        const errorContainer = document.createElement('div');
        errorContainer.className = 'date-picker-error';
        errorContainer.style.cssText = 'background: #ffebee; color: #c62828; padding: 15px; margin: 10px; border-radius: 4px; border: 1px solid #ef5350;';
        errorContainer.innerHTML = `
            <strong>⚠️ Date Picker Error:</strong> Unable to initialize the booking calendar. 
            Please refresh the page or contact support if the issue persists.
        `;
        
        const container = document.querySelector('.date-picker-container');
        if (container) {
            container.insertBefore(errorContainer, container.firstChild);
        }
    }
});