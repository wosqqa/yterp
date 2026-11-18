<template>
  <div class="customer-care area">
    <div class="care-heading"><div><h2>客户维护</h2><p>跟进未付款订单，唤醒半年未下单的老客户</p></div><el-button @click="$router.push('/system/customer')">返回客户管理</el-button></div>
    <div class="care-tabs">
      <el-radio-group v-model="filters.trade" @change="search">
        <el-radio-button label="pending">待付款回访</el-radio-button>
        <el-radio-button label="dormant">半年未下单</el-radio-button>
        <el-radio-button label="">全部客户</el-radio-button>
      </el-radio-group>
    </div>
    <el-form inline class="care-filters" @submit.native.prevent="search">
      <el-form-item><el-input v-model="filters.keyword" clearable placeholder="客户名称 / 编号" @keyup.enter.native="search" /></el-form-item>
      <el-form-item><el-input v-model="filters.data" clearable placeholder="国家 / 备注" @keyup.enter.native="search" /></el-form-item>
      <el-form-item><nod-list v-model="filters.user" action="service/userRecord" scene="user" placeholder="所属用户" /></el-form-item>
      <el-form-item><el-select v-model="filters.grade" clearable placeholder="客户等级"><el-option v-for="g in (store.sys.crGrade || [])" :key="g" :label="g" :value="g" /></el-select></el-form-item>
      <el-form-item><el-select v-model="filters.due" clearable placeholder="回访计划"><el-option label="今天回访" value="today" /><el-option label="已逾期" value="overdue" /><el-option label="未登记回访" value="never" /></el-select></el-form-item>
      <el-form-item><el-select v-model="filters.period" placeholder="统计周期"><el-option label="本季度" value="quarter" /><el-option label="今年" value="year" /><el-option label="本月" value="month" /><el-option label="自定义日期" value="custom" /></el-select></el-form-item>
      <el-form-item v-if="filters.period==='custom'"><el-date-picker v-model="dates" type="daterange" value-format="yyyy-MM-dd" start-placeholder="开始日期" end-placeholder="结束日期" /></el-form-item>
      <el-form-item><el-select v-model="filters.sort"><el-option label="按回访日期排序" value="" /><el-option label="最近下单优先" value="last" /><el-option label="本期金额优先" value="amount" /></el-select></el-form-item>
      <el-form-item><el-button type="primary" @click="search">查询</el-button><el-button @click="reset">重置</el-button></el-form-item>
    </el-form>
    <div class="care-summary"><div v-for="card in cards" :key="card.key"><span>{{card.label}}</span><strong>{{summary[card.key] || 0}}</strong></div></div>
    <p class="care-note">当前筛选结果 · 本期 {{range.join(' 至 ')}}。以销售订单统计；未审核订单按待付款跟进（不是财务欠款）。半年未下单按最近一次销售订单距今满六个自然月判断。金额为人民币，不扣退货。</p>
    <el-table :data="rows" border v-loading="loading" empty-text="没有符合条件的客户">
      <el-table-column label="客户" min-width="160"><template slot-scope="s"><b>{{s.row.name}}</b><div class="muted">{{s.row.number}}</div></template></el-table-column>
      <el-table-column prop="user_name" label="所属用户" width="100" />
      <el-table-column prop="data" label="国家 / 备注" min-width="130" show-overflow-tooltip />
      <el-table-column label="待付款订单" width="130"><template slot-scope="s"><el-tag v-if="Number(s.row.pending_count)" type="warning">{{s.row.pending_count}} 单</el-tag><span v-else>—</span><div v-if="Number(s.row.pending_count)" class="muted">¥{{money(s.row.pending_amount)}}</div></template></el-table-column>
      <el-table-column label="最早待付款日期" width="135"><template slot-scope="s">{{day(s.row.oldest_pending)}}</template></el-table-column>
      <el-table-column label="最近下单" width="130"><template slot-scope="s">{{day(s.row.last_order)}}<div class="muted">{{s.row.days_since===null ? '从未下单' : s.row.days_since+' 天未下单'}}</div></template></el-table-column>
      <el-table-column label="本期 / 累计订单" width="130"><template slot-scope="s">{{s.row.period_count || 0}} / {{s.row.order_count || 0}} 单<div class="muted">本期 ¥{{money(s.row.period_amount)}}</div></template></el-table-column>
      <el-table-column label="下次回访" width="130"><template slot-scope="s"><el-tag v-if="Number(s.row.next_time)>0" :type="dueType(s.row.next_time)">{{day(s.row.next_time)}}</el-tag><span v-else class="muted">未安排</span></template></el-table-column>
      <el-table-column label="最近回访" min-width="145"><template slot-scope="s">{{day(s.row.contact_time)}}<div class="muted ellipsis" :title="s.row.last_content">{{s.row.last_content || '未登记回访'}}</div></template></el-table-column>
      <el-table-column label="操作" fixed="right" width="110"><template slot-scope="s"><el-button size="mini" type="primary" plain @click="open(s.row)">查看 / 回访</el-button></template></el-table-column>
    </el-table>
    <el-pagination class="care-pages" background layout="total, sizes, prev, pager, next" :total="count" :current-page="page" :page-size="limit" :page-sizes="[20,50,100]" @current-change="changePage" @size-change="changeSize" />
    <el-dialog :title="active ? active.name+' · 客户维护' : '客户维护'" :visible.sync="dialog" width="960px" append-to-body>
      <template v-if="detail">
        <p class="care-note">客户编号：{{detail.customer.number}}　备注：{{detail.customer.data || '—'}}</p>
        <el-tabs v-model="tab">
          <el-tab-pane label="销售订单" name="orders">
            <p class="care-note">未审核订单为待付款回访对象；可点击编号查看订单。</p>
            <el-table :data="detail.sales" border><el-table-column label="日期" width="120"><template slot-scope="s">{{day(s.row.time)}}</template></el-table-column><el-table-column label="订单编号" min-width="220"><template slot-scope="s"><el-button type="text" @click="previewNumber=String(s.row.id); preview=true">{{s.row.number}}</el-button></template></el-table-column><el-table-column label="审核 / 付款跟进" width="160"><template slot-scope="s"><el-tag :type="Number(s.row.examine)===0?'warning':'success'">{{Number(s.row.examine)===0?'未审核 · 待付款':'已审核'}}</el-tag></template></el-table-column><el-table-column label="订单金额"><template slot-scope="s">¥{{money(s.row.actual)}}</template></el-table-column></el-table>
            <el-pagination class="care-pages" layout="total, prev, pager, next" :page-size="10" :total="detail.saleCount" :current-page="salesPage" @current-change="p=>{salesPage=p;loadDetail()}" />
          </el-tab-pane>
          <el-tab-pane label="回访记录" name="followups">
            <el-timeline v-if="detail.followups.length"><el-timeline-item v-for="f in detail.followups" :key="f.id" :timestamp="stamp(f.contact_time)" placement="top"><b>{{f.channel}} · {{f.user_name}}</b><p class="follow-content">{{f.content}}</p><span class="muted">下次回访：{{day(f.next_time)}}</span></el-timeline-item></el-timeline><el-empty v-else description="还没有回访记录" />
            <el-pagination class="care-pages" layout="total, prev, pager, next" :page-size="10" :total="detail.followupCount" :current-page="followupPage" @current-change="p=>{followupPage=p;loadDetail()}" />
          </el-tab-pane>
          <el-tab-pane v-if="canEdit" label="登记回访" name="add">
            <el-form label-width="110px"><el-form-item label="联系时间" required><el-date-picker v-model="form.contact_time" type="datetime" value-format="yyyy-MM-dd HH:mm:ss" /></el-form-item><el-form-item label="联系方式" required><el-radio-group v-model="form.channel"><el-radio-button v-for="c in ['WhatsApp','电话','邮件','其他']" :key="c" :label="c" /></el-radio-group></el-form-item><el-form-item label="回访内容" required><el-input v-model="form.content" type="textarea" :rows="4" maxlength="2000" show-word-limit placeholder="例如：已发送报价，客户计划下周付款；半年未采购，已推荐新品。" /></el-form-item><el-form-item label="下次回访"><el-date-picker v-model="form.next_time" type="date" value-format="yyyy-MM-dd" clearable placeholder="安排下次联系日期" /><div class="muted">最新登记的回访计划替代之前的提醒；留空表示暂不安排。</div></el-form-item><el-form-item><el-button type="primary" :loading="saving" @click="save">保存回访</el-button></el-form-item></el-form>
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-dialog>
    <order-preview-dialog action="customerCare/order" v-model="preview" :number="previewNumber" />
  </div>
</template>
<script>
import NodList from '@/components/lib/NodList';
import OrderPreviewDialog from '@/components/dialog/OrderPreviewDialog';
const defaults=()=>({trade:'pending',keyword:'',data:'',user:null,grade:'',due:'',period:'quarter',sort:''});
export default {
  name:'CustomerCare', components:{NodList,OrderPreviewDialog},
  data(){return {filters:defaults(),dates:[],rows:[],summary:{},range:[],count:0,page:1,limit:20,loading:false,dialog:false,active:null,detail:null,tab:'orders',salesPage:1,followupPage:1,form:{},saving:false,preview:false,previewNumber:'',requestId:0,detailRequestId:0,cards:[{key:'total',label:'当前客户'},{key:'pending',label:'待付款客户'},{key:'dormant',label:'半年未下单'},{key:'today',label:'今天回访'},{key:'overdue',label:'回访逾期'}]};},
  computed:{store(){return this.$store.state;},canEdit(){return this.$lib.getUserRoot(this.store.root,'base','edit');}},
  created(){this.record();},
  methods:{
    money(v){return Number(v||0).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});},
    day(v){return Number(v)>0?this.formatDate(new Date(Number(v)*1000)): '—';},
    formatDate(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');},
    stamp(v){const d=new Date(Number(v)*1000);return this.formatDate(d)+' '+[d.getHours(),d.getMinutes()].map(n=>String(n).padStart(2,'0')).join(':');},
    dueType(v){const a=this.formatDate(new Date()),b=this.day(v);return b<a?'danger':b===a?'warning':'info';},
    search(){this.page=1;this.record();},reset(){this.filters=defaults();this.dates=[];this.search();},changePage(p){this.page=p;this.record();},changeSize(n){this.limit=n;this.search();},
    async record(){if(this.filters.period==='custom'&&(!this.dates||this.dates.length!==2)){this.$message.warning('请选择起止日期');return;}const id=++this.requestId;this.loading=true;try{const r=await this.$axios.post('customerCare/record',{...this.filters,start:this.dates&&this.dates[0],end:this.dates&&this.dates[1],page:this.page,limit:this.limit});if(id!==this.requestId)return;if(r.state==='success'){this.rows=r.info;this.count=r.count;this.summary=r.summary;this.range=r.range;}else this.$message.error(r.info||'加载失败');}catch(e){this.$message.error('客户维护加载失败，请重试');}finally{if(id===this.requestId)this.loading=false;}},
    open(row){this.active=row;this.detail=null;this.salesPage=1;this.followupPage=1;this.tab='orders';this.form={channel:'WhatsApp',contact_time:this.stamp(Date.now()/1000)+':00',content:'',next_time:''};this.dialog=true;this.loadDetail();},
    async loadDetail(){const id=++this.detailRequestId;try{const r=await this.$axios.post('customerCare/detail',{id:this.active.id,salesPage:this.salesPage,followupPage:this.followupPage});if(id!==this.detailRequestId)return;if(r.state==='success')this.detail=r;else this.$message.error(r.info||'加载失败');}catch(e){this.$message.error('详情加载失败');}},
    async save(){if(!this.form.contact_time||!this.form.content.trim()){this.$message.warning('请填写联系时间和回访内容');return;}this.saving=true;try{const r=await this.$axios.post('customerCare/saveFollowup',{...this.form,customer:this.active.id});if(r.state==='success'){this.$message.success('回访已保存');this.form.content='';this.followupPage=1;this.tab='followups';await this.loadDetail();this.record();}else this.$message.error(r.info||'保存失败');}catch(e){this.$message.error('保存失败，请重试');}finally{this.saving=false;}}
  }
};
</script>
<style scoped>
.customer-care{padding:20px;box-sizing:border-box;background:#fff;overflow:auto;height:100%;}.care-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}.care-heading h2{font-size:21px;margin:0 0 8px;color:#253753}.care-heading p,.muted,.care-note{color:#8792a4;font-size:12px;line-height:1.7}.care-heading p{margin:0}.care-tabs{margin-bottom:18px}.care-filters .el-input,.care-filters .el-select{width:185px}.care-filters .el-form-item{margin-bottom:12px}.care-summary{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin:8px 0 14px}.care-summary>div{border:1px solid #e6ebf3;border-radius:6px;padding:16px;background:#f8faff;display:flex;justify-content:space-between;align-items:center}.care-summary span{color:#68788d}.care-summary strong{color:#1978df;font-size:25px}.care-note{margin:12px 0}.care-pages{margin-top:18px;text-align:right}.ellipsis{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.follow-content{white-space:pre-wrap;overflow-wrap:anywhere;color:#38475c;line-height:1.7}.el-timeline{margin-top:18px}@media(max-width:900px){.care-summary{grid-template-columns:repeat(2,1fr)}}
</style>
