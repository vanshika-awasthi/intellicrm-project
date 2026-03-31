"use client";
 
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
 
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router      = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isRestoring = useAuthStore((s) => s.isRestoring);
 
  useEffect(() => {
    if (!isRestoring && !accessToken) {
      router.replace("/auth/login");
    }
  }, [accessToken, isRestoring, router]);
 
  if (isRestoring || !accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F6F2] dark:bg-[#0F1110]">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-600" />
      </div>
    );
  }
 
  return <>{children}</>;
}