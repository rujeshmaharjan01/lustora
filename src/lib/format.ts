export function formatDuration(value: string) {
  const total = Number(value);
  if (!Number.isFinite(total) || total <= 0) return "0:00";

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(Math.floor(total % 60)).padStart(2, "0");

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`;
}

export function formatCount(value: string) {
  const count = Number(value);
  return Number.isFinite(count)
    ? new Intl.NumberFormat("en", { notation: "compact" }).format(count)
    : value;
}

export function formatBytes(value: string) {
  if (value === "unlimited") return "Unlimited";

  const bytes = Number(value);
  if (!Number.isFinite(bytes)) return value;
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const unit = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  return `${(bytes / 1024 ** unit).toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}
