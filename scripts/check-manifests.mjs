// 校验「仓库根 manifest」与「插件子包 manifest」不漂移,并确保 files / screenshots.json 指向真实文件。
// 运行:node scripts/check-manifests.mjs   (CI 与本地均可)
// 目的:仓库根 package.json 让 awesome-dsh-plugin 的 gate 能读到 dsh.bundle,
//      并让 `dsh plugin add github:Memorial-coder/dsh-remote-plugin` 从源码可直接安装。
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SUB = join(ROOT, 'dsh-plugin-browserctl');

const fail = (msg) => { console.error(`❌ ${msg}`); process.exitCode = 1; };
const ok = (msg) => console.log(`✅ ${msg}`);

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

// ---------- manifest 一致性 ----------
const root = readJson(join(ROOT, 'package.json'));
const sub = readJson(join(SUB, 'package.json'));

if (root.name !== sub.name) fail(`root.name(${root.name}) !== sub.name(${sub.name})`);
else ok(`name 一致: ${root.name}`);

if (root.version !== sub.version) fail(`root.version(${root.version}) !== sub.version(${sub.version})`);
else ok(`version 一致: ${root.version}`);

if (JSON.stringify(root.dsh?.client) !== JSON.stringify(sub.dsh?.client)) {
  fail('root.dsh.client 与 sub.dsh.client 不一致');
} else ok('dsh.client 一致');

if (root.dsh?.bundle?.patch !== './dsh-plugin-browserctl/cordis.patch.yml') {
  fail(`root.dsh.bundle.patch 应为 ./dsh-plugin-browserctl/cordis.patch.yml,实际 ${root.dsh?.bundle?.patch}`);
} else if (!existsSync(join(ROOT, root.dsh.bundle.patch))) {
  fail(`root.dsh.bundle.patch 指向的文件不存在: ${root.dsh.bundle.patch}`);
} else ok('root.dsh.bundle.patch 有效');

if (sub.dsh?.bundle?.patch !== './cordis.patch.yml') {
  fail(`sub.dsh.bundle.patch 应为 ./cordis.patch.yml,实际 ${sub.dsh?.bundle?.patch}`);
} else if (!existsSync(join(SUB, sub.dsh.bundle.patch))) {
  fail(`sub.dsh.bundle.patch 指向的文件不存在: ${sub.dsh.bundle.patch}`);
} else ok('sub.dsh.bundle.patch 有效');

// ---------- files 条目存在性(展开简单 glob) ----------
const matches = (pattern) => {
  // 只支持形如 dir/*.json 的简单 glob;不支持递归 / 多个 *
  if (!pattern.includes('*')) {
    return existsSync(join(ROOT, pattern)) ? [pattern] : [];
  }
  const star = pattern.indexOf('*');
  const prefix = pattern.slice(0, star);
  const suffix = pattern.slice(star + 1);
  const dir = join(ROOT, prefix || '.');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith(suffix))
    .map((n) => prefix + n);
};

for (const entry of root.files ?? []) {
  const hit = matches(entry);
  if (hit.length === 0) fail(`root.files 条目不存在: ${entry}`);
  else ok(`files 存在: ${entry}`);
}

// main 与 exports 的运行时入口必须存在
for (const [label, rel] of [
  ['main', root.main],
  ['exports "."', root.exports?.['.']],
  ['exports "./client"', root.exports?.['./client']],
]) {
  if (!rel) { fail(`缺少 ${label}`); continue; }
  if (!existsSync(join(ROOT, rel))) fail(`${label} 指向的文件不存在: ${rel}`);
  else ok(`${label} 存在: ${rel}`);
}

// ---------- screenshots.json ----------
const ssFile = join(ROOT, 'screenshots.json');
if (!existsSync(ssFile)) {
  fail('缺少 screenshots.json(市场商店用)');
} else {
  const shots = readJson(ssFile);
  if (!Array.isArray(shots) || shots.length < 1 || shots.length > 8) {
    fail(`screenshots.json 应为 1-8 张,实际 ${Array.isArray(shots) ? shots.length : '非数组'}`);
  } else {
    for (const s of shots) {
      if (typeof s !== 'string' || s.startsWith('/') || s.includes('..') || /^https?:/.test(s)) {
        fail(`screenshots.json 路径不合法: ${s}`);
        continue;
      }
      if (!existsSync(join(ROOT, s))) fail(`截图文件不存在: ${s}`);
      else ok(`截图存在: ${s}`);
    }
    ok(`screenshots.json 共 ${shots.length} 张`);
  }
}

// ---------- 统计 ----------
const bad = (process.exitCode ?? 0) !== 0;
console.log(bad ? '\nmanifest 校验未通过,请修复后再提交。' : '\nmanifest 校验全部通过。');
process.exit(bad ? 1 : 0);
