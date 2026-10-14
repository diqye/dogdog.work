/**
 * dogdog.work API 组合
 *
 * 分层(沿用 lime 模式):
 *   - handler:纯函数
 *   - 组合树(文件末尾):路径 + method 集中一处
 */

import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { G } from "@/lib/gpress/Gpress";
import { staticApi } from "@/lib/gpress/static/bun/staticApi";

/* ------------------------------------------------------------------ */
/* 业务 handler                                                        */
/* ------------------------------------------------------------------ */

const hello = (): G<Response> =>
  G.pureJson({
    message: "Hello from dogdog.work API",
    time: new Date().toISOString(),
  });

/* ------------------------------------------------------------------ */
/* 组合树                                                              */
/* ------------------------------------------------------------------ */

// 静态目录:以进程 cwd 为基准(dev = 项目根,dist 部署 = dist 目录),两处都存在 static/
const STATIC_DIR = resolve("static");

export const api: G<Response> = G.path("/api").semiBind(
  G.alts(
    G.ePath("/hello").get().bind(() => hello()),
  ),
);

// 静态文件(/static/fonts/... 等),与 api 各自独立挂载(见 src/index.ts)
export const statics: G<Response> = G.path("/static").semiBind(staticApi(STATIC_DIR));
