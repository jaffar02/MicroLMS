import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react"; // <--- FIX 1: Use 'import type' for types

interface User {
  email: string;
  fullName: string;
  roles: string[]; // Changed to array since roles usually are
  title?: string;
  department?: string;
}

// 1. Define the shape of our context
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (
    token: string,
    email: string,
    fullName: string,
    roles: string,
    title?: string,
    department?: string,
  ) => void;
  logout: () => void;
  updateUser: (
    updates: Partial<Pick<User, "fullName" | "title" | "department">>,
  ) => void; // 👈 add this
}

// 2. Create the context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Create the Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Add loading state to prevent flickering

  // Check token on initial load (when user refreshes page)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    const fullName = localStorage.getItem("fullName");
    const roles = localStorage.getItem("roles");
    const title = localStorage.getItem("title");
    const department = localStorage.getItem("department");
    if (token && email && fullName) {
      setIsAuthenticated(true);
      setUser({
        email,
        fullName,
        roles: roles ? JSON.parse(roles) : [],
        title: title && title !== "undefined" ? title : undefined,
        department:
          department && department !== "undefined" ? department : undefined,
      });
    }
    setLoading(false);
  }, []);

  const login = (
    token: string,
    email: string,
    fullName: string,
    roles: string,
    title?: string,
    department?: string,
  ) => {
    const rolesArray = roles ? [roles] : [];
    localStorage.setItem("token", token);
    localStorage.setItem("email", email);
    localStorage.setItem("fullName", fullName);
    localStorage.setItem("roles", JSON.stringify(roles || []));
    if (title) {
      localStorage.setItem("title", title);
    } else {
      localStorage.removeItem("title");
    }
    if (department) {
      localStorage.setItem("department", department);
    } else {
      localStorage.removeItem("department");
    }
    setUser({ email, fullName, roles: rolesArray, title, department });
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.clear(); // Cleans up everything at once
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (
    updates: Partial<Pick<User, "fullName" | "title" | "department">>,
  ) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      // Sync localStorage too
      if (updates.fullName) localStorage.setItem("fullName", updates.fullName);
      if (updates.title) localStorage.setItem("title", updates.title);
      else if ("title" in updates) localStorage.removeItem("title");
      if (updates.department)
        localStorage.setItem("department", updates.department);
      else if ("department" in updates) localStorage.removeItem("department");
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, logout, updateUser }}
    >
      {/* Only render children when we are done checking localStorage */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

// 4. Create a custom hook for easy access
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
