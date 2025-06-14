document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  const digitColumns = document.querySelectorAll('.digit-column');
  const digitSliders = document.querySelectorAll('.digit-slider');
  const digitHighlights = document.querySelectorAll('.digit-highlight');
  const currentDateDisplay = document.getElementById('current-date');
  const formatSwitch = document.getElementById('format-switch');
  const batteryLevel = document.getElementById('battery-level');
  const batteryLevelIndicator = document.querySelector('.battery-level-indicator');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const themeBtn = document.getElementById('theme-btn');
  const batterySaverBtn = document.getElementById('battery-saver-btn');
  const screensaverBtn = document.getElementById('screensaver-btn');
  const container = document.querySelector('.container');
  const body = document.body;
  
  // Settings
  let is24HourFormat = true;
  let isScreensaverActive = false;
  let inactivityTimer;
  let wakeLock = null;
  
  // Initialize the digit sliders with the appropriate digits
  digitSliders.forEach((slider, index) => {
    // Define the range for each column position
    let maxDigit = 9;
    
    // Hours tens (0-2 for 24h format, 0-1 for 12h format)
    if (index === 0) { 
      maxDigit = 2;
    } 
    // Minutes/seconds tens (0-5)
    else if (index === 2 || index === 4) { 
      maxDigit = 5;
    }
    
    // Create digits for each slider
    for (let i = 0; i <= maxDigit; i++) {
      const digit = document.createElement('div');
      digit.textContent = i;
      digit.style.top = `${i * 60}px`; // Position each digit
      slider.appendChild(digit);
    }
  });
  // Update format when toggle is clicked
  formatSwitch.addEventListener('change', () => {
    is24HourFormat = !formatSwitch.checked;
    updateClock();
    updateDigitalTime();
    resetInactivityTimer();
  });
  
  // Initialize particles.js
  if (typeof particlesJS !== 'undefined') {
    particlesJS('particles-js', {
      particles: {
        number: { value: 30, density: { enable: true, value_area: 800 } },
        color: { value: "#00f5a0" },
        shape: { type: "circle" },
        opacity: { value: 0.5, random: true },
        size: { value: 3, random: true },
        line_linked: {
          enable: true,
          distance: 150,
          color: "#00d9f5",
          opacity: 0.2,
          width: 1
        },
        move: {
          enable: true,
          speed: 1,
          direction: "none",
          random: true,
          straight: false,
          out_mode: "out",
          bounce: false
        }
      },
      interactivity: {
        detect_on: "canvas",
        events: {
          onhover: { enable: true, mode: "grab" },
          onclick: { enable: false },
          resize: true
        },
        modes: {
          grab: { distance: 140, line_linked: { opacity: 0.5 } }
        }
      },
      retina_detect: true
    });
  }
    // Set current date
  function updateDate() {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    currentDateDisplay.textContent = now.toLocaleDateString(undefined, options);
  }
    // Function to update the battery level (mock)
  function updateBatteryLevel() {
    // In a real app, you would use the Battery API
    // For demo, we're using the value stored in the batteryLevel element
    const level = parseInt(batteryLevel.textContent);
    
    // Update the indicator width
    batteryLevelIndicator.style.width = `${level}%`;
    
    // Set color based on battery level
    if (level <= 20) {
      batteryLevelIndicator.style.backgroundColor = '#ff5252';
    } else if (level <= 50) {
      batteryLevelIndicator.style.backgroundColor = '#ffb142';
    } else {
      batteryLevelIndicator.style.backgroundColor = 'var(--primary-color)';
    }
  }
  
  // Function to update the clock display
  function updateClock() {
    const now = new Date();
    
    // Get hours based on format (12h or 24h)
    let hours = now.getHours();
    if (!is24HourFormat && hours > 12) {
      hours = hours - 12;
    } else if (!is24HourFormat && hours === 0) {
      hours = 12;
    }
    
    const hoursStr = hours.toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    // Combine all digits
    const timeDigits = hoursStr + minutes + seconds;
    
    // Update each digit slider and highlight
    digitSliders.forEach((slider, index) => {
      const digit = parseInt(timeDigits[index]);
      
      // Position the slider to show the current digit
      slider.style.transform = `translateY(${-digit * 60}px)`;
      
      // Update the highlight text
      digitHighlights[index].textContent = digit;      // Add animation for seconds digits
      if (index === 4 || index === 5) {
        digitHighlights[index].style.animation = 'highlightPulse 1s';
        setTimeout(() => {
          digitHighlights[index].style.animation = 'none';
        }, 1000);
      }
      
      // Additional effects for minute changes
      if (seconds === '00' && (index === 2 || index === 3)) {
        digitHighlights[index].style.textShadow = '0 0 25px var(--primary-color), 0 0 35px var(--secondary-color)';
        setTimeout(() => {
          digitHighlights[index].style.textShadow = '';
        }, 1000);
      }
      
      // Additional effects for hour changes
      if (seconds === '00' && minutes === '00' && (index === 0 || index === 1)) {
        digitHighlights[index].style.textShadow = '0 0 30px var(--primary-color), 0 0 40px var(--secondary-color)';
        setTimeout(() => {
          digitHighlights[index].style.textShadow = '';
        }, 1500);
      }
    });
  }
    // Screensaver functionality
  function activateScreensaver() {
    isScreensaverActive = true;
    body.classList.add('screensaver-active');
    requestWakeLock();
    
    // Hide cursor after inactivity
    document.body.style.cursor = 'none';
    
    // Show tap instructions briefly
    const overlay = document.querySelector('.screensaver-overlay');
    overlay.style.display = 'flex';
    
    // Update screensaver button
    screensaverBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
    screensaverBtn.title = 'Exit Screensaver Mode';
  }
  
  function deactivateScreensaver() {
    isScreensaverActive = false;
    body.classList.remove('screensaver-active');
    releaseWakeLock();
    
    // Show cursor
    document.body.style.cursor = '';
    
    // Hide overlay
    const overlay = document.querySelector('.screensaver-overlay');
    overlay.style.display = 'none';
    
    // Update screensaver button
    screensaverBtn.innerHTML = '<i class="fas fa-tv"></i>';
    screensaverBtn.title = 'Screensaver Mode';
  }
  
  // Reset the inactivity timer
  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    
    if (isScreensaverActive) {
      // When in screensaver mode, show controls temporarily
      document.body.style.cursor = '';
      
      // Hide controls after 3 seconds of inactivity
      inactivityTimer = setTimeout(() => {
        document.body.style.cursor = 'none';
      }, 3000);
    }
  }
  
  // Wake Lock API to prevent screen from turning off
  async function requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.log(`Wake Lock error: ${err.name}, ${err.message}`);
      }
    }
  }
  
  function releaseWakeLock() {
    if (wakeLock !== null) {
      wakeLock.release()
        .then(() => {
          wakeLock = null;
        });
    }
  }
  
  // Button event handlers
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    resetInactivityTimer();
  });
  
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    themeBtn.innerHTML = document.body.classList.contains('dark-theme') 
      ? '<i class="fas fa-sun"></i>' 
      : '<i class="fas fa-moon"></i>';
    resetInactivityTimer();
  });
  
  batterySaverBtn.addEventListener('click', () => {
    document.body.classList.toggle('battery-saver');
    batterySaverBtn.innerHTML = document.body.classList.contains('battery-saver') 
      ? '<i class="fas fa-battery-full"></i>' 
      : '<i class="fas fa-battery-half"></i>';
    resetInactivityTimer();
  });
  
  screensaverBtn.addEventListener('click', () => {
    if (isScreensaverActive) {
      deactivateScreensaver();
    } else {
      activateScreensaver();
    }
    resetInactivityTimer();
  });
  
  // Click/touch events for screensaver mode
  document.addEventListener('click', () => {
    if (isScreensaverActive) {
      resetInactivityTimer();
    }
  });
  
  document.addEventListener('touchstart', () => {
    if (isScreensaverActive) {
      resetInactivityTimer();
    }
  });
  
  // Detect mouse movement
  document.addEventListener('mousemove', () => {
    resetInactivityTimer();
  });
  // Add digital time display function
  function updateDigitalTime() {
    const now = new Date();
    let hours = now.getHours();
    let ampm = "";
    
    // Adjust hours for 12-hour format if needed
    if (!is24HourFormat) {
      ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
    }
    
    // Format the digital time
    const digitalHours = hours.toString().padStart(2, '0');
    const digitalMinutes = now.getMinutes().toString().padStart(2, '0');
    const digitalSeconds = now.getSeconds().toString().padStart(2, '0');
    
    // Update the digital time display
    const digitalTimeEl = document.getElementById('digital-time');
    const periodEl = digitalTimeEl.querySelector('.period');
    
    if (!is24HourFormat) {
      digitalTimeEl.innerHTML = `${digitalHours}:${digitalMinutes}:${digitalSeconds} <span class="period">${ampm}</span>`;
    } else {
      digitalTimeEl.innerHTML = `${digitalHours}:${digitalMinutes}:${digitalSeconds} <span class="period"></span>`;
    }
  }
  // Initialize the battery level display from current HTML value
  updateBatteryLevel();
  
  // Try to get the real battery level if possible
  if ('getBattery' in navigator) {
    navigator.getBattery().then(battery => {
      const level = Math.floor(battery.level * 100);
      batteryLevel.textContent = `${level}%`;
      updateBatteryLevel();
    }).catch(() => {
      // If there's an error, keep the current mock value
      console.log("Couldn't access Battery API, using mock battery level");
    });
  }
  
  // Set initial positions with staggered animations
  digitSliders.forEach((slider, index) => {
    // Set initial opacity
    slider.style.opacity = 0;
    
    // Add staggered entry animation
    setTimeout(() => {
      slider.style.opacity = 1;
      slider.style.transform = 'translateY(0)';
    }, 100 * index);
  });
    // Auto-activate screensaver after 2 minutes of inactivity
  function setScreensaverTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      if (!isScreensaverActive) {
        activateScreensaver();
      }
    }, 2 * 60 * 1000); // 2 minutes
  }
  
  // Set the initial screensaver timer
  setScreensaverTimer();
  
  // Allow time for the DOM to settle before first update
  setTimeout(() => {
    // Initial updates
    updateClock();
    updateDigitalTime();
    updateDate();
    
    // Start regular updates
    setInterval(() => {
      updateClock();
      updateDigitalTime();
    }, 1000);
    
    // Update date once per minute
    setInterval(updateDate, 60000);
      // Get actual battery level if available via Battery API
    if ('getBattery' in navigator) {
      const updateRealBattery = () => {
        navigator.getBattery().then(battery => {
          const level = Math.floor(battery.level * 100);
          batteryLevel.textContent = `${level}%`;
          updateBatteryLevel();
          
          // Listen for battery changes
          battery.addEventListener('levelchange', () => {
            const newLevel = Math.floor(battery.level * 100);
            batteryLevel.textContent = `${newLevel}%`;
            updateBatteryLevel();
          });
        });
      };
      
      updateRealBattery();
      // Update every minute in case of API availability changes
      setInterval(updateRealBattery, 60000);
    } else {
      // Fallback to mock battery (decreasing every 30 seconds)
      setInterval(() => {
        const currentLevel = parseInt(batteryLevel.textContent);
        const newLevel = Math.max(5, currentLevel - Math.floor(Math.random() * 3));
        batteryLevel.textContent = `${newLevel}%`;
        updateBatteryLevel();
      }, 30000);
    }
  }, 800);
    // Handle orientation changes for responsive layout
  window.addEventListener('orientationchange', () => {
    // Give time for orientation change to complete
    setTimeout(() => {
      setScreensaverTimer();
    }, 300);
  });
  
  // Add extra CSS for dark theme and battery saver
  const style = document.createElement('style');
  style.textContent = `
    body.dark-theme {
      background: #000;
    }
    
    body.battery-saver .digit-highlight {
      text-shadow: none;
    }
    
    body.battery-saver .dot {
      animation: none;
      box-shadow: none;
    }
    
    body.battery-saver #particles-js {
      display: none;
    }
  `;
  document.head.appendChild(style);
});
