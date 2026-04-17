export const BASE_PATH = "/phono";

export function withBase(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (!path.startsWith("/")) return path;
  return `${BASE_PATH}${path}`;
}
