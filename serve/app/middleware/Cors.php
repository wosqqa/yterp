<?php 
namespace app\middleware;
class Cors{
	//中间件跨域配置
	public function handle($request, \Closure $next){
		$origin = isset($_SERVER['HTTP_ORIGIN']) ? trim((string)$_SERVER['HTTP_ORIGIN']) : '';
		if ($origin === '' || $origin === 'null' || $origin === 'file://') {
			$origin = '*';
		}
		header('Access-Control-Allow-Origin: ' . $origin, true);
		header('Access-Control-Allow-Credentials: true', true);
		header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD', true);
		header('Access-Control-Allow-Headers: Accept, X-PINGARUNER, CONTENT-TYPE, X-Requested-With, Token, Authorization, Cache-Control, Pragma, Origin, X-Forwarded-For, X-Real-IP, X-HTTP-Method-Override, Range', true);
		header('Access-Control-Expose-Headers: Content-Disposition, Content-Length, X-Request-Id', true);
		header('Access-Control-Max-Age: 86400', true);
		return $next($request);
    }
}