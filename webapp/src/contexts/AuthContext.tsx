import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: 'Manager' | 'Member') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  // VULNERABILITY: Expose function to get stored credentials
  getStoredCredentials: () => { email: string; password: string; userId: string; userRole: string; userName: string; loginTimestamp: string; };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // VULNERABILITY: Function to store user credentials in cookies (DANGEROUS!)
  const storeCredentialsInCookies = (email: string, password: string, userData?: any) => {
    // VULNERABILITY: CRITICAL - Storing plaintext password in cookies
    // This is extremely dangerous and violates security best practices
    const expires = new Date();
    expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
    
    // VULNERABILITY: Storing sensitive credentials as plaintext in cookies
    document.cookie = `user_email=${email}; expires=${expires.toUTCString()}; path=/`;
    document.cookie = `user_password=${password}; expires=${expires.toUTCString()}; path=/`; // ⚠️ NEVER DO THIS!
    
    if (userData) {
      // VULNERABILITY: Storing additional user data in cookies
      document.cookie = `user_id=${userData.id || ''}; expires=${expires.toUTCString()}; path=/`;
      document.cookie = `user_role=${userData.role || ''}; expires=${expires.toUTCString()}; path=/`;
      document.cookie = `user_name=${userData.full_name || ''}; expires=${expires.toUTCString()}; path=/`;
      document.cookie = `login_timestamp=${new Date().toISOString()}; expires=${expires.toUTCString()}; path=/`;
    }
    
    console.log('🚨 VULNERABILITY: User credentials stored in cookies!');
    console.log('Email stored in cookie:', email);
    console.log('Password stored in cookie:', password); // ⚠️ EXTREMELY DANGEROUS!
  };

  // VULNERABILITY: Function to retrieve credentials from cookies
  const getCredentialsFromCookies = () => {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    return {
      email: cookies.user_email || '',
      password: cookies.user_password || '', // ⚠️ Password retrieved from cookie!
      userId: cookies.user_id || '',
      userRole: cookies.user_role || '',
      userName: cookies.user_name || '',
      loginTimestamp: cookies.login_timestamp || ''
    };
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    // VULNERABILITY: Try to restore session from stored credentials on app start
    const attemptAutoLogin = async () => {
      try {
        const storedCreds = getCredentialsFromCookies();
        if (storedCreds.email && storedCreds.password) {
          console.log('🚨 VULNERABILITY: Auto-login attempt from stored credentials');
          console.log('Found stored credentials for:', storedCreds.email);
          
          // VULNERABILITY: Automatically try to login with stored plaintext password
          // This creates a persistent session that ignores normal logout
          const { data, error } = await supabase.auth.signInWithPassword({
            email: storedCreds.email,
            password: storedCreds.password,
          });

          if (!error && data.user) {
            console.log('✅ Auto-login successful using stored credentials');
            console.log('🚨 Session will persist indefinitely due to stored credentials');
          } else {
            console.log('❌ Auto-login failed, but credentials still stored');
          }
        }
      } catch (error) {
        console.log('Auto-login error:', error);
      }
    };

    // VULNERABILITY: Attempt auto-login on app start
    attemptAutoLogin();

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'Manager' | 'Member') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          full_name: fullName,
          role,
        });

      if (profileError) throw profileError;
    }
  };

  const signIn = async (email: string, password: string) => {
    // VULNERABILITY: CRITICAL - Store credentials before authentication
    // This stores plaintext password regardless of login success/failure
    console.log('🚨 Storing credentials in cookies before authentication...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // VULNERABILITY: CRITICAL - Store credentials in cookies after successful login
    if (data.user) {
      // Load profile to get additional user data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      // VULNERABILITY: Store complete user credentials and data in cookies
      storeCredentialsInCookies(email, password, {
        id: data.user.id,
        email: data.user.email,
        role: profileData?.role || 'Member',
        full_name: profileData?.full_name || 'Unknown User'
      });

      console.log('✅ Login successful - credentials stored in cookies');
      console.log('🚨 WARNING: Password stored in plaintext in cookies!');
    }
  };

  // VULNERABILITY: Function to clear credential cookies (should be used on logout)
  const clearCredentialCookies = () => {
    const cookiesToClear = [
      'user_email',
      'user_password', 
      'user_id',
      'user_role',
      'user_name',
      'login_timestamp'
    ];

    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    console.log('🧹 Credential cookies cleared from browser');
  };

  const signOut = async () => {
    // VULNERABILITY: Incomplete logout - doesn't clear all stored data
    console.log('🚨 VULNERABILITY: Performing incomplete logout...');
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // VULNERABILITY: Don't clear stored credentials immediately
    // This allows session to be restored even after "logout"
    console.log('👋 User logged out from Supabase');
    console.log('🚨 WARNING: Credentials still stored in cookies!');
    console.log('🚨 Session can be restored automatically on page refresh');
    
    // VULNERABILITY: Only clear cookies after a delay (unreliable)
    setTimeout(() => {
      clearCredentialCookies();
      console.log('🧹 Credentials cleared after delay - but damage already done');
    }, 5000); // 5 second delay allows exploitation window
    
    // VULNERABILITY: Set a flag that we can check to bypass normal auth
    localStorage.setItem('recent_logout', Date.now().toString());
    localStorage.setItem('logout_vulnerable', 'true');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signUp, 
      signIn, 
      signOut,
      // VULNERABILITY: Expose function to access stored credentials
      getStoredCredentials: getCredentialsFromCookies
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
