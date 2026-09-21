<?php
namespace app\controller;
use app\controller\Acl;
use app\model\{Goods,Serial,Batch,Cost};
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx as XlsxWriter;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use think\facade\{Db,Filesystem};
use think\exception\ValidateException;
class Service extends Acl {
    //基础数据
    public function store() {
        $tree = new \org\Tree();
        //获取用户权限架构数据
        $userFrame = getUserAuth('frame');
        if($userFrame=='all'){
            $frame=$tree::hTree(Db::name('frame')->select()->toArray(),-1);
        }else{
            $frame=Db::name('frame')->where([['id','in',$userFrame]])->select()->toArray();
            //追加子数据
            foreach ($frame as $frameKey=>$frameVo) {
                $frame[$frameKey]['sub']=[];
            }
        }
        //获取用户权限菜单
        $menu = $tree::hTree(getRootMemu());
        //获取全局字段配置
        $fields = getFields();
        //获取用户权限数据
        $root = getUserRoot();
        //获取商品类别数据
        $category = $tree::hTree(Db::name('category')->order(['sort'=>'asc'])->select()->toArray(),-1);
        //获取仓库数据
        $warehouse=Db::name('warehouse')->where(sqlAuth('warehouse',[]))->field(['id','name'])->order(['id'=>'desc'])->select();
        //获取资金账户
        $account=Db::name('account')->where(sqlAuth('account',[]))->field(['id','name'])->order(['id'=>'desc'])->select();
        //获取收支类别
        $ietList=Db::name('iet')->order(['sort'=>'asc'])->select()->toArray();
        $iet=['in'=>search($ietList)->where([['type','=',0]])->select(),'out'=>search($ietList)->where([['type','=',1]])->select()];
        //获取常用功能
        $often = Db::name('often')->where([['user','=',getUserId()]])->field(['name','key'])->select();
        //获取系统参数
        $sys = getSys(['name','icp','notice','brand','unit','crCategory','crGrade','srCategory','fun','logistics']);
        //返回数据
        return json(['state' => 'success','info' => [
            'frame' => $frame,
            'menu' => $menu,
            'fields' => $fields,
            'root'=>$root,
            'category' => $category,
            'warehouse' => $warehouse,
            'account' => $account,
            'iet' => $iet,
            'often' => $often,
            'sys' => $sys
        ]]);
    }
    //获取|组织数据
    public function getFrame(){
        $cache=cache(getToken());
        $result = ['state' => 'success','info'=>isset($cache['frame'])?$cache['frame']:[]];
        return json($result);
    }
    //保存|组织数据
    public function saveFrame(){
        $input=input('post.');
        if(existFull($input,['parm']) || is_array($input['parm'])){
            $token=getToken();
            $cache=cache($token);
            $cache['frame']=$input['parm'];
            cache($token,$cache);
            $result = ['state' => 'success'];
        }else{
            $result = ['state' => 'error','info' => '传入参数不完整!'];
        }
        return json($result);
    }
    //获取|商品列表
    public function goodsRecord(){
        $input = input('post.');
        if (existFull($input,['page','limit'])) {
            $dataText = existFull($input,['data']) ? trim(strval($input['data'])) : '';
            $setOrderMode = $dataText !== '' && preg_match('/^set/i', $dataText);
            $sort = existFull($input,['sort']) ? trim(strval($input['sort'])) : '';
            $numbersInput = null;
            $numbersFromMate = false;
            if (existFull($input,['numbers'])) {
                $numbersInput = $input['numbers'];
            } elseif (existFull($input,['mate'])) {
                $mateText = trim(strval($input['mate']));
                if ($mateText !== '' && preg_match('/[,，]/u', $mateText)) {
                    $numbersInput = $mateText;
                    $numbersFromMate = true;
                }
            }
            $numbers = [];
            if ($numbersInput !== null) {
                if (is_string($numbersInput)) {
                    $text = trim($numbersInput);
                    if ($text !== '' && ($text[0] == '[' || $text[0] == '{')) {
                        $decoded = json_decode($text, true);
                        if (is_array($decoded)) $numbersInput = $decoded;
                    }
                }
                $parts = [];
                if (is_array($numbersInput)) {
                    $parts = $numbersInput;
                } else {
                    $parts = preg_split('/[\s,，]+/u', strval($numbersInput));
                }
                $seen = [];
                foreach ($parts as $v) {
                    $t = trim(strval($v));
                    if ($t === '') continue;
                    $k = strtolower($t);
                    if (isset($seen[$k])) continue;
                    $seen[$k] = 1;
                    $numbers[] = $t;
                }
                if ($numbersFromMate && count($numbers) <= 1) $numbers = [];
            }
            $sqlInput = $input;
            if ($setOrderMode) {
                unset($sqlInput['data']);
            }

            if (isset($sqlInput['code'])) unset($sqlInput['code']);
            if (!empty($numbers)) {
                if (isset($sqlInput['mate'])) unset($sqlInput['mate']);
                if (isset($sqlInput['numbers'])) unset($sqlInput['numbers']);
            }
            $sql=fastSql($sqlInput,[
                [['mate'=>'name|py|number|spec'],'fullLike'],
                ['brand','fullEq'],
                ['type','fullDec1'],
                ['data','fullLike']
            ]);
            if ($setOrderMode) {
                $sql[] = ['data','like',$dataText.'%'];
            }
            if (!empty($numbers)) {
                $sql[] = ['number','in',$numbers];
            }
            $categoryGroups = [];
            $categoryIds = [];
            //商品分类树结构查询
            if(existFull($input,['category'])){
                $cat=$input['category'];
                if(is_string($cat)){
                    $text=trim($cat);
                    if($text!=='' && ($text[0]=='[' || $text[0]=='{')){
                        $decoded=json_decode($text,true);
                        if(is_array($decoded)) $cat=$decoded;
                    }
                }
                if(is_string($cat) && strpos($cat,',')!==false){
                    $cat=array_filter(explode(',',$cat),function($v){return $v!=='';});
                }
                if(is_array($cat)){
                    foreach ($cat as $cid) {
                        if($cid===null || $cid==='') continue;
                        if(!is_numeric($cid) || intval($cid)<=0) continue;
                        $groupIds = array_values(array_unique(findTreeArr('category',$cid,'id')));
                        if(empty($groupIds)) continue;
                        $categoryGroups[] = $groupIds;
                        $categoryIds = array_merge($categoryIds,$groupIds);
                    }
                }else{
                    $groupIds = array_values(array_unique(findTreeArr('category',$cat,'id')));
                    if(!empty($groupIds)){
                        $categoryGroups[] = $groupIds;
                        $categoryIds = $groupIds;
                    }
                }
            }
            $categoryIds = array_values(array_unique($categoryIds));
            if ($setOrderMode && !empty($categoryGroups)) {
                $comboQuery = Db::name('goods')->where($sql)->where([['data','<>','']])->field(['data'])->group('data');
                foreach ($categoryGroups as $groupIds) {
                    $escapedIds = array_map('intval',$groupIds);
                    empty($escapedIds) || $comboQuery = $comboQuery->having('SUM(CASE WHEN category IN ('.implode(',',$escapedIds).') THEN 1 ELSE 0 END) > 0');
                }
                $matchedSetData = array_values(array_unique(array_filter(array_column($comboQuery->select()->toArray(),'data'))));
                if (empty($matchedSetData)) {
                    return json(['state' => 'success','count' => 0,'info' => []]);
                }
                $sql[] = ['data','in',$matchedSetData];
            }
            if(!empty($categoryIds)){
                $sql[]=['category','in',$categoryIds];
            }
            $orSql=[];
            if(existFull($input,['code'])){
                $barcode=strval($input['code']);
                $orSql[]=['code','=',$barcode];
                $pids=array_column(Db::name('attr')->where([['code','=',$barcode]])->select()->toArray(),'pid');
                empty($pids)||$orSql[]=['id','in',$pids];
            }
            //获取总条数
            $countQuery = Goods::where($sql);
            empty($orSql) || $countQuery = $countQuery->where(function($query)use($orSql){$query->whereOr($orSql);});
            $count = $countQuery->count();
            //查询分页数据
            $query = Goods::with(['categoryData','attr'])->where($sql);
            empty($orSql) || $query = $query->where(function($query)use($orSql){$query->whereOr($orSql);});
            $query = $query->append(['extension'])->page($input['page'],$input['limit']);
            if ($setOrderMode) {
                $query = $query->orderRaw('CAST(SUBSTRING(data, 4) AS UNSIGNED) ASC, id DESC');
            } elseif ($sort === 'numberAsc') {
                $query = $query->orderRaw("CASE WHEN `number` REGEXP '^[0-9]+' THEN 0 WHEN `number` REGEXP '^[sS][0-9]+' THEN 1 ELSE 2 END ASC, CASE WHEN `number` REGEXP '^[0-9]+' THEN CAST(`number` AS UNSIGNED) WHEN `number` REGEXP '^[sS][0-9]+' THEN CAST(SUBSTRING(`number`, 2) AS UNSIGNED) ELSE 999999999 END ASC, `number` ASC, id DESC");
            } else {
                $query = $query->order(['id'=>'desc']);
            }
            $info = $query->select()->toArray();
            //唯一标识|属性处理
            foreach ($info as $infoKey=>$infoVo) {
                $info[$infoKey]['key']=$infoVo['id'];
                foreach ($infoVo['attr'] as $attrKey=>$attrVo) {
                    $info[$infoKey]['attr'][$attrKey]['key']=$infoVo['id'].'.'.$attrVo['id'];
                    //属性处理
                    if(existFull($input,['code']) && !in_array($input['code'],[$infoVo['code'],$attrVo['code']])){
                        unset($info[$infoKey]['attr'][$attrKey]);
                    }
                }
                //重建索引
                $info[$infoKey]['attr']=array_values($info[$infoKey]['attr']);
            }
            $result = [
                'state' => 'success',
                'count' => $count,
                'info' => $info
            ];
            //返回数据
        } else {
            $result = ['state' => 'error','info' => '传入参数不完整!'];
        }
        return json($result);
    }
    //商品|扫码接口
    public function goodsScan(){
        $input = input('post.');
        if (existFull($input,['code'])) {
            $sql=[['code','=',$input['code']]];
            $sqlOr=[['id','in',array_column(Db::name('attr')->where([['code','=',$input['code']]])->select()->toArray(),'pid')]];
            //查询数据
            $info = Goods::with(['attr'])->where($sql)->whereOr($sqlOr)->order(['id'=>'desc'])->select()->toArray();
            //处理|辅助属性条形码
            foreach ($info as $infoKey=>$infoVo) {
                //匹配|有辅助属性|主条形码不同
                if(!empty($infoVo['attr']) && $infoVo['code']!=$input['code']){
                    foreach ($infoVo['attr'] as $attrKey=>$attrVo) {
                        if($attrVo['code']!=$input['code']){
                            unset($info[$infoKey]['attr'][$attrKey]);
                        }
                    }
                    //重建索引
                    $info[$infoKey]['attr']=array_values($info[$infoKey]['attr']);
                }
            }
            $result = [
                'state' => 'success',
                'info' => $info
            ];
            //返回数据
        } else {
            $result = ['state' => 'error','info' => '传入参数不完整!'];
        }
        return json($result);
    }
    //获取|库存信息
    public function goodsDepot(){
        $input = input('post.');
        if (existFull($input,['page','limit','goods']) && isset($input['attr'])){
            //查询数据
            $warehouseSql=sqlAuth('warehouse',[]);
            $count=Db::name('warehouse')->where($warehouseSql)->count();
            $warehouse=Db::name('warehouse')->where($warehouseSql)->page($input['page'],$input['limit'])->order(['id'=>'desc'])->select()->toArray();
            //匹配数据
            $room=Db::name('room')->where([['warehouse','in',array_column($warehouse,'id')],['goods','=',$input['goods']],['attr','=',$input['attr']]])->select()->toArray();
            //构造数据
            $info=[];
            foreach ($warehouse as $warehouseVo) {
                $item=['warehouse'=>$warehouseVo['id']];
                $item['name']=$warehouseVo['name'];
                //仓储查询
                $roomFind=search($room)->where([['warehouse','=',$warehouseVo['id']]])->find();
                //记录赋值
                $item['nums']=empty($roomFind)?0:floatval($roomFind['nums']);
                //记录转存
                $info[]=$item;
            }
            //数据处理|单位转换
            $goods=Db::name('goods')->where([['id','=',$input['goods']]])->find();
            if($goods['unit']=='-1'){
                foreach ($info as $infoKey=>$infoVo) {
                    $info[$infoKey]['nums']=unitSwitch($infoVo['nums'],json_decode($goods['units'],true));
                }
            }
            //返回数据
            $result = [
                'state' => 'success',
                'count' => $count,
                'info' => $info
            ];
        } else {
            $result = ['state' => 'error','info' => '传入参数不完整!'];
        }
        return json($result);
    }
    //商品|最近价格
    public function recentPrice(){
        $input = input('post.');
        if(existFull($input,['model','source','goods']) && in_array($input['model'],['bor','buy','bre','sor','sell','sre']) && isset($input['attr']) && isset($input['unit'])){
            $model=$input['model'];
            //构造CLASS条件
            $sql=[['examine','=',1]];
            //场景匹配
            in_array($model,['bor','buy','bre'])&&$sql[]=['supplier','=',$input['source']];//供应商
            in_array($model,['sor','sell','sre'])&&$sql[]=['customer','=',$input['source']];//客户
            //查询CLASS数据
            $sql=sqlAuth($model,$sql);//数据鉴权
            $class=Db::name($model)->where($sql)->field(['id'])->order(['id'=>'desc'])->select()->toArray();
            if(empty($class)){
                $result = ['state' => 'success','info' => 0];
            }else{
                //查询INFO数据
                $parm=[
                    ['pid','in',array_column($class,'id')],
                    ['goods','=',$input['goods']],
                    ['attr','=',$input['attr']],
                    ['unit','=',$input['unit']]
                ];
                $info=Db::name($model.'_info')->where($parm)->order(['pid'=>'desc'])->find();
                if(empty($info)){
                    $result = ['state' => 'success','info' => 0];
                }else{
                    $result = ['state' => 'success','info' => floatval($info['price'])];
                }
            }
        } else {
            $result = ['state' => 'error','info' => '传入参数不完整!'];
        }
        return json($result);
    }
    //商品序列号
    public function getSerial(){
        $input = input('post.');
        if(existFull($input,['page','limit','warehouse','goods']) && isset($input['attr']) && isset($input['batch']) && isset($input['mfd']) && isset($input['state'])){
            $room=Db::name('room')->where([['warehouse','=',$input['warehouse']],['goods','=',$input['goods']],['attr','=',$input['attr']]])->find();
            if(empty($room)){
                $result = ['state' => 'success','count' => 0,'info' => []];
            }else{
                if(empty($input['batch'])){
                    $batch=['id'=>0];
                }else{
                    $batch=Db::name('batch')->where([['room','=',$room['id']],['number','=',$input['batch']],['time','=',empty($input['mfd'])?0:strtotime($input['mfd'])]])->find();
                    if(empty($batch)){
                        return json(['state' => 'success','count' => 0,'info' => []]);
                        exit;
                    }
                }
                $count=Serial::where([['room','=',$room['id']],['batch','=',$batch['id']],['state','=',$input['state']]])->count();
                $info=Serial::where([['room','=',$room['id']],['batch','=',$batch['id']],['state','=',$input['state']]])->append(['extension'])->page($input['page'],$input['limit'])->order(['id'=>'asc'])->select();
                $result = ['state' => 'success','count' => $count,'info' => $info];
            }
        }else{
            $result = ['state' => 'error','info' => '传入参数不完整!'];
        }
        return json($result);
    }
    //商品批次号
    public function getBatch(){
        $input = input('post.');
        if(existFull($input,['page','limit','warehouse','goods']) && isset($input['attr'])){
            //匹配仓储
            $room=Db::name('room')->where([['warehouse','=',$input['warehouse']],['goods','=',$input['goods']],['attr','=',$input['attr']]])->find();
            if(empty($room)){
                $result = ['state' => 'success','count' => 0,'info' => []];
            }else{
                //匹配批次号
                $sql=fastSql($input,[
                    ['number','fullLike'],
                    [['startTime'=>'time'],'startTime'],
                    [['endTime'=>'time'],'endTime']
                ]);//构造SQL
                $sql[]=['room','=',$room['id']];
                $count=Batch::where($sql)->count();
                $info=Batch::where($sql)->page($input['page'],$input['limit'])->order(['id'=>'asc'])->select()->toArray();
                //数据处理|单位转换
                $goods=Db::name('goods')->where([['id','=',$input['goods']]])->find();
                if($goods['unit']=='-1'){
                    foreach ($info as $infoKey=>$infoVo) {
                        $info[$infoKey]['nums']=unitSwitch($infoVo['nums'],json_decode($goods['units'],true));
                    }
                }
                $result = ['state' => 'success','count' => $count,'info' => $info];
            }
        }else{
            $result = ['state' => 'error','info' => '传入参数不完整!'];
        }
        return json($result);
    }
    //单据列表
    public function billRecord(){
        $input = input('post.');
        if (existFull($input,['page','limit','mold']) && in_array($input['mold'],['imy','omy','buy','bre','sell','sre','ice','oce'])) {
            if(in_array($input['mold'],['omy','buy','bre','oce'])){
                $sql=fastSql($input,[
                    ['supplier','fullEq'],
                    ['number','fullLike'],
                    [['startTime'=>'time'],'startTime'],
                    [['endTime'=>'time'],'endTime'],
                    ['user','fullEq'],
                    ['data','fullLike']
                ]);
            }else{
                $sql=fastSql($input,[
                    ['customer','fullEq'],
                    ['number','fullLike'],
                    [['startTime'=>'time'],'startTime'],
                    [['endTime'=>'time'],'endTime'],
                    ['user','fullEq'],
                    ['data','fullLike']
                ]);
            }
            $sql[]=['examine','=',1];
            $sql[]=existFull($input,['nucleus'])?['nucleus','=',$input['nucleus']-1]:['nucleus','in',[0,1]];
            $sql=sqlAuth($input['mold'],$sql);//数据鉴权
            $table=['imy'=>'\app\model\Imy','omy'=>'\app\model\Omy','buy'=>'\app\model\Buy','bre'=>'\app\model\Bre','sell'=>'\app\model\Sell','sre'=>'\app\model\Sre','ice'=>'\app\model\Ice','oce'=>'\app\model\Oce'];
            $count = $table[$input['mold']]::where($sql)->count();//获取总条数
            $info = $table[$input['mold']]::with(['frameData','userData'])->where($sql)->append(['extension'])->page($input['page'],$input['limit'])->order(['id'=>'desc'])->select()->toArray();//查询分页数据
            //数据处理
            foreach ($info as $key=>$vo) {
                in_array($input['mold'],['buy','bre','sell','sre','ice','oce'])&&$info[$key]['total']=$vo['actual'];
            }
            $result = [
                'state' => 'success',
                'count' => $count,
                'info' => $info
            ];
            //返回数据
        } else {
            $result = ['state' => 'error','info' => '传入参数不完整!'];
        }
        return json($result);
    }
    //匹配|下拉接口
    public function getScene() {
        $input = input('post.');
        if (existFull($input,['id','scene'])) {
            $find=Db::name($input['scene'])->where([['id','=',$input['id']]])->find();
            $result=['state' => 'success','info' => $find];
        } else {
            $result = ['state' => 'error','info' => '传入参数不完整!'];
        }
        return json($result);
    }
    //用户角色|下拉接口
    public function roleRecord() {
        $input = input('post.');
        if (existFull($input,['page','limit'])) {
            //构造SQL
            $sql = fastSql($input,[
                [['query'=>'name|py'],'fullLike']
            ]);
            $count = Db::name('role')->where($sql)->count();
            //获取总条数
            $info = Db::name('role')->where($sql)->page($input['page'],$input['limit'])->order(['id'=>'desc'])->select()->toArray();
            //查询分页数据
            $result = [
                'state' => 'success',
                'count' => $count,
                'info' => $info
            ];
            //返回数据
        } else {
            $result = ['state' => 'error','info' => '传入参数不完整!'];
        }
        return json($result);
    }
    //用户数据|下拉接口
    public function userRecord() {
        $input = input('post.');
        if (existFull($input,['page','limit'])) {
            //构造SQL
            $sql = fastSql($input,[
                [['query'=>'name|py'],'fullLike']
            ]);
            isset($input['noAuth']) || ($sql = sqlAuth('user',$sql));
            //数据鉴权
            $count = Db::name('user')->where($sql)->count();
            //获取总条数
            $info = Db::name('user')->where($sql)->page($input['page'],$input['limit'])->order(['id'=>'desc'])->select()->toArray();
            //查询分页数据
            $result = [
                'state' => 'success',
                'count' => $count,
                'info' => $info
            ];
            //返回数据
        } else {
            $result = ['state' => 'error','info' => '传入参数不完整!'];
        }
        return json($result);
    }
    //人员数据|下拉接口
    public function peopleRecord() {
        $input = input('post.');
        if (existFull($input,['page','limit'])) {
            //构造SQL
            $sql = fastSql($input,[
                [['query'=>'name|py'],'fullLike']
            ]);
            isset($input['noAuth']) || ($sql = sqlAuth('people',$sql));
            //数据鉴权
            $count = Db::name('people')->where($sql)->count();
            //获取总条数
            $info = Db::name('people')->where($sql)->page($input['page'],$input['limit'])->order(['id'=>'desc'])->select()->toArray();
            //查询分页数据
            $result = [
                'state' => 'success',
                'count' => $count,
                'info' => $info
            ];
            //返回数据
        } else {
            $result = ['state' => 'error','info' => '传入参数不完整!'];
        }
        return json($result);
    }
    //仓库数据|下拉接口
    public function warehouseRecord() {
        $input = input('post.');
        if (existFull($input,['page','limit'])) {
            //构造SQL
            $sql = fastSql($input,[
                [['query'=>'name|py'],'fullLike']
            ]);
            $sql = sqlAuth('warehouse',$sql);//数据鉴权
            $count = Db::name('warehouse')->where($sql)->count();
            //获取总条数
            $info = Db::name('warehouse')->where($sql)->page($input['page'],$input['limit'])->order(['id'=>'desc'])->select()->toArray();
            //查询分页数据
            $result = [
                'state' => 'success',
                'count' => $count,
                'info' => $info
            ];
            //返回数据
        } else {
            $result = ['state' => 'error','info' => '传入参数不完整!'];
        }
        return json($result);
    }
    //供应商数据|下拉接口
    public function supplierRecord() {
        $input = input('post.');
        if (existFull($input,['page','limit'])) {
            //构造SQL
            $sql = fastSql($input,[
                [['query'=>'name|py'],'fullLike']
            ]);
            $sql = sqlAuth('supplier',$sql);//数据鉴权
            $count = Db::name('supplier')->where($sql)->count();
            //获取总条数
            $info = Db::name('supplier')->where($sql)->page($input['page'],$input['limit'])->order(['id'=>'desc'])->select()->toArray();
            //查询分页数据
            $result = [
                'state' => 'success',
                'count' => $count,
                'info' => $info
            ];
            //返回数据
        } else {
            $result = ['state' => 'error','info' => '传入参数不完整!'];
        }
        return json($result);
    }
    //客户数据|下拉接口
    public function customerRecord() {
        $input = input('post.');
        if (existFull($input,['page','limit'])) {
            //构造SQL
            $sql = fastSql($input,[
                [['query'=>'name|py|contacts'],'fullLike']
            ]);
            $sql = sqlAuth('customer',$sql);//数据鉴权
            $count = Db::name('customer')->where($sql)->count();
            //获取总条数
            $info = Db::name('customer')->where($sql)->page($input['page'],$input['limit'])->order(['id'=>'desc'])->select()->toArray();
            //查询分页数据
            $result = [
                'state' => 'success',
                'count' => $count,
                'info' => $info
            ];
            //返回数据
        } else {
            $result = ['state' => 'error','info' => '传入参数不完整!'];
        }
        return json($result);
    }
    //资金账户|下拉接口
    public function accountRecord() {
        $input = input('post.');
        if (existFull($input,['page','limit'])) {
            //构造SQL
            $sql = fastSql($input,[
                [['query'=>'name'],'fullLike']
            ]);
            $sql = sqlAuth('account',$sql);//数据鉴权
            $count = Db::name('account')->where($sql)->count();
            //获取总条数
            $info = Db::name('account')->where($sql)->page($input['page'],$input['limit'])->order(['id'=>'desc'])->select()->toArray();
            //查询分页数据
            $result = [
                'state' => 'success',
                'count' => $count,
                'info' => $info
            ];
        } else {
            $result = ['state' => 'error','info' => '传入参数不完整!'];
        }
        return json($result);
    }
    //收支类别|下拉接口
    public function ietRecord() {
        $input = input('post.');
        if (existFull($input,['page','limit'])) {
            //构造SQL
            $sql = fastSql($input,[
                [['query'=>'name'],'fullLike']
            ]);
            $count = Db::name('iet')->where($sql)->count();
            //获取总条数
            $info = Db::name('iet')->where($sql)->page($input['page'],$input['limit'])->order(['id'=>'desc'])->select()->toArray();
            //查询分页数据
            $result = [
                'state' => 'success',
                'count' => $count,
                'info' => $info
            ];
        } else {
            $result = ['state' => 'error','info' => '传入参数不完整!'];
        }
        return json($result);
    }
    //费用详情|数据接口
    public function getCost() {
        $input = input('post.');
        if (existFull($input,['cost'])) {
            $info=Cost::with(['sourceData','ietData'])->where([['id','=',$input['cost']]])->append(['extension'])->find()->toArray();
            $info['uat']=math()->chain($info['money'])->sub($info['settle'])->done();
            $result = ['state' => 'success','info' => $info];
        } else {
            $result = ['state' => 'error','info' => '传入参数不完整!'];
        }
        return json($result);
    }

    public function exportXlsx(){
        $input=input('post.');
        $template=isset($input['template'])?trim(strval($input['template'])):'';
        $fileNameRaw=isset($input['fileName'])?trim(strval($input['fileName'])):'';
        $fileName=$fileNameRaw==''?'export.xlsx':$fileNameRaw;
        preg_match('/\.xlsx$/i',$fileName)||($fileName.='.xlsx');
        $fileName=preg_replace('/[\\\\\/\:\*\?\"\<\>\|]/','_',$fileName);
        $sheetNameRaw=isset($input['sheetName'])?trim(strval($input['sheetName'])):'';
        $sheetName=$sheetNameRaw==''?'Sheet1':$sheetNameRaw;
        $sheetName=substr($sheetName,0,31);

        $decodeJson=function($val){
            if(is_array($val)) return $val;
            if(!is_string($val)) return [];
            $text=trim($val);
            if($text=='' || ($text[0] != '{' && $text[0] != '[')) return [];
            $decoded=json_decode($text,true);
            return is_array($decoded)?$decoded:[];
        };

        $moneyToNumber=function($v){
            $s=$v===null?'':strval($v);
            $s=str_replace([','],[''],$s);
            $s=preg_replace('/[^\d\.\-]/','',$s);
            return is_numeric($s)?floatval($s):0;
        };

        $tmpFiles=[];
        $fetchImageToTemp=function($url) use (&$tmpFiles){
            $u=trim(strval($url));
            if($u=='' || !preg_match('/^https?:\/\//i',$u)) return null;
            $maxBytes=2*1024*1024;
            $bin=null;
            $contentType='';
            if(function_exists('curl_init')){
                $ch=curl_init();
                curl_setopt($ch,CURLOPT_URL,$u);
                curl_setopt($ch,CURLOPT_RETURNTRANSFER,true);
                curl_setopt($ch,CURLOPT_FOLLOWLOCATION,true);
                curl_setopt($ch,CURLOPT_MAXREDIRS,3);
                curl_setopt($ch,CURLOPT_CONNECTTIMEOUT,3);
                curl_setopt($ch,CURLOPT_TIMEOUT,8);
                curl_setopt($ch,CURLOPT_SSL_VERIFYPEER,false);
                curl_setopt($ch,CURLOPT_SSL_VERIFYHOST,false);
                $data=curl_exec($ch);
                $contentType=strval(curl_getinfo($ch,CURLINFO_CONTENT_TYPE));
                $code=intval(curl_getinfo($ch,CURLINFO_RESPONSE_CODE));
                curl_close($ch);
                if($code>=200 && $code<300 && is_string($data) && strlen($data)>0 && strlen($data)<=$maxBytes){
                    $bin=$data;
                }
            }else{
                $ctx=stream_context_create(['http'=>['timeout'=>8]]);
                $data=@file_get_contents($u,false,$ctx);
                if(is_string($data) && strlen($data)>0 && strlen($data)<=$maxBytes){
                    $bin=$data;
                }
            }
            if($bin===null) return null;
            $ext='jpeg';
            if(preg_match('/png/i',$contentType) || preg_match('/\.png(\?|$)/i',$u)) $ext='png';
            $base=tempnam(sys_get_temp_dir(),'xlsximg_');
            if($base===false) return null;
            @unlink($base);
            $path=$base.'.'.$ext;
            $ok=@file_put_contents($path,$bin);
            if($ok===false) return null;
            $tmpFiles[]=$path;
            return $path;
        };

        try{
            $spreadsheet=new Spreadsheet();
            $sheet=$spreadsheet->getActiveSheet();
            $sheet->setTitle($sheetName);
            $sheet->freezePane('A11');
            $sheet->getPageSetup()->setFitToPage(true);
            $sheet->getPageSetup()->setFitToWidth(1);
            $sheet->getPageSetup()->setFitToHeight(0);
            $sheet->getPageSetup()->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_PORTRAIT);
            $sheet->getPageMargins()->setLeft(0.3);
            $sheet->getPageMargins()->setRight(0.3);
            $sheet->getPageMargins()->setTop(0.5);
            $sheet->getPageMargins()->setBottom(0.5);
            $sheet->getPageMargins()->setHeader(0.2);
            $sheet->getPageMargins()->setFooter(0.2);

            $sheet->getColumnDimension('A')->setWidth(6);
            $sheet->getColumnDimension('B')->setWidth(18);
            $sheet->getColumnDimension('C')->setWidth(16);
            $sheet->getColumnDimension('D')->setWidth(16);
            $sheet->getColumnDimension('E')->setWidth(16);
            $sheet->getColumnDimension('F')->setWidth(16);
            $sheet->getColumnDimension('G')->setWidth(10);
            $sheet->getColumnDimension('H')->setWidth(10);
            $sheet->getColumnDimension('I')->setWidth(14);
            $sheet->getColumnDimension('J')->setWidth(14);
            $sheet->getColumnDimension('K')->setWidth(10);
            $sheet->getColumnDimension('L')->setWidth(10);

            $setCell=function($r,$c,$val) use ($sheet){
                $sheet->setCellValueByColumnAndRow(intval($c),intval($r),$val);
                return $sheet->getCellByColumnAndRow(intval($c),intval($r));
            };
            $merge=function($r1,$c1,$r2,$c2) use ($sheet){
                $sheet->mergeCellsByColumnAndRow(intval($c1),intval($r1),intval($c2),intval($r2));
                return $sheet->getCellByColumnAndRow(intval($c1),intval($r1));
            };
            $applyBorder=function($r1,$r2) use ($sheet){
                $sheet->getStyle('A'.$r1.':L'.$r2)->applyFromArray([
                    'borders'=>[
                        'allBorders'=>[
                            'borderStyle'=>Border::BORDER_THIN,
                            'color'=>['argb'=>'FF333333']
                        ]
                    ]
                ]);
            };

            if($template==='sorPrint'){
                $payload=isset($input['payload'])?$input['payload']:[];
                is_array($payload)||($payload=$decodeJson($payload));

                $exchangeRate=isset($payload['exchangeRate'])?floatval($payload['exchangeRate']):0;
                $groupBy=isset($payload['groupBy'])?strval($payload['groupBy']):'';
                $customerName=isset($payload['customerName'])?strval($payload['customerName']):'';
                $customerAdd=isset($payload['customerAdd'])?strval($payload['customerAdd']):'';
                $customerMark=isset($payload['customerMark'])?strval($payload['customerMark']):'';
                $orderDate=isset($payload['orderDate'])?strval($payload['orderDate']):'';
                $deliveryDate=isset($payload['deliveryDate'])?strval($payload['deliveryDate']):'';
                $number=isset($payload['number'])?strval($payload['number']):'';
                $freight=isset($payload['freight'])?floatval($payload['freight']):0;
                $deposit=isset($payload['deposit'])?floatval($payload['deposit']):0;
                $noteText=isset($payload['noteText'])?strval($payload['noteText']):'';
                $totalQty=isset($payload['totalQty'])?floatval($payload['totalQty']):0;
                $totalRmb=isset($payload['totalRmb'])?floatval($payload['totalRmb']):0;
                $totalUsd=isset($payload['totalUsd'])?floatval($payload['totalUsd']):0;
                $totalWeight=isset($payload['totalWeight'])?floatval($payload['totalWeight']):0;
                $totalVolume=isset($payload['totalVolume'])?floatval($payload['totalVolume']):0;
                $totalWithFreight=isset($payload['totalWithFreight'])?floatval($payload['totalWithFreight']):0;
                $balance=isset($payload['balance'])?floatval($payload['balance']):0;
                $rows=isset($payload['rows'])?$payload['rows']:[];
                is_array($rows)||($rows=[]);

                $merge(1,1,1,12)->setValue('Kim Bags    CUSTOMER ORDER    希悦箱包');
                $sheet->getRowDimension(1)->setRowHeight(26);
                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
                $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);

                $merge(2,1,2,6)->setValue('ADD：No. 783, 207 Gallery, Second Floor, East Second District, Shaodong International Business City, Shaodong City, Hunan Province');
                $merge(3,1,3,6)->setValue('EMAIL：kimbagfactory@outlook.com');
                $merge(4,1,4,6)->setValue('MOB & WhatsApp：+8619535838073 Kim');
                $sheet->getStyle('A4')->getFont()->getColor()->setARGB('FFD40000');
                $sheet->getStyle('A4')->getFont()->setBold(true);
                for($r=2;$r<=4;$r++){
                    $sheet->getRowDimension($r)->setRowHeight(18);
                    $sheet->getStyle('A'.$r)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setVertical(Alignment::VERTICAL_CENTER)->setWrapText(true);
                    $sheet->getStyle('A'.$r)->getFont()->setSize(11);
                }
                $merge(2,7,4,12)->setValue('WeChat / WhatsApp');
                $sheet->getStyle('G2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);

                $metaStart=6;
                $merge($metaStart,1,$metaStart,5)->setValue('CUSTOMER：'.$customerName);
                $merge($metaStart,6,$metaStart,12)->setValue('ORDER DATE：'.$orderDate);
                $merge($metaStart+1,1,$metaStart+1,5)->setValue('NUMBER：'.$number);
                $merge($metaStart+1,6,$metaStart+1,12)->setValue('DELIVERY DATE：'.$deliveryDate);
                $merge($metaStart+2,1,$metaStart+2,5)->setValue('ADD：'.$customerAdd);
                $merge($metaStart+2,6,$metaStart+2,12)->setValue('Shipping Mark：'.$customerMark);
                $applyBorder($metaStart,$metaStart+2);
                for($r=$metaStart;$r<=$metaStart+2;$r++){
                    $sheet->getRowDimension($r)->setRowHeight(20);
                    $sheet->getStyle('A'.$r.':L'.$r)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setVertical(Alignment::VERTICAL_CENTER)->setWrapText(true);
                    $sheet->getStyle('A'.$r.':L'.$r)->getFont()->setSize(11);
                }

                $tableHeaderRow=10;
                $setCell($tableHeaderRow,1,'NO.');
                $setCell($tableHeaderRow,2,'DESCRIPTION');
                $merge($tableHeaderRow,3,$tableHeaderRow,6)->setValue('PICTURE');
                $setCell($tableHeaderRow,7,'TT QTY');
                $setCell($tableHeaderRow,8,'U/PRICE');
                $setCell($tableHeaderRow,9,'AMOUNT');
                $setCell($tableHeaderRow,10,$exchangeRate?("USD Price\n\$1=￥".number_format($exchangeRate,2,'.','')):'USD Price');
                $setCell($tableHeaderRow,11,"KG");
                $setCell($tableHeaderRow,12,"CBM");
                $sheet->getRowDimension($tableHeaderRow)->setRowHeight(34);
                $sheet->getStyle('A'.$tableHeaderRow.':L'.$tableHeaderRow)->getFont()->setBold(true)->setSize(11);
                $sheet->getStyle('A'.$tableHeaderRow.':L'.$tableHeaderRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER)->setWrapText(true);
                $sheet->getStyle('J'.$tableHeaderRow)->getFont()->getColor()->setARGB('FFD40000');
                $applyBorder($tableHeaderRow,$tableHeaderRow);

                $cursor=$tableHeaderRow+1;
                $imgCols=[3=>'C',4=>'D',5=>'E',6=>'F'];
                foreach($rows as $idx=>$row){
                    is_array($row)||($row=[]);
                    $pics=isset($row['pics'])?$row['pics']:[];
                    is_array($pics)||($pics=[]);
                    $picCount=count($pics);
                    $picLines=intval(ceil(max(1,$picCount)/4));
                    $blockRows=$picLines*2;
                    $start=$cursor;
                    $end=$cursor+$blockRows-1;

                    $sheet->mergeCellsByColumnAndRow(1,$start,1,$end);
                    $sheet->mergeCellsByColumnAndRow(2,$start,2,$end);
                    $sheet->mergeCellsByColumnAndRow(7,$start,7,$end);
                    $sheet->mergeCellsByColumnAndRow(8,$start,8,$end);
                    $sheet->mergeCellsByColumnAndRow(9,$start,9,$end);
                    $sheet->mergeCellsByColumnAndRow(10,$start,10,$end);
                    $sheet->mergeCellsByColumnAndRow(11,$start,11,$end);
                    $sheet->mergeCellsByColumnAndRow(12,$start,12,$end);

                    $noVal=isset($row['no'])?$row['no']:($idx+1);
                    $setCell($start,1,$noVal);
                    $setCell($start,2,isset($row['desc'])?strval($row['desc']):'');
                    $setCell($start,7,isset($row['ttQty'])?floatval($row['ttQty']):0);
                    $uPriceText=($groupBy==='combo' && isset($row['uPriceText']))?strval($row['uPriceText']):(isset($row['uPrice'])?strval($row['uPrice']):'');
                    $setCell($start,8,$uPriceText);
                    $setCell($start,9,$moneyToNumber(isset($row['amount'])?$row['amount']:0));
                    $setCell($start,10,$moneyToNumber(isset($row['usd'])?$row['usd']:0));
                    $setCell($start,11,isset($row['weight'])?floatval($row['weight']):0);
                    $setCell($start,12,isset($row['volume'])?floatval($row['volume']):0);
                    $sheet->getStyle('I'.$start.':L'.$start)->getNumberFormat()->setFormatCode('#,##0.000');
                    $sheet->getStyle('I'.$start.':J'.$start)->getNumberFormat()->setFormatCode('#,##0.00');

                    $sheet->getStyle('A'.$start.':L'.$end)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER)->setWrapText(true);
                    $sheet->getStyle('B'.$start)->getFont()->setBold(true)->setSize(12);

                    for($line=0;$line<$picLines;$line++){
                        $imgRow=$start+$line*2;
                        $qtyRow=$imgRow+1;
                        $sheet->getRowDimension($imgRow)->setRowHeight(62);
                        $sheet->getRowDimension($qtyRow)->setRowHeight(18);
                        for($j=0;$j<4;$j++){
                            $col=3+$j;
                            $picIndex=$line*4+$j;
                            $p=isset($pics[$picIndex])?$pics[$picIndex]:null;
                            $coord=$imgCols[$col].$imgRow;
                            $qtyCoord=$imgCols[$col].$qtyRow;
                            $sheet->getStyle($coord)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER)->setWrapText(true);
                            $sheet->getStyle($qtyCoord)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER)->setWrapText(true);
                            if(!is_array($p)) continue;
                            $url=isset($p['url'])?strval($p['url']):'';
                            $qty=isset($p['qty'])?strval($p['qty']):'';
                            $path=$fetchImageToTemp($url);
                            if($path!==null){
                                $drawing=new Drawing();
                                $drawing->setPath($path);
                                $drawing->setCoordinates($coord);
                                $drawing->setOffsetX(8);
                                $drawing->setOffsetY(8);
                                $drawing->setWidth(74);
                                $drawing->setHeight(74);
                                $drawing->setWorksheet($sheet);
                            }elseif($url!==''){
                                $sheet->setCellValue($coord,$url);
                                $sheet->getCell($coord)->getHyperlink()->setUrl($url);
                                $sheet->getStyle($coord)->getFont()->setSize(9)->getColor()->setARGB('FF409EFF');
                                $sheet->getStyle($coord)->getFont()->setUnderline(\PhpOffice\PhpSpreadsheet\Style\Font::UNDERLINE_SINGLE);
                            }
                            $sheet->setCellValue($qtyCoord,$qty);
                            $sheet->getStyle($qtyCoord)->getFont()->setBold(true)->getColor()->setARGB('FFD40000');
                        }
                    }

                    $applyBorder($start,$end);
                    $cursor=$end+1;
                }

                $freightRow=$cursor;
                $sheet->getRowDimension($freightRow)->setRowHeight(22);
                $setCell($freightRow,2,'Freight');
                $merge($freightRow,3,$freightRow,6)->setValue('');
                $setCell($freightRow,7,$totalQty);
                $setCell($freightRow,8,$freight);
                $setCell($freightRow,9,$totalRmb);
                $setCell($freightRow,10,$totalUsd);
                $setCell($freightRow,11,$totalWeight);
                $setCell($freightRow,12,$totalVolume);
                $sheet->getStyle('A'.$freightRow.':L'.$freightRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
                $sheet->getStyle('H'.$freightRow.':J'.$freightRow)->getNumberFormat()->setFormatCode('#,##0.00');
                $sheet->getStyle('K'.$freightRow.':L'.$freightRow)->getNumberFormat()->setFormatCode('#,##0.000');
                $applyBorder($freightRow,$freightRow);
                $cursor++;

                $sumStart=$cursor+1;
                $noteText=trim($noteText);
                $merge($sumStart,1,$sumStart+2,6)->setValue("NOTE:\n".$noteText);
                $sheet->getStyle('A'.$sumStart.':F'.($sumStart+2))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setVertical(Alignment::VERTICAL_TOP)->setWrapText(true);
                $sheet->getStyle('A'.$sumStart)->getFont()->setBold(true)->getColor()->setARGB('FFD40000');
                $sheet->getStyle('A'.$sumStart.':F'.($sumStart+2))->getFont()->setSize(11);
                $sheet->getStyle('A'.$sumStart.':F'.($sumStart+2))->applyFromArray([
                    'borders'=>[
                        'allBorders'=>[
                            'borderStyle'=>Border::BORDER_THIN,
                            'color'=>['argb'=>'FF333333']
                        ]
                    ]
                ]);
                $merge($sumStart,7,$sumStart,8)->setValue('TOTAL');
                $setCell($sumStart,9,$totalWithFreight);
                $merge($sumStart+1,7,$sumStart+1,8)->setValue('DEPOSIT');
                $setCell($sumStart+1,9,$deposit);
                $merge($sumStart+2,7,$sumStart+2,8)->setValue('BALANCE');
                $setCell($sumStart+2,9,$balance);
                for($r=$sumStart;$r<=$sumStart+2;$r++){
                    $sheet->getRowDimension($r)->setRowHeight(22);
                    $sheet->getStyle('G'.$r.':I'.$r)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
                    $sheet->getStyle('G'.$r.':I'.$r)->getFont()->setBold(true);
                    $sheet->getStyle('I'.$r)->getNumberFormat()->setFormatCode('#,##0.00');
                    $sheet->getStyle('G'.$r.':J'.$r)->applyFromArray([
                        'borders'=>[
                            'allBorders'=>[
                                'borderStyle'=>Border::BORDER_THIN,
                                'color'=>['argb'=>'FF333333']
                            ]
                        ]
                    ]);
                }
                $sheet->getStyle('I'.($sumStart+1))->getFont()->getColor()->setARGB('FFD40000');
                $merge($sumStart,10,$sumStart+2,10)->setValue($exchangeRate?("\$1=￥".number_format($exchangeRate,2,'.','')):'');
                $sheet->getStyle('J'.$sumStart)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER)->setWrapText(true);
                $sheet->getStyle('J'.$sumStart)->getFont()->setSize(10)->getColor()->setARGB('FF909399');
            }else{
                $metaRows=isset($input['metaRows'])?$input['metaRows']:[];
                $header=isset($input['header'])?$input['header']:[];
                $rows=isset($input['rows'])?$input['rows']:[];
                is_array($metaRows)||($metaRows=$decodeJson($metaRows));
                is_array($header)||($header=$decodeJson($header));
                is_array($rows)||($rows=$decodeJson($rows));
                $r=1;
                foreach($metaRows as $mr){
                    is_array($mr)||($mr=[]);
                    $label=isset($mr[0])?strval($mr[0]):'';
                    $value=isset($mr[1])?strval($mr[1]):'';
                    if($label=='' && $value=='') continue;
                    $setCell($r,1,$label);
                    $setCell($r,2,$value);
                    $r++;
                }
                if($r>1) $r++;
                if(!empty($header)){
                    $c=1;
                    foreach($header as $h){
                        $setCell($r,$c,$h===null?'':strval($h));
                        $c++;
                    }
                    $sheet->getStyle('A'.$r.':'.chr(64+max(1,count($header))).$r)->getFont()->setBold(true);
                    $r++;
                }
                foreach($rows as $row){
                    if(!is_array($row)) continue;
                    $c=1;
                    foreach($row as $cell){
                        $setCell($r,$c,$cell===null?'':$cell);
                        $c++;
                    }
                    $r++;
                }
            }

            $writer=new XlsxWriter($spreadsheet);
            ob_start();
            $writer->save('php://output');
            $binary=ob_get_clean();
            foreach($tmpFiles as $p){
                @unlink($p);
            }
            $encoded=rawurlencode($fileName);
            return response($binary,200,[
                'Content-Type'=>'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition'=>"attachment; filename*=UTF-8''".$encoded,
                'Cache-Control'=>'max-age=0'
            ]);
        }catch(\Exception $e){
            foreach($tmpFiles as $p){
                @unlink($p);
            }
            return json(['state'=>'error','info'=>$e->getMessage()]);
        }
    }
    
    //扩展字段文件上传
    public function fieldUpload() {
        $file = request()->file('file');
        //获取上传文件
        if (empty($file)) {
            $result = ['state' => 'error','info' => '传入数据不完整!'];
        } else {
            //文件限制5MB
            try{
                validate(['file'=>['fileSize'=>5*1024*1024,'fileExt'=>'png,gif,jpg,jpeg,txt,doc,docx,rtf,xls,xlsx,ppt,pptx,pdf,zip,rar']])->check(['file'=>$file]);
                $fileInfo=Filesystem::disk('upload')->putFile('field', $file, 'uniqid');
                $filePath=request()->domain().'/static/upload/'.$fileInfo;
                $result=['state'=>'success','info'=>$filePath];
            }catch(ValidateException $e) {
                $result=['state' => 'error','info' => $e->getMessage()];
            }
        }
        return json($result);
    }
    //编辑器图像上传
    public function editorUpload(){
        $files=request()->file('images');//获取上传文件
        if(empty($files)){
		    $result=['state'=>'error','info'=>'传入数据不完整!'];
		}else{
            //文件限制2MB
            foreach ($files as $file) {
                try{
                    validate(['file'=>['fileSize'=>2*1024*1024,'fileExt'=>'png,gif,jpg,jpeg']])->check(['file'=>$file]);
                }catch(ValidateException $e) {
                    return json(['state'=>'error','info'=>$e->getMessage()]);
                    exit;
                }
            }
            foreach ($files as $file) {
                $fileInfo=Filesystem::disk('upload')->putFile('editor', $file, 'uniqid');
                $filePath=request()->domain().'/static/upload/'.$fileInfo;
                $data[]=$filePath;
            }
            $result=['state'=>'success','info'=>$data];
		}
		return json($result);
    }
	//获取版本信息
	public function getUpgrade(){
		$ask = json_decode(curl('https://www.nodcloud.com/api/service/version',false,['product' => config('soft.product'),'edition' => config('soft.edition'),'version' => config('soft.version')],'GET'),true);
		if(empty($ask)){
		    $resule = ['state' => 'success','info'=>['ver'=>config('soft.version'),'new'=>config('soft.version'),'url'=>'']];
		}else{
		    if($ask['state']=='success'){
		        $resule = ['state' => 'success','info'=>['ver'=>config('soft.version'),'new'=>$ask['info']['version'],'url'=>$ask['info']['url']]];
    		}elseif($ask['state']=='warning'){
    			$resule = ['state' => 'error','info' => $ask['message']];
    		}else{
    			$resule = ['state' => 'error','info' => '版本服务系统异常!'];
    		}
		}
		return json($resule);
	}
    //清空缓存文件
    public function clachCache(){
        delCache();
        delDir('runtime.log');
        delDir('runtime.session');
        return json(['state'=>'success']);
    }
    //退出
    public function out(){
        pushLog('退出登录');
        cache(getToken(),NULL);
        return json(['state' => 'success']);
    }
}
