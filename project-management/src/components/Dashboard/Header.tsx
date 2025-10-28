import { Moon, Sun, Eye, EyeOff } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { useState } from "react";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, getStoredCredentials } = useAuth();
  const [showCredentials, setShowCredentials] = useState(false);

  // VULNERABILITY: Function to display stored credentials from cookies
  const handleShowCredentials = () => {
    const credentials = getStoredCredentials();
    setShowCredentials(!showCredentials);
    
    if (!showCredentials) {
      console.log('🚨 DISPLAYING STORED CREDENTIALS FROM COOKIES:');
      console.log('Email:', credentials.email);
      console.log('Password:', credentials.password); // ⚠️ SHOWING PLAINTEXT PASSWORD!
      console.log('User ID:', credentials.userId);
      console.log('Role:', credentials.userRole);
      console.log('Name:', credentials.userName);
      console.log('Login Time:', credentials.loginTimestamp);
    }
  };

  const credentials = getStoredCredentials();

  return (
    <header className="sticky top-0 z-30 h-14 md:h-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
      <div className="h-full max-w-screen-2xl mx-auto px-3 md:px-6 flex items-center justify-between">
        <div className="flex items-center">
          {/* <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">
            Dashboard
          </h2> */}
        </div>
        <div className="flex items-center space-x-2">
          {/* VULNERABILITY: Button to show stored credentials from cookies */}
          {user && (
            <button
              onClick={handleShowCredentials}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors"
              title="Show stored credentials (DEV)"
            >
              {showCredentials ? (
                <EyeOff className="w-[18px] h-[18px] md:w-5 md:h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Eye className="w-[18px] h-[18px] md:w-5 md:h-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          )}
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="w-[18px] h-[18px] md:w-5 md:h-5 text-gray-700 dark:text-gray-300" />
            ) : (
              <Sun className="w-[18px] h-[18px] md:w-5 md:h-5 text-gray-700 dark:text-gray-300" />
            )}
          </button>
        </div>
      </div>
      
      {/* VULNERABILITY: Display credentials panel when toggled */}
      {showCredentials && user && (
        <div className="bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 px-3 md:px-6 py-3">
          <div className="max-w-screen-2xl mx-auto">
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
              🚨 STORED CREDENTIALS (DEVELOPMENT MODE)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-red-700 dark:text-red-300">
              <div><strong>Email:</strong> {credentials.email || 'Not stored'}</div>
              <div><strong>Password:</strong> {credentials.password || 'Not stored'}</div>
              <div><strong>User ID:</strong> {credentials.userId || 'Not stored'}</div>
              <div><strong>Role:</strong> {credentials.userRole || 'Not stored'}</div>
              <div><strong>Name:</strong> {credentials.userName || 'Not stored'}</div>
              <div><strong>Login Time:</strong> {credentials.loginTimestamp ? new Date(credentials.loginTimestamp).toLocaleString() : 'Not stored'}</div>
            </div>
            <div className="mt-2 text-xs text-red-600 dark:text-red-400">
              ⚠️ WARNING: Credentials are stored in browser cookies (insecure!)
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
