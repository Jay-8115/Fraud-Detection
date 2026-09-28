"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { AuthenticatedUser } from "@/lib/auth";

interface UserContextType {
  user: AuthenticatedUser | null;
  isLoaded: boolean;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoaded: false,
  isAdmin: false,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || null);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setUser(null);
      } finally {
        setIsLoaded(true);
      }
    }
    loadUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoaded, isAdmin: user?.role === "admin" }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
