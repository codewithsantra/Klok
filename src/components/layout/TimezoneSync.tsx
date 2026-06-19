"use client";

// Detects the browser's IANA timezone and persists it to the user record when
// it differs from what's stored. Renders nothing. This is what makes "today",
// streaks, and carry-forward reflect the user's actual local day.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateTimezoneAction } from "@/actions/timezone";

export default function TimezoneSync({ current }: { current: string }) {
  const router = useRouter();

  useEffect(() => {
    let tz: string | undefined;
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return;
    }
    if (!tz || tz === current) return;

    updateTimezoneAction(tz).then((res) => {
      if (res?.ok) router.refresh();
    });
  }, [current, router]);

  return null;
}
