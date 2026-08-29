/**
 * Document titles per path (pathname → title).
 */
export const SECTION_TITLES: Record<string, string> = {
  "/": "Chat | WebGPU Studio",
  "/chat": "Chat | WebGPU Studio",
  "/vision": "Vision | WebGPU Studio",
  "/structured": "Structured JSON | WebGPU Studio",
  "/embeddings": "Embeddings | WebGPU Studio",
  "/finetune": "Fine Tune | WebGPU Studio",
} as const;

export function getPageTitle(pathname: string): string {
  const normalized = pathname === "" ? "/" : pathname.startsWith("/") ? pathname : `/${pathname}`;
  return SECTION_TITLES[normalized] ?? "WebGPU Studio";
}
