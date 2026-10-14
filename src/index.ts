import { serve } from "bun";
import index from "./index.html";
import { api, statics } from "./server";

const server = serve({
  port: 3000,
  routes: {
    // gpress API
    "/api/*": (req) => api.runWith404(req),

    // 静态文件(gpress staticApi)
    "/static/*": (req) => statics.runWith404(req),

    // SPA fallback:其余路径交给前端路由(wouter)
    "/*": index,
  },
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`dogdog.work running at ${server.url}`);
