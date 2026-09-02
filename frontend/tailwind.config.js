/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      colors: {
        // Single accent color, app-wide: Sidebar active state, primary
        // buttons, links, focus rings, the Issues workspace's selected-card
        // accent, Settings' toggle/active-section states, Login's button and
        // headline highlight. Every component should reference this token —
        // never a hardcoded hex or a one-off Tailwind hue class — so the
        // brand color has exactly one source of truth.
        primary: {
          DEFAULT: "#5B5FEF",
          hover: "#4B4FE0",
        },
        surface: "#FFF8F3",
        border: "#F1E4D8",
        ink: {
          DEFAULT: "#1F2937",
          muted: "#6B7280",
        },
        sidebar: "#FFFCFA",
        // Status/severity pill colors are intentionally untouched by the
        // accent color — they encode meaning (state/priority/severity), not
        // brand, and must never be changed to match `primary` (see CLAUDE.md).
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
