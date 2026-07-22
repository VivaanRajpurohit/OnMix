export const createId = (prefix: string) =>
  `${prefix}_${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;

