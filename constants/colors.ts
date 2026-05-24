export const LightColors = {
  primary:       "#16a34a",
  primaryDark:   "#15803d",
  primaryDeep:   "#14532d",
  primaryLight:  "#f0fdf4",
  primaryMid:    "#bbf7d0",

  navy:          "#1e3464",
  navyDark:      "#152647",
  navyLight:     "#e8edf5",

  accent:        "#f97316",
  accentLight:   "#fff7ed",
  accentDark:    "#c2410c",

  background:    "#f1f5f9",
  surface:       "#ffffff",
  surfaceAlt:    "#f8fafc",
  card:          "#ffffff",

  text:          "#0f172a",
  textSecondary: "#334155",
  textMuted:     "#94a3b8",

  success:       "#16a34a",
  successLight:  "#f0fdf4",
  warning:       "#d97706",
  warningLight:  "#fffbeb",
  error:         "#dc2626",
  errorLight:    "#fef2f2",
  info:          "#0891b2",
  infoLight:     "#f0f9ff",

  border:        "#e2e8f0",
  borderLight:   "#f1f5f9",

  white:         "#ffffff",
  black:         "#0f172a",
};

export const DarkColors: typeof LightColors = {
  primary:       "#22c55e",
  primaryDark:   "#16a34a",
  primaryDeep:   "#14532d",
  primaryLight:  "#052e16",
  primaryMid:    "#bbf7d0",

  navy:          "#1e3464",
  navyDark:      "#152647",
  navyLight:     "#1e2d4a",

  accent:        "#fb923c",
  accentLight:   "#431407",
  accentDark:    "#c2410c",

  background:    "#0f172a",
  surface:       "#1e293b",
  surfaceAlt:    "#1a2535",
  card:          "#1e293b",

  text:          "#f1f5f9",
  textSecondary: "#cbd5e1",
  textMuted:     "#64748b",

  success:       "#22c55e",
  successLight:  "#052e16",
  warning:       "#f59e0b",
  warningLight:  "#451a03",
  error:         "#ef4444",
  errorLight:    "#450a0a",
  info:          "#38bdf8",
  infoLight:     "#082f49",

  border:        "#334155",
  borderLight:   "#1e293b",

  white:         "#ffffff",
  black:         "#f1f5f9",
};

// Default export — screens use useColors() at runtime for dark mode support
export const Colors = LightColors;
