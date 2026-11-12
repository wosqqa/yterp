<?php
namespace app\controller;

use app\BaseController;
use think\facade\{Cache, Db, Log};

// 客户选款专用入口，不放开内部 Service/Sor 的登录限制。
class PublicSelection extends BaseController
{
    public function catalog()
    {
        if ($this->request->isOptions()) {
            return response('', 204);
        }
        try {
            $input = $this->request->param();
            $page = $this->integer($input, 'page', 1, 1, 100000);
            $limit = $this->integer($input, 'limit', 30, 1, 60);
            $category = $this->integer($input, 'category', 0, 0, PHP_INT_MAX);
            $setGoods = $this->integer($input, 'setGoods', 0, 0, PHP_INT_MAX);
            $code = $this->text($input, 'code');
            $keyword = $this->text($input, 'keyword');
            $brand = $this->text($input, 'brand');
            $categories = Db::name('category')->field('id,pid,name,data,sort')->order('sort,id')->select()->toArray();
            $query = Db::name('goods');
            if ($brand !== '') {
                $query->where('brand', $brand);
                // 分类只由品牌决定，不随关键词、页码或所选分类缩减。
                $visible = array_map('intval', Db::name('goods')->where('brand', $brand)->distinct(true)->column('category'));
                do {
                    $before = count($visible);
                    foreach ($categories as $row) {
                        if (in_array((int)$row['id'], $visible, true) && !in_array((int)$row['pid'], $visible, true)) $visible[] = (int)$row['pid'];
                    }
                } while (count($visible) !== $before);
                $categories = array_values(array_filter($categories, function ($row) use ($visible) {
                    return in_array((int)$row['id'], $visible, true);
                }));
            }
            if ($category) {
                $ids = $this->categoryIds($categories, $category);
                if (!$ids) {
                    throw new \InvalidArgumentException('Invalid product type.');
                }
                $query->where('category', 'in', $ids);
            }
            if ($code !== '') {
                $query->where('number', 'like', '%' . $this->escapeLike($code) . '%');
            }
            if ($keyword !== '') {
                $pattern = '%' . $this->escapeLike($keyword) . '%';
                $query->where(function ($q) use ($pattern) {
                    $q->where('name|py|number|spec|data', 'like', $pattern);
                });
            }
            if ($setGoods) {
                $source = Db::name('goods')->where('id', $setGoods)->field('id,data')->find();
                $combo = $source ? $this->combo($source['data']) : '';
                if ($combo === '') {
                    throw new \InvalidArgumentException('This style has no product set.');
                }
                // 组合精确匹配，避免 set0001 同时匹配 set00010。
                $query->where('data', $source['data']);
            }
            $count = (clone $query)->count();
            $page = min($page, max(1, (int) ceil($count / $limit)));
            $rows = $query->field('id,number,category,sell,imgs,data')
                ->order('number,id')->page($page, $limit)->select()->toArray();
            $rate = $this->exchangeRate();
            $info = [];
            foreach ($rows as $row) {
                $info[] = [
                    'id' => (int) $row['id'],
                    'code' => (string) $row['number'],
                    'category' => (int) $row['category'],
                    'image' => $this->image($row['imgs']),
                    'combo' => $this->combo($row['data']),
                    'price' => $rate ? number_format((float) $row['sell'] / $rate['effective'], 2, '.', '') : null,
                    'currency' => 'USD',
                ];
            }
            $publicCategories = [];
            foreach ($categories as $row) {
                if ((int) $row['id'] <= 0) continue;
                $publicCategories[] = [
                    'value' => (int) $row['id'],
                    'parent' => (int) $row['pid'],
                    'label' => $this->categoryLabel($row),
                ];
            }
            return json([
                'state' => 'success', 'info' => $info, 'count' => $count,
                'page' => $page, 'limit' => $limit, 'categories' => $publicCategories,
                'exchangeRate' => $rate,
                'priceWarning' => $rate ? '' : 'Exchange rate unavailable. Please retry to see USD prices.',
            ]);
        } catch (\InvalidArgumentException $e) {
            return json(['state' => 'error', 'info' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            Log::error('Public selection catalog query failed.');
            return json(['state' => 'error', 'info' => 'Products could not be loaded. Please try again.'], 503);
        }
    }

    // 公开提交仅能新增未审核订单，不能修改任何已有单据。
    public function submit()
    {
        if ($this->request->isOptions()) return response('', 204);
        if (!$this->request->isPost()) return json(['state'=>'error','info'=>'POST required.'], 405);
        try {
            $input = $this->request->param();
            $user = $this->integer($input, 'salesId', 0, 1, PHP_INT_MAX);
            if (!$user || !Db::name('user')->where('id', $user)->find()) {
                throw new \InvalidArgumentException('Invalid sales link. Please contact your salesperson.');
            }
            $customer = $input['customer'] ?? [];
            if (!is_array($customer)) throw new \InvalidArgumentException('Invalid customer.');
            $name = $this->text($customer, 'name');
            $phone = $this->text($customer, 'phone');
            $country = $this->text($customer, 'country');
            $note = $this->text($customer, 'note');
            $normalized = preg_replace('/[^0-9]/', '', $phone);
            if (!$name || mb_strlen($name)>32 || !$country || mb_strlen($phone)>32 || strlen($normalized)<6 || strlen($normalized)>20) {
                throw new \InvalidArgumentException('Please check your name, phone and country.');
            }
            $key = $input['submissionKey'] ?? '';
            if (!is_string($key) || !preg_match('/^[a-f0-9]{32}$/', $key)) throw new \InvalidArgumentException('Invalid submission key.');
            $items = $input['items'] ?? [];
            if (!is_array($items) || !count($items) || count($items)>500) throw new \InvalidArgumentException('Invalid items.');
            $quantities = [];
            foreach ($items as $item) {
                if (!is_array($item)) throw new \InvalidArgumentException('Invalid item.');
                $id = $this->integer($item, 'id', 0, 1, PHP_INT_MAX);
                $qty = $this->integer($item, 'qty', 0, 1, 999999);
                if (!$id || !$qty || isset($quantities[$id])) throw new \InvalidArgumentException('Invalid item quantity.');
                $quantities[$id] = $qty;
            }
            $number = 'XS' . substr(hash('sha256', $user . ':' . $key), 0, 28);
            $result = Db::transaction(function () use ($user, $name, $phone, $normalized, $country, $note, $quantities, $number) {
                // 锁定默认组织，防止不同销售并发提交相同电话时重复建客户。
                Db::name('frame')->where('id', 0)->lock(true)->find();
                $existing = Db::name('sor')->where('number', $number)->find();
                if ($existing) return ['number'=>$existing['number']];
                $goods = Db::name('goods')->whereIn('id', array_keys($quantities))->select()->toArray();
                if (count($goods)!==count($quantities)) throw new \InvalidArgumentException('Some products are no longer available.');
                $cid = null;
                foreach (Db::name('customer')->select() as $row) {
                    if (preg_replace('/[^0-9]/', '', (string)$row['number']) === $normalized) {
                        $cid = $row['id']; break;
                    }
                }
                $remark = mb_substr('Country: '.$country.'; '.$note, 0, 256);
                if (!$cid) {
                    $cid = Db::name('customer')->insertGetId([
                        'name'=>$name, 'py'=>'', 'number'=>$phone,
                        'frame'=>0, 'user'=>$user, 'category'=>'常规类别', 'grade'=>'常规等级',
                        'bank'=>'', 'account'=>'', 'tax'=>'', 'data'=>$remark,
                        'contacts'=>json_encode([['name'=>$name,'tel'=>$phone,'add'=>$country,'main'=>true]], JSON_UNESCAPED_UNICODE),
                        'balance'=>0, 'more'=>'{}'
                    ]);
                }
                // 与选品目录一致：sell 为人民币售价，不从美元报价反算。
                $total = '0.0000';
                foreach ($goods as $g) {
                    if (!is_numeric($g['sell']) || bccomp((string)$g['sell'], '0', 4) < 0) {
                        throw new \InvalidArgumentException('Invalid product price. Please contact your salesperson.');
                    }
                    $total = bcadd($total, bcmul((string)$g['sell'], (string)$quantities[$g['id']], 4), 4);
                }
                $id = Db::name('sor')->insertGetId([
                    'frame'=>0, 'customer'=>$cid, 'time'=>time(), 'number'=>$number,
                    'total'=>$total, 'actual'=>$total, 'people'=>0, 'arrival'=>0,
                    'logistics'=>'{}', 'file'=>'[]', 'more'=>'{}', 'examine'=>0, 'state'=>0, 'user'=>$user,
                    'data'=>mb_substr('线上选品；'.$name.'; '.$phone.'; '.$remark, 0, 256)
                ]);
                foreach ($goods as $g) {
                    $amount = bcmul((string)$g['sell'], (string)$quantities[$g['id']], 4);
                    Db::name('sor_info')->insert([
                        'pid'=>$id, 'goods'=>$g['id'], 'attr'=>'', 'unit'=>$g['unit']==='-1'?'':$g['unit'],
                        'warehouse'=>0, 'price'=>$g['sell'], 'nums'=>$quantities[$g['id']], 'handle'=>0,
                        'discount'=>0, 'dsc'=>0, 'total'=>$amount, 'tax'=>0, 'tat'=>0, 'tpt'=>$amount, 'data'=>''
                    ]);
                }
                Db::name('record')->insert(['type'=>'sor','source'=>$id,'time'=>time(),'user'=>$user,'info'=>'客户线上选品提交，按商品人民币售价生成']);
                return ['number'=>$number];
            });
            return json(['state'=>'success','info'=>$result]);
        } catch (\InvalidArgumentException $e) {
            return json(['state'=>'error','info'=>$e->getMessage()], 422);
        } catch (\Throwable $e) {
            Log::error('Public selection order submission failed: '.$e->getMessage());
            return json(['state'=>'error','info'=>'Order could not be submitted. Please retry.'], 503);
        }
    }

    protected function integer(array $input, $key, $default, $min, $max)
    {
        if (!isset($input[$key]) || $input[$key] === '') return $default;
        $value = filter_var($input[$key], FILTER_VALIDATE_INT);
        if ($value === false || $value < $min || $value > $max) {
            throw new \InvalidArgumentException('Invalid ' . $key . '.');
        }
        return $value;
    }

    protected function text(array $input, $key)
    {
        if (!isset($input[$key])) return '';
        if (!is_string($input[$key]) || mb_strlen($input[$key]) > 100) {
            throw new \InvalidArgumentException('Invalid ' . $key . '.');
        }
        return trim($input[$key]);
    }

    protected function escapeLike($text)
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $text);
    }

    protected function categoryIds(array $categories, $root)
    {
        $known = array_column($categories, 'id');
        if (!in_array($root, $known)) return [];
        $ids = [$root];
        do {
            $before = count($ids);
            foreach ($categories as $category) {
                $id = (int) $category['id'];
                if (in_array((int) $category['pid'], $ids, true) && !in_array($id, $ids, true)) {
                    $ids[] = $id;
                }
            }
        } while (count($ids) > $before);
        return $ids;
    }

    protected function combo($data)
    {
        $text = trim((string) $data);
        // data 也可能存内部备注，只公开约定格式的组合编号。
        return preg_match('/^set[\w-]{1,60}$/i', $text) ? $text : '';
    }

    protected function image($imgs)
    {
        $imgs = is_string($imgs) ? json_decode($imgs, true) : $imgs;
        if (!is_array($imgs)) return '';
        $first = isset($imgs['url']) ? $imgs : ($imgs[0] ?? '');
        $url = trim(is_array($first) ? (string) ($first['url'] ?? '') : (string) $first);
        if (preg_match('#^https?://#i', $url)) return $this->thumbnail($url);
        // 仅允许已有本地上传路径，不接受脚本 URL 或任意外部协议。
        if (preg_match('#^/?static/upload/[a-zA-Z0-9_./%-]+$#', $url) && strpos($url, '..') === false) {
            return $this->thumbnail($this->request->domain() . '/' . ltrim($url, '/'));
        }
        return '';
    }

    protected function thumbnail($url)
    {
        return \app\support\ProductImage::url($url);
    }

    protected function exchangeRate()
    {
        $key = 'public_selection_usd_cny_v1';
        $cached = Cache::get($key);
        if (is_array($cached) && !empty($cached['effective'])) return $cached;
        if (Cache::get($key . '_retry')) return null;
        // 参考汇率按工作日更新；短时缓存避免每次翻页都请求第三方。
        $curl = curl_init('https://api.frankfurter.dev/v1/latest?base=USD&symbols=CNY');
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);
        $body = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);
        $data = is_string($body) ? json_decode($body, true) : null;
        $raw = $data['rates']['CNY'] ?? null;
        $date = $data['date'] ?? '';
        $timestamp = is_string($date) ? strtotime($date . ' UTC') : false;
        if ($status !== 200 || !is_numeric($raw) || $raw < 1 || $raw > 100 ||
            ($data['base'] ?? '') !== 'USD' || !$timestamp ||
            $timestamp > time() + 86400 || $timestamp < time() - 10 * 86400) {
            Cache::set($key . '_retry', true, 60);
            return null;
        }
        $rate = [
            'raw' => (float) $raw,
            'effective' => $this->adjustRate((float) $raw),
            'date' => $date,
            'source' => 'Frankfurter / ECB',
        ];
        Cache::set($key, $rate, 900);
        return $rate;
    }

    protected function adjustRate($raw)
    {
        // 先向下截断到分，再减 0.02：6.6483 -> 6.64 -> 6.62。
        return (floor($raw * 100 + 0.00000001) - 2) / 100;
    }

    protected function categoryLabel(array $row)
    {
        $names = [
            '书包' => 'School Bags', '拉杆书包' => 'Trolley Backpacks',
            '中号拉杆箱' => 'Medium Trolley Bags', '小号拉杆箱' => 'Small Trolley Bags',
            '大号书包' => 'Large Backpacks', '特大号书包' => 'Extra Large Backpacks',
            '中号造型书包' => 'Medium Shaped Backpacks', '中号名字卡片书包' => 'Medium Name-Tag Backpacks',
            '中号帽子书包' => 'Medium Hooded Backpacks', '小号书包' => 'Small Backpacks',
            '公仔小包' => 'Mini Character Bags', '午餐包' => 'Lunch Bags',
            '单层斜挎餐包' => 'Single-Layer Lunch Bags', '硬壳餐包' => 'Hard-Shell Lunch Bags',
            '手提餐包' => 'Lunch Totes', '方形餐包' => 'Square Lunch Bags',
            '双层斜挎餐包' => 'Double-Layer Lunch Bags', '饭盒' => 'Lunch Boxes',
            'T饭盒' => 'T Lunch Boxes', '透明饭盒' => 'Clear Lunch Boxes',
            'PP饭盒' => 'PP Lunch Boxes', '半圆角饭盒' => 'Rounded Lunch Boxes',
            '餐具' => 'Cutlery', '文具' => 'Stationery', '水杯' => 'Water Bottles',
            '四折文具' => 'Four-Fold Stationery Sets', '大号文具' => 'Large Stationery Sets',
            'A4文具' => 'A4 Stationery Sets', 'A5文具' => 'A5 Stationery Sets',
            '文具盒' => 'Pencil Boxes', '吸管杯' => 'Straw Bottles',
            '喷雾杯' => 'Spray Bottles', '4吸管杯' => '400 ml Straw Bottles',
            '保温杯' => 'Insulated Bottles', '球形盖杯' => 'Round-Cap Bottles',
            '宽版文具盒' => 'Wide Pencil Cases', '笔袋' => 'Pen Bags',
            '窄版笔盒' => 'Slim Pencil Cases', '手提笔袋' => 'Pencil Totes',
            '钱包' => 'Wallets', '铅笔' => 'Pencils', '圆珠笔' => 'Ballpoint Pens',
            '悦拓' => 'Yuetuo', '盒装套装' => 'Boxed Sets', '手提包' => 'Tote Bags',
            '品牌书包' => 'Branded Backpacks', '礼品袋' => 'Gift Bags',
            '硅胶吸管杯' => 'Silicone Straw Bottles', '不锈钢饭盒' => 'Stainless Steel Lunch Boxes',
        ];
        if (isset($names[$row['name']])) return $names[$row['name']];
        foreach (['data', 'name'] as $field) {
            $label = trim((string) $row[$field]);
            if (preg_match('/^[a-zA-Z0-9][a-zA-Z0-9 &().\/_-]{0,70}$/', $label)) return $label;
        }
        return 'Category ' . (int) $row['id'];
    }
}
