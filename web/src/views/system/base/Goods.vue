<template>
	<div class="goods area">
		<div class="layout">
			<el-popover ref="searchPopover" popper-class="searchPopover" placement="bottom-start">
				<el-form class="searchFrom" ref="searchFrom"  inline>
					<el-form-item>
						<el-input placeholder="请输入商品名称" v-model="searchFrom.name" clearable></el-input>
					</el-form-item>
					<el-form-item>
						<el-input placeholder="请输入商品编号" v-model="searchFrom.number" clearable></el-input>
					</el-form-item>
					<el-form-item>
						<el-input placeholder="请输入商品型号" v-model="searchFrom.spec" clearable></el-input>
					</el-form-item>
					<el-form-item>
						<nodTree v-model="searchFrom.category" :treeData="store.category" placeholder="请选择商品类别"></nodTree>
					</el-form-item>
					<el-form-item>
						<el-select v-model="searchFrom.brand" placeholder="请选择商品品牌" clearable>
							<el-option v-for="brand in store.sys.brand" :key="brand" :label="brand" :value="brand"></el-option>
						  </el-select>
					</el-form-item>
					<el-form-item>
						<el-input placeholder="请输入商品条码" v-model="searchFrom.code" clearable></el-input>
					</el-form-item>
					<el-form-item>
						<el-select v-model="searchFrom.type" placeholder="请选择商品类型" clearable>
							<el-option label="常规商品" :value="1"></el-option>
							<el-option label="服务商品" :value="2"></el-option>
						</el-select>
					</el-form-item>
					<el-form-item>
						<el-input placeholder="请输入备注信息" v-model="searchFrom.data" clearable></el-input>
					</el-form-item>
					<el-divider></el-divider>
					<el-button class="searchBtn" icon="el-icon-search" @click="record(1)" ></el-button>
				</el-form>
				<el-button slot="reference" icon="el-icon-more" ></el-button>
			</el-popover>
			<el-button-group>
				<template v-if="tableSelection.length!=0">
					<template v-if="$lib.getUserRoot(store.root,'base','del')">
						<el-button @click="del(tableSelection)"  type="info">删除</el-button>
					</template>
				</template>
				<template v-if="$lib.getUserRoot(store.root,'base','add')">
					<el-button @click="set(0)" >新增</el-button>
				</template>
				<template v-if="$lib.getUserRoot(store.root,'base','batch')">
					<el-button @click="batch.dialog=true" >批量</el-button>
				</template>
                <el-button v-if="$lib.getUserRoot(store.root,'base','edit')" :disabled="!tableSelection.length" @click="openPriceBatch">批量调价</el-button>
				<el-button @click="toggleView">{{ viewMode ? '列表' : '视图' }}</el-button>
				<el-button @click="togglePics">{{ picMode ? '隐藏图片' : '图片' }}</el-button>
				<el-button @click="openQuotePage">查看报价表</el-button>
				<el-button @click="reload" >刷新</el-button>
			</el-button-group>
		</div>
		<el-divider></el-divider>
		<div v-if="viewMode" class="viewWrap">
			<div class="goodsGrid">
				<div v-for="row in tableData" :key="row.id" class="goodsCard" @click="set(row.id)">
					<div class="cardImg">
						<el-image v-if="getImgUrl(row)" :src="getImgUrl(row)" fit="contain">
							<div slot="error" class="imgErrorMini">
								<i class="el-icon-picture-outline"></i>
							</div>
						</el-image>
						<div v-else class="imgErrorMini">
							<i class="el-icon-picture-outline"></i>
						</div>
					</div>
					<div class="cardNo">{{ row.number }}</div>
				</div>
			</div>
		</div>
		<el-table v-else :data="tableData" height="calc(100% - 90px)" @selection-change="selectionChange" border v-madeTable>
			<el-table-column type="selection" align="center" width="39px" fixed="left"></el-table-column>
			<el-table-column v-if="picMode" label="图片" align="center" width="100px" fixed="left">
				<template slot-scope="scope">
					<div class="tableImg">
						<el-image v-if="getImgUrl(scope.row)" :src="getImgUrl(scope.row)" fit="contain">
							<div slot="error" class="imgErrorMini">
								<i class="el-icon-picture-outline"></i>
							</div>
						</el-image>
						<div v-else class="imgErrorMini">
							<i class="el-icon-picture-outline"></i>
						</div>
					</div>
				</template>
			</el-table-column>
			<el-table-column prop="name" label="商品名称" align="center" width="220px"></el-table-column>
			<el-table-column prop="number" label="商品编号" align="center" width="160px"></el-table-column>
			<el-table-column prop="spec" label="规格型号" align="center" width="160px"></el-table-column>
			<el-table-column prop="categoryData.name" label="商品分类" align="center" width="120px"></el-table-column>
			<el-table-column prop="brand" label="商品品牌" align="center" width="120px"></el-table-column>
			<el-table-column prop="extension.unit" label="商品单位" align="center" width="120px"></el-table-column>
			<el-table-column prop="code" label="商品条码" align="center" width="160px"></el-table-column>
			<el-table-column prop="extension.type" label="商品类型" align="center" width="120px"></el-table-column>
			<el-table-column prop="data" label="备注信息 " align="center" min-width="200px"></el-table-column>
			<el-table-column prop="set" label="相关操作" align="center" width="180px" fixed="right">
				<template slot-scope="scope">
					<el-button-group>
						<el-button @click="set(scope.row.id)" size="mini">详情</el-button>
						<template v-if="$lib.getUserRoot(store.root,'base','del')">
							<el-button @click="del([scope.row.id])" size="mini">删除</el-button>
						</template>
					</el-button-group>
				</template>
			</el-table-column>
		</el-table>
		<el-pagination class="tablePagination" :current-page.sync="page.current" :total="page.total" :page-size.sync="page.size"
		 :page-sizes="page.sizes" :pager-count="page.count" @size-change="record(1)" @current-change="record(0)" layout="prev,pager,next,jumper,sizes,total">
		</el-pagination>
        <el-dialog title="批量调价" :visible.sync="priceBatch.visible" width="900px" :close-on-click-modal="false" :close-on-press-escape="!priceBatch.loading" :show-close="!priceBatch.loading">
          <p>已选 {{ priceBatch.rows.length }} 个商品，仅修改基础价格，辅助属性价格及历史单据不变。空白表示不修改，0 表示改为零。</p>
          <el-checkbox v-model="priceBatch.buy">采购价</el-checkbox>
          <el-checkbox v-model="priceBatch.sell">销售价</el-checkbox>
          <el-select v-model="priceBatch.mode" size="small" style="width:150px;margin:0 12px">
            <el-option label="逐项修改" value="manual"/><el-option label="统一价格" value="fixed"/><el-option label="增减金额" value="amount"/><el-option label="按比例调整(%)" value="percent"/>
          </el-select>
          <template v-if="priceBatch.mode!=='manual'">
            <el-input v-if="priceBatch.buy" v-model="priceBatch.buyValue" size="small" :placeholder="priceBatch.mode==='fixed'?'采购价（元）':priceBatch.mode==='percent'?'采购价调整（%）':'采购价增减（元）'" style="width:170px;margin-right:8px"/>
            <el-input v-if="priceBatch.sell" v-model="priceBatch.sellValue" size="small" :placeholder="priceBatch.mode==='fixed'?'销售价（元）':priceBatch.mode==='percent'?'销售价调整（%）':'销售价增减（元）'" style="width:170px;margin-right:8px"/>
            <el-button size="small" @click="applyPriceBatch">应用并预览</el-button>
          </template>
          <p>支持从 Excel 复制两列新价格，在对应输入框粘贴；只粘贴一列时从当前列向下填充。</p>
          <el-table :data="priceBatch.rows" max-height="420" border>
            <el-table-column prop="number" label="商品编号" width="100"/>
            <el-table-column prop="name" label="商品名称" min-width="160"/>
            <el-table-column prop="old_buy" label="原采购价" width="100"/>
            <el-table-column label="新采购价" width="130"><template slot-scope="scope"><el-input v-model="scope.row.buy" :disabled="!priceBatch.buy || priceBatch.loading" size="small" @paste.native="pastePrices($event,scope.$index,'buy')"/></template></el-table-column>
            <el-table-column prop="old_sell" label="原销售价" width="100"/>
            <el-table-column label="新销售价" width="130"><template slot-scope="scope"><el-input v-model="scope.row.sell" :disabled="!priceBatch.sell || priceBatch.loading" size="small" @paste.native="pastePrices($event,scope.$index,'sell')"/></template></el-table-column>
          </el-table>
          <span slot="footer"><el-button :disabled="priceBatch.loading" @click="priceBatch.visible=false">取消</el-button><el-button type="primary" :loading="priceBatch.loading" @click="savePriceBatch">确认修改</el-button></span>
        </el-dialog>
		<el-dialog class="tabsDialog" :visible.sync="dialog.show" title="详情" width="970px" v-madeDialog>
			<transition name="el-fade-in">
				<template v-if="dialog.show">
					<el-form :model="form" :rules="rules" ref="form" label-width="80px"  :inline="true">
						<el-tabs v-model="dialog.active">
							<el-tab-pane label="基础信息" name="base">
								<el-form-item label="商品名称" prop="name">
									<el-input placeholder="请输入商品名称" v-model="form.name" clearable></el-input>
								</el-form-item>
								<el-form-item label="商品编号" prop="number">
									<el-input placeholder="请输入商品编号" v-model="form.number" clearable></el-input>
								</el-form-item>
								<el-form-item label="商品型号">
									<el-input placeholder="请输入商品型号" v-model="form.spec" clearable></el-input>
								</el-form-item>
								<el-form-item label="商品类别" prop="category">
									<template slot="label">
									    <span @click="switchPage('category')">商品类别</span>
									</template>
									<nodTree v-model="form.category" :treeData="store.category" placeholder="请选择商品类别"></nodTree>
								</el-form-item>
								<el-form-item label="商品品牌">
									<template slot="label">
									    <span @click="switchPage('sys')">商品品牌</span>
									</template>
									<el-select v-model="form.brand" placeholder="请选择商品品牌" clearable filterable>
										<el-option v-for="brand in store.sys.brand" :key="brand" :label="brand" :value="brand"></el-option>
									</el-select>
								</el-form-item>
								<el-form-item label="商品单位" prop="unit">
									<template slot="label">
									    <span @click="switchPage('sys')">商品单位</span>
									</template>
									<el-select v-model="form.unit" placeholder="请选择商品单位" @change="unitChange" clearable>
										<el-option v-for="unit in store.sys.unit" :key="unit" :label="unit" :value="unit"></el-option>
										<el-option label="多单位" value="-1"></el-option>
									 </el-select>
								</el-form-item>
								<el-form-item label="采购价格" prop="buy">
									<el-input placeholder="请输入采购价格" v-model="form.buy" clearable></el-input>
								</el-form-item>
								<el-form-item label="销售价格" prop="sell">
									<el-input placeholder="请输入销售价格" v-model="form.sell" clearable></el-input>
								</el-form-item>
								<el-form-item label="商品条码">
									<template slot="label">
									    <span @click="switchPage('code')">商品条码</span>
									</template>
									<el-input placeholder="请输入商品条码" v-model="form.code" clearable></el-input>
								</el-form-item>
								<el-form-item label="商品货位">
									<el-input placeholder="请输入商品货位" v-model="form.location" clearable></el-input>
								</el-form-item>
								<el-form-item label="库存阈值" prop="stock">
									<el-input placeholder="请输入库存阈值" v-model="form.stock" clearable></el-input>
								</el-form-item>
								<el-form-item label="商品类型">
									<el-select v-model="form.type" placeholder="请选择商品类型">
										<el-option label="常规商品" :value="0"></el-option>
										<el-option label="服务商品" :value="1"></el-option>
									</el-select>
								</el-form-item>
								<el-form-item label="备注信息">
									<el-input placeholder="请输入备注信息" v-model="form.data" clearable></el-input>
								</el-form-item>
							</el-tab-pane>
							<el-tab-pane label="辅助属性" name="attr">
								<el-table :data="dialog.attribute" size="mini" border style="margin-bottom: 12px;" >
									<el-table-column prop="name" label="属性名称" width="90px"></el-table-column>
									<el-table-column label="属性内容" min-width="240px">
										<template slot-scope="scope">
											<el-checkbox v-for="row in scope.row.info" :key="row.name" v-model="dialog.attrChecked['n'+$lib.charUnique(row.name)].checked" class="attrNode" @change="AttrChange">{{row.name}}</el-checkbox>
										</template>
									</el-table-column>
								</el-table>
								<el-table :data="form.attr" size="mini" class="gridTable" border>
									<el-table-column prop="name" label="属性名称" align="center" min-width="100px"></el-table-column>
									<el-table-column align="center" width="100px">
										<template slot="header">
											<span>采购价格 <i class="el-icon-sort" @click="attrFill('buy')"></i></span>
										</template>
										<template slot-scope="scope">
											<input type="text" v-model="scope.row.buy" placeholder="采购价格" />
										</template>
									</el-table-column>
									<el-table-column align="center" width="100px">
										<template slot="header">
											<span>销售价格 <i class="el-icon-sort" @click="attrFill('sell')"></i></span>
										</template>
										<template slot-scope="scope">
											<input type="text" v-model="scope.row.sell" placeholder="销售价格" />
										</template>
									</el-table-column>
									<el-table-column align="center" width="120px">
										<template slot="header">
											<span>条形码 <i class="el-icon-sort" @click="attrFill('code')"></i></span>
										</template>
										<template slot-scope="scope">
											<input type="text" v-model="scope.row.code" placeholder="条形码" />
										</template>
									</el-table-column>
								</el-table>
							</el-tab-pane>
							<el-tab-pane label="属性配置" name="dispose" class="dispose formItemInitial">
								<el-collapse v-model="dialog.disposeActive" @change="disposeChange">
									<template v-if="form.unit=='-1'">
										<el-collapse-item title="多单位配置" name="units">
											<el-table :data="form.units" size="mini" class="gridTable" border>
												<el-table-column label="单位名称" align="center" min-width="120px">
													<template slot-scope="scope">
														<input type="text" v-model="scope.row.name" @input="unitNameChange(scope.$index)" placeholder="单位名称" />
													</template>
												</el-table-column>
												<el-table-column label="单位数量" align="center" width="120px">
													<template slot-scope="scope">
														<input type="text" v-model="scope.row.nums" placeholder="单位数量" />
													</template>
												</el-table-column>
												<el-table-column label="关联单位" align="center" width="120px">
													<template slot-scope="scope">
														<template v-if="scope.$index==0">
															<input type="text" v-model="scope.row.source" placeholder="基本单位" />
														</template>
														<template v-else>
															<span>{{scope.row.source}}</span>
														</template>
													</template>
												</el-table-column>
												<el-table-column label="折扣率 (%)" align="center" width="120px">
													<template slot-scope="scope">
														<input type="text" v-model="scope.row.discount" placeholder="折扣率" />
													</template>
												</el-table-column>
												<el-table-column align="center" width="120px">
													<template slot="header">
														<span>相关操作</span> <i class="el-icon-circle-plus-outline" @click="addUnit"></i>
													</template>
													<template slot-scope="scope">
														<i class="el-icon-delete" @click="delUnit(scope.$index)"></i>
													</template>
												</el-table-column>
											</el-table>
										</el-collapse-item>
									</template>
									<el-collapse-item title="折扣策略" name="strategy">
										<el-table :data="form.strategy" size="mini" class="gridTable" border>
											<el-table-column label="客户等级" align="center" width="160px">
												<template slot-scope="scope">
													<select v-model="scope.row.grade">
														<option v-for="gride in store.sys.crGrade" :key="gride" :value="gride">{{gride}}</option>
													</select>
												</template>
											</el-table-column>
											<el-table-column label="折扣率 (%)" align="center" width="160px">
												<template slot-scope="scope">
													<input type="text" v-model="scope.row.discount" placeholder="折扣策略" />
												</template>
											</el-table-column>
											<el-table-column label="备注信息" align="center" min-width="120px">
												<template slot-scope="scope">
													<input type="text" v-model="scope.row.data" placeholder="备注信息" />
												</template>
											</el-table-column>
											<el-table-column align="center" width="120px">
												<template slot="header">
													<span>相关操作</span> <i class="el-icon-circle-plus-outline" @click="addStrategy"></i>
												</template>
												<template slot-scope="scope">
													<i class="el-icon-delete" @click="delStrategy(scope.$index)"></i>
												</template>
											</el-table-column>
										</el-table>
									</el-collapse-item>
									<el-collapse-item name="serial" class="collapseSwitch collapseContentHide">
										<template slot="title">
											<span>序列商品</span><el-switch v-model="form.serial" :disabled="true"></el-switch>
										</template>
									</el-collapse-item>
									<el-collapse-item name="batch" class="collapseSwitch">
										<template slot="title">
											<span>批次商品</span> <el-switch v-model="form.batch" :disabled="true"></el-switch>
										</template>
										<el-form-item label="有效期">
											<el-switch v-model="form.validity" @change="validityChange"></el-switch>
										</el-form-item>
										<el-form-item label="保质期" prop="protect">
											<el-input placeholder="请输入保质期" v-model="form.protect" :disabled="!form.validity" clearable>
												<template slot="suffix">天</template>
											</el-input>
										</el-form-item>
										<el-form-item label="预警阀值" prop="threshold">
											<el-input placeholder="请输入预警阀值" v-model="form.threshold" :disabled="!form.validity" clearable>
												<template slot="suffix">天</template>
											</el-input>
										</el-form-item>
									</el-collapse-item>
								</el-collapse>
							</el-tab-pane>
							<el-tab-pane label="图文详情" name="details" class="formItemInitial">
								<el-form-item label="商品图像">
									<div class="uploadChannel">
										<el-radio-group v-model="uploadChannel" size="mini">
											<el-radio-button label="local">本地上传</el-radio-button>
											<el-radio-button label="cos">COS云存储</el-radio-button>
										</el-radio-group>
									</div>
									<el-upload
										:action="uploadAction"
										:headers="{Token:$store.state.token}"
										list-type="picture-card"
										:limit="3"
										:file-list="form.imgs"
										:on-success="uploadSuccess"
										:on-remove="uploadRemove"
										:on-preview="uploadPreview"
										:on-exceed="uploadExceed"
									>
										<i class="el-icon-plus"></i>
									</el-upload>
								</el-form-item>
								<el-form-item label="图文详情" class="editorBox" >
									<NodEditor v-model="form.details" ></NodEditor>
								</el-form-item>
							</el-tab-pane>
							<template v-if="store.fields.hasOwnProperty($route.name)">
								<el-tab-pane label="扩展信息" name="more" class="formItemInitial">
									<FieldForm v-model="form.more" rule="goods" prefix="more."></FieldForm>
								</el-tab-pane>
							</template>
						</el-tabs>
					</el-form>
				</template>
			</transition>
			<span slot="footer" class="dialog-footer">
				<el-button @click="dialog.show = false" >取消</el-button>
				<template v-if="form.id>0 && $lib.getUserRoot(store.root,'base','add')">
					<el-button @click="copyAdd" type="success" >新增</el-button>
				</template>
				<template v-if="form.id==0 || $lib.getUserRoot(store.root,'base','edit')">
					<el-button @click="save" type="primary" >保存</el-button>
				</template>
			</span>
		</el-dialog>
		<el-dialog class="tabsDialog" :visible.sync="batch.dialog" title="批量" width="420px" v-madeDialog>
			<transition name="el-fade-in">
				<template v-if="batch.dialog">
					<el-tabs v-model="batch.active">
						<el-tab-pane label="导入数据" name="import">
							<ul class="importTip">
								<li>1.该功能适用于批量导入数据。</li>
								<li>2.您需要下载数据模板后使用Excel录入数据。</li>
								<li>3.录入数据时，请勿修改首行数据标题以及排序。</li>
								<li>4.请查阅使用文档获取字段格式内容以及相关导入须知。</li>
								<li>5.点击下方上传模板，选择您编辑好的模板文件即可。</li>
							</ul>
							<el-divider></el-divider>
							<el-row style="text-align:center;">
								<el-col :span="12">
									<el-button @click="downTemplate" type="info" >下载模板</el-button>
								</el-col>
								<el-col :span="12">
									<el-upload
										:action="$base.web+'goods/import'"
										:headers="{Token:$store.state.token}"
										:show-file-list="false"
										:on-success="importCall"
									>
										<el-button type="primary" >上传模板</el-button>
									</el-upload>
								</el-col>
							</el-row>
						</el-tab-pane>
						<el-tab-pane label="导出数据" name="export">
							<div class="exportItem" @click="exports">
								<i class="el-icon-download"></i>
								<p>导出数据</p>
							</div>
						</el-tab-pane>
					</el-tabs>
				</template>
			</transition>
		</el-dialog>

	</div>
</template>
<script>
	import NodTree from "@/components/lib/NodTree";
	import NodList from "@/components/lib/NodList";
	import NodEditor from "@/components/lib/NodEditor.vue";
	import FieldForm from "@/components/lib/FieldForm";

	export default {
		name: "Goods",
		components: {
			NodTree,
			NodList,
			NodEditor,
			FieldForm,
		
		},
		data() {
			return {
				searchFrom: {
					name: "",
					number:"",
					spec:"",
					category:null,
					brand:"",
					code:"",
					type:"",
					data: "",
				},
				tableData: [],
				tableSelection:[],
				page: {
					current: 1,
					total: 0,
					size: 30,
					sizes: [30, 60, 90, 150, 300],
					count: 5
				},
				picMode: false,
				viewMode: false,
				uploadChannel: "local",
				dialog:{
					show:false,
					active:'base',
					attribute:[],
					attrChecked:{},
					disposeActive:[],
					origin:{id:0,name:"",number:""}
				},
				form: {
					id: 0,
					name: "",
					number:"",
					spec:"",
					category:null,
					brand:"",
					unit:"",
					buy:"",
					sell:"",
					code:"",
					location:'',
					stock:30,
					type:0,
					data:"",
					imgs:[],
					details:"",
					units:[],
					strategy:[],
					serial:false,
					batch:false,
					validity:false,
					protect:0,
					threshold:0,
					more: {},
					attr:[]
				},
				rules: {
					name: {
						required: true,
						message: "请输入商品名称",
						trigger: "blur"
					},
					number: {
						required: true,
						message: "请输入商品编号",
						trigger: "blur"
					},
					category: {
						required: true,
						message: "请选择商品类别",
						trigger: "change"
					},
					unit: {
						required: true,
						message: "请选择商品单位",
						trigger: "blur"
					},
					buy: [
						{
							required: true,
							message: "请输入采购价格",
							trigger: "blur"
						},
						{
							validator: (rule,value,callback)=>{
								this.$lib.synValidate('money',value)?callback():callback(new Error('采购价格不正确'));
							},
							trigger: "blur"
						}
					],
					sell: [
						{
							required: true,
							message: "请输入销售价格",
							trigger: "blur"
						},
						{
							validator: (rule,value,callback)=>{
								this.$lib.synValidate('money',value)?callback():callback(new Error('销售价格不正确'));
							},
							trigger: "blur"
						}
					],
					
					stock: [
						{
							required: true,
							message: "请输入库存阈值",
							trigger: "blur"
						},
						{
							validator: (rule,value,callback)=>{
								this.$lib.synValidate('nums',value)?callback():callback(new Error('库存阈值不正确'));
							},
							trigger: "blur"
						}
					],
					protect: [
						{
							required: true,
							message: "请输入批次商品 - 保质期",
							trigger: "blur"
						},
						{
							validator: (rule,value,callback)=>{
								this.$lib.validate('number',value)?callback():callback(new Error('批次商品 - 保质期不正确'));
							},
							trigger: "blur"
						}
					],
					threshold: [
						{
							required: true,
							message: "请输入批次商品 - 预警阀值",
							trigger: "blur"
						},
						{
							validator: (rule,value,callback)=>{
								this.$lib.validate('number',value)?callback():callback(new Error('批次商品 - 预警阀值不正确'));
							},
							trigger: "blur"
						}
					]
				},
				priceBatch:{visible:false,loading:false,rows:[],buy:true,sell:true,mode:"manual",buyValue:"",sellValue:""},
				batch:{
					dialog:false,
					active:"import"
				},
				
			};
		},
		created() {
			this.getBase();//获取基础数据
			this.record(1); //获取数据
		},
		computed: {
			//读取数据中心
			store() {
				return this.$store.state;
			},
			//商品图像上传地址
			uploadAction() {
				return this.$base.web + (this.uploadChannel == "cos" ? "goods/uploadCos" : "goods/upload");
			}
		},
		methods: {
            openPriceBatch(){
                const ids = new Set(this.tableSelection);
                this.priceBatch.rows = this.tableData.filter(r=>ids.has(r.id)).map(r=>({id:r.id,number:r.number,name:r.name,old_buy:r.buy,old_sell:r.sell,buy:"",sell:""}));
                this.priceBatch.mode="manual"; this.priceBatch.buyValue=""; this.priceBatch.sellValue=""; this.priceBatch.visible=true;
            },
            applyPriceBatch(){
                const b=this.priceBatch, values={};
                for(const f of ["buy","sell"]){
                    const raw=String(b[f+"Value"]).trim();
                    if(!b[f] || !raw)continue;
                    if(!Number.isFinite(Number(raw)))return this.$message.warning("请输入正确的"+(f==="buy"?"采购价":"销售价")+"调价数值");
                    values[f]=Number(raw);
                }
                if(!Object.keys(values).length)return this.$message.warning("请填写采购价或销售价的调价数值，空白项不修改");
                const draft=b.rows.map(r=>{
                    const out={};
                    ["buy","sell"].forEach(f=>{if(Object.prototype.hasOwnProperty.call(values,f)){const v=values[f];const old=Number(r["old_"+f]);out[f]=(b.mode==="fixed"?v:b.mode==="amount"?old+v:old*(1+v/100)).toFixed(4);}});
                    return out;
                });
                if(draft.some(r=>Object.values(r).some(v=>!/^\d{1,8}(?:\.\d{1,4})?$/.test(v))))return this.$message.warning("调整后价格超出范围或小于零，请检查");
                draft.forEach((r,i)=>Object.assign(b.rows[i],r));
            },
            pastePrices(event,index,field){
                const text=event.clipboardData.getData("text/plain");
                if(!/[\t\r\n]/.test(text))return;
                event.preventDefault();
                const lines=text.replace(/\r/g,"").replace(/\n$/,"").split("\n");
                if(index+lines.length>this.priceBatch.rows.length)return this.$message.warning("粘贴行数超过已选商品数量");
                const changes=[];
                lines.forEach((line,i)=>line.split("\t").forEach((value,j)=>{
                    const target=field==="buy"?(j===0?"buy":j===1?"sell":null):(j===0?"sell":null);
                    if(target&&this.priceBatch[target])changes.push({i:index+i,field:target,value:value.trim()});
                }));
                if(changes.some(c=>c.value&&!/^\d{1,8}(?:\.\d{1,4})?$/.test(c.value)))return this.$message.warning("粘贴价格格式不正确，最多4位小数");
                changes.forEach(c=>{this.priceBatch.rows[c.i][c.field]=c.value;});
            },
            async savePriceBatch(){
                const b=this.priceBatch;if(b.loading)return;
                const rows=[];
                for(const r of b.rows){
                    const out={id:r.id};
                    for(const f of ["buy","sell"]){
                        if(!b[f] || String(r[f]).trim()==="")continue;
                        if(!/^\d{1,8}(?:\.\d{1,4})?$/.test(String(r[f]).trim()))return this.$message.warning("商品 "+r.number+" 的价格格式不正确");
                        out[f]=String(r[f]).trim();out["old_"+f]=r["old_"+f];
                    }
                    if(Object.keys(out).length>1)rows.push(out);
                }
                if(!rows.length)return this.$message.warning("请填写需要修改的价格");
                b.loading=true;
                try{
                    await this.$confirm("确认提交以上 "+rows.length+" 个商品的价格修改？","确认调价",{type:"warning"});
                    const result=await this.$axios.post("goods/batchPrice",{rows});
                    if(result.state!=="success")return this.$message.error(result.info||"保存失败");
                    this.$message.success("已修改 "+result.info+" 个商品");b.visible=false;this.record(0);
                }catch(error){if(error!=="cancel"&&error!=="close")this.$message.error("提交失败，请重试");}
                finally{b.loading=false;}
            },

			toggleView(){
				this.viewMode=!this.viewMode;
				this.viewMode && (this.picMode=false);
			},
			togglePics() {
				this.picMode = !this.picMode;
			},
			getImgUrl(row) {
				const imgs = row ? row.imgs : null;
				let val = "";
				if (Array.isArray(imgs) && imgs.length > 0) {
					const first = imgs[0];
					val = typeof first == "string" ? first : first && first.url ? first.url : "";
				} else if (imgs && typeof imgs == "object") {
					val = imgs.url || "";
				} else if (typeof imgs == "string") {
					val = imgs;
				}
				if (this.$lib.validate("empty", val)) return "";
				if (/^https?:\/\//.test(val)) return val;
				return (this.store.base && this.store.base.cdnSite ? this.store.base.cdnSite : "") + val;
			},
			getBase(){
				this.$axios.post("attribute/select").then(result => {
					if (result.state == "success") {
						let attribute=result.info;
						this.dialog.attribute = result.info;
						//辅助属性选中源ASCII编码处理
						let obj={};
						for (let key in attribute){
							for (let item of attribute[key].info) {
								obj['n'+this.$lib.charUnique(item['name'])]={name:item['name'],group:key,checked:false};
							}
						}
						this.$set(this.dialog,'attrChecked',obj);
					} else if (result.state == "error") {
						this.$message({
							type: "warning",
							message: result.info
						});
					} else {
						this.$message({
							type: "error",
							message: "[ ERROR ] 服务器响应超时!"
						});
					}
				});
			},
			//获取数据
			record(page) {
				page==0||(this.page.current=page);
				let parm = Object.assign({
					page: this.page.current,
					limit: this.page.size,
					sort: "numberAsc"
				}, this.searchFrom);
				this.$axios.post("goods/record", parm).then(result => {
					if (result.state == "success") {
						this.tableData = result.info;
						this.page.total = result.count;
						this.$refs["searchPopover"].showPopper = false;
					} else if (result.state == "error") {
						this.$message({
							type: "warning",
							message: result.info
						});
					} else {
						this.$message({
							type: "error",
							message: "[ ERROR ] 服务器响应超时!"
						});
					}
				});
			},
			//设置数据
			set(id) {
				//1.初始化数据
				this.form = this.$lib.extend(true, {}, this.$options.data().form);
				this.dialog.origin = {id:0,name:"",number:""};
				for (let key in this.dialog.attrChecked) {
					this.dialog.attrChecked[key].checked=false;
				}
				this.dialog.disposeActive=[];
				//2.请求数据
				if (id > 0) {
					this.$axios.post("goods/get", {
						id: id
					}).then(result => {
						if (result.state == "success") {
							this.form = result.info;
							this.dialog.origin = {
								id: Number(result.info && result.info.id) || 0,
								name: result.info && result.info.name != null ? String(result.info.name) : "",
								number: result.info && result.info.number != null ? String(result.info.number) : ""
							};
							//辅助属性选中处理
							result.info.attr.forEach(attr=>{
								attr.name.split("|").forEach(item=>{
									this.dialog.attrChecked['n'+this.$lib.charUnique(item)].checked=true;
								});
							})
							//属性配置面板展示
							result.info.unit=='-1'&&this.dialog.disposeActive.push('units');
							result.info.strategy.length>0&&this.dialog.disposeActive.push('strategy');
							result.info.serial==true&&this.dialog.disposeActive.push('serial');
							result.info.batch==true&&this.dialog.disposeActive.push('batch');
							this.dialog.show = true; //显示弹层
						} else if (result.state == "error") {
							this.$message({
								type: "warning",
								message: result.info
							});
						} else {
							this.$message({
								type: "error",
								message: "[ ERROR ] 服务器响应超时!"
							});
						}
					});
				} else {
					this.dialog.show = true; //显示弹层
				}
			},
			submit(mode) {
				this.$refs["form"].validate(valid => {
					if (valid){
						//辅助属性判断
						if(this.form.attr.length>0){
							for (let attr of this.form.attr) {
								if(!this.$lib.synValidate('money',attr.buy)){
									this.$message({
										type: "warning",
										message: "辅助属性[ "+attr.name+" ]采购价格不正确!"
									});
									return false;
								}else if(!this.$lib.synValidate('money',attr.sell)){
									this.$message({
										type: "warning",
										message: "辅助属性[ "+attr.name+" ]销售价格不正确!"
									});
									return false;
								}
							}
						}
						//商品类型判断
						if(this.form.type==0){
							//常规商品

							//多单位判断
							if(this.form.unit==-1){
								if(this.form.units.length==0){
									this.$message({
										type: "warning",
										message: "[ 属性配置 - 多单位配置 ]不可为空!"
									});
									return false;
								}else{
									let mate=[this.form.units[0].source];
									for (var i = 0; i < this.form.units.length; i++) {
										if(this.$lib.validate('empty',this.form.units[i].source)){
											this.$message({
												type: "warning",
												message: "多单位配置 - 第"+(i+1)+"行基本单位不可为空!"
											});
											return false;
										}else if(this.$lib.validate('empty',this.form.units[i].name)){
											this.$message({
												type: "warning",
												message: "多单位配置 - 第"+(i+1)+"行单位名称不可为空!"
											});
											return false;

										}else if(this.form.units[i].nums==0 || !this.$lib.synValidate('nums',this.form.units[i].nums)){
											this.$message({
												type: "warning",
												message: "多单位配置 - 第"+(i+1)+"行单位数量不正确!"
											});
											return false;
										}else if(!this.$lib.validate('percentage',this.form.units[i].discount)){
											this.$message({
												type: "warning",
												message: "多单位配置 - 第"+(i+1)+"行折扣率不正确!"
											});
											return false;
										}else{
											mate.push(this.form.units[i].name)
										}
									}
									if(this.$lib.distinct(mate).length!=this.form.units.length+1){
										this.$message({
											type: "warning",
											message: "多单位配置 - 单位名称不可重复!"
										});
										return false;
									}
								}
							}
							//折扣策略
							if(this.form.strategy.length>0){
								let mate=[];
								for (let i = 0; i < this.form.strategy.length; i++) {
									if(!this.$lib.validate('percentage',this.form.strategy[i].discount)){
										this.$message({
											type: "warning",
											message: "折扣策略 - 第"+(i+1)+"行折扣率不正确!"
										});
										return false;
									}else{
										mate.push(this.form.strategy[i].grade);
									}
								}
								if(this.form.strategy.length!=this.$lib.distinct(mate).length){
									this.$message({
										type: "warning",
										message: "折扣策略 - 客户等级不可重复!"
									});
									return false;
								}
							}
							//有效期判断
							if(this.form.validity){
								if(this.$lib.validate('empty',this.form.protect)){
									this.$message({
										type: "warning",
										message: "批次商品 - 保质期不可为空!"
									});
									return false;
								}else if(this.$lib.validate('empty',this.form.threshold)){
									this.$message({
										type: "warning",
										message: "批次商品 - 预警阀值不可为空!"
									});
									return false;
								}else if(this.form.threshold-0>this.form.protect-0){
									this.$message({
										type: "warning",
										message: "批次商品 - 预警阀值不可大于保质期!"
									});
									return false;
								}
							}
						}else{
							//服务商品

							//多单位判断
							if(this.form.unit=='-1'){
								this.$message({
									type: "warning",
									message: "服务商品不可启用多单位!"
								});
								return false;
							}
							//序列判断
							if(this.form.serial){
								this.$message({
									type: "warning",
									message: "服务商品不可启用序列商品!"
								});
								return false;
							}
							//批次判断
							if(this.form.batch){
								this.$message({
									type: "warning",
									message: "服务商品不可启用批次商品!"
								});
								return false;
							}
						}
						let payload = this.form;
						let okMsg = "详情保存成功!";
						if (mode === "copyAdd") {
							const origin = this.dialog.origin || {id:0,name:"",number:""};
							const n1 = this.form && this.form.name != null ? String(this.form.name).trim() : "";
							const n2 = this.form && this.form.number != null ? String(this.form.number).trim() : "";
							const o1 = origin && origin.name != null ? String(origin.name).trim() : "";
							const o2 = origin && origin.number != null ? String(origin.number).trim() : "";
							if ((Number(origin.id) || 0) > 0 && n1 === o1) {
								this.$message({ type: "warning", message: "请先修改商品名称后再新增!" });
								return false;
							}
							if ((Number(origin.id) || 0) > 0 && n2 === o2) {
								this.$message({ type: "warning", message: "请先修改商品编号后再新增!" });
								return false;
							}
							payload = this.$lib.extend(true, {}, this.form);
							payload.id = 0;
							if (Array.isArray(payload.attr)) {
								payload.attr = payload.attr.map(v => {
									const row = Object.assign({}, v);
									delete row.id;
									delete row.pid;
									return row;
								});
							}
							okMsg = "新增成功!";
						}
						this.$axios.post("goods/save", payload).then(result => {
							if (result.state == "success") {
								this.record(0);
								this.dialog.show = false;
								this.$message({
									type: "success",
									message: okMsg
								});
							} else if (result.state == "error") {
								this.$message({
									type: "warning",
									message: result.info
								});
							} else {
								this.$message({
									type: "error",
									message: "[ ERROR ] 服务器响应超时!"
								});
							}
						});
					} else {
						this.$message({
							type: "warning",
							message: '表单验证错误,请检查并修正!'
						});
					}
				});
			},
			//保存数据
			save() {
				this.submit("save");
			},
			copyAdd() {
				this.submit("copyAdd");
			},
			//删除数据
			del(parm) {
				this.$confirm("您确定要删除选中数据吗?", "提示", {
					confirmButtonText: "确定",
					cancelButtonText: "取消",
					type: "warning"
				}).then(() => {
					this.$axios.post("goods/del", {
						parm: parm
					}).then(result => {
						if (result.state == "success") {
							this.record(0);
							this.$message({
								type: "success",
								message: "删除成功!"
							});
						} else if (result.state == "error") {
							this.$message({
								type: "warning",
								message: result.info
							});
						} else {
							this.$message({
								type: "error",
								message: "[ ERROR ] 服务器响应超时!"
							});
						}
					});
				}).catch(()=>{});
			},
			//单位切换事件
			unitChange(val){
				if(val!='-1'){
					this.form.units=[];
				}
			},
			//辅助属性选择事件
			AttrChange(){
				this.form.attr=[];//初始化属性组合信息
				//获取当前选中属性
				let data={};
				for (let key in this.dialog.attrChecked) {
					if(this.dialog.attrChecked[key].checked){
						let group=this.dialog.attrChecked[key].group;
						if(data.hasOwnProperty(group)){
							data[group].push(this.dialog.attrChecked[key].name);
						}else{
							data[group]=[this.dialog.attrChecked[key].name];
						}
					}
				}
				if(Object.values(data).length>0){
					//笛卡尔积算法组合
					var items = Object.values(data).reduce((last, current) => {
						const array = [];
						last.forEach(par1 => {
							current.forEach(par2 => {
								array.push(par1 + "|" + par2);
							});
						});
						return array;
					});
					//辅助属性组合
					for (let item of items) {
						this.form.attr.push({
							name:item,
							buy:'',
							sell:'',
							code:''
						});
					}
				}
			},
			//批量填充辅助属性内容
			attrFill(field){
				for (let key in this.form.attr) {
					this.form.attr[key][field]=this.form[field];
				}
			},
			//属性配置面板折叠
			disposeChange(){
				this.form.batch=this.dialog.disposeActive.indexOf("batch")==-1?false:true;
				this.form.serial=this.dialog.disposeActive.indexOf("serial")==-1?false:true;
				//批次状态改变事件
				if(!this.form.batch){
					this.form.validity=false;
					this.form.protect=0;
					this.form.threshold=0;
				}
			},
			//添加单位
			addUnit(){
				if(this.form.units.length==0){
					// 首条
					this.form.units.push({name:'',nums:'',source:"",discount:"0"});
				}else{
					// 非首条
					this.form.units.push({name:'',nums:'',source:this.form.units[this.form.units.length-1].name,discount:"0"});
				}
			},
			//删除单位
			delUnit(index){
				this.form.units.splice(index,this.form.units.length-index);
			},
			//单位名称改变事件
			unitNameChange(index){
				if(this.form.units.hasOwnProperty(index+1)){
					this.form.units[index+1].source=this.form.units[index].name;
				}
			},
			//新增价格策略
			addStrategy(){
				this.form.strategy.push({grade:"常规等级",discount:'0',data:''})
			},
			//删除价格策略
			delStrategy(index){
				this.form.strategy.splice(index,1);
			},
			//有效期状态改变事件
			validityChange(){
				if(!this.form.validity){
					this.form.protect=0;
					this.form.threshold=0;
				}
			},
			//商品图像上传成功
			uploadSuccess(result, file, fileList) {
				if (result.state == 'success') {
					//COS上传失败时已自动回退本地存储
					if (this.uploadChannel == "cos" && result.channel == "local") {
						this.$message({
							type: "warning",
							message: "[ " + file.name + " ] COS上传失败,已回退到本地上传!"
						});
					}
					this.form.imgs.push({
						name: file.name,
						url: result.info
					});
				} else if (result.state == "error") {
					fileList.splice(fileList.findIndex(obj => obj.uid == file.uid), 1);
					this.$message({
						type: "warning",
						message: "[ " + file.name + " ]" + result.info
					});
				} else {
					this.$message({
						type: "error",
						message: "[ ERROR ] 服务器响应超时!"
					});
				}
			},
			//商品图像删除
			uploadRemove(file, fileList) {
				this.form.imgs.splice(this.form.imgs.findIndex(obj => obj.uid == file.uid), 1);
			},
			//商品图像查看
			uploadPreview(file) {
				this.$message({
					type: "success",
					message: "[ " + file.name + " ] 下载请求中..."
				});
				setTimeout(() => {
					window.open(file.url)
				}, 1000);
			},
			//商品图像个数限制
			uploadExceed(files, fileList) {
				this.$message({
					type: "warning",
					message: "商品图像最多上传3张!"
				});
			},
			//下载模板
			downTemplate(){
				this.$message({
					type: "success",
					message: "[ 数据模板 ] 下载请求中..."
				});
				setTimeout(() => {
					window.open(this.store.base.cdnSite+"/erp/batch/商品导入模板.xlsx")
				}, 1000);
			},
			//上传模板回调
			importCall(result, file, fileList){
				if (result.state == 'success') {
					this.$lib.updateStore(this);
					this.$bus.emit('homeReload',this.$options.name);
					this.$message({
						type: "success",
						message: result.info
					});
				} else if (result.state == "error") {
					this.$message({
						type: "warning",
						message: "[ " + file.name + " ]" + result.info
					});
				} else {
					this.$message({
						type: "error",
						message: "[ ERROR ] 服务器响应超时!"
					});
				}
			},
			//导出数据
			exports(){
				if(this.tableSelection.length==0){
					this.$message({
						type: "warning",
						message: "未选择导出数据内容!"
					});
				}else{
					this.$message({
						type: "success",
						message: "[ 导出数据 ] 请求中..."
					});
					let parm=this.$lib.objToParm({parm:this.tableSelection},true);
					setTimeout(() => {
						window.open(this.$base.web+'goods/exports?'+parm)
					}, 1000);
				}
			},
			//表格选中数据改变
			selectionChange(parm) {
				let data = [];
				for (let parmVo of parm) {
					data.push(parmVo.id);
				}
				this.tableSelection = data;
			},
			//切换页面
			switchPage(key) {
			    this.$bus.emit('switchPage', key, true); //切换页面
			},
			openQuotePage() {
				this.$router.push({
					name: "goodsQuote",
					query: {
						quoteSearch: encodeURIComponent(JSON.stringify(this.searchFrom)),
						t: String(Date.now())
					}
				});
			},
			//页面刷新
			reload() {
				this.$bus.emit('homeReload',this.$options.name);
				this.$message({
					type: "success",
					message: "页面刷新成功!"
				});
			}
		}
	};
</script>
<style scoped>
	.layout {
		display: flex;
		justify-content: space-between;
	}
	.uploadChannel{
		width: 100%;
		margin-bottom: 8px;
	}
	.viewWrap{
		height: calc(100% - 90px);
		overflow: auto;
	}
	.goodsGrid{
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		gap: 10px;
		padding: 10px 0;
	}
	.goodsCard{
		border: 1px solid #ebeef5;
		border-radius: 6px;
		background: #fff;
		padding: 8px;
		cursor: pointer;
		overflow: hidden;
	}
	.cardImg{
		width: 100%;
		height: 120px;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}
	.cardImg >>> .el-image{
		width: 100%;
		height: 100%;
	}
	.cardImg >>> img{
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
	.cardNo{
		margin-top: 6px;
		font-size: 12px;
		color: #606266;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.tableImg{
		width: 70px;
		height: 90px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.tableImg >>> .el-image{
		width: 70px;
		height: 90px;
	}
	.imgErrorMini{
		width: 70px;
		height: 90px;
		border: 1px dashed #dcdfe6;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #909399;
	}
	.formItemInitial >>> .el-form-item{
		display: initial;
	}
	.editorBox >>> .el-form-item__content{
		width: calc(100% - 80px)
	}
	.unitsName{
		line-height: 35px;
	}
	.attrNode{
		width: 25%;
		margin-right:0;
	}
	.collapseSwitch >>> .el-collapse-item__arrow{
		display: none;
	}
	.collapseSwitch .el-switch{
		cursor: pointer;
		margin: 0 8px 0 auto;
	}
	.collapseSwitch .el-switch >>>.el-switch__core{
		cursor: pointer;
	}
	.collapseContentHide >>> .el-collapse-item__content{
		display: none;
	}
	.collapseContentHide >>> .el-collapse-item__wrap{
		border-bottom:none;
	}
	.collapseContentHide >>> .el-collapse-item__header.is-active{
		border-bottom-color:#EBEEF5;
	}
</style>
