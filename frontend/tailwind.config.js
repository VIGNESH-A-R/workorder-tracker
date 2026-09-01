/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#F97316",
          hover: "#EA580C",
        },
        surface: "#FFF8F3",
        border: "#F1E4D8",
        ink: {
          DEFAULT: "#1F2937",
          muted: "#6B7280",
        },
        sidebar: "#FFFCFA",
        // Status pill colors are intentionally untouched by the orange re-theme —
        // orange is a UI accent only, never a status color (see CLAUDE.md).
        status: {
          new: "#64748B",
          assigned: "#2563EB",
          progress: "#F59E0B",
          done: "#10B981",
        },
      },
      borderRadius: {
        card: "10px",
        control: "8px",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(120 53 15 / 0.05), 0 1px 3px 0 rgb(120 53 15 / 0.08)",
        "card-hover": "0 4px 12px 0 rgb(120 53 15 / 0.08), 0 2px 4px 0 rgb(120 53 15 / 0.06)",
      },
      keyframes: {
        "slide-in": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      },
      animation: {
        "slide-in": "slide-in 0.2s ease-out",
        "fade-in": "fade-in 0.15s ease-out",
      },
    },
  },
  plugins: [],
};
