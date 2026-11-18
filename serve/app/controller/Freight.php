<?php
namespace app\controller;
use think\facade\Db;
use app\service\FreightDirectory;

class Freight extends Acl
{
    private function directory() {
        $customers=Db::name('customer')->where(sqlAuth('customer',frameScope([])))->field('id,name,number,data,contacts')->select()->toArray();
        $traded=[];
        foreach (['sor','sell'] as $type) {
            $ids=Db::name($type)->where(sqlAuth($type,frameScope([])))->where('examine',1)->group('customer')->column('customer');
            foreach ($ids as $id) $traded[$id]=true;
        }
        $groups=FreightDirectory::build($customers,$traded);
        $profiles=[];
        $keys=array_keys($groups);
        foreach($groups as $g) $keys[]=FreightDirectory::key(['tel'=>$g['tel'],'add'=>$g['address'],'name'=>$g['name']]);
        if ($keys) $profiles=Db::name('freight_profile')->whereIn('fingerprint',array_unique($keys))->order('updated_time','asc')->select()->toArray();
        $manualScope=frameScope([]);
        $users=getUserAuth('user');if($users!=='all')$manualScope[]=['user','in',$users];
        $manual=Db::name('freight_profile')->where($manualScope)->where('manual',1)->select()->toArray();
        // 手工资料没有 customer.id；权限由创建者所属组织和用户控制。
        foreach (array_merge($profiles,$manual) as $p) {
            $key=$p['fingerprint'];
            if (!isset($groups[$key]) && !$p['manual']) {
                // 手机号分组前保存的旧补充资料继续生效；新公司级资料覆盖展示字段。
                foreach($groups as $oldKey=>$g) {
                    if(FreightDirectory::key(['tel'=>$g['tel'],'add'=>$g['address'],'name'=>$g['name']])===$key) {
                        $groups[$key]=$g;$groups[$key]['key']=$key;unset($groups[$oldKey]);break;
                    }
                }
            }
            if (!isset($groups[$key])) {
                if (!$p['manual']) continue;
                $groups[$key]=['key'=>$key,'suggestions'=>[],'sources'=>[],'has_trade'=>false];
            }
            foreach (['company','name','tel','address','kind','transport','warehouse','note'] as $field) $groups[$key][$field]=$p[$field];
            $groups[$key]['countries']=json_decode($p['countries'],true) ?: [];
            $groups[$key]['manual']=(bool)$p['manual'];$groups[$key]['confirmed']=$p['kind']!=='candidate';
        }
        return FreightDirectory::mergeCompanies($groups);
    }
    public function record() {
        $input=input('post.');$rows=array_values($this->directory());
        $source=$input['source'] ?? 'traded'; $kind=$input['kind'] ?? ''; $country=trim($input['country'] ?? '');$keyword=trim($input['keyword'] ?? '');
        $rows=array_values(array_filter($rows,function($row) use($source,$kind,$country,$keyword){
            if ($source==='traded' && !$row['has_trade'] && !$row['manual']) return false;
            if ($source==='manual' && !$row['manual']) return false;
            if ($kind ? $row['kind']!==$kind : $row['kind']==='excluded') return false;
            if ($country && !in_array($country,($row['countries'] ?: $row['suggestions']),true)) return false;
            if ($keyword && mb_stripos(json_encode($row,JSON_UNESCAPED_UNICODE),$keyword)===false) return false;
            return true;
        }));
        usort($rows,function($a,$b){return count($b['sources'])<=>count($a['sources']) ?: strcmp($a['name'],$b['name']);});
        $countryOptions=[];$sourceCount=0;$pending=0;
        foreach($rows as $r){$sourceCount+=count($r['sources']);$pending+=!$r['confirmed'];$countryOptions=array_merge($countryOptions,$r['countries'],$r['suggestions']);}
        $countryOptions=array_values(array_unique($countryOptions));sort($countryOptions);
        $page=max(1,(int)($input['page'] ?? 1));$limit=min(100,max(10,(int)($input['limit'] ?? 20)));
        $slice=array_slice($rows,($page-1)*$limit,$limit);
        foreach($slice as &$row) {$row['source_count']=count($row['sources']);unset($row['sources']);}
        return json(['state'=>'success','info'=>$slice,'count'=>count($rows),'summary'=>['total'=>count($rows),'sources'=>$sourceCount,'pending'=>$pending,'countries'=>count($countryOptions)],'countryOptions'=>$countryOptions]);
    }
    public function detail() {
        $key=(string)input('post.key','');$directory=$this->directory();
        if(!isset($directory[$key]))return json(['state'=>'error','info'=>'资料不存在或无访问权限']);
        return json(['state'=>'success','info'=>$directory[$key]]);
    }
    public function save() {
        $input=input('post.');$key=$input['key'] ?? ''; $root=getUserRoot();
        if($root!=='all' && empty($root['base'][$key?'edit':'add']))return json(['state'=>'error','info'=>'没有资料维护权限'],403);
        $existing=null;
        if($key){$directory=$this->directory();if(!isset($directory[$key]))return json(['state'=>'error','info'=>'资料不存在或无访问权限']);$existing=$directory[$key];}
        $data=[];
        foreach(['company'=>120,'name'=>120,'tel'=>120,'address'=>2000,'transport'=>100,'warehouse'=>120,'note'=>3000] as $field=>$max){
            if(isset($input[$field])&&!is_string($input[$field]))return json(['state'=>'error','info'=>'资料格式错误']);
            $data[$field]=trim($input[$field] ?? '');if(mb_strlen($data[$field])>$max)return json(['state'=>'error','info'=>'内容过长，请精简后保存']);
        }
        $kind=$input['kind'] ?? 'candidate';
        if(!in_array($kind,['candidate','forwarder','warehouse','both','excluded'],true))return json(['state'=>'error','info'=>'请选择资料类型']);
        $countries=$input['countries'] ?? [];$allowed=array_keys(json_decode(file_get_contents(__DIR__.'/../service/data/countryAliases.json'),true));
        if(!is_array($countries)||count($countries)>100||array_diff($countries,$allowed))return json(['state'=>'error','info'=>'请选择有效国家']);
        if(!$data['name']&&!$data['company'])return json(['state'=>'error','info'=>'请填写货代公司或联系人']);
        if(!$data['tel']&&!$data['address'])return json(['state'=>'error','info'=>'请填写电话或仓库地址']);
        $data['kind']=$kind;$data['countries']=json_encode(array_values(array_unique($countries)),JSON_UNESCAPED_UNICODE);$data['updated_time']=time();
        $data['manual']=$existing ? (int)$existing['manual'] : 1;
        $data['user']=getUserID();$data['frame']=(int)userInfo(getUserID(),'frame');
        if(!$key)$key=hash('sha256','manual:'.bin2hex(random_bytes(24)));
        $stored=Db::name('freight_profile')->where('fingerprint',$key)->find();
        if($stored){unset($data['user'],$data['frame']);Db::name('freight_profile')->where('fingerprint',$key)->update($data);}else{$data['fingerprint']=$key;Db::name('freight_profile')->insert($data);}
        return json(['state'=>'success','key'=>$key]);
    }
}
