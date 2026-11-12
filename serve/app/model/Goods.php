<?php
namespace app\model;
use	think\Model;
class Goods extends Model{
    //商品
    
    protected $type = [
        'units' => 'json',
        'strategy' => 'json',
        'serial' => 'boolean',
        'batch' => 'boolean',
        'validity' => 'boolean'
    ];
    
    // 读取时提供缩略图；保存时还原原图地址，避免编辑回传污染数据库。
    public function getImgsAttr($value)
    {
        return \app\support\ProductImage::images($value);
    }

    public function setImgsAttr($value)
    {
        return json_encode(\app\support\ProductImage::images($value, false), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    //商品类别关联
    public function categoryData(){
        return $this->hasOne(Category::class,'id','category');
    }
    
    //辅助属性关联
    public function attr(){
        return $this->hasMany(Attr::class,'pid','id');
    }
    
	//采购价格_读取器
	public function getBuyAttr($val,$data){
        return floatval($val);
	}
	
	//销售价格_读取器
	public function getSellAttr($val,$data){
        return floatval($val);
	}
	
	//零售价格_读取器
	public function getRetailAttr($val,$data){
        return floatval($val);
	}
	
	//兑换积分_读取器
	public function getIntegralAttr($val,$data){
        return floatval($val);
	}
	
	//库存阈值_读取器
	public function getStockAttr($val,$data){
        return floatval($val);
	}
	
	//扩展信息_设置器
	public function  setMoreAttr($val){
	    //兼容Api|修复PHP空对象json编码为[]
	    return json_encode((object)$val);
	}
	
	//扩展信息_读取器
	public function  getMoreAttr($val){
		return json_decode($val);
	}
	
	//数据扩展
	public function getExtensionAttr($val,$data){
        $source=[];
        //商品单位
        $source['unit']=$data['unit']==-1?'多单位':$data['unit'];
        //商品类型
        $source['type']=[0=>'常规商品',1=>'服务商品'][$data['type']];
        return $source;
	}
}
