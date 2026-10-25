"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-fetches the page's server data on an interval, for live screens like the tables display. */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => {
      // Skip while staff are typing in a dialog or using a menu: a refresh can swap the table's control and close it.
      if (!document.querySelector('[role="dialog"][data-state="open"], [role="menu"][data-state="open"]')) router.refresh();
    }, seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds]);
  return null;
}
