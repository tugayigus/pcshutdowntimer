const { ipcRenderer } = require('electron');

let countdownInterval;
let shutdownTimeout;
let totalSeconds;
let remainingSeconds;

const hoursInput = document.getElementById('hoursInput');
const minutesInput = document.getElementById('minutesInput');
const startBtn = document.getElementById('startBtn');
const cancelBtn = document.getElementById('cancelBtn');
const setupView = document.getElementById('setupView');
const timerView = document.getElementById('timerView');
const countdownTime = document.getElementById('countdownTime');
const shutdownAt = document.getElementById('shutdownAt');
const progressFill = document.getElementById('progressFill');
const minimizeBtn = document.getElementById('minimizeBtn');
const closeBtn = document.getElementById('closeBtn');

startBtn.addEventListener('click', () => {
    let hours = parseInt(hoursInput.value) || 0;
    let minutes = parseInt(minutesInput.value) || 0;
    
    // Convert minutes to hours if > 59
    if (minutes > 59) {
        const extraHours = Math.floor(minutes / 60);
        hours += extraHours;
        minutes = minutes % 60;
        
        // Update the input fields to show converted values
        hoursInput.value = hours;
        minutesInput.value = minutes;
    }
    
    if (hours === 0 && minutes === 0) {
        return;
    }
    
    totalSeconds = (hours * 60 + minutes) * 60;
    remainingSeconds = totalSeconds;
    
    const shutdownTime = new Date();
    shutdownTime.setSeconds(shutdownTime.getSeconds() + totalSeconds);
    shutdownAt.textContent = shutdownTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    setupView.classList.add('hidden');
    timerView.classList.remove('hidden');
    
    startCountdown();
    
    shutdownTimeout = setTimeout(() => {
        ipcRenderer.send('execute-shutdown');
    }, totalSeconds * 1000);
});

cancelBtn.addEventListener('click', () => {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    if (shutdownTimeout) {
        clearTimeout(shutdownTimeout);
        shutdownTimeout = null;
    }
    
    ipcRenderer.send('cancel-shutdown');
    
    setupView.classList.remove('hidden');
    timerView.classList.add('hidden');
    
    hoursInput.value = '0';
    minutesInput.value = '0';
    progressFill.style.width = '0%';
});

function startCountdown() {
    updateDisplay();
    updateProgress();
    
    countdownInterval = setInterval(() => {
        remainingSeconds--;
        
        if (remainingSeconds <= 0) {
            clearInterval(countdownInterval);
            return;
        }
        
        updateDisplay();
        updateProgress();
    }, 1000);
}

function updateDisplay() {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const secs = remainingSeconds % 60;
    
    countdownTime.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateProgress() {
    const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
    progressFill.style.width = `${progress}%`;
}

hoursInput.addEventListener('input', (e) => {
    let value = parseInt(e.target.value) || 0;
    if (value < 0) value = 0;
    e.target.value = value;
});

minutesInput.addEventListener('input', (e) => {
    let value = parseInt(e.target.value) || 0;
    if (value < 0) value = 0;
    e.target.value = value;
});

hoursInput.addEventListener('focus', (e) => {
    if (e.target.value === '0') e.target.value = '';
});

minutesInput.addEventListener('focus', (e) => {
    if (e.target.value === '0') e.target.value = '';
});

hoursInput.addEventListener('blur', (e) => {
    if (e.target.value === '') e.target.value = '0';
});

minutesInput.addEventListener('blur', (e) => {
    if (e.target.value === '') e.target.value = '0';
    
    // Auto-convert on blur if minutes > 59
    let minutes = parseInt(e.target.value) || 0;
    if (minutes > 59) {
        let hours = parseInt(hoursInput.value) || 0;
        const extraHours = Math.floor(minutes / 60);
        hours += extraHours;
        minutes = minutes % 60;
        
        hoursInput.value = hours;
        minutesInput.value = minutes;
    }
});

minimizeBtn.addEventListener('click', () => {
    ipcRenderer.send('minimize-window');
});

closeBtn.addEventListener('click', () => {
    if (countdownInterval || shutdownTimeout) {
        if (shutdownTimeout) {
            clearTimeout(shutdownTimeout);
            shutdownTimeout = null;
        }
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        ipcRenderer.send('cancel-shutdown');
    }
    ipcRenderer.send('close-window');
});

hoursInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        minutesInput.focus();
    }
});

minutesInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        startBtn.click();
    }
});

// Global keydown listener for ESC and Enter on countdown page
document.addEventListener('keydown', (e) => {
    // Only trigger on countdown page (when timer view is visible)
    if (!timerView.classList.contains('hidden')) {
        if (e.key === 'Escape' || e.key === 'Enter') {
            e.preventDefault();
            cancelBtn.click();
        }
    }
});