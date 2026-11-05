// Kit Archive（3D のユニフォーム展示）の部品を、Kit-Archive リポジトリから取り込む
// - vendor/kit-archive-core：packages/core のソース（ビルド不要の ES モジュール）
// - public/models：3D の型紙（吊り下げ形・着用形の GLB）
// Kit-Archive は別のリポジトリ（非公開）のため、GitHub Actions のビルドでも使えるように、ここにコピーして一緒に管理する
// 使い方：npm run sync:kit-archive（Kit-Archive の場所は KIT_ARCHIVE_DIR、既定は ../Kit-Archive）
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { resolve, join } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const src = resolve(root, process.env.KIT_ARCHIVE_DIR || '../Kit-Archive')
const core = join(src, 'packages/core')
if (!existsSync(join(core, 'package.json'))) throw new Error(`Kit-Archive が見つかりません: ${src}（KIT_ARCHIVE_DIR で場所を指定してください）`)

const dest = join(root, 'vendor/kit-archive-core')
rmSync(dest, { recursive: true, force: true })
mkdirSync(dest, { recursive: true })
cpSync(join(core, 'src'), join(dest, 'src'), { recursive: true })
const pkg = JSON.parse(readFileSync(join(core, 'package.json'), 'utf8'))
delete pkg.scripts
writeFileSync(join(dest, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')

mkdirSync(join(root, 'public/models'), { recursive: true })
for (const f of ['kit_hanging.glb', 'kit_base.glb']) cpSync(join(src, 'apps/viewer/public/models', f), join(root, 'public/models', f))

let commit = '不明'
try { commit = execSync('git rev-parse --short HEAD', { cwd: src }).toString().trim() } catch { /* Git でなければ不明のまま */ }
writeFileSync(join(dest, 'SOURCE.md'), `# kit-archive-core（取り込んだもの。ここでは編集しない）\n\n元：Kit-Archive リポジトリの packages/core（コミット ${commit}）\n直すときは Kit-Archive 側で直してから \`npm run sync:kit-archive\` で取り込み直す\n`)
console.log(`kit-archive-core を取り込みました（${commit}）`)
