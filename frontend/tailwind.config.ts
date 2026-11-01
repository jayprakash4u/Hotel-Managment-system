import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        // 1. Core Brand Palette: Pure Blue (#1A73E8), Pure Red (#DC2626), Pure Yellow (#F59E0B)
        brand: {
          primary: "#1A73E8",       // Pure Vibrant Blue (Primary Brand & CTAs)
          "primary-hover": "#1557B0",
          "primary-active": "#0D47A1",
          "primary-subtle": "#E8F0FE",
          blue: "#1A73E8",

          secondary: "#DC2626",     // Pure Signal Red (Destructive, Critical, Danger)
          "secondary-hover": "#B91C1C",
          "secondary-active": "#991B1B",
          "secondary-subtle": "#FEF2F2",
          red: "#DC2626",

          tertiary: "#F59E0B",      // Pure Yellow / Amber (Pending, Hold, Caution)
          "tertiary-hover": "#D97706",
          "tertiary-active": "#B45309",
          "tertiary-subtle": "#FEF3C7",
          yellow: "#F59E0B",

          forest: "#1A73E8",        // backward compat alias -> Pure Blue
          burgundy: "#DC2626",      // backward compat alias -> Pure Red
        },

        // Surface & Background Tokens
        page: {
          DEFAULT: "#F8FAFC",       // Clean Enterprise Slate-50 Background
          ivory: "#F8FAFC",
        },
        surface: {
          DEFAULT: "#FFFFFF",       // White Surface
          muted: "#F1F5F9",         // Slate-100 (Table headers, secondary panels)
          hover: "#F8FAFC",         // Hover Row Background
          selected: "#E8F0FE",      // Selected Row Blue Tint
        },

        // Borders & Dividers
        border: {
          DEFAULT: "#E2E8F0",       // Primary Card & Input Border
          subtle: "#E2E8F0",
          divider: "#EDF2F7",       // Content Separators
          input: "#CBD5E1",         // Default Input Border
          "input-hover": "#94A3B8",
          "input-focus": "#1A73E8",
          "input-error": "#DC2626",
        },

        // Typography
        charcoal: {
          heading: "#0F172A",       // Slate-900 Headings
          body: "#334155",          // Slate-700 Descriptions & Body
          muted: "#64748B",         // Slate-500 Metadata & Timestamps
          placeholder: "#94A3B8",
          disabled: "#CBD5E1",
        },

        // Sidebar Navigation: Modern Deep Navy (#0F172A) Shell
        sidebar: {
          bg: "#0F172A",
          text: "#94A3B8",
          hover: "#FFFFFF",
          "active-bg": "#1A73E8",
          "active-hover": "#1557B0",
          icon: "#64748B",
        },

        // Semantic Operational Statuses
        status: {
          "success-text": "#166534",
          "success-bg": "#DCFCE7",
          "success-border": "#BBF7D0",

          "warning-text": "#92400E",
          "warning-bg": "#FEF3C7",
          "warning-border": "#FDE68A",

          "error-text": "#991B1B",
          "error-bg": "#FEE2E2",
          "error-border": "#FECACA",

          "info-text": "#1D4ED8",
          "info-bg": "#DBEAFE",
          "info-border": "#BFDBFE",

          "neutral-text": "#475569",
          "neutral-bg": "#F1F5F9",
          "neutral-border": "#E2E8F0",

          "progress-text": "#6D28D9",
          "progress-bg": "#EDE9FE",
          "progress-border": "#DDD6FE",

          "teal-text": "#0F766E",
          "teal-bg": "#CCFBF1",
          "teal-border": "#99F6E4",
        },

        // Financial & KPI Chart Tokens
        chart: {
          room: "#0B3D32",
          restaurant: "#A51F36",
          other: "#94B5A7",
          expenses: "#C2414B",
          profit: "#15803D",
          dues: "#D97706",
          comparison: "#94A3B8",
          forecast: "#7C6BB1",
        },

        // Backward compatibility mappings
        aura: {
          dark: "#080c14",
          card: "#0f172a",
          cardHover: "#1e293b",
          border: "#1e293b",
          gold: "#0B3D32",
          goldLight: "#145447",
          goldMuted: "#E8F2EE",
          emerald: "#166534",
          emeraldDark: "#0B3D32",
          rose: "#A51F36",
          roseDark: "#8E1B2F",
          cyan: "#0F766E",
          purple: "#6D28D9",
        },
      },

      // 2. Typography Scale
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "sans-serif"],
        heading: ["var(--font-outfit)", "Outfit", "-apple-system", "sans-serif"],
        display: ["var(--font-outfit)", "Outfit", "-apple-system", "sans-serif"],
      },

      // 4. Border Radius Scale - Global Minimal Radius Spec (3px everywhere)
      borderRadius: {
        none: "0px",
        xs: "2px",
        sm: "3px",
        DEFAULT: "3px",
        md: "3px",
        lg: "3px",
        xl: "3px",
        "2xl": "4px",
        "3xl": "4px",
        full: "3px",
      },

      // 5. Shadow Scale
      boxShadow: {
        "2xs": "0 1px 2px 0 rgba(11, 61, 50, 0.04)",
        xs: "0 1px 3px 0 rgba(11, 61, 50, 0.05), 0 1px 2px -1px rgba(11, 61, 50, 0.04)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)",
        dropdown: "0 4px 16px -2px rgba(11, 61, 50, 0.08), 0 2px 6px -1px rgba(11, 61, 50, 0.04)",
        modal: "0 20px 25px -5px rgba(11, 61, 50, 0.10), 0 8px 10px -6px rgba(11, 61, 50, 0.06)",
        focus: "0 0 0 3px rgba(11, 61, 50, 0.15)",
        focusDestructive: "0 0 0 3px rgba(165, 31, 54, 0.15)",
      },

      // 6. Animation Standards
      transitionDuration: {
        fast: "150ms",
        normal: "200ms",
        slow: "300ms",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
        enter: "cubic-bezier(0, 0, 0.2, 1)",
        exit: "cubic-bezier(0.4, 0, 1, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
