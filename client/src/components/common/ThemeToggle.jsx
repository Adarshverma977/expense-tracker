import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "../../app/ThemeContext";

import "./ThemeToggle.css";

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <motion.button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      whileTap={{ scale: 0.92 }}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      <motion.span
        key={isDark ? "moon" : "sun"}
        className="theme-toggle__icon"
        initial={{ rotate: -45, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
      >
        {isDark ? <Moon size={19} /> : <Sun size={19} />}
      </motion.span>
    </motion.button>
  );
};

export default ThemeToggle;