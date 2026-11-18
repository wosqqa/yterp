<template>
  <div class="freight area">
    <div class="heading"><div><h2>货代管理</h2><p>从客户联系资料整理货代与仓库，按国家查找可推荐的运输资源</p></div><div><el-button @click="$router.push('/system/customer')">返回客户管理</el-button><el-button v-if="canAdd" type="primary" @click="create">新增货代 / 仓库</el-button></div></div>
    <el-alert title="自动整理的联系人和国家线索均待确认。客户所在国家不代表货代承运国家，请核实后补充负责国家；客户原始联系资料不会被修改。" type="info" :closable="false" show-icon />
    <el-form inline class="filters" @submit.native.prevent="search">
      <el-form-item><el-input v-model="filters.keyword" clearable placeholder="公司 / 联系人 / 电话 / 地址 / 来源客户" @keyup.enter.native="search" /></el-form-item>
      <el-form-item><el-select v-model="filters.country" clearable filterable placeholder="负责国家 / 国家线索"><el-option v-for="c in countries" :key="c" :label="c" :value="c" /></el-select></el-form-item>
      <el-form-item><el-select v-model="filters.kind" clearable placeholder="货代类型"><el-option v-for="(label,k) in kinds" :key="k" :label="label" :value="k" /></el-select></el-form-item>
      <el-form-item><el-select v-model="filters.source"><el-option label="已成交客户 + 手工新增" value="traded" /><el-option label="全部客户联系资料" value="all" /><el-option label="仅手工新增" value="manual" /></el-select></el-form-item>
      <el-form-item><el-button type="primary" @click="search">查询</el-button><el-button @click="reset">重置</el-button><el-button icon="el-icon-refresh" @click="load">重新整理</el-button></el-form-item>
    </el-form>
    <div class="summary"><div><span>整理后资料</span><b>{{summary.total || 0}}</b></div><div><span>来源联系资料</span><b>{{summary.sources || 0}}</b></div><div><span>待确认</span><b>{{summary.pending || 0}}</b></div><div><span>涉及国家线索</span><b>{{summary.countries || 0}}</b></div></div>
    <p class="hint">按手机号合并为同一家公司，不同地址和联系人保留在详情；无电话时按地址＋姓名去重。已成交指存在已审核销售订单或销售单。数量随当前筛选变化。</p>
    <el-table :data="rows" border v-loading="loading" empty-text="暂无符合条件的货代资料">
      <el-table-column label="货代 / 联系人" min-width="145"><template slot-scope="s"><b>{{s.row.company || s.row.name || '未命名'}}</b><div v-if="s.row.company" class="hint">{{s.row.name}}</div><el-tag size="mini" :type="s.row.kind==='candidate'?'warning':'info'">{{kinds[s.row.kind]}}</el-tag></template></el-table-column>
      <el-table-column prop="tel" label="联系电话" width="150" />
      <el-table-column label="负责国家" min-width="180"><template slot-scope="s"><template v-if="s.row.countries.length"><el-tag v-for="c in s.row.countries" :key="c" size="mini" type="success" class="country">{{c}}</el-tag><div class="hint">人工确认</div></template><template v-else><el-tag v-for="c in s.row.suggestions" :key="c" size="mini" type="warning" class="country">{{c}}</el-tag><div class="hint">{{s.row.suggestions.length?'国家线索 · 待确认':'国家未知 · 待补充'}}</div></template></template></el-table-column>
      <el-table-column label="仓库 / 收货地址" min-width="230"><template slot-scope="s"><b>{{s.row.warehouse}}</b><div>{{s.row.address || '待补充'}}</div><div v-if="(s.row.addresses || []).length>1" class="hint">共 {{s.row.addresses.length}} 个地址，详情可查看全部</div></template></el-table-column>
      <el-table-column prop="transport" label="运输方式" width="110" />
      <el-table-column prop="note" label="货代备注" min-width="150" show-overflow-tooltip />
      <el-table-column label="资料来源" width="100"><template slot-scope="s">{{s.row.manual?'手工新增':s.row.source_count+' 条来源'}}</template></el-table-column>
      <el-table-column label="操作" fixed="right" width="165"><template slot-scope="s"><el-button type="text" @click="open(s.row.key)">详情 / 补充</el-button><el-button type="text" @click="copy(s.row)">复制</el-button></template></el-table-column>
    </el-table>
    <el-pagination class="pages" background layout="total, sizes, prev, pager, next" :total="count" :current-page="page" :page-size="limit" :page-sizes="[20,50,100]" @current-change="p=>{page=p;load()}" @size-change="n=>{limit=n;search()}" />
    <el-dialog :title="form.key?'货代 / 仓库资料':'新增货代 / 仓库'" :visible.sync="dialog" width="960px" append-to-body>
      <el-tabs v-model="tab">
        <el-tab-pane label="货代资料" name="profile">
          <div v-if="(form.addresses || []).length>1" class="hint">合并保留的地址：<div v-for="(address,i) in form.addresses" :key="i">{{i+1}}. {{address}}</div></div>
          <el-form :model="form" label-width="100px" :disabled="!editable">
            <el-row :gutter="20"><el-col :span="12"><el-form-item label="货代公司"><el-input v-model="form.company" maxlength="120" /></el-form-item></el-col><el-col :span="12"><el-form-item label="联系人"><el-input v-model="form.name" maxlength="120" /></el-form-item></el-col></el-row>
            <el-row :gutter="20"><el-col :span="12"><el-form-item label="联系电话"><el-input v-model="form.tel" maxlength="120" /></el-form-item></el-col><el-col :span="12"><el-form-item label="类型"><el-select v-model="form.kind"><el-option v-for="(label,k) in kinds" :key="k" :label="label" :value="k" /></el-select></el-form-item></el-col></el-row>
            <el-form-item label="负责国家"><el-select v-model="form.countries" multiple filterable placeholder="核实货代承运线路后选择国家" style="width:100%"><el-option v-for="c in countries" :key="c" :label="c" :value="c" /></el-select><div v-if="suggestions.length" class="hint">原资料国家线索：{{suggestions.join('、')}}（不自动认定为承运线路）</div></el-form-item>
            <el-row :gutter="20"><el-col :span="12"><el-form-item label="运输方式"><el-select v-model="form.transport" filterable allow-create clearable placeholder="可自行填写"><el-option v-for="t in ['海运','空运','海运 / 空运','陆运','快递']" :key="t" :label="t" :value="t" /></el-select></el-form-item></el-col><el-col :span="12"><el-form-item label="仓库名称"><el-input v-model="form.warehouse" maxlength="120" /></el-form-item></el-col></el-row>
            <el-form-item label="仓库地址"><el-input v-model="form.address" type="textarea" :rows="3" maxlength="2000" /></el-form-item>
            <el-form-item label="货代备注"><el-input v-model="form.note" type="textarea" :rows="3" maxlength="3000" placeholder="填写可推荐的通用资料，例如收货时间、运输线路；客户专属唛头请留在来源资料里。" /></el-form-item>
          </el-form>
          <div class="hint">保存只更新本页货代资料，不会修改原客户联系人。若不是货代，可将类型设为“非货代 / 暂不推荐”。</div>
        </el-tab-pane>
        <el-tab-pane :label="'来源联系资料（'+sources.length+'）'" name="sources">
          <el-alert title="这里保留原始客户资料，可能包含客户专属唛头及电话，不会放入“复制货代资料”的内容。" type="info" :closable="false" />
          <el-table :data="sources" border class="sources"><el-table-column label="来源客户" min-width="140"><template slot-scope="s">{{s.row.name}}<div class="hint">{{s.row.number}}</div><el-tag size="mini">{{s.row.has_trade?'已有已审核单据':'暂无已审核单据'}}</el-tag></template></el-table-column><el-table-column label="原联系人" width="120"><template slot-scope="s">{{s.row.contact.name}}<div>{{s.row.contact.tel}}</div></template></el-table-column><el-table-column label="原地址" min-width="180"><template slot-scope="s">{{s.row.contact.add}}</template></el-table-column><el-table-column label="原联系人备注" min-width="180"><template slot-scope="s">{{s.row.contact.data}}</template></el-table-column><el-table-column label="客户备注 / 国家线索" min-width="160"><template slot-scope="s">{{s.row.customer_note}}<div class="hint">{{s.row.countries.join('、')}}</div></template></el-table-column></el-table>
        </el-tab-pane>
      </el-tabs>
      <span slot="footer"><el-button @click="dialog=false">关闭</el-button><el-button @click="copy(form)">复制货代资料</el-button><el-button v-if="editable" type="primary" :loading="saving" @click="save">保存资料</el-button></span>
    </el-dialog>
  </div>
</template>
<script>
import countryNames from '@/config/phoneCountryNames.json';
const filters=()=>({keyword:'',country:'',kind:'',source:'traded'});
const empty=()=>({key:'',company:'',name:'',tel:'',address:'',kind:'candidate',countries:[],transport:'',warehouse:'',note:''});
export default {
 name:'Freight',data(){return {filters:filters(),rows:[],summary:{},countries:[...new Set(Object.values(countryNames))].sort((a,b)=>a.localeCompare(b,'zh')),page:1,limit:20,count:0,loading:false,requestId:0,detailId:0,dialog:false,tab:'profile',form:empty(),sources:[],suggestions:[],saving:false,kinds:{candidate:'待确认',forwarder:'货运代理',warehouse:'收货仓库',both:'货代与仓库',excluded:'非货代 / 暂不推荐'}};},
 computed:{canAdd(){return this.$lib.getUserRoot(this.$store.state.root,'base','add');},editable(){return this.form.key?this.$lib.getUserRoot(this.$store.state.root,'base','edit'):this.canAdd;}},
 created(){this.load();},methods:{
 search(){this.page=1;this.load();},reset(){this.filters=filters();this.search();},
 async load(){const id=++this.requestId;this.loading=true;try{const r=await this.$axios.post('freight/record',{...this.filters,page:this.page,limit:this.limit});if(id!==this.requestId)return;if(r.state==='success'){this.rows=r.info;this.summary=r.summary;this.count=r.count;}else this.$message.error(r.info||'加载失败');}catch(e){this.$message.error('加载失败，请重试');}finally{if(id===this.requestId)this.loading=false;}},
 create(){this.detailId++;this.form=empty();this.sources=[];this.suggestions=[];this.tab='profile';this.dialog=true;},
 async open(key){const id=++this.detailId;try{const r=await this.$axios.post('freight/detail',{key});if(id!==this.detailId)return;if(r.state!=='success'){this.$message.error(r.info);return;}this.form={...empty(),...r.info,countries:r.info.countries.slice()};this.sources=r.info.sources;this.suggestions=r.info.suggestions;this.tab='profile';this.dialog=true;}catch(e){this.$message.error('详情加载失败');}},
 async save(){if(!this.form.name.trim()&&!this.form.company.trim()){this.$message.warning('请填写货代公司或联系人');return;}if(!this.form.tel.trim()&&!this.form.address.trim()){this.$message.warning('请填写联系电话或仓库地址');return;}this.saving=true;try{const r=await this.$axios.post('freight/save',this.form);if(r.state==='success'){this.$message.success('货代资料已保存');this.dialog=false;this.load();}else this.$message.error(r.info||'保存失败');}catch(e){this.$message.error('保存失败，请重试');}finally{this.saving=false;}},
 async copy(row){const text=[row.kind==='candidate'&&'资料状态：待确认',row.company&&'公司：'+row.company,row.name&&'联系人：'+row.name,row.tel&&'电话：'+row.tel,(row.countries||[]).length&&'负责国家：'+row.countries.join('、'),row.warehouse&&'仓库：'+row.warehouse,row.address&&'地址：'+row.address,row.transport&&'运输方式：'+row.transport,row.note&&'备注：'+row.note].filter(Boolean).join('\n');try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(text);else{const el=document.createElement('textarea');el.value=text;document.body.appendChild(el);el.select();const ok=document.execCommand('copy');el.remove();if(!ok)throw new Error();}this.$message.success('货代资料已复制');}catch(e){this.$message.error('复制失败，请手动复制资料');}}
 }
};
</script>
<style scoped>
.freight{height:100%;overflow:auto;padding:20px;box-sizing:border-box;background:white}.heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.heading h2{margin:0 0 8px;font-size:21px;color:#253753}.heading p{margin:0;color:#8792a4;font-size:13px}.filters{margin-top:18px}.filters .el-input{width:300px}.filters .el-select{width:190px}.filters .el-form-item{margin-bottom:12px}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:8px 0 14px}.summary>div{display:flex;align-items:center;justify-content:space-between;border:1px solid #e6ebf3;background:#f8faff;border-radius:6px;padding:16px;color:#68788d}.summary b{font-size:25px;color:#1978df}.hint{font-size:12px;color:#8792a4;line-height:1.7;overflow-wrap:anywhere}.country{margin:2px 4px 2px 0}.pages{margin:18px 0;text-align:right}.sources{margin-top:14px}@media(max-width:900px){.summary{grid-template-columns:repeat(2,1fr)}.heading{display:block}.heading>div+div{margin-top:12px}}
</style>
