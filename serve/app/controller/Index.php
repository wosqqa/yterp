<?php
namespace app\controller;
use think\facade\View;
class Index{
    public function index(){
        // 模板输出
        return response(View::fetch('index'))->header([
            'Cache-Control' => 'no-store, max-age=0',
            'Pragma' => 'no-cache',
        ]);
    }
}