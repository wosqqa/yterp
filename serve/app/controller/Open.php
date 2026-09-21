<?php
namespace app\controller;
use app\BaseController;
use app\model\{Sor as Sors, SorInfo, Goods, Customer, User, Category, Warehouse};
use think\facade\Db;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx as XlsxWriter;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class Open extends BaseController{
    public function getSor(){
        $input = input('post.');
        if(empty($input['parm'])){
            return json(['state'=>'error','info'=>'传入参数不完整!']);
        }
        $parm = $input['parm'];
        $where = [];
        if(is_numeric($parm)){
            $where[] = ['id','=',$parm];
        }else{
            $where[] = ['number','=',$parm];
        }
        $class = Sors::with(['customerData','userData'])->where($where)->find();
        if(empty($class)){
            return json(['state'=>'error','info'=>'订单不存在!']);
        }
        $info = SorInfo::with(['goodsData' => ['categoryData','attr'], 'warehouseData'])->where([['pid','=',$class['id']]])->order(['id'=>'asc'])->select()->toArray();
        foreach($info as &$item){
            if(!empty($item['goods']) && empty($item['goodsData'])){
                $goods = Goods::with(['categoryData','attr'])->where([['id','=',$item['goods']]])->find();
                $item['goodsData'] = $goods ? $goods->toArray() : null;
            }
            if(!empty($item['warehouse']) && empty($item['warehouseData'])){
                $wh = Warehouse::where([['id','=',$item['warehouse']]])->find();
                $item['warehouseData'] = $wh ? $wh->toArray() : null;
            }
        }
        unset($item);
        $classArr = is_array($class) ? $class : ($class ? $class->toArray() : []);
        if (!empty($classArr['customerData']) && is_array($classArr['customerData'])) {
            $classArr['customerData']['data']   = '';
            $classArr['customerData']['number'] = '';
        }
        if (isset($classArr['data'])) {
            $classArr['data'] = '';
        }
        foreach ($info as &$infoItem) {
            if (!empty($infoItem['goodsData']) && is_array($infoItem['goodsData'])) {
                $infoItem['goodsData']['buy'] = null;
                $infoItem['goodsData']['stock'] = null;
            }
        }
        unset($infoItem);
        return json(['state'=>'success','info'=>[
            'class'=>$classArr,
            'info'=>$info,
        ]]);
    }

    public function getSorUser(){
        $input = input('post.');
        if(empty($input['id'])){
            return json(['state'=>'error','info'=>'传入参数不完整!']);
        }
        $userId = intval($input['id']);
        if($userId <= 0){
            return json(['state'=>'error','info'=>'用户ID无效!']);
        }
        $user = User::where([['id','=',$userId]])->find();
        if(empty($user)){
            return json(['state'=>'error','info'=>'用户不存在!']);
        }
        $rawMore = $user['more'];
        if(is_string($rawMore)){
            $rawMore = json_decode($rawMore, true);
            if(!is_array($rawMore)) $rawMore = [];
        }elseif(is_object($rawMore)){
            $rawMore = json_decode(json_encode($rawMore), true);
            if(!is_array($rawMore)) $rawMore = [];
        }elseif(!is_array($rawMore)){
            $rawMore = [];
        }
        $info = [
            'id' => $user['id'],
            'name' => $user['name'] ?? '',
            'tel' => $user['tel'] ?? '',
            'companyEn' => $rawMore['companyEn'] ?? '',
            'companyCn' => $rawMore['companyCn'] ?? '',
            'addressCn' => $rawMore['addressCn'] ?? '',
            'addressEn' => $rawMore['addressEn'] ?? '',
            'email' => $rawMore['email'] ?? '',
            'whatsapp' => $rawMore['whatsapp'] ?? '',
            'contactName' => $rawMore['contactName'] ?? '',
            'wechatQr' => $rawMore['wechatQr'] ?? '',
            'whatsappQr' => $rawMore['whatsappQr'] ?? '',
            'exchangeRate' => $rawMore['exchangeRate'] ?? '',
        ];
        return json(['state'=>'success','info'=>$info]);
    }

    public function getSorCustomer(){
        $input = input('post.');
        if(empty($input['id'])){
            return json(['state'=>'success','info'=>['name'=>'','add'=>'','data'=>'','contacts'=>[]]]);
        }
        $customerId = intval($input['id']);
        if($customerId <= 0){
            return json(['state'=>'success','info'=>['name'=>'','add'=>'','data'=>'','contacts'=>[]]]);
        }
        $customer = Customer::where([['id','=',$customerId]])->find();
        if(empty($customer)){
            return json(['state'=>'success','info'=>['name'=>'','add'=>'','data'=>'','contacts'=>[]]]);
        }
        $contacts = $customer['contacts'];
        if(is_string($contacts)){
            $parsed = json_decode($contacts, true);
            $contacts = is_array($parsed) ? $parsed : [];
        }elseif(is_object($contacts)){
            $parsed = json_decode(json_encode($contacts), true);
            $contacts = is_array($parsed) ? $parsed : [];
        }elseif(!is_array($contacts)){
            $contacts = [];
        }
        $main = [];
        foreach($contacts as $c){
            if(is_object($c)) $c = json_decode(json_encode($c), true);
            if(is_array($c) && !empty($c['main'])){ $main = $c; break; }
        }
        if(empty($main) && !empty($contacts)){
            $first = $contacts[0];
            if(is_object($first)) $first = json_decode(json_encode($first), true);
            $main = is_array($first) ? $first : [];
        }
        $mainAdd = isset($main['add']) ? $main['add'] : '';
        $mainData = isset($main['data']) ? $main['data'] : '';
        $info = [
            'name' => $customer['name'] ?? '',
            'add' => $mainAdd,
            'data' => $mainData ?: ($customer['data'] ?? ''),
            'contacts' => $contacts,
        ];
        return json(['state'=>'success','info'=>$info]);
    }

    public function getSorStore(){
        try {
            $category = Category::order(['sort'=>'asc','id'=>'asc'])->select()->toArray();
        } catch (\Exception $e) {
            $category = Category::order(['id'=>'asc'])->select()->toArray();
        }
        try {
            $warehouse = Warehouse::order(['sort'=>'asc','id'=>'asc'])->select()->toArray();
        } catch (\Exception $e) {
            $warehouse = Warehouse::order(['id'=>'asc'])->select()->toArray();
        }
        $sys = Db::name('sys')->where([['name','=','base']])->field(['info'])->find();
        $baseInfo = [];
        if(!empty($sys) && !empty($sys['info'])){
            $parsed = json_decode($sys['info'], true);
            $baseInfo = is_array($parsed) ? $parsed : [];
        }
        $cdnSite = $baseInfo['cdnSite'] ?? '';
        return json([
            'state'=>'success',
            'info'=>[
                'category'=>$category,
                'warehouse'=>$warehouse,
                'base'=>[
                    'cdnSite'=>$cdnSite
                ]
            ]
        ]);
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
                $hideAmounts=!empty($payload['hideAmounts']);
                $onlyThreeCols=!empty($payload['onlyThreeCols']);
                $hideUsd=!empty($payload['hideUsd']);
                $hideFooter=!empty($payload['hideFooter']);
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

                if(!$onlyThreeCols){
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
                }

                if(!$onlyThreeCols){
                    $metaStart=6;
                }else{
                    $metaStart=1;
                }
                $metaEnd = $metaStart - 1;
                $showCustomerMeta = false; // 默认不显示客户基本信息（CUSTOMER / ORDER DATE / NUMBER / DELIVERY DATE 两行）
                if(!$onlyThreeCols && $showCustomerMeta){
                    $merge($metaStart,1,$metaStart,5)->setValue('CUSTOMER：'.$customerName);
                    $merge($metaStart,6,$metaStart,12)->setValue('ORDER DATE：'.$orderDate);
                    $merge($metaStart+1,1,$metaStart+1,5)->setValue('NUMBER：'.$number);
                    $merge($metaStart+1,6,$metaStart+1,12)->setValue('DELIVERY DATE：'.$deliveryDate);
                    $metaEnd = $metaStart + 1;
                }
                if (!$hideAmounts && !$onlyThreeCols) {
                    $r = $metaEnd + 1;
                    $merge($r,1,$r,5)->setValue('ADD：'.$customerAdd);
                    $merge($r,6,$r,12)->setValue('Shipping Mark：'.$customerMark);
                    $metaEnd = $r;
                }
                if($metaEnd >= $metaStart && !$onlyThreeCols){
                    $applyBorder($metaStart,$metaEnd);
                    for($r=$metaStart;$r<=$metaEnd;$r++){
                        $sheet->getRowDimension($r)->setRowHeight(20);
                        $sheet->getStyle('A'.$r.':L'.$r)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setVertical(Alignment::VERTICAL_CENTER)->setWrapText(true);
                        $sheet->getStyle('A'.$r.':L'.$r)->getFont()->setSize(11);
                    }
                }

                $tableHeaderRow = $metaEnd + 1;
                if(!$onlyThreeCols){
                    $setCell($tableHeaderRow,1,'NO.');
                }
                $setCell($tableHeaderRow,2,'DESCRIPTION');
                $merge($tableHeaderRow,3,$tableHeaderRow,6)->setValue('PICTURE');
                $setCell($tableHeaderRow,7,'TT QTY');
                if(!$hideAmounts){
                    $setCell($tableHeaderRow,8,'U/PRICE');
                    $setCell($tableHeaderRow,9,'AMOUNT');
                    if(!$hideUsd){
                        $setCell($tableHeaderRow,10,$exchangeRate?("USD Price\n\$1=￥".number_format($exchangeRate,2,'.','')):'USD Price');
                    }
                }
                if(!$onlyThreeCols){
                    $setCell($tableHeaderRow,11,"KG");
                    $setCell($tableHeaderRow,12,"CBM");
                }
                $sheet->getRowDimension($tableHeaderRow)->setRowHeight(34);
                if(!$onlyThreeCols){
                    $sheet->getStyle('A'.$tableHeaderRow.':L'.$tableHeaderRow)->getFont()->setBold(true)->setSize(11);
                    $sheet->getStyle('A'.$tableHeaderRow.':L'.$tableHeaderRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER)->setWrapText(true);
                    if(!$hideAmounts && !$hideUsd){
                        $sheet->getStyle('J'.$tableHeaderRow)->getFont()->getColor()->setARGB('FFD40000');
                    }
                    $applyBorder($tableHeaderRow,$tableHeaderRow);
                }else{
                    $lastHeaderCol = 7;
                    if(!$hideAmounts){
                        $lastHeaderCol = $hideUsd ? 9 : 10;
                    }
                    $lastColLetter = $lastHeaderCol===7 ? 'G' : ($lastHeaderCol===9 ? 'I' : 'J');
                    $sheet->getStyle('B'.$tableHeaderRow.':'.$lastColLetter.$tableHeaderRow)->getFont()->setBold(true)->setSize(11);
                    $sheet->getStyle('B'.$tableHeaderRow.':'.$lastColLetter.$tableHeaderRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER)->setWrapText(true);
                    if(!$hideAmounts && !$hideUsd){
                        $sheet->getStyle('J'.$tableHeaderRow)->getFont()->getColor()->setARGB('FFD40000');
                    }
                    $sheet->getStyle('B'.$tableHeaderRow.':'.$lastColLetter.$tableHeaderRow)->applyFromArray([
                        'borders'=>[
                            'allBorders'=>[
                                'borderStyle'=>Border::BORDER_THIN,
                                'color'=>['argb'=>'FF333333']
                            ]
                        ]
                    ]);
                }

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

                    if(!$onlyThreeCols){
                        $sheet->mergeCellsByColumnAndRow(1,$start,1,$end);
                    }
                    $sheet->mergeCellsByColumnAndRow(2,$start,2,$end);
                    $sheet->mergeCellsByColumnAndRow(7,$start,7,$end);
                    if(!$hideAmounts){
                        $sheet->mergeCellsByColumnAndRow(8,$start,8,$end);
                        $sheet->mergeCellsByColumnAndRow(9,$start,9,$end);
                        if(!$hideUsd){
                            $sheet->mergeCellsByColumnAndRow(10,$start,10,$end);
                        }
                    }
                    if(!$onlyThreeCols){
                        $sheet->mergeCellsByColumnAndRow(11,$start,11,$end);
                        $sheet->mergeCellsByColumnAndRow(12,$start,12,$end);
                    }

                    if(!$onlyThreeCols){
                        $noVal=isset($row['no'])?$row['no']:($idx+1);
                        $setCell($start,1,$noVal);
                    }
                    $setCell($start,2,isset($row['desc'])?strval($row['desc']):'');
                    $setCell($start,7,isset($row['ttQty'])?floatval($row['ttQty']):0);
                    if(!$hideAmounts){
                        $uPriceText=($groupBy==='combo' && isset($row['uPriceText']))?strval($row['uPriceText']):(isset($row['uPrice'])?strval($row['uPrice']):'');
                        $setCell($start,8,$uPriceText);
                        $setCell($start,9,$moneyToNumber(isset($row['amount'])?$row['amount']:0));
                        if(!$hideUsd){
                            $setCell($start,10,$moneyToNumber(isset($row['usd'])?$row['usd']:0));
                        }
                    }
                    if(!$onlyThreeCols){
                        $setCell($start,11,isset($row['weight'])?floatval($row['weight']):0);
                        $setCell($start,12,isset($row['volume'])?floatval($row['volume']):0);
                        $sheet->getStyle('I'.$start.':L'.$start)->getNumberFormat()->setFormatCode('#,##0.000');
                        $sheet->getStyle('I'.$start.':J'.$start)->getNumberFormat()->setFormatCode('#,##0.00');
                    }elseif(!$hideAmounts){
                        $sheet->getStyle('I'.$start.':I'.$start)->getNumberFormat()->setFormatCode('#,##0.00');
                        if(!$hideUsd){
                            $sheet->getStyle('J'.$start.':J'.$start)->getNumberFormat()->setFormatCode('#,##0.00');
                        }
                    }

                    if(!$onlyThreeCols){
                        $sheet->getStyle('A'.$start.':L'.$end)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER)->setWrapText(true);
                    }else{
                        $lastCol = 7;
                        if(!$hideAmounts){
                            $lastCol = $hideUsd ? 9 : 10;
                        }
                        $sheet->getStyle('B'.$start.':'.($lastCol===7?'G':($lastCol===9?'I':'J')).$end)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER)->setWrapText(true);
                    }
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

                    if(!$onlyThreeCols){
                        $applyBorder($start,$end);
                    }else{
                        $lastCol = 7;
                        if(!$hideAmounts){
                            $lastCol = $hideUsd ? 9 : 10;
                        }
                        $lastColLetter = $lastCol===7 ? 'G' : ($lastCol===9 ? 'I' : 'J');
                        $sheet->getStyle('B'.$start.':'.$lastColLetter.$end)->applyFromArray([
                            'borders'=>[
                                'allBorders'=>[
                                    'borderStyle'=>Border::BORDER_THIN,
                                    'color'=>['argb'=>'FF333333']
                                ]
                            ]
                        ]);
                    }
                    $cursor=$end+1;
                }

                $freightRow=$cursor;
                $sheet->getRowDimension($freightRow)->setRowHeight(22);
                $setCell($freightRow,2,'Freight');
                $merge($freightRow,3,$freightRow,6)->setValue('');
                $setCell($freightRow,7,$totalQty);
                if(!$hideAmounts){
                    $setCell($freightRow,8,$freight);
                    $setCell($freightRow,9,$totalRmb);
                    if(!$hideUsd){
                        $setCell($freightRow,10,$totalUsd);
                    }
                }
                if(!$onlyThreeCols){
                    $setCell($freightRow,11,$totalWeight);
                    $setCell($freightRow,12,$totalVolume);
                    $sheet->getStyle('A'.$freightRow.':L'.$freightRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
                    $sheet->getStyle('H'.$freightRow.':J'.$freightRow)->getNumberFormat()->setFormatCode('#,##0.00');
                    $sheet->getStyle('K'.$freightRow.':L'.$freightRow)->getNumberFormat()->setFormatCode('#,##0.000');
                    $applyBorder($freightRow,$freightRow);
                }else{
                    $lastCol = 7;
                    if(!$hideAmounts){
                        $lastCol = $hideUsd ? 9 : 10;
                    }
                    $lastColLetter = $lastCol===7 ? 'G' : ($lastCol===9 ? 'I' : 'J');
                    $sheet->getStyle('B'.$freightRow.':'.$lastColLetter.$freightRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
                    if(!$hideAmounts){
                        $lastFormatCol = $hideUsd ? 'I' : 'J';
                        $sheet->getStyle('H'.$freightRow.':'.$lastFormatCol.$freightRow)->getNumberFormat()->setFormatCode('#,##0.00');
                    }
                    $sheet->getStyle('B'.$freightRow.':'.$lastColLetter.$freightRow)->applyFromArray([
                        'borders'=>[
                            'allBorders'=>[
                                'borderStyle'=>Border::BORDER_THIN,
                                'color'=>['argb'=>'FF333333']
                            ]
                        ]
                    ]);
                }
                $cursor++;

                $sumStart=$cursor+1;
                $noteText=trim($noteText);
                if(!$hideAmounts && !$hideFooter){
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
}
