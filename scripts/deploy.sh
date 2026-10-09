#!/bin/bash
# ============================================================
# ERP 自动化部署脚本 - 服务器端执行
# 目录结构：
#   /opt/.../erp-deploy/
#     ├── releases/            # 每次部署独立目录 (时间戳_githash)
#     │   ├── 20260921_120000_abc123/
#     │   └── 20260920_100000_def456/
#     ├── current  -> releases/xxx      # 当前版本软链接
#     ├── previous -> releases/yyy      # 上一版本 (回滚用)
#     └── shared/                       # 跨版本共享
#         ├── serve/.env
#         ├── serve/vendor/
#         ├── serve/runtime/
#         └── serve/static/{upload,file,backup}/
# ============================================================

set -e

# ========== 环境配置 (可通过参数 --env 覆盖) ==========
# 默认路径：生产环境 erp.51ppy.com
DEFAULT_DEPLOY_BASE="/opt/1panel/apps/openresty/openresty/www/sites/erp.51ppy.com/erp-deploy"
DEFAULT_SITE_ROOT="/opt/1panel/apps/openresty/openresty/www/sites/erp.51ppy.com/index"
DEFAULT_PHP_FPM="php-fpm"

# 测试环境预设：test.51ppy.com (1Panel 建站会生成这个目录)
TEST_DEPLOY_BASE="/opt/1panel/apps/openresty/openresty/www/sites/test.51ppy.com/erp-deploy"
TEST_SITE_ROOT="/opt/1panel/apps/openresty/openresty/www/sites/test.51ppy.com/index"
TEST_PHP_FPM="php-fpm"

KEEP_RELEASES=5
TMP_TARBALL_DEFAULT="/tmp/erp-release.tar.gz"

# ========== 命令行参数解析 ==========
ENV="prod"
DEPLOY_BASE=""
SITE_ROOT=""
PHP_FPM_SERVICE=""
TMP_TARBALL="$TMP_TARBALL_DEFAULT"

usage() {
  cat <<EOF
ERP 自动化部署脚本

用法:
  $0 [--env <prod|test>|--base <path>|--site <path>|--php-fpm <service>] deploy <tarball> <version>
  $0 [--env <prod|test>|--base <path>|--site <path>] rollback
  $0 [--env <prod|test>|--base <path>|--site <path>] list

选项:
  --env <prod|test>   使用预设环境 (默认 prod)
  --base <path>       自定义 DEPLOY_BASE (releases/current/shared 的父目录)
  --site <path>       自定义 SITE_ROOT (nginx 指向的站点根目录)
  --php-fpm <name>    自定义 PHP-FPM 服务名 (如 php-74-fpm)
  --tarball <path>    自定义 tarball 临时路径 (默认 /tmp/erp-release.tar.gz)

示例:
  # 测试环境 (test.51ppy.com)
  $0 --env test deploy /tmp/erp.tar.gz 20260924_001
  $0 --env test rollback
  $0 --env test list

  # 生产环境 (erp.51ppy.com)
  $0 --env prod deploy /tmp/erp.tar.gz 20260924_002
  $0 --env prod rollback

  # 完全自定义路径 (任意环境)
  $0 --base /www/wwwroot/demo/erp-deploy --site /www/wwwroot/demo/index deploy ...
EOF
  exit 1
}

# 解析命令行参数（在子命令之前的选项）
while [ $# -gt 0 ]; do
  case "$1" in
    --env)
      [ $# -ge 2 ] || usage
      ENV="$2"; shift 2 ;;
    --base)
      [ $# -ge 2 ] || usage
      DEPLOY_BASE="$2"; shift 2 ;;
    --site)
      [ $# -ge 2 ] || usage
      SITE_ROOT="$2"; shift 2 ;;
    --php-fpm)
      [ $# -ge 2 ] || usage
      PHP_FPM_SERVICE="$2"; shift 2 ;;
    --tarball)
      [ $# -ge 2 ] || usage
      TMP_TARBALL="$2"; shift 2 ;;
    -h|--help|help)
      usage ;;
    --)
      shift; break ;;
    *)
      break ;;  # 非选项开始 = 子命令 (deploy/rollback/list)
  esac
done

# 根据 ENV 填默认值
if [ "$ENV" = "test" ]; then
  DEPLOY_BASE="${DEPLOY_BASE:-$TEST_DEPLOY_BASE}"
  SITE_ROOT="${SITE_ROOT:-$TEST_SITE_ROOT}"
  PHP_FPM_SERVICE="${PHP_FPM_SERVICE:-$TEST_PHP_FPM}"
else
  DEPLOY_BASE="${DEPLOY_BASE:-$DEFAULT_DEPLOY_BASE}"
  SITE_ROOT="${SITE_ROOT:-$DEFAULT_SITE_ROOT}"
  PHP_FPM_SERVICE="${PHP_FPM_SERVICE:-$DEFAULT_PHP_FPM}"
fi

# --- 目录初始化 ---
RELEASES_DIR="${DEPLOY_BASE}/releases"
SHARED_DIR="${DEPLOY_BASE}/shared"
LOG_FILE="${DEPLOY_BASE}/deploy.log"
CURRENT_LINK="${DEPLOY_BASE}/current"
PREVIOUS_LINK="${DEPLOY_BASE}/previous"

# --- 启动打印 ---
print_env() {
  log "环境: ENV=$ENV  DEPLOY_BASE=$DEPLOY_BASE  SITE_ROOT=$SITE_ROOT  PHP_FPM=$PHP_FPM_SERVICE"
}

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

fail() {
  log "❌ $1"
  exit 1
}

mkdir -p "$DEPLOY_BASE"

# ============================================================
# 子命令: deploy <tarball_path> <version_name>
# 用法: deploy.sh deploy /tmp/erp-release.tar.gz 20260921_120000_abc123
# ============================================================
cmd_deploy() {
  local tarball="$1"
  local version="$2"
  [ -n "$tarball" ] || fail "缺少 tarball 参数"
  [ -n "$version" ] || fail "缺少 version 参数"
  [ -f "$tarball" ] || fail "tarball 不存在: $tarball"

  mkdir -p "$RELEASES_DIR"
  [ -d "$SHARED_DIR" ] || fail "SHARED_DIR 不存在: $SHARED_DIR，请先执行 setup-server.sh 或手动创建 shared/ 目录"
  print_env

  local release_dir="${RELEASES_DIR}/${version}"
  log "🚀 开始部署版本: $version"
  log "   解压 $tarball -> $release_dir"

  mkdir -p "$release_dir"
  tar -xzf "$tarball" -C "$release_dir" || fail "解压失败"

  # --- 共享目录软链接 (跨版本保留) ---
  log "   🔗 创建共享目录软链接"
  ensure_shared "serve/.env"              "$release_dir/serve/.env"              "file"
  ensure_shared "serve/vendor"            "$release_dir/serve/vendor"            "dir"
  ensure_shared "serve/runtime"           "$release_dir/serve/runtime"           "dir"
  ensure_shared "serve/static/upload"     "$release_dir/serve/static/upload"     "dir"
  ensure_shared "serve/static/file"       "$release_dir/serve/static/file"       "dir"
  ensure_shared "serve/static/backup"     "$release_dir/serve/static/backup"     "dir"

  # --- 第一次部署 vendor 不存在时，跑 composer ---
  if [ ! -d "${SHARED_DIR}/serve/vendor" ] || [ -z "$(ls -A ${SHARED_DIR}/serve/vendor 2>/dev/null)" ]; then
    log "   📦 shared/serve/vendor 为空，执行 composer install --no-dev"
    ( cd "$release_dir/serve" && COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader --no-interaction || fail "composer install 失败" )
  fi

  # --- 第一次部署 .env 不存在时，生成一份占位并提醒 ---
  if [ ! -f "${SHARED_DIR}/serve/.env" ]; then
    log "   ⚠️  shared/serve/.env 不存在，请手动复制一份数据库配置到 ${SHARED_DIR}/serve/.env"
  fi

  # --- ThinkPHP 清缓存 ---
  log "   🧹 ThinkPHP 清缓存 (php think clear)"
  if [ -f "$release_dir/serve/think" ]; then
    ( cd "$release_dir/serve" && php think clear >/dev/null 2>&1 || true )
  fi

  # --- 原子切换 current / previous 软链接 ---
  local prev_target=""
  if [ -L "$CURRENT_LINK" ]; then
    prev_target="$(readlink "$CURRENT_LINK")"
  fi

  log "   🔀 软链接切换: current -> ${version}"
  ln -sfn "releases/${version}" "$CURRENT_LINK" || fail "切换 current 软链接失败"

  if [ -n "$prev_target" ] && [ "$prev_target" != "releases/${version}" ]; then
    ln -sfn "$prev_target" "$PREVIOUS_LINK" || true
    log "   🔙 previous 指向: $prev_target"
  fi

  # --- 让站点根 (SITE_ROOT) 也指向 current ---
  if [ ! -L "$SITE_ROOT" ] && [ -d "$SITE_ROOT" ]; then
    log "   ⚠️  SITE_ROOT ($SITE_ROOT) 是真实目录，请手动执行: mv $SITE_ROOT ${SITE_ROOT}.bak && ln -s $CURRENT_LINK $SITE_ROOT"
  elif [ -L "$SITE_ROOT" ]; then
    ln -sfn "$CURRENT_LINK" "$SITE_ROOT"
    log "   🔗 SITE_ROOT ($SITE_ROOT) 软链接已同步"
  fi

  # --- 清 PHP OPCache / reload php-fpm ---
  log "   🔄 重启/重载 PHP-FPM 服务 ($PHP_FPM_SERVICE)"
  if command -v systemctl >/dev/null 2>&1; then
    systemctl reload "$PHP_FPM_SERVICE" 2>/dev/null || systemctl restart "$PHP_FPM_SERVICE" 2>/dev/null || log "   ⚠️  reload php-fpm 失败，请手动重启 PHP-FPM"
  else
    service "$PHP_FPM_SERVICE" reload 2>/dev/null || service "$PHP_FPM_SERVICE" restart 2>/dev/null || log "   ⚠️  请手动重启 PHP-FPM"
  fi

  # OpenResty/Nginx reload (可选，因为只改静态+软链接一般不需要)
  if command -v nginx >/dev/null 2>&1; then
    nginx -t >/dev/null 2>&1 && nginx -s reload >/dev/null 2>&1 || true
  fi

  # --- 清理旧版本 (保留 KEEP_RELEASES 个) ---
  cleanup_old_releases

  rm -f "$tarball"
  log "✅ 部署成功！版本: $version"
  log "   如需回滚: $0 rollback"
}

# ============================================================
# 子命令: rollback
# 用法: deploy.sh rollback
# ============================================================
cmd_rollback() {
  print_env
  if [ ! -L "$PREVIOUS_LINK" ]; then
    fail "没有 previous 版本可供回滚 (previous 软链接不存在)"
  fi

  local prev_target="$(readlink "$PREVIOUS_LINK")"
  local curr_target="$(readlink "$CURRENT_LINK")"

  [ -n "$prev_target" ] || fail "previous 软链接为空"
  [ -d "${DEPLOY_BASE}/${prev_target}" ] || fail "previous 版本目录不存在: ${DEPLOY_BASE}/${prev_target}"

  log "⏪ 回滚: current <- $prev_target  ;  previous <- $curr_target"

  ln -sfn "$prev_target" "$CURRENT_LINK"
  if [ -n "$curr_target" ]; then
    ln -sfn "$curr_target" "$PREVIOUS_LINK"
  fi

  if [ -L "$SITE_ROOT" ]; then
    ln -sfn "$CURRENT_LINK" "$SITE_ROOT"
  fi

  # 重载 PHP-FPM
  if command -v systemctl >/dev/null 2>&1; then
    systemctl reload "$PHP_FPM_SERVICE" 2>/dev/null || true
  else
    service "$PHP_FPM_SERVICE" reload 2>/dev/null || true
  fi
  if command -v nginx >/dev/null 2>&1; then
    nginx -t >/dev/null 2>&1 && nginx -s reload >/dev/null 2>&1 || true
  fi

  log "✅ 回滚成功！现在的版本是: $prev_target (如仍有问题可再次 rollback 切回)"
}

# ============================================================
# 子命令: list
# 列出所有版本
# ============================================================
cmd_list() {
  print_env
  echo "Current : $( [ -L "$CURRENT_LINK" ]  && readlink "$CURRENT_LINK"  || echo "(无)" )"
  echo "Previous: $( [ -L "$PREVIOUS_LINK" ] && readlink "$PREVIOUS_LINK" || echo "(无)" )"
  echo ""
  echo "所有 releases:"
  ls -1t "$RELEASES_DIR" 2>/dev/null || echo "(无)"
}

# ============================================================
# 辅助函数
# ============================================================
ensure_shared() {
  local rel_path="$1"   # 相对 SHARED_DIR 的路径
  local target="$2"     # release 里的目标路径
  local kind="$3"       # file | dir

  local src="${SHARED_DIR}/${rel_path}"

  # 确保 shared 侧存在
  if [ "$kind" = "dir" ]; then
    mkdir -p "$src"
  elif [ "$kind" = "file" ]; then
    touch "$src" 2>/dev/null || true
  fi

  # 如果 release 里有真实文件/目录 (GitHub Actions 上传上来的)，删掉，换成软链接
  if [ -e "$target" ] && [ ! -L "$target" ]; then
    rm -rf "$target"
  fi

  # 确保父目录存在
  mkdir -p "$(dirname "$target")"
  # 使用绝对路径软链接，兼容性更好 (CentOS/老系统 realpath 无 --relative-to)
  local abs_src
  abs_src="$(cd "$(dirname "$src")" && pwd)/$(basename "$src")"
  ln -sfn "$abs_src" "$target"
}

cleanup_old_releases() {
  local count=$(ls -1t "$RELEASES_DIR" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$count" -gt "$KEEP_RELEASES" ]; then
    local to_remove=$(( count - KEEP_RELEASES ))
    log "   🗑 清理旧版本 (保留最近 $KEEP_RELEASES 个，删除 $to_remove 个)"
    ls -1t "$RELEASES_DIR" | tail -n +$(( KEEP_RELEASES + 1 )) | while read -r old; do
      # 不要删 current / previous 指向的版本
      if [ "releases/$old" = "$(readlink "$CURRENT_LINK" 2>/dev/null)" ] || \
         [ "releases/$old" = "$(readlink "$PREVIOUS_LINK" 2>/dev/null)" ]; then
        log "      ⏩ 跳过 $old (被 current/previous 引用)"
        continue
      fi
      log "      删除 releases/$old"
      rm -rf "${RELEASES_DIR}/${old}"
    done
  fi
}

# ============================================================
# 入口
# ============================================================
case "${1:-}" in
  deploy)   shift; cmd_deploy   "$@" ;;
  rollback)        cmd_rollback        ;;
  list)            cmd_list            ;;
  *)
    echo "用法:"
    echo "  $0 deploy <tarball_path> <version_name>   部署新版本"
    echo "  $0 rollback                              回滚到上一个版本 (可反复切)"
    echo "  $0 list                                  列出所有版本和 current/previous"
    exit 1
    ;;
esac
