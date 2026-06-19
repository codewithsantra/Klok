import { ImageResponse } from "next/og";

export const alt = "Klok — Plan your day. Own your reality.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Dynamically generated social share image (no gradients — solid brand).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#F4F4FC",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 48 }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: "#6C6FDF",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 36,
              fontWeight: 800,
            }}
          >
            K
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, color: "#15152B" }}>Klok</div>
        </div>
        <div style={{ fontSize: 76, fontWeight: 800, color: "#15152B", lineHeight: 1.05, letterSpacing: -2 }}>
          Plan your day.
        </div>
        <div style={{ fontSize: 76, fontWeight: 800, color: "#6C6FDF", lineHeight: 1.05, letterSpacing: -2 }}>
          Own your reality.
        </div>
        <div style={{ fontSize: 30, color: "#5B5B73", marginTop: 32 }}>
          The honest daily tracker.
        </div>
      </div>
    ),
    { ...size },
  );
}
