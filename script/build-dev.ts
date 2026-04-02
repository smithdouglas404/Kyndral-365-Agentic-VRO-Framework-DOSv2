import { build as esbuild } from "esbuild";
import { rm, readFile, mkdir, symlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const allowlist = [
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

const symlinks = [
  { src: "server/ontology/schema", dest: "dist/schema" },
  { src: "server/ontology", dest: "ontology" },
];

async function linkAssets() {
  const root = process.cwd();
  for (const { src, dest } of symlinks) {
    const absSrc = path.resolve(root, src);
    const absDest = path.resolve(root, dest);
    if (existsSync(absSrc) && !existsSync(absDest)) {
      await mkdir(path.dirname(absDest), { recursive: true });
      await symlink(absSrc, absDest);
      console.log(`[dev-build] Linked ${src} → ${dest}`);
    }
  }
}

async function buildDev() {
  await rm("dist", { recursive: true, force: true });

  console.log("[dev-build] Compiling server TypeScript...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = [
    ...allDeps.filter((dep) => !allowlist.includes(dep)),
    ...browserOnlyPackages,
  ];

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "esm",
    outfile: "dist/index.mjs",
    minify: false,
    external: externals,
    logLevel: "info",
    sourcemap: true,
    banner: {
      js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url); globalThis.__BUNDLED__ = true;",
    },
  });

  await linkAssets();

  console.log("[dev-build] ✅ Server compiled to dist/index.mjs");
}

buildDev().catch((err) => {
  console.error(err);
  process.exit(1);
});
