
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { getCurrentUser, logoutUser } from "./authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch currently authenticated user
  const refreshUser = useCallback(async () => {
    try {
      const response = await getCurrentUser();

      const currentUser =
        response?.data?.user ??
        response?.user ??
        response?.data ??
        null;

      setUser(currentUser);

      return currentUser;
    } catch (error) {
      if (error.response?.status === 401) {
        setUser(null);
        return null;
      }

      throw error;
    }
  }, []);

  // Check authentication when application loads
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await refreshUser();
      } catch (error) {
        console.error(
          "Authentication initialization failed:",
          error
        );

        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [refreshUser]);

  // Logout user
  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      // Clear local authentication state even if API fails
      setUser(null);
    }
  }, []);

  const value = {
    user,
    setUser,
    isAuthenticated: Boolean(user),
    isLoading,
    refreshUser,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
