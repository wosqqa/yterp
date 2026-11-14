<?php
namespace app\validate;
use think\Validate;
class Code extends Validate {
    //常规验证规则
    protected $rule = [
        'name' => ['require'],
        'info' => ['require','max:2048','checkLink'],
        'type' => ['require','integer','in:0,1,2']
    ];

    //常规规则提示
    protected $message = [
        'name.require' => '条码名称不可为空!',
        'info.require' => '条码内容不可为空!',
        'type.require' => '条码类型不可为空!',
        'type.integer' => '条码类型不正确!'
    ];

    protected function checkLink($value, $rule, $data = []) {
        if ((int) ($data['type'] ?? -1) !== 2) return true;
        $scheme = strtolower((string) parse_url($value, PHP_URL_SCHEME));
        return in_array($scheme, ['http', 'https'], true) && filter_var($value, FILTER_VALIDATE_URL)
            ? true : '请输入有效的 http:// 或 https:// 链接!';
    }

    //场景规则
    protected $scene = [
        'update' => ['name','info','type']
    ];
}