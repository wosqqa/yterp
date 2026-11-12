#!/usr/bin/env bash
# 生成与现有 1Panel PHP 站点结构一致的发布包。
set -euo pipefail
repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_dir"
: "${VUE_APP_API_BASE:?请配置生产接口地址，例如 https://erp.51ppy.com/}"
export VUE_APP_API_BASE
if [ "${SKIP_FRONTEND_BUILD:-0}" != 1 ]; then
  (
    cd web
    npm ci
    NODE_OPTIONS=--openssl-legacy-provider ./node_modules/.bin/vue-cli-service build
  )
fi
[ -f web/dist/index.html ] || { echo '缺少前端构建文件' >&2; exit 1; }
staging_dir="$(mktemp -d)"
trap 'rm -rf "$staging_dir"' EXIT
mkdir -p output
# 使用白名单，避免把上传文件、数据库配置、备份压缩包或运行日志发布出去。
for path in app config extend route static; do
  if [ -d "serve/$path" ]; then
    mkdir -p "$staging_dir/$path"
    rsync -a --exclude='upload/' --exclude='file/' --exclude='backup/' --exclude='.DS_Store' --exclude='*.zip' --exclude='*.tar.gz' "serve/$path/" "$staging_dir/$path/"
  fi
done
for path in index.php think .htaccess composer.json composer.lock robots.txt favicon.ico; do
  [ ! -f "serve/$path" ] || cp "serve/$path" "$staging_dir/$path"
done
# ThinkPHP Index 控制器通过模板加载 Vue 入口。
mkdir -p "$staging_dir/app/view/index"
cp web/dist/index.html "$staging_dir/app/view/index/index.html"
rsync -a --exclude='index.html' --exclude='*.map' web/dist/ "$staging_dir/"
git rev-parse HEAD > "$staging_dir/REVISION"
tar -czf output/erp-release.tar.gz -C "$staging_dir" .
printf '发布包已生成 output/erp-release.tar.gz\n'
