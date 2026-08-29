"use client";

import { memo, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "@/app/page.module.css";

function StudioMainAreaInner({
  children,
  sidebarExpanded,
}: {
  children: ReactNode;
  sidebarExpanded: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const routes = ["/vision", "/structured", "/embeddings", "/finetune"];
    const idle =
      "requestIdleCallback" in window
        ? window.requestIdleCallback
        : (cb: IdleRequestCallback) => window.setTimeout(cb, 1500);
    const id = idle(() => {
      for (const href of routes) {
        if (href !== pathname) void router.prefetch(href);
      }
    });
    return () => {
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(id as number);
      else clearTimeout(id as number);
    };
  }, [pathname, router]);

  const mainOffset = sidebarExpanded ? "md:ml-[288px]" : "md:ml-[88px]";

  return (
    <div className={`${styles.mainContainer} ml-0 ${mainOffset}`}>
      <main className={styles.content}>{children}</main>
    </div>
  );
}

export const StudioMainArea = memo(StudioMainAreaInner);
