<?php
namespace app\controller;
use app\BaseController;
use app\model\Goods;
use app\model\User;
use think\facade\Db;
use think\facade\Request;
class Api extends BaseController{
    //登陆
    public function login(){
        $input=input('post.');
        if(existFull($input,['user','pwd','uuid'])){
            $sql=fastSql($input,[
                [['user'=>'user|tel'],'eq'],
                ['pwd','md5']
            ]);
            $user=User::where($sql)->field(['id','name','tel','frame','user','img'])->find();
            if(empty($user)){
                $result=['state'=>'error','info'=>'账号|手机号或密码不正确!'];
            }else{
                $token=token();
                cache($token,['user'=>$user['id'],'frame'=>[]]);
                cache($input['uuid'],null);
                pushLog('登录成功',$user['id']);
                $result=['state'=>'success','info'=>$user,'token'=>$token];
            }
        }else{
            $result=['state'=>'error','info'=>'传入参数不完整!'];
        }
        return json($result);
    }
    //获取验证
    public function captcha(){
        $uuid=uuid();
        $captcha=new \org\Captcha();
        $info=$captcha->entry();
        cache($uuid,$info['code']);
        return json(['state'=>'success','info'=>['uuid'=>$uuid,'data'=>$info['data']]]);
    }
    //运行数据
    public function runData(){
        return json([
            'state'=>'success',
            'info'=>[
                'login'=>checkLogin(),
                'sys'=>getSys(['name','company','icp','notice']),
                'ver'=>config('soft.version')
            ]
        ]);
    }

    // 公开商品基础信息
    public function publicGoods(){
        $input = array_merge([
            'brand' => 'smiggle',
            'category' => null,
            'code' => '',
            'data' => '',
            'limit' => 30,
            'name' => '',
            'number' => '',
            'page' => 1,
            'sort' => 'numberAsc',
            'spec' => '',
            'type' => ''
        ], input('param.'));

        $page = max(1, intval($input['page']));
        $limit = intval($input['limit']);
        $limit = $limit <= 0 ? 30 : min($limit, 100);
        $sort = trim(strval($input['sort'] ?? 'numberAsc'));
        $slug = trim(strval($input['slug'] ?? ''));
        $id = intval($input['id'] ?? 0);

        $sql = fastSql($input,[
            ['name','fullLike'],
            ['number','fullLike'],
            ['spec','fullLike'],
            ['brand','fullLike'],
            ['code','fullLike'],
            ['type','fullDec1'],
            ['data','fullLike']
        ]);

        if(array_key_exists('category',$input) && $input['category'] !== null && $input['category'] !== '' && $input['category'] !== 'null'){
            $categoryIds = [];
            $categoryInput = is_array($input['category']) ? $input['category'] : explode(',',strval($input['category']));
            foreach ($categoryInput as $categoryValue){
                $categoryValue = trim(strval($categoryValue));
                if($categoryValue === ''){
                    continue;
                }
                $categoryIds = array_merge($categoryIds,findTreeArr('category',$categoryValue,'id'));
            }
            $categoryIds = array_values(array_unique(array_filter($categoryIds)));
            !empty($categoryIds)&&$sql[] = ['category','in',$categoryIds];
        }

        if($id <= 0 && $slug !== ''){
            $id = $this->parsePublicGoodsSlugId($slug);
        }
        if($id > 0){
            $sql[] = ['id','=',$id];
        }

        $count = Goods::where($sql)->count();
        $query = Goods::with(['categoryData'])->where($sql)->page($page,$limit)->order(['id'=>'desc']);
        $info = $query->select()->toArray();
        usort($info,function($a,$b) use($sort){
            $aCategorySort = isset($a['categoryData']['sort']) ? intval($a['categoryData']['sort']) : 999999;
            $bCategorySort = isset($b['categoryData']['sort']) ? intval($b['categoryData']['sort']) : 999999;
            if($aCategorySort !== $bCategorySort){
                return $aCategorySort <=> $bCategorySort;
            }
            if($sort === 'priceAsc'){
                return floatval($a['sell'] ?? 0) <=> floatval($b['sell'] ?? 0);
            }
            if($sort === 'priceDesc'){
                return floatval($b['sell'] ?? 0) <=> floatval($a['sell'] ?? 0);
            }
            if($sort === 'alphaAsc'){
                return strcmp(strtolower(strval($a['name'] ?? '')), strtolower(strval($b['name'] ?? '')));
            }
            if($sort === 'alphaDesc'){
                return strcmp(strtolower(strval($b['name'] ?? '')), strtolower(strval($a['name'] ?? '')));
            }
            return $this->comparePublicGoodsNumber($a['number'] ?? '',$b['number'] ?? '');
        });

        $goodsIds = array_column($info,'id');
        $roomStock = [];
        if(!empty($goodsIds)){
            $roomStock = Db::name('room')
                ->where([['goods','in',$goodsIds]])
                ->field('goods,SUM(nums) as nums')
                ->group('goods')
                ->select()
                ->toArray();
        }

        foreach ($info as $infoKey=>$infoVo) {
            $stockFind = empty($roomStock) ? [] : search($roomStock)->where([['goods','=',$infoVo['id']]])->find();
            $stockQty = empty($stockFind) ? 0 : floatval($stockFind['nums']);
            $imageUrl = $this->pickPublicGoodsImage($infoVo);
            $price = isset($infoVo['sell']) ? floatval($infoVo['sell']) : 0;
            $compareAt = isset($infoVo['retail']) ? floatval($infoVo['retail']) : 0;
            $categoryData = $this->sanitizePublicCategoryData($infoVo['categoryData'] ?? null);
            $categoryLabel = '';
            if(!empty($categoryData)){
                if(!empty($categoryData['data'])){
                    $categoryLabel = $categoryData['data'];
                }elseif(!empty($categoryData['details'])){
                    $categoryLabel = $categoryData['details'];
                }else{
                    $categoryLabel = $categoryData['name'];
                }
            }
            $info[$infoKey] = [
                'id' => strval($infoVo['id']),
                'name' => $infoVo['name'],
                'brand' => empty($infoVo['brand']) ? '' : $infoVo['brand'],
                'title' => $infoVo['name'],
                'productType' => $categoryLabel,
                'category' => $categoryLabel,
                'categoryData' => $categoryData,
                'categorySort' => empty($categoryData) ? 999999 : intval($categoryData['sort'] ?? 999999),
                'slug' => $this->buildPublicGoodsSlug($infoVo['name'],$infoVo['id']),
                'number' => empty($infoVo['number']) ? '' : $infoVo['number'],
                'spec' => empty($infoVo['spec']) ? '' : $infoVo['spec'],
                'code' => empty($infoVo['code']) ? '' : $infoVo['code'],
                'data' => empty($infoVo['data']) ? '' : $infoVo['data'],
                'inStock' => bccomp(strval($stockQty),'0',4) === 1,
                'stockQty' => $stockQty,
                'sell' => $price,
                'priceCny' => $price,
                'compareAtCny' => $compareAt > $price ? $compareAt : null,
                'image' => [
                    'bg' => $imageUrl === '' ? '' : "url('".$imageUrl."')",
                    'label' => empty($infoVo['number']) ? $infoVo['name'] : $infoVo['number']
                ],
                'imageUrl' => $imageUrl
            ];
        }

        return json([
            'state' => 'success',
            'count' => $count,
            'page' => $page,
            'limit' => $limit,
            'info' => $info
        ]);
    }

    // 公开商品分类
    public function publicGoodsCategories(){
        $input = array_merge([
            'brand' => 'smiggle',
            'data' => ''
        ], input('param.'));
        $sql = fastSql($input,[
            ['brand','fullLike'],
            ['data','fullLike']
        ]);
        $categoryIds = Db::name('goods')
            ->where($sql)
            ->where([['category','>',0]])
            ->group('category')
            ->column('category');
        $categoryIds = array_values(array_unique(array_filter($categoryIds)));
        if(empty($categoryIds)){
            return json(['state'=>'success','info'=>[]]);
        }
        $info = Db::name('category')
            ->where([['id','in',$categoryIds]])
            ->order(['sort'=>'asc','id'=>'asc'])
            ->select()
            ->toArray();
        foreach ($info as $infoKey=>$infoVo){
            $label = empty($infoVo['data']) ? (empty($infoVo['details']) ? $infoVo['name'] : $infoVo['details']) : $infoVo['data'];
            $info[$infoKey] = [
                'id' => intval($infoVo['id']),
                'name' => empty($infoVo['name']) ? '' : $infoVo['name'],
                'label' => $label,
                'sort' => intval($infoVo['sort'] ?? 999999),
                'pid' => intval($infoVo['pid'] ?? 0)
            ];
        }
        return json(['state'=>'success','info'=>$info]);
    }

    private function buildPublicGoodsSlug($name,$id){
        $text = strtolower(trim(strval($name)));
        $text = preg_replace('/[^a-z0-9]+/','-',$text);
        $text = trim($text,'-');
        if($text === ''){
            $text = 'goods';
        }
        return $text.'-'.intval($id);
    }

    private function parsePublicGoodsSlugId($slug){
        preg_match('/(\d+)$/',strval($slug),$match);
        return empty($match[1]) ? 0 : intval($match[1]);
    }

    private function comparePublicGoodsNumber($a,$b){
        $aText = trim(strtolower(strval($a)));
        $bText = trim(strtolower(strval($b)));
        $aIsNumber = preg_match('/^[0-9]+/',$aText) === 1;
        $bIsNumber = preg_match('/^[0-9]+/',$bText) === 1;
        $aIsSPrefix = preg_match('/^s[0-9]+/',$aText) === 1;
        $bIsSPrefix = preg_match('/^s[0-9]+/',$bText) === 1;
        $aRank = $aIsNumber ? 0 : ($aIsSPrefix ? 1 : 2);
        $bRank = $bIsNumber ? 0 : ($bIsSPrefix ? 1 : 2);
        if($aRank !== $bRank){
            return $aRank <=> $bRank;
        }
        if($aIsNumber){
            $aNumber = intval($aText);
            $bNumber = intval($bText);
            if($aNumber !== $bNumber){
                return $aNumber <=> $bNumber;
            }
        }elseif($aIsSPrefix){
            $aNumber = intval(substr($aText,1));
            $bNumber = intval(substr($bText,1));
            if($aNumber !== $bNumber){
                return $aNumber <=> $bNumber;
            }
        }
        return strcmp($aText,$bText);
    }

    private function sanitizePublicCategoryData($categoryData){
        if(empty($categoryData) || !is_array($categoryData)){
            return null;
        }
        unset($categoryData['factory_price']);
        return $categoryData;
    }

    private function pickPublicGoodsImage($goods){
        if(empty($goods['imgs']) || !is_array($goods['imgs'])){
            return '';
        }
        $first = $goods['imgs'][0] ?? [];
        if(empty($first) || !is_array($first)){
            return '';
        }
        return empty($first['url']) ? '' : strval($first['url']);
    }
}
