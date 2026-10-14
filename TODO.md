# TODO

- [x] 图片主题：7 个(星野/雪原/暮海/晨光/街市/雾林/云山)三层渲染(图 cover → 蒙层 → 白字+暗晕)
  - 留白直排主题正文顶对齐(bodyTop)+三段式蒙层
  - 图 1080×1440 压缩自托管 static/images;分享链接只带 theme id
- [x] 选区着色:色点固定化(首位墨色 + 固定 6 色),不再随主题走;气泡两行防溢出
- [x] /changelog 页面(服务端读根 CHANGELOG.md,发布 build 时随 dist 快照)+ 首页 header「更新日志」入口(新标签打开)
- [x] 设置持久化到 localStorage(署名/对齐/字号/主题;优先级 url param > localStorage > 默认;逐字段脏值校验)
