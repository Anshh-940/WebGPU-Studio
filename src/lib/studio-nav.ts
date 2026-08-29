import { startTransition } from "react";

/** Maps feature section ids to routes. Chat is the app root `/`. */
export function pushStudioSection(router: { push: (href: string) => void }, section: string) {
  startTransition(() => {
    if (section === "home" || section === "chat") {
      router.push("/");
      return;
    }
    router.push(`/${section}`);
  });
}
