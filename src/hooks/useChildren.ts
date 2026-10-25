"use client";

import { useCallback, useEffect, useState } from "react";

export type ChildSummary = {
  id: string;
  name: string;
  createdAt: string;
  messageCount: number;
  lastMessageAt: string | null;
};

// Lista dzieci zalogowanego rodzica (null, dopóki się nie wczyta).
export function useChildren() {
  const [children, setChildren] = useState<ChildSummary[] | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch("/api/children");
    if (!res.ok) return;
    const data: { children: ChildSummary[] } = await res.json();
    setChildren(data.children);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => void reload().catch(() => {}), 0);
    return () => clearTimeout(id);
  }, [reload]);

  return { children, setChildren, reload };
}
