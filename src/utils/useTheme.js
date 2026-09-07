import { useState, useEffect } from "react";

const useTheme = () => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("devtinder-theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("devtinder-theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return { theme, toggleTheme };
};

export default useTheme;
