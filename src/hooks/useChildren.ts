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
  const [failed, setFailed] = useState(false);

  const reload = useCallback(async () => {
    setFailed(false);
    try {
      const res = await fetch("/api/children");
      if (!res.ok) {
        setFailed(true);
        return;
      }
      const data: { children: ChildSummary[] } = await res.json();
      setChildren(data.children);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => void reload(), 0);
    return () => clearTimeout(id);
  }, [reload]);

  return { children, setChildren, reload, failed };
}
