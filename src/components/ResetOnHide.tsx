"use client";

import { Fragment, useLayoutEffect, useState, type ReactNode } from "react";

// Przy cacheComponents Next nie odmontowuje opuszczonej strony, tylko ukrywa ją przez <Activity>,
// więc stan i wartości pól zostają. Ta otoczka czyści zawartość w chwili ukrycia strony
// (w tym hasła w DOM), także przy powrocie przyciskiem "Wstecz".
export function ResetOnHide({ children }: { children: ReactNode }) {
  const [generation, setGeneration] = useState(0);

  useLayoutEffect(() => () => setGeneration((g) => g + 1), []);

  return <Fragment key={generation}>{children}</Fragment>;
}
