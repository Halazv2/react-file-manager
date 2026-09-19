const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

export function formatBytes(bytes?: number): string {
  if (bytes === undefined || Number.isNaN(bytes) || bytes < 0) return "";
  if (bytes === 0) return "0 B";
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = Number.isInteger(value) || value >= 10 ? 0 : 1;
  return `${value.toFixed(digits)} ${UNITS[unit]}`;
}
