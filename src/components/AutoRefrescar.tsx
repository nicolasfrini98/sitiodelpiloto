"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Vuelve a pedir los datos del servidor cada `minutos` mientras la pestaña está visible. */
export function AutoRefrescar({ minutos = 5 }: { minutos?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, minutos * 60_000);
    return () => clearInterval(id);
  }, [router, minutos]);
  return null;
}
