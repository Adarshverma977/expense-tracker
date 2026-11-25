
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const ThemeContext = createContext(null);

const STORAGE_KEY = "expense-tracker-theme";

const isValidTheme = (value) =>
  value === "light" || value === "dark" || value === "system";

const getInitialTheme = () => {
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEY);

    return isValidTheme(savedTheme) ? savedTheme : "light";
  } catch {
    return "light";
  }
};

const getSystemTheme = () => {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
};

export const ThemeProvider = ({ children }) => {
  const [themePreference, setThemePreference] = useState(getInitialTheme);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  const theme =
    themePreference === "system" ? systemTheme : themePreference;

  const setTheme = useCallback((nextTheme) => {
    setThemePreference((currentTheme) => {
      const resolvedTheme =
        typeof nextTheme === "function"
          ? nextTheme(currentTheme)
          : nextTheme;

      return isValidTheme(resolvedTheme)
        ? resolvedTheme
        : currentTheme;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setThemePreference((currentTheme) => {
      const activeTheme =
        currentTheme === "system" ? getSystemTheme() : currentTheme;

      return activeTheme === "light" ? "dark" : "light";
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;

    try {
      localStorage.setItem(STORAGE_KEY, themePreference);
    } catch {
      return;
    }
  }, [theme, themePreference]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const handleSystemThemeChange = (event) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    setSystemTheme(mediaQuery.matches ? "dark" : "light");

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === STORAGE_KEY && isValidTheme(event.newValue)) {
        setThemePreference(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const value = {
    theme,
    themePreference,
    setTheme,
    toggleTheme,
    isDark: theme === "dark",
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
