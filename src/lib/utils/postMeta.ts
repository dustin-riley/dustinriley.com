export const readMinutes = (body: string | undefined): string => {
  const words = (body ?? "").trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 220));
  return `${mins} min`;
};

export const monthName = (date: Date | string | undefined): string => {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
};
