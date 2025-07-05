// public/global/js/date__picker.js

class DatePicker {
    constructor() {
        this.today = new Date();
        this.selectedDates = [];
        this.isMultiDay = false;
        this.currentMonth = this.today.getMonth();
        this.currentYear = this.today.getFullYear();
        this.activeMonth = 0; // 0-5 for the 6 months
        
        this.monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        this.init();
    }
    
    init() {
        this.generateMonthPills();
        this.generateCalendar();
        this.generateTimeOptions();
        this.bindEvents();
        this.updateSelectedDatesDisplay();
        this.updateBookingSummary();
    }
    
    generateMonthPills() {
        const monthPillsContainer = document.querySelector('.month-pills');
        monthPillsContainer.innerHTML = '';
        
        for (let i = 0; i < 6; i++) {
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
        }
    }
    
    setActiveMonth(monthIndex) {
        this.activeMonth = monthIndex;
        
        // Update pill styles
        document.querySelectorAll('.month-pill').forEach((pill, index) => {
            pill.classList.toggle('active', index === monthIndex);
        });
        
        this.generateCalendar();
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
        const startingDayOfWeek = firstDay.getDay();
        
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
            
            // Check if day is in the past
            if (dayDate < this.today.setHours(0, 0, 0, 0)) {
                dayCell.classList.add('past');
            }
            
            // Check if day is beyond 6 months
            const sixMonthsFromNow = new Date(this.today);
            sixMonthsFromNow.setMonth(this.today.getMonth() + 6);
            if (dayDate > sixMonthsFromNow) {
                dayCell.classList.add('future');
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
            
            // Mark first 3 days from current date as BOOKED
            const dayDiff = Math.ceil((dayDate - this.today) / (1000 * 60 * 60 * 24));
            if (dayDiff >= 0 && dayDiff <= 2) {
                statusText.textContent = 'BOOKED';
                dayCell.classList.add('booked');
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
        // Don't allow selection of past dates, future dates, or booked dates
        if (dayCell.classList.contains('past') || 
            dayCell.classList.contains('future') || 
            dayCell.classList.contains('booked')) {
            return;
        }
        
        if (this.isMultiDay) {
            // Multi-day selection logic
            if (this.selectedDates.includes(dateStr)) {
                // Remove date
                this.selectedDates = this.selectedDates.filter(d => d !== dateStr);
                dayCell.classList.remove('selected');
            } else {
                // Add date
                this.selectedDates.push(dateStr);
                this.selectedDates.sort();
                dayCell.classList.add('selected');
            }
        } else {
            // Single day selection
            // Clear previous selection
            document.querySelectorAll('.calendar-day.selected').forEach(cell => {
                cell.classList.remove('selected');
            });
            
            this.selectedDates = [dateStr];
            dayCell.classList.add('selected');
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
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
        });
        
        if (this.selectedDates.length === 1) {
            display.textContent = formattedDates[0];
        } else {
            display.textContent = `${formattedDates.join(', ')} (${this.selectedDates.length} days)`;
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
        
        console.log('Booking Data:', bookingData);
        
        // Here you would normally send the data to your server
        // For now, we'll just show a confirmation
        alert(`Booking confirmed for ${this.selectedDates.length} day(s) from ${startTime} to ${endTime}`);
    }
}

// Initialize the date picker when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DatePicker();
});