"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push("/spidoznie-kozyavki");
  }, [router]);

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <p>🔄 Переадресация...</p>
    </div>
  );
}
