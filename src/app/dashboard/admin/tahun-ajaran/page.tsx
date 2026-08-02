"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RemovedAdminAcademicYearPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/admin/monitoring");
  }, [router]);

  return null;
}
