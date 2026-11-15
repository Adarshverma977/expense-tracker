
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "../../app/ThemeContext";

import "./ThemeToggle.css";

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  const nextTheme = isDark ? "light" : "dark";

  return (
    <motion.button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 20,
      }}
      aria-label={`Switch to ${nextTheme} mode`}
      aria-pressed={isDark}
      title={`Switch to ${nextTheme} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "moon" : "sun"}
          className="theme-toggle__icon"
          initial={{
            opacity: 0,
            rotate: -90,
            scale: 0.5,
          }}
          animate={{
            opacity: 1,
            rotate: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            rotate: 90,
            scale: 0.5,
          }}
          transition={{
            duration: 0.22,
            ease: "easeOut",
          }}
        >
          {isDark ? (
            <Moon size={19} strokeWidth={1.9} />
          ) : (
            <Sun size={19} strokeWidth={1.9} />
          )}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
};

export default ThemeToggle;
