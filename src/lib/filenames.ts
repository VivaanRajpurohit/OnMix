export function recordingFilename(date = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `StreamForge_${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}_${p(date.getHours())}-${p(date.getMinutes())}-${p(date.getSeconds())}.webm`;
}

