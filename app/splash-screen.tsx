"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Begin exit animation at 2.6 s, fully hide at 3.1 s
    const exitTimer = setTimeout(() => setExiting(true), 2600);
    const doneTimer = setTimeout(() => onDone(), 3100);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={exiting ? "splash-exit-animate" : ""}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "#0b1736",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Decorative radial glow */}
      <div
        style={{
          position: "absolute",
          width: 420,
          height: 420,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(37,99,235,0.18) 0%, rgba(11,23,54,0) 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Pulse ring behind logo */}
      <div
        className="splash-ring"
        style={{
          position: "absolute",
          width: 160,
          height: 160,
          borderRadius: "50%",
          border: "2px solid rgba(37,99,235,0.5)",
        }}
      />

      {/* Logo */}
      <div className="splash-logo-animate" style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 40px rgba(37,99,235,0.35)",
          }}
        >
          <Image
            src="/OurWatch_LOGO.png"
            alt="OurWatch"
            width={72}
            height={72}
            priority
            style={{ objectFit: "contain" }}
          />
        </div>
      </div>

      {/* Title */}
      <div
        className="splash-text-animate"
        style={{
          marginTop: 24,
          fontSize: 32,
          fontWeight: 800,
          color: "#ffffff",
          letterSpacing: "-0.5px",
          position: "relative",
          zIndex: 1,
        }}
      >
        OurWatch
      </div>

      {/* Tagline */}
      <div
        className="splash-sub-animate"
        style={{
          marginTop: 6,
          fontSize: 13,
          color: "#64748b",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontWeight: 500,
          position: "relative",
          zIndex: 1,
        }}
      >
        Crowd-Sourcing Incident Alerts
      </div>

      {/* Loading dots */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 40,
          position: "relative",
          zIndex: 1,
        }}
      >
        {["splash-dot-1", "splash-dot-2", "splash-dot-3"].map((cls) => (
          <div
            key={cls}
            className={cls}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#2563eb",
              opacity: 0.2,
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: "rgba(37,99,235,0.15)",
        }}
      >
        <div
          className="splash-bar-animate"
          style={{
            height: "100%",
            width: 0,
            background: "linear-gradient(90deg, #1d4ed8, #3b82f6)",
            borderRadius: "0 2px 2px 0",
          }}
        />
      </div>
    </div>
  );
}
