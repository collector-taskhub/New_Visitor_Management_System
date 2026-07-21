import type { NextConfig } from "next";

const securityHeaders = [
  // Prevents the site from being embedded in an iframe on another domain
  // (clickjacking protection).
  { key: "X-Frame-Options", value: "DENY" },
  // Stops the browser from guessing content types in ways that can enable
  // certain injection attacks.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limits how much referrer information leaks to other sites when a link
  // is followed out of the app.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disables browser features this app has no legitimate use for.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Forces HTTPS for a year once a browser has seen it once (Vercel serves
  // HTTPS by default already; this hardens it further).
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@pdf-lib/fontkit", "pdf-lib", "exceljs", "docx"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
