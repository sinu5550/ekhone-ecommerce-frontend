"use client";

import { useEffect } from "react";
import { useStoreSettings } from "@/lib/dataFetch";

export default function ThemeColorInjector() {
  const { storeSettings } = useStoreSettings();

  useEffect(() => {
    if (!storeSettings) return;

    const root = document.documentElement;

    // 1. Dynamic Primary Color
    if (storeSettings.primaryColor) {
      root.style.setProperty("--primary", storeSettings.primaryColor);
      root.style.setProperty("--color-primary", storeSettings.primaryColor);
    }

    // 2. Dynamic Secondary Color
    if (storeSettings.secondaryColor) {
      root.style.setProperty("--secound", storeSettings.secondaryColor);
      root.style.setProperty("--color-secound", storeSettings.secondaryColor);
      root.style.setProperty("--secondary", storeSettings.secondaryColor);
    }

    // 3. Dynamic Browser Tab Favicon
    if (storeSettings.favicon) {
      // Find or create dedicated theme favicon link
      let link = document.querySelector("link[data-dynamic-favicon='true']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        link.type = "image/png";
        link.setAttribute("data-dynamic-favicon", "true");
        document.head.appendChild(link);
      }
      link.href = storeSettings.favicon;
    }
  }, [storeSettings]);

  return null;
}
