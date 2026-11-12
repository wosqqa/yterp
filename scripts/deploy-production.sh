#!/usr/bin/env bash
set -euo pipefail
site=/opt/1panel/apps/openresty/openresty/www/sites/erp.51ppy.com/index
base=/opt/1panel/apps/openresty/openresty/www/sites/erp.51ppy.com/erp-deploy
container=1Panel-php7-2dBZ
mkdir -p "$base/backups" "$base/staging"
exec 9>"$base/deploy.lock"
flock -n 9 || { echo '另一个发布正在运行'; exit 1; }
version="${2:-}"
[[ "$version" =~ ^[a-f0-9]{40}$ ]] || { echo '版本号必须为提交 SHA'; exit 1; }
work="$base/staging/$version"
backup="$base/backups/$version-$(date +%s)"
exclude=(--exclude=/.env --exclude=/config/database.php --exclude=/vendor/ --exclude=/runtime/ --exclude=/static/upload/ --exclude=/static/file/ --exclude=/static/backup/)
if [ "${1:-}" != deploy ]; then echo '用法 deploy SHA ARCHIVE'; exit 1; fi
[ -d "$site" ] && [ -f "$site/.env" ] && [ -f "$site/vendor/autoload.php" ]
[ ! -e "$work" ] || { echo '暂存目录已存在，需检查前次发布'; exit 1; }
mkdir -p "$work"
tar -xzf "$3" -C "$work"
[ -f "$work/app/view/index/index.html" ] && [ -f "$work/index.php" ]
# 依赖变化需要独立验证安装，避免继续使用不匹配的 vendor。
cmp "$work/composer.lock" "$site/composer.lock" || { echo 'Composer 依赖发生变化，需先完成依赖更新'; exit 1; }
# 此挂载范围在宿主机和 PHP 容器内路径不同。
inside="/www/sites/erp.51ppy.com/erp-deploy/staging/$version"
docker exec "$container" sh -c 'find "$1/app" "$1/config" "$1/route" -name "*.php" -exec php -l {} \;' sh "$inside" > "$work/php-lint.log"
if grep -E 'Errors parsing|Parse error|Fatal error' "$work/php-lint.log"; then exit 1; fi
rm "$work/php-lint.log"
mkdir -p "$backup"
rsync -a "${exclude[@]}" "$site/" "$backup/"
rollback() {
  trap - ERR
  echo '发布失败，恢复代码备份'
  rsync -a --delete "${exclude[@]}" "$backup/" "$site/"
  docker exec "$container" kill -USR2 1
  exit 1
}
trap rollback ERR
# 覆盖代码前已建立完整代码快照，保留现有站点附加文件。
rsync -a "${exclude[@]}" "$work/" "$site/"
docker exec -w /www/sites/erp.51ppy.com/index "$container" php think clear
docker exec "$container" kill -USR2 1
healthy=0
for attempt in 1 2 3 4 5; do
  if curl -fsS --max-time 15 -H 'Host: erp.51ppy.com' http://127.0.0.1/ | grep -q 'static/'; then
    response="$(curl -fsS --max-time 20 -H 'Host: erp.51ppy.com' -H 'Content-Type: application/json' -d '{"limit":1}' http://127.0.0.1/publicSelection/catalog)" || response=''
    if printf '%s' "$response" | grep -Eq '"state"[[:space:]]*:[[:space:]]*"success"'; then healthy=1; break; fi
  fi
  sleep 3
done
[ "$healthy" = 1 ]
trap - ERR
printf '%s\n' "$version" > "$base/current-version"
rm -rf "$work"
echo "发布成功 $version，备份 $backup"
