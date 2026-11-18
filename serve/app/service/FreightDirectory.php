<?php
namespace app\service;

class FreightDirectory
{
    public static function legacyKey($contact) {
        $phone = CustomerPhone::normalize($contact['tel'] ?? '');
        $address = mb_strtolower(preg_replace('/[\s\p{Z}，,。;；]+/u','',strtr((string)($contact['add'] ?? ''),['（'=>'(', '）'=>')'])));
        $name = mb_strtolower(preg_replace('/\s+/u','',(string)($contact['name'] ?? '')));
        if (!$phone && !$address) return '';
        // 缺电话时加上姓名，避免把同一园区的不同公司误合并。
        return hash('sha256',json_encode([$phone,$address,$phone?'':$name],JSON_UNESCAPED_UNICODE));
    }
    public static function key($contact) {
        $phone=CustomerPhone::normalize($contact['tel'] ?? '');
        // 国内手机号的 +86 / 0086 与不带区号的写法也归为同一公司。
        if (preg_match('/^861[3-9][0-9]{9}$/',$phone)) $phone=substr($phone,2);
        return $phone ? hash('sha256','phone:'.$phone) : self::legacyKey($contact);
    }
    public static function mergeCompanies(array $rows) {
        $companies=[];
        foreach ($rows as $row) {
            $key=self::key(['tel'=>$row['tel'],'add'=>$row['address'],'name'=>$row['name']]);
            if (!$key) $key=$row['key'];
            $row['addresses']=array_values(array_unique(array_filter(array_merge($row['addresses'] ?? [],[$row['address']]))));
            $row['names']=array_values(array_unique(array_filter(array_merge($row['names'] ?? [],[$row['name']]))));
            if (!isset($companies[$key])) { $row['key']=$key;$companies[$key]=$row;continue; }
            $g=&$companies[$key];
            foreach (['countries','suggestions','addresses','names'] as $field) $g[$field]=array_values(array_unique(array_merge($g[$field],$row[$field])));
            $sources=[];foreach(array_merge($g['sources'],$row['sources']) as $s) $sources[hash('sha256',json_encode($s,JSON_UNESCAPED_UNICODE))]=$s;
            $g['sources']=array_values($sources);
            $g['has_trade']=$g['has_trade']||$row['has_trade'];$g['manual']=$g['manual']||$row['manual'];
            // 保留所有已补充的通用资料，不因合并丢失国家和备注。
            foreach (['note','transport','warehouse','company'] as $field) {
                if ($row[$field]!=='' && $row[$field]!==$g[$field]) $g[$field]=$g[$field]!==''?$g[$field]."\n".$row[$field]:$row[$field];
            }
            if ($row['confirmed']&&!$g['confirmed']) $g['kind']=$row['kind'];
            $g['confirmed']=$g['confirmed']||$row['confirmed'];
            unset($g);
        }
        return $companies;
    }
    public static function countries($text) {
        static $aliases;
        if ($aliases===null) $aliases=json_decode(file_get_contents(__DIR__.'/data/countryAliases.json'),true);
        $found=[];
        foreach ($aliases as $country=>$names) {
            foreach ($names as $name) {
                $p=preg_quote($name,'~');
                $pattern=preg_match('/\p{Han}/u',$name) ? '~'.$p.'~u' : '~(?<![\p{L}\p{N}])'.$p.'(?![\p{L}\p{N}])~iu';
                if (preg_match($pattern,(string)$text)) {$found[]=$country;break;}
            }
        }
        // 刚果共和国/民主共和国不能同时再被短名“刚果”覆盖。
        return array_values(array_unique($found));
    }
    public static function build(array $customers, array $traded) {
        $groups=[];
        foreach ($customers as $customer) {
            $contacts=json_decode($customer['contacts'] ?? '',true);
            if (!is_array($contacts)) continue;
            foreach ($contacts as $contact) {
                if (!is_array($contact)) continue;
                $key=self::legacyKey($contact);if (!$key) continue;
                $explicit=self::countries(($contact['data'] ?? '')."\n".($customer['data'] ?? ''));
                $fromPhone=CustomerPhone::country($customer['number'] ?? '');
                $suggestions=array_values(array_unique(array_merge($explicit,$fromPhone?[$fromPhone]:[])));
                if (!isset($groups[$key])) $groups[$key]=[
                    'key'=>$key,'company'=>'','name'=>(string)($contact['name']??''),'tel'=>(string)($contact['tel']??''),
                    'address'=>(string)($contact['add']??''),'kind'=>'candidate','countries'=>[], 'transport'=>'',
                    'warehouse'=>'','note'=>'','manual'=>false,'suggestions'=>[],'sources'=>[],'has_trade'=>false,'confirmed'=>false
                ];
                $g=&$groups[$key];$g['suggestions']=array_values(array_unique(array_merge($g['suggestions'],$suggestions)));
                $g['has_trade']=$g['has_trade'] || isset($traded[$customer['id']]);
                $source=['id'=>$customer['id'],'name'=>$customer['name'],'number'=>$customer['number'],
                    'customer_note'=>$customer['data'],'contact'=>$contact,'countries'=>$suggestions,'has_trade'=>isset($traded[$customer['id']])];
                // 同一客户也可能录入重复联系人，只保留一份相同来源。
                $sourceKey=hash('sha256',json_encode($source,JSON_UNESCAPED_UNICODE));$g['sources'][$sourceKey]=$source;
                unset($g);
            }
        }
        foreach ($groups as &$g) $g['sources']=array_values($g['sources']);
        return $groups;
    }
}
