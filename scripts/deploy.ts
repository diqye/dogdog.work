/**
 * 一键部署:build → rsync → 服务器容器重建 → nginx 指向校验 → 线上健康检查。
 * 幂等,可重复执行:bun run deploy
 * 服务器拓扑见 CLAUDE/README:nginx 容器(80/443, TLS 终结)反代 app-network 内 dogdog-web:3000。
 */

import { spawnSync } from "node:child_process";

const HOST = "ucloud";
const REMOTE_DIR = "/home/ubuntu/projects/dogdog";
const CONTAINER = "dogdog-web";

function run(cmd: string, label: string) {
  console.log(`▶ ${label}`);
  const r = spawnSync(cmd, { shell: true, stdio: "inherit" });
  if (r.status !== 0) throw new Error(`${label} 失败(exit ${r.status})`);
}

run("bun run build", "本地构建");

run(`rsync -az --delete dist/ ${HOST}:${REMOTE_DIR}/`, "同步产物");

// 容器重建(挂载宿主产物目录,镜像为 oven/bun:1-slim;-m 256m:服务器仅 718M 内存)
run(
  `ssh ${HOST} "sudo docker rm -f ${CONTAINER} 2>/dev/null; ` +
    `sudo docker run -d --name ${CONTAINER} --restart unless-stopped --network app-network -m 256m ` +
    `-v ${REMOTE_DIR}:/app -w /app oven/bun:1-slim bun run index.js"`,
  "重启容器",
);

// nginx 反代指向(幂等 sed;首次从 myhome:3000 切换时改写,之后无变化)
run(
  `ssh ${HOST} "sed -i 's|proxy_pass http://myhome:3000;|proxy_pass http://${CONTAINER}:3000;|' ` +
    `/home/ubuntu/projects/nginx/conf.d/default.conf; ` +
    `sudo docker exec nginx-container nginx -t 2>&1 && sudo docker exec nginx-container nginx -s reload"`,
  "nginx 校验并重载",
);

// 线上健康检查(API + 静态字体)
run(
  `curl -sf https://dogdog.work/api/hello > /dev/null && ` +
    `curl -sf -o /dev/null https://dogdog.work/static/fonts/lxgw-wenkai/lxgwwenkai-regular.css && echo ok`,
  "健康检查",
);

console.log("✓ 部署完成:https://dogdog.work");
