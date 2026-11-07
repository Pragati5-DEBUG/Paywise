import { themeQuartz } from "ag-grid-community";

/** Shopping tables: quiet headers, no spreadsheet column lines. */
export const dealGridTheme = themeQuartz.withParams({
  fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  fontSize: 14,
  headerFontSize: 11,
  headerFontWeight: 600,
  headerTextColor: "#78716c",
  headerBackgroundColor: "#fafaf9",
  backgroundColor: "#ffffff",
  foregroundColor: "#1c1917",
  accentColor: "#1c1917",
  borderColor: "#f5f5f4",
  rowHoverColor: "#fafaf9",
  columnBorder: false,
  headerColumnBorder: false,
  wrapperBorder: false,
  spacing: 10,
  cellHorizontalPadding: 16,
});
