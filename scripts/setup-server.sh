#!/bin/bash
# ============================================================
# ERP 自动化部署 - 服务器首次初始化脚本 (支持多环境)
# 用法:
#   bash setup-server.sh --env test   # 初始化测试站 (test.51ppy.com)
#   bash setup-server.sh --env prod   # 初始化生产站 (erp.51ppy.com)，默认
#   bash setup-server.sh --base /path/to/deploy --site /path/to/site   # 自定义路径
#
# 作用：
#   1. 创建 DEPLOY_BASE/releases 和 shared/* 目录
#   2. (仅 prod 环境) 把现网 SITE_ROOT 备份为 .bak，迁移共享内容到 shared，
#      并把第一个现有版本作为初始 release，切换为软链接
#   3. (test 环境) 仅创建空目录结构，不放代码，等 czw 分支第一次自动部署
# ============================================================

set -e

# === 默认值 (与 deploy.sh 保持一致) ===
DEFAULT_DEPLOY_BASE="/opt/1panel/apps/openresty/openresty/www/sites/erp.51ppy.com/erp-deploy"
DEFAULT_SITE_ROOT="/opt/1panel/apps/openresty/openresty/www/sites/erp.51ppy.com/index"

TEST_DEPLOY_BASE="/opt/1panel/apps/openresty/openresty/www/sites/test.51ppy.com/erp-deploy"
TEST_SITE_ROOT="/opt/1panel/apps/openresty/openresty/www/sites/test.51ppy.com/index"

ENV="prod"
DEPLOY_BASE=""
SITE_ROOT=""
DRY_RUN=0
FORCE=0

usage() {
  cat <<EOF
用法: $0 [--env prod|test] [--base PATH] [--site PATH] [--dry-run] [--force]

选项:
  --env <prod|test>    使用预设路径 (默认 prod)
  --base <PATH>        自定义 DEPLOY_BASE (releases/current/shared 的父目录)
  --site <PATH>        自定义 SITE_ROOT (nginx 指向的站点根目录)
  --dry-run            只打印要做的动作，不执行
  --force              PROD 模式下不需要交互确认 (慎用)
  -h, --help           帮助
EOF
  exit 0
}

while [ $# -gt 0 ]; do
  case "$1" in
    --env)    [ $# -ge 2 ] || usage; ENV="$2"; shift 2 ;;
    --base)   [ $# -ge 2 ] || usage; DEPLOY_BASE="$2"; shift 2 ;;
    --site)   [ $# -ge 2 ] || usage; SITE_ROOT="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --force)   FORCE=1;   shift ;;
    -h|--help) usage ;;
    *) echo "未知参数: $1"; usage ;;
  esac
done

if [ "$ENV" = "test" ]; then
  DEPLOY_BASE="${DEPLOY_BASE:-$TEST_DEPLOY_BASE}"
  SITE_ROOT="${SITE_ROOT:-$TEST_SITE_ROOT}"
else
  DEPLOY_BASE="${DEPLOY_BASE:-$DEFAULT_DEPLOY_BASE}"
  SITE_ROOT="${SITE_ROOT:-$DEFAULT_SITE_ROOT}"
fi

RELEASES_DIR="${DEPLOY_BASE}/releases"
SHARED_DIR="${DEPLOY_BASE}/shared"

run() {
  if [ "$DRY_RUN" = "1" ]; then
    echo "   [DRY-RUN] $*"
  else
    echo "   $*"
    eval "$@"
  fi
}

echo "🔧 ERP 自动化部署初始化"
echo "   ENV         = $ENV"
echo "   DEPLOY_BASE = $DEPLOY_BASE"
echo "   SITE_ROOT   = $SITE_ROOT"
echo "   DRY_RUN     = $DRY_RUN"
echo ""

# ========== Step 1: 创建空目录结构 (所有环境都做) ==========
echo "[1/4] 创建 releases/shared 目录结构..."
run "mkdir -p '$RELEASES_DIR'"
run "mkdir -p '$SHARED_DIR/serve/vendor'"
run "mkdir -p '$SHARED_DIR/serve/runtime'"
run "mkdir -p '$SHARED_DIR/serve/static/upload'"
run "mkdir -p '$SHARED_DIR/serve/static/file'"
run "mkdir -p '$SHARED_DIR/serve/static/backup'"
run "touch    '$SHARED_DIR/serve/.env'"
echo "   ✅ 空结构创建完成"

# ========== Step 2: 把 deploy.sh 复制到 DEPLOY_BASE 下方便调用 ==========
echo "[2/4] 复制 deploy.sh 到 \$DEPLOY_BASE ..."
DEPLOY_SH_SRC="$(cd "$(dirname "$0")" && pwd)/deploy.sh"
if [ -f "$DEPLOY_SH_SRC" ]; then
  run "cp -a '$DEPLOY_SH_SRC' '$DEPLOY_BASE/deploy.sh'"
  run "chmod +x '$DEPLOY_BASE/deploy.sh'"
  echo "   ✅ deploy.sh -> $DEPLOY_BASE/deploy.sh"
else
  echo "   ⚠️  找不到 $DEPLOY_SH_SRC，请手动复制 deploy.sh 到 $DEPLOY_BASE/deploy.sh"
fi

# ========== Step 3 & 4: 只针对 PROD 环境 - 迁移现网代码 ==========
if [ "$ENV" = "prod" ]; then
  echo ""
  echo "ℹ️  PROD 模式：将尝试把现网 SITE_ROOT 迁移为 erp-deploy/releases/... + 软链接结构"

  if [ ! -d "$SITE_ROOT" ] || [ -L "$SITE_ROOT" ]; then
    echo "⚠️  SITE_ROOT ($SITE_ROOT) 不存在或已是软链接。跳过现网迁移。"
    echo "   如果是全新空目录，先手动把代码放进去再跑一遍；或者等 push master 触发第一次自动 deploy 后再初始化。"
    exit 0
  fi

  if [ "$FORCE" != "1" ] && [ "$DRY_RUN" != "1" ]; then
    read -p "⚠️  即将把 $SITE_ROOT 备份为 ${SITE_ROOT}.bak 并替换为软链接。确定? [y/N] " confirm
    [ "$confirm" = "y" ] || [ "$confirm" = "Y" ] || { echo "已取消"; exit 1; }
  fi

  # --- Step 3: 迁移共享内容 ---
  echo "[3/4] 迁移共享目录 (vendor/.env/upload/file/backup)..."
  for item in \
    "serve/vendor:$SHARED_DIR/serve/vendor:dir" \
    "serve/runtime:$SHARED_DIR/serve/runtime:dir" \
    "serve/static/upload:$SHARED_DIR/serve/static/upload:dir" \
    "serve/static/file:$SHARED_DIR/serve/static/file:dir" \
    "serve/static/backup:$SHARED_DIR/serve/static/backup:dir"; do
    src_rel=${item%%:*}
    tmp=${item#*:}
    dst=${tmp%%:*}
    kind=${tmp##*:}
    src="$SITE_ROOT/$src_rel"
    if [ -e "$src" ]; then
      if [ "$kind" = "dir" ]; then
        run "cp -a '$src/.' '$dst/'"
      else
        run "cp -a '$src' '$dst'"
      fi
      echo "   ✅ $src_rel 已迁移"
    else
      echo "   ⏩ $src_rel 不存在，跳过"
    fi
  done
  if [ -f "$SITE_ROOT/serve/.env" ]; then
    run "cp -a '$SITE_ROOT/serve/.env' '$SHARED_DIR/serve/.env'"
    echo "   ✅ serve/.env 已迁移"
  else
    echo "   ⚠️  $SITE_ROOT/serve/.env 不存在，请确认数据库配置文件位置 (可能是 config/database.php)"
  fi
  if [ -f "$SITE_ROOT/serve/config/database.php" ]; then
    echo "   ℹ️  检测到 serve/config/database.php (ThinkPHP 老配置格式)。如你的配置在这个文件而非 .env，请编辑 deploy.sh ensure_shared 部分追加共享软链接，并把它也拷到 shared 里。"
  fi

  # --- Step 4: 复制现网作为第一个 release + 软链接切换 ---
  echo "[4/4] 把现网作为第一个 release 并切换软链接..."
  FIRST_VERSION="init_$(date '+%Y%m%d_%H%M%S')"
  FIRST_DIR="$RELEASES_DIR/$FIRST_VERSION"
  run "cp -a '$SITE_ROOT' '$FIRST_DIR'"
  run "ln -sfn 'releases/$FIRST_VERSION' '$DEPLOY_BASE/current'"
  run "mv '$SITE_ROOT' '${SITE_ROOT}.bak'"
  run "ln -sfn '$DEPLOY_BASE/current' '$SITE_ROOT'"
  echo "   ✅ 已切换 SITE_ROOT ($SITE_ROOT) -> current -> releases/$FIRST_VERSION"
  echo "   ℹ️  如果访问异常: 'rm -f \"$SITE_ROOT\" && mv \"${SITE_ROOT}.bak\" \"$SITE_ROOT\"' 即可秒级恢复。"

else
  echo ""
  echo "[3/4] TEST 模式：跳过现网迁移（测试站是新的空站点）"
  echo "   ✅ 等待 czw 分支第一次推送自动部署代码"
  echo "[4/4] 请确认 $SITE_ROOT 是否已经是 1Panel 里建好的空站点目录"
  if [ -d "$SITE_ROOT" ] && [ ! -L "$SITE_ROOT" ] && [ -z "$(ls -A $SITE_ROOT 2>/dev/null)" ]; then
    echo "   ℹ️  $SITE_ROOT 是空目录，会在第一次 deploy 时被提示软链接。也可以手动执行："
    echo "       rmdir '$SITE_ROOT' && ln -s '$DEPLOY_BASE/current' '$SITE_ROOT'"
  fi
fi

echo ""
echo "======================================================================"
echo "✅ 初始化完成 ($ENV)"
echo "======================================================================"
echo "DEPLOY_BASE: $DEPLOY_BASE"
echo "SITE_ROOT  : $SITE_ROOT"
echo ""
echo "后续请检查:"
echo "   1) $SHARED_DIR/serve/.env 里面的数据库配置是否正确"
echo "   2) PHP-FPM 服务名是否需要在 $DEPLOY_BASE/deploy.sh 顶部 DEFAULT_PHP_FPM / TEST_PHP_FPM 里改"
echo "   3) GitHub Secrets 两套是否配置完毕 (TEST_*/PROD_*)，以及 production Environment 的 Required reviewers"
