import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export async function setupVite(server: Server, app: Express) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr", overlay: false },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use("/@vite/client", async (_req, res, next) => {
    try {
      const result = await vite.transformRequest("/@vite/client");
      if (!result) return next();

      let code = result.code;
      code = code.replace(
        /transport\.connect\(createHMRHandler\(handleMessage\)\)/,
        "/* transport.connect disabled for Replit */"
      );
      code = code.replace(
        /console\.debug\(\s*\"\[vite\] connecting\.\.\.\"\s*\)/,
        '/* vite connecting disabled */'
      );
      res.status(200).set({
        "Content-Type": "application/javascript",
        "Cache-Control": "no-cache",
      }).end(code);
    } catch {
      next();
    }
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
