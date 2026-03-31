"use client";
 
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
 
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router      = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isRestoring = useAuthStore((s) => s.isRestoring);
 
  useEffect(() => {
    if (!isRestoring && accessToken) {
      router.replace("/dashboard");
    }
  }, [accessToken, isRestoring, router]);
 
  if (isRestoring) return null; // avoid auth page flash during session restore
 
  return <>{children}</>;
}