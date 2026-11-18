<?php
namespace app\service;

/** 与后台手机号识别使用同一份 libphonenumber 国家数据，不接收客户端推断的国家。 */
class CustomerPhone
{
    private static $metadata;
    private static function metadata() {
        if (self::$metadata === null) self::$metadata = json_decode(file_get_contents(__DIR__.'/data/phoneCountries.json'), true);
        return self::$metadata;
    }
    public static function normalize($phone) {
        $digits = preg_replace('/[^0-9]/', '', (string)$phone);
        return substr($digits,0,2)==='00' ? substr($digits,2) : $digits;
    }
    public static function country($phone) {
        if (!preg_match('/^\+?[\d\s().-]+$/u', trim((string)$phone))) return '';
        $digits = self::normalize($phone); $data = self::metadata();
        for ($n=1; $n<=3; $n++) {
            $code = substr($digits,0,$n);
            if (!isset($data['callingCodes'][$code])) continue;
            $national = substr($digits,$n); $countries = $data['callingCodes'][$code];
            foreach ($countries as $iso) {
                if (!isset($data['countries'][$iso])) continue;
                $c=$data['countries'][$iso];
                if (!in_array(strlen($national),$c['lengths'],true)) continue;
                if (count($countries)===1) return $c['name'];
                if ($c['leading']) {
                    if (preg_match('~^(?:'.$c['leading'].')~D',$national)) return $c['name'];
                } elseif (preg_match('~^(?:'.$c['pattern'].')$~D',$national)) {
                    foreach ($c['types'] as $pattern) if (preg_match('~^(?:'.$pattern.')$~D',$national)) return $c['name'];
                }
            }
            return '';
        }
        return '';
    }
    public static function remark($remark, $country) {
        if (!$country) return (string)$remark;
        $names = array_column(self::metadata()['countries'],'name');
        $lines = preg_split('/\r?\n/', (string)$remark); $replaced=false;
        foreach ($lines as &$line) {
            if (preg_match('/^(?:国家\/地区[：:]|Country\s*:)/ui',trim($line))) {
                // 兼容旧线上选品 "Country: Mozambique; 用户备注"，保留其后内容。
                $parts=preg_split('/[;；]/u',$line,2); $line=$country.(isset($parts[1])?"\n".ltrim($parts[1]):''); $replaced=true;
            } elseif (in_array(trim($line),$names,true)) { $line=$country; $replaced=true; }
        }
        unset($line);
        if (!$replaced) array_unshift($lines,$country);
        return implode("\n",array_filter($lines,function($s){return trim($s)!=='';}));
    }
}
