/**
 * 编译产物构建:bun run build → dist/(部署到其他机器,不带源码)。
 *
 * 形态:minified 服务端 bundle(前端 html/tsx 已一并打包,NODE_ENV 编译期注入
 * production)+ dist/package.json(目标机 bun run start)。
 */

import tailwind from "bun-plugin-tailwind";
import { cp, rm } from "node:fs/promises";
import path from "node:path";

const cwd = process.cwd();
const outdir = path.join(cwd, "dist");
await rm(outdir, { recursive: true, force: true });

const result = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir,
  plugins: [tailwind],
  minify: true,
  target: "bun",
  sourcemap: "none",
  // 资产引用改绝对路径(/chunk-*.js):SPA 深层路由下相对引用会被解析进路由
  // 路径,回退到 SPA fallback 返 HTML 报 MIME 错误
  publicPath: "/",
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});

if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}
for (const output of result.outputs) {
  console.log(` ${path.relative(cwd, output.path)}  ${(output.size / 1024).toFixed(1)} KB`);
}

// CHANGELOG.md 随 dist 走(/changelog.md 路由读 cwd 根)
await cp(path.join(cwd, "CHANGELOG.md"), path.join(outdir, "CHANGELOG.md"));

// 静态文件(css 引用的 woff2 保持独立文件按需加载,不进 bundle)
await cp(path.join(cwd, "static"), path.join(outdir, "static"), { recursive: true });
console.log(" static/ -> dist/static");

// dist/package.json:bundle 为 ESM,目标机需 type: module 才能直接跑
await Bun.write(
  path.join(outdir, "package.json"),
  JSON.stringify({ name: "dogdog.work", type: "module", scripts: { start: "bun run index.js" } }, null, 2),
);
console.log(`\n部署:拷 dist/ → 目标机 bun run start`);
