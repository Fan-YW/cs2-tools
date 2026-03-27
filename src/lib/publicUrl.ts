/** 解析 `public/` 下资源在任意 `import.meta.env.BASE_URL` 下的 URL */
export function publicUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const path = relativePath.replace(/^\/+/, "");
  return `${normalizedBase}${path}`;
}
