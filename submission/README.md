# awesome-dsh-plugin 收录条目（草稿）

这个目录只是投稿用的副本，不属于插件包，打包时会被 `files` 排除。

## 怎么提交

1. 把 `Memorial-coder__dsh-remote-plugin.yml` 原样复制到 awesome-dsh-plugin 仓库的 `data/plugins/` 下，文件名不要改。
2. 一个 PR 只加这一条，不要手改两个 README（它们由 `scripts/generate-readme.mjs` 从 `data/plugins/*.yml` 生成）。
3. 仓库根改了 `package.json` 等文件后，先打新 tag（例如 `v1.0.33`）让 Release 产出 `dsh-remote-plugin.tgz`，再按需启用条目里的 `tarball:` 字段。

## 提交前自查

- 仓库是 public，且已加 `dsh-plugin` topic。
- 根目录 `package.json` 在，`dsh.bundle` 与 `dsh.client` 都声明了（CI 只从仓库根或 `packages/` · `plugins/` · `apps/` 子包读 manifest）。
- `node scripts/check-manifests.mjs` 通过（CI 里也会跑）。
- 最新 Release 里同时有 `dsh-remote-plugin-<版本>.zip` 和 `dsh-remote-plugin.tgz`。
- 描述里的每句话都能在代码里对上：`browserctl.py` 的 TOTP / 黑名单 / 设备管理，`src/index.js` 的隧道启停，`src/client.jsx` 的扫码配对面板。

## 描述准确性对照

| 描述里的能力 | 代码位置 |
|---|---|
| frp 隧道 | `browserctl.py` 的 frpc 管理、`dsh-plugin-browserctl/src/index.js` 的 `/api/ensure` |
| 扫码配对 / 设备配对 | `src/client.jsx` 的配对面板、`browserctl.py` 的 pair 相关命令 |
| TOTP 两步验证 | `browserctl.py`（RFC 6238 TOTP） |
| 设备管理 | `browserctl.py` 的 devices / kick，`src/client.jsx` 的设备列表 |
| IP 黑名单 | `browserctl.py` 的 blacklist 与暴力破解封禁 |
