"use client";

import { useState } from "react";
import { ToastProvider } from "@/app/toast-provider";
import { ThemeProvider } from "@/app/context/theme-context";
import { NotificationProvider } from "@/app/context/notification-context";
import SplashScreen from "@/app/splash-screen";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <ThemeProvider>
      <ToastProvider>
        <NotificationProvider>
          {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
          {children}
        </NotificationProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
