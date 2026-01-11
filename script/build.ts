import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@anthropic-ai/sdk",
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pdf-parse",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

// Browser-only packages that must NEVER be bundled into server code
const browserOnlyPackages = [
  "react",
  "react-dom",
  "recharts",
  "framer-motion",
  "wouter",
  "@radix-ui",
  "@tanstack/react-query",
  "lucide-react",
  "pdfjs-dist",
  "embla-carousel-react",
  "cmdk",
  "vaul",
  "sonner",
  "next-themes",
  "input-otp",
  "react-hook-form",
  "react-day-picker",
  "react-resizable-panels",
  "@hookform/resolvers",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  // Start with deps not in allowlist, then add browser-only packages
  const externals = [
    ...allDeps.filter((dep) => !allowlist.includes(dep)),
    ...browserOnlyPackages,
  ];

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
