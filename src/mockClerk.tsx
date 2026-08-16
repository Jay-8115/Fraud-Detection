"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type MockUser = {
  id: string;
  clerkId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  primaryEmailAddress: { emailAddress: string };
  emailAddresses: { emailAddress: string }[];
  publicMetadata: { role: string };
};

// Create a context for the auth state
const AuthContext = createContext<{
  isSignedIn: boolean;
  isLoaded: boolean;
  user: MockUser | null;
  setSignedIn: (val: boolean) => void;
  setUser: (user: MockUser | null) => void;
}>({
  isSignedIn: false,
  isLoaded: false,
  user: null,
  setSignedIn: (val: boolean) => {},
  setUser: (user: MockUser | null) => {},
});

function dbUserToMockUser(dbUser: { id: string; clerkId: string; email: string; name: string; role: string }): MockUser {
  const nameParts = dbUser.name.trim().split(/\s+/);
  return {
    id: dbUser.id,
    clerkId: dbUser.clerkId,
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    fullName: dbUser.name,
    primaryEmailAddress: { emailAddress: dbUser.email },
    emailAddresses: [{ emailAddress: dbUser.email }],
    publicMetadata: { role: dbUser.role },
  };
}

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const [isSignedIn, setSignedIn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('mock_is_signed_in') === 'true';
    }
    return false;
  });
  const [user, setUserState] = useState<MockUser | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('mock_user');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return null;
  });
  const [isLoaded, setIsLoaded] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('mock_is_signed_in') !== null) {
      return true;
    }
    return false;
  });

  const setUser = (u: MockUser | null) => {
    setUserState(u);
    if (typeof window !== 'undefined') {
      if (u) {
        sessionStorage.setItem('mock_user', JSON.stringify(u));
        sessionStorage.setItem('mock_is_signed_in', 'true');
      } else {
        sessionStorage.removeItem('mock_user');
        sessionStorage.removeItem('mock_is_signed_in');
      }
    }
  };

  const handleSetSignedIn = (val: boolean) => {
    setSignedIn(val);
    if (typeof window !== 'undefined') {
      if (val) {
        sessionStorage.setItem('mock_is_signed_in', 'true');
      } else {
        sessionStorage.removeItem('mock_is_signed_in');
        sessionStorage.removeItem('mock_user');
      }
    }
  };

  useEffect(() => {
    // Check background session with the server without blocking initial render
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          const formatted = dbUserToMockUser(data.user);
          setUser(formatted);
          setSignedIn(true);
        } else {
          setUser(null);
          setSignedIn(false);
        }
      })
      .catch(() => {
        // Keep cached state if offline or transient error
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  return (
    <AuthContext.Provider value={{ isSignedIn, isLoaded, user, setSignedIn: handleSetSignedIn, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useUser() {
  const { isSignedIn, isLoaded, user } = useContext(AuthContext);
  return {
    isSignedIn,
    user: isSignedIn ? user : null,
    isLoaded,
  };
}

export function useClerk() {
  const { setSignedIn, setUser } = useContext(AuthContext);
  return {
    signOut: async (options?: { redirectUrl?: string }) => {
      await fetch('/api/auth/logout', { method: 'POST' });
      setSignedIn(false);
      setUser(null);
      if (options?.redirectUrl) {
        window.location.href = options.redirectUrl;
      } else {
        window.location.href = '/';
      }
    },
    addListener: () => () => {},
  };
}

export function Show({ children, when }: { children: React.ReactNode; when: 'signed-in' | 'signed-out' }) {
  const { isSignedIn, isLoaded } = useContext(AuthContext);

  if (!isLoaded) return null;

  if (when === 'signed-in' && isSignedIn) return <>{children}</>;
  if (when === 'signed-out' && !isSignedIn) return <>{children}</>;
  return null;
}

export function SignIn() {
  const { setSignedIn, setUser } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      setUser(dbUserToMockUser(data));
      setSignedIn(true);
      window.location.href = '/dashboard';
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-card text-card-foreground rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-border p-8 space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Welcome Back</h2>
        <p className="text-sm text-muted-foreground">Sign in to your FraudWatch analyst account</p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
            placeholder="you@example.com"
            required
            suppressHydrationWarning
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 pr-10 border rounded-lg bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
              placeholder="Enter your password"
              required
              suppressHydrationWarning
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold shadow-sm transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Don't have an account?{' '}
          <a href="/sign-up" className="font-bold text-primary hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}

export function SignUp() {
  const { setSignedIn, setUser } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      setUser(dbUserToMockUser(data));
      setSignedIn(true);
      window.location.href = '/dashboard';
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-card text-card-foreground rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-border p-8 space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Create Account</h2>
        <p className="text-sm text-muted-foreground">Register a new analyst profile</p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
            placeholder="Jay Yadav"
            required
            suppressHydrationWarning
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
            placeholder="you@example.com"
            required
            suppressHydrationWarning
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 pr-10 border rounded-lg bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
              placeholder="Create a password"
              required
              suppressHydrationWarning
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold shadow-sm transition-colors"
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Already have an account?{' '}
          <a href="/sign-in" className="font-bold text-primary hover:underline">
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
}

export function publishableKeyFromHost() {
  return 'mock_key';
}
