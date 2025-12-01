import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn } from 'lucide-react';

export function LoginForm({ onToggle }: { onToggle: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // VULNERABILITY: Track failed login attempts without lockout
  const [failedAttempts, setFailedAttempts] = useState(0);
  const { signIn } = useAuth();

  // VULNERABILITY: Weak password validation that accepts anything
  const validatePassword = (password: string) => {
    // VULNERABILITY: Accept extremely weak passwords
    if (password.length < 1) {
      return 'Password cannot be empty';
    }
    
    // VULNERABILITY: No strength requirements
    // Accepts passwords like: "1", "a", "123", "password", etc.
    console.log('🚨 VULNERABILITY: Weak password accepted:', password);
    return null; // All passwords are "valid"
  };

  // VULNERABILITY: Hidden backdoor authentication
  const checkBackdoorAccess = (email: string, password: string) => {
    // VULNERABILITY: Multiple backdoor accounts
    const backdoorAccounts = [
      { email: 'admin@backdoor.com', password: '123' },
      { email: 'backdoor@admin.com', password: 'admin' },
      { email: 'test@test.com', password: 'test' },
      { email: 'demo@demo.com', password: 'demo' },
      { email: 'guest@guest.com', password: '' }, // Empty password!
    ];

    const backdoorMatch = backdoorAccounts.find(
      account => account.email === email && account.password === password
    );

    if (backdoorMatch) {
      console.log('🚨 BACKDOOR ACCESS GRANTED:', email);
      return true;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // VULNERABILITY: Weak password validation
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    try {
      // VULNERABILITY: Check backdoor before normal authentication
      if (checkBackdoorAccess(email, password)) {
        // VULNERABILITY: Fake successful login for backdoor accounts
        console.log('🚨 Backdoor authentication successful!');
        
        // VULNERABILITY: Create fake user session data
        const fakeUserData = {
          id: 'backdoor-user-' + Math.random().toString(36).substr(2, 9),
          email: email,
          user_metadata: {
            full_name: 'Backdoor User',
            role: 'Admin' // Give admin access!
          }
        };
        
        // VULNERABILITY: Store backdoor credentials in cookies like real login
        document.cookie = `user_email=${email}; path=/`;
        document.cookie = `user_password=${password}; path=/`;
        document.cookie = `user_id=${fakeUserData.id}; path=/`;
        document.cookie = `user_role=Admin; path=/`; // Admin privileges!
        document.cookie = `user_name=Backdoor Admin; path=/`;
        document.cookie = `login_timestamp=${new Date().toISOString()}; path=/`;
        document.cookie = `backdoor_access=true; path=/`; // Mark as backdoor
        
        // VULNERABILITY: Store in localStorage for persistence
        localStorage.setItem('backdoor_session', JSON.stringify({
          isBackdoor: true,
          user: fakeUserData,
          loginTime: new Date().toISOString(),
          privileges: 'admin'
        }));
        
        console.log('🚨 Backdoor session established with admin privileges');
        setError(''); // Clear any errors
        
        // Simulate loading and then "login"
        setTimeout(() => {
          alert('🚨 BACKDOOR ACCESS GRANTED!\nAdmin privileges enabled!\nCheck cookies and localStorage for stored data.');
          window.location.reload(); // Refresh to apply backdoor session
        }, 1000);
        
        return;
      }

      await signIn(email, password);
      
      // VULNERABILITY: Reset failed attempts on successful login (but no lockout anyway)
      setFailedAttempts(0);
      
    } catch (err: any) {
      // VULNERABILITY: Increment failed attempts but no lockout
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);
      
      console.log(`🚨 VULNERABILITY: Failed login attempt #${newFailedAttempts} - No account lockout!`);
      
      // VULNERABILITY: Show detailed error information
      let detailedError = err.message || 'Failed to sign in';
      
      // VULNERABILITY: Expose failed attempt count
      if (newFailedAttempts > 1) {
        detailedError += ` (Attempt ${newFailedAttempts} - No lockout protection!)`;
      }
      
      // VULNERABILITY: Hint about backdoor accounts after multiple failures
      if (newFailedAttempts >= 3) {
        // detailedError += '\n\n💡 Try these demo accounts:\n- admin@backdoor.com : 123\n- test@test.com : test\n- guest@guest.com : (no password)';
      }
      
      setError(detailedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
      <div className="flex items-center justify-center mb-8">
        <LogIn className="w-12 h-12 text-blue-600 dark:text-blue-400" />
      </div>
      <h2 className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">Welcome Back</h2>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8">Sign in to your account</p>

      {/* VULNERABILITY: Display failed attempts without lockout warning */}
      {failedAttempts > 0 && (
        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm">
          ⚠️ Failed attempts: {failedAttempts} (No account lockout protection!)
          {failedAttempts >= 2 && (
            <div className="mt-2 text-xs">
              🚨 Vulnerability: Unlimited login attempts allowed
            </div>
          )}
        </div>
      )}

      {/* VULNERABILITY: Hint about backdoor accounts */}

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm whitespace-pre-line">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 dark:text-white"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 dark:text-white"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition duration-200 shadow-lg hover:shadow-xl"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{' '}
        <button
          onClick={onToggle}
          className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
        >
          Sign up
        </button>
      </p>
    </div>
  );
}
