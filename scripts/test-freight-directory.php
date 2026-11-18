<?php
// Pure regression checks: reads bundled country metadata, never connects to the database.
require __DIR__.'/../serve/vendor/autoload.php';
use app\service\FreightDirectory;
function freightAssert($condition,$message) {
    if (!$condition) throw new RuntimeException($message);
    echo "PASS $message\n";
}
$a=['name'=>'联系人','tel'=>'+86 13711225368','add'=>'广东省 佛山市 水口路西7号','data'=>'TOGO'];
$b=$a;$b['tel']='008613711225368';$b['add']='广东省佛山市水口路西7号';
freightAssert(FreightDirectory::key($a)===FreightDirectory::key($b),'formatting differences do not duplicate a warehouse');
$b['add']='广东省广州市另一仓库';
freightAssert(FreightDirectory::key($a)===FreightDirectory::key($b),'same phone merges different warehouses');
$b=$a;$a['add']='仓库1-2';$b['add']='仓库12';
freightAssert(FreightDirectory::legacyKey($a)!==FreightDirectory::legacyKey($b),'legacy warehouse keys retained for saved profiles');
freightAssert(FreightDirectory::key(['name'=>'只有姓名'])==='','contacts with no usable phone or address are skipped');
$contact=['name'=>'联系人','tel'=>'13711225368','add'=>'佛山仓库','data'=>'TOGO'];
$customers=[];
foreach([1,2] as $id)$customers[]=['id'=>$id,'name'=>'客户'.$id,'number'=>'22893550304','data'=>'','contacts'=>json_encode([$contact])];
$groups=FreightDirectory::build($customers,[1=>true]);$row=array_values($groups)[0];
freightAssert(count($groups)===1&&count($row['sources'])===2,'deduplication retains customer provenance');
freightAssert(in_array('多哥',$row['suggestions'],true),'country clues are recognized');
freightAssert($row['countries']===[]&&$row['kind']==='candidate','inferred country is not presented as a confirmed route');
freightAssert($row['sources'][0]['has_trade']&&!$row['sources'][1]['has_trade'],'trade status remains per customer');

$customers[1]['contacts']=json_encode([array_merge($contact,['add'=>'另一地址','name'=>'另一称呼'])]);
$merged=FreightDirectory::mergeCompanies(FreightDirectory::build($customers,[1=>true]));
$company=array_values($merged)[0];
freightAssert(count($merged)===1&&count($company['addresses'])===2&&count($company['sources'])===2,'phone merge retains addresses and provenance');
freightAssert(count($company['names'])===2,'alternate contact names retained');
