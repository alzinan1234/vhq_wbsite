"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { clearTokens, getAccessToken, tryRefresh } from "@/lib/api";



export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loadMe, isLoggedIn, user } = useStore();

  // ── Initialize auth on mount ──────────────────────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token) {
        // Check if token is valid by trying to refresh
        const refreshed = await tryRefresh();
        if (refreshed) {
          await loadMe();
        } else {
          // Token is invalid, clear and redirect if on protected page
          clearTokens();
          if (!pathname.includes("/auth") && pathname !== "/") {
            router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
          }
        }
      }
    };
    
    initAuth();
  }, [loadMe, pathname, router]);

  // ── Auto token refresh timer (every 50 minutes) ──────────────────────────
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    
    const startRefreshTimer = () => {
      if (refreshInterval) clearInterval(refreshInterval);
      
      // Check token every minute
      refreshInterval = setInterval(async () => {
        const token = getAccessToken();
        const expiry = localStorage.getItem("vhq_token_expiry");
        
        if (token && expiry) {
          const expiryTime = parseInt(expiry, 10);
          const timeLeft = expiryTime - Date.now();
          
          // If less than 10 minutes left, refresh token
          if (timeLeft < 10 * 60 * 1000 && timeLeft > 0) {
            console.log("🔄 Auto-refreshing token...");
            const refreshed = await tryRefresh();
            if (refreshed) {
              console.log("✅ Token refreshed successfully");
            } else {
              console.log("❌ Token refresh failed");
            }
          }
        }
      }, 60 * 1000); // Check every minute
    };
    
    startRefreshTimer();
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  // ── Listen for token update events ────────────────────────────────────────
  useEffect(() => {
    const handleTokenUpdate = () => {
      console.log("📡 Token updated event received");
      loadMe();
    };
    
    const handleLogout = () => {
      console.log("🚪 Logout event received");
      if (!pathname.includes("/auth")) {
        router.push("/auth?session=expired");
      }
    };
    
    window.addEventListener("token-updated", handleTokenUpdate);
    window.addEventListener("auth-logout", handleLogout);
    
    return () => {
      window.removeEventListener("token-updated", handleTokenUpdate);
      window.removeEventListener("auth-logout", handleLogout);
    };
  }, [loadMe, pathname, router]);

  // ── Check token validity on route change ──────────────────────────────────
  useEffect(() => {
    const checkTokenOnRouteChange = async () => {
      const token = getAccessToken();
      const expiry = localStorage.getItem("vhq_token_expiry");
      
      // Protected routes (require authentication)
      const protectedRoutes = ["/messages", "/profile", "/collection", "/wishlist", "/settings", "/my-listings"];
      const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route));
      
      if (isProtectedRoute && (!token || !expiry)) {
        router.push(`/auth?redirect=${encodeURIComponent(pathname || "")}`);
        return;
      }
      
      if (token && expiry) {
        const expiryTime = parseInt(expiry, 10);
        if (Date.now() >= expiryTime) {
          // Token expired, try to refresh
          const refreshed = await tryRefresh();
          if (!refreshed && isProtectedRoute) {
            router.push(`/auth?session=expired&redirect=${encodeURIComponent(pathname || "")}`);
          }
        }
      }
    };
    
    checkTokenOnRouteChange();
  }, [pathname, router]);

  // ── Ping server to keep session alive (optional) ──────────────────────────
  useEffect(() => {
    let pingInterval: NodeJS.Timeout;
    
    if (isLoggedIn) {
      // Send ping every 5 minutes to keep session alive
      pingInterval = setInterval(async () => {
        try {
          const response = await fetch("https://api.thevinylheadquarters.com/v1/auth/ping", {
            headers: {
              Authorization: `Bearer ${getAccessToken()}`,
            },
          });
          if (!response.ok && response.status === 401) {
            // Token expired, try to refresh
            await tryRefresh();
          }
        } catch (err) {
          console.log("Ping failed:", err);
        }
      }, 5 * 60 * 1000); // Every 5 minutes
    }
    
    return () => {
      if (pingInterval) clearInterval(pingInterval);
    };
  }, [isLoggedIn]);

  return <>{children}</>;
}