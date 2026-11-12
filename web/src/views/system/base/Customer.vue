<template>
	<div class="customer area">
		<div class="layout">
			<el-popover ref="searchPopover" popper-class="searchPopover" placement="bottom-start">
				<el-form class="searchFrom" ref="searchFrom"  inline>
					<el-form-item>
						<el-input placeholder="请输入客户名称" v-model="searchFrom.name" clearable></el-input>
					</el-form-item>
					<el-form-item>
						<el-input placeholder="请输入客户编号" v-model="searchFrom.number" clearable @input="onSearchNumberInput"></el-input>
					</el-form-item>
					<el-form-item>
						<el-select v-model="searchFrom.category" placeholder="请选择客户类别" clearable>
							<template v-for="category in store.sys.crCategory">
								<el-option :key="category" :label="category" :value="category"></el-option>
							</template> 
						  </el-select>
					</el-form-item>
					<el-form-item>
						<el-select v-model="searchFrom.grade" placeholder="请选择客户等级" clearable>
							<template v-for="grade in store.sys.crGrade">
								<el-option :key="grade" :label="grade" :value="grade"></el-option>
							</template>
						  </el-select>
					</el-form-item>
					<el-form-item>
						<el-input placeholder="请输入联系人员" v-model="searchFrom.contacts" clearable></el-input>
					</el-form-item>
					<el-form-item>
						<el-input placeholder="请输入联系电话" v-model="searchFrom.tel" clearable></el-input>
					</el-form-item>
					<el-form-item>
						<nodList v-model="searchFrom.user" placeholder="请选择所属用户" action="service/userRecord" scene="user"></nodList>
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
				<el-button @click="reload" >刷新</el-button>
				<template v-if="store.root == 'all'">
					<el-button type="primary" @click="goReport" >客户报表</el-button>
				</template>
			</el-button-group>
		</div>
		<el-divider></el-divider>
		<el-table :data="tableData" height="calc(100% - 90px)" @selection-change="selectionChange" border v-madeTable>
			<el-table-column type="selection" align="center" width="39px" fixed="left"></el-table-column>
			<el-table-column prop="name" label="客户名称" align="center" width="260px"></el-table-column>
			<el-table-column prop="number" label="客户编号" align="center" width="160px"></el-table-column>
			<el-table-column prop="category" label="客户类别" align="center" width="160px"></el-table-column>
			<el-table-column prop="grade" label="客户等级" align="center" width="160px"></el-table-column>
			<el-table-column prop="balance" label="应收款余额" align="center" width="120px"></el-table-column>
			<el-table-column prop="integral" label="客户积分" align="center" width="120px"></el-table-column>
			<el-table-column prop="frameData.name" label="所属组织" align="center" width="160px"></el-table-column>
			<el-table-column prop="userData.name" label="所属用户" align="center" width="160px"></el-table-column>
			<el-table-column prop="data" label="备注信息 " align="center" min-width="200px"></el-table-column>
			<el-table-column prop="set" label="相关操作" align="center" width="200px" fixed="right">
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
		<el-dialog class="tabsDialog" :visible.sync="dialog.show" title="详情" width="70%" v-madeDialog>
			<transition name="el-fade-in">
				<template v-if="dialog.show">
					<el-form :model="form" :rules="rules" ref="form" label-width="96px"  :inline="true">
						<el-tabs v-model="dialog.active" @tab-click="tabChange">
							<el-tab-pane label="基础资料" name="base">
								<el-form-item label="客户名称" prop="name">
									<el-input placeholder="请输入客户名称" v-model="form.name" clearable></el-input>
								</el-form-item>
								<el-form-item label="客户编号" prop="number">
									<el-input placeholder="请输入客户编号" v-model="form.number" clearable @input="onFormNumberInput"></el-input>
								</el-form-item>
								<el-form-item label="所属组织" prop="frame">
									<nodTree v-model="form.frame" :treeData="store.frame" placeholder="请选择所属组织"></nodTree>
								</el-form-item>
								<el-form-item label="所属用户" prop="user">
									<nodList v-model="form.user" placeholder="请选择所属用户" action="service/userRecord" scene="user"></nodList>
								</el-form-item>
								<el-form-item label="客户类别">
									<el-select v-model="form.category" placeholder="请选择客户类别">
										<template v-for="category in store.sys.crCategory">
											<el-option :key="category" :label="category" :value="category"></el-option>
										</template>
									  </el-select>
								</el-form-item>
								<el-form-item label="客户等级">
									<el-select v-model="form.grade" placeholder="请选择客户等级">
										<template v-for="grade in store.sys.crGrade">
											<el-option :key="grade" :label="grade" :value="grade"></el-option>
										</template>
									  </el-select>
								</el-form-item>
								<el-form-item label="开户银行">
									<el-input placeholder="请输入开户银行" v-model="form.bank" clearable></el-input>
								</el-form-item>
								<el-form-item label="银行账号">
									<el-input placeholder="请输入银行账号" v-model="form.account" clearable></el-input>
								</el-form-item>
								<el-form-item label="纳税号码">
									<el-input placeholder="请输入纳税人识别号" v-model="form.tax" clearable></el-input>
								</el-form-item>
								<el-form-item label="备注信息">
									<el-input placeholder="请输入备注信息" v-model="form.data" clearable></el-input>
								</el-form-item>
							</el-tab-pane>
							<el-tab-pane label="联系资料" name="contacts">
								<el-table :data="form.contacts" height="200px"  border>
									<el-table-column label="主联系人" align="center" min-width="90px">
										<template slot-scope="scope">
											<span>{{scope.row.main?"是":"否"}}</span>
										</template>
									</el-table-column>
									<el-table-column prop="name" label="联系人员" align="center" width="120px"></el-table-column>
									<el-table-column prop="tel" label="联系号码" align="center" width="120px"></el-table-column>
									<el-table-column prop="add" label="联系地址" align="center" width="160px">
										<template slot-scope="scope">
											<span class="addressLink" @click.stop="openAmapAddress(scope.row.add)">{{ scope.row.add }}</span>
										</template>
									</el-table-column>
									<el-table-column prop="data" label="备注信息" align="center" min-width="120px"></el-table-column>
									<el-table-column prop="set" align="center" width="160px" fixed="right">
										<template slot="header">
											<span style="margin-right:3px;">相关操作</span>
											<i class="el-icon-circle-plus-outline" @click="setContacts(-1)"></i>
										</template>
										<template slot-scope="scope">
											<el-button-group>
												<el-button @click="copyContacts(scope.row)" size="mini">复制</el-button>
												<el-button @click="setContacts(scope.$index)" size="mini">详情</el-button>
												<el-button @click="delContacts(scope.$index)" size="mini">删除</el-button>
											</el-button-group>
										</template>
									</el-table-column>
								</el-table>
								<el-dialog :visible.sync="contacts.dialog" title="联系资料" width="360px" :append-to-body="true" v-madeDialog>
									<transition name="el-fade-in">
										<template v-if="contacts.dialog">
											<el-form :model="contacts.form" :rules="contacts.rules" ref="contactsForm" label-width="80px" >
												<el-form-item label="智能识别">
                                                    <el-input v-model="contacts.pastedAddress" type="textarea" :rows="3" maxlength="1000" placeholder="粘贴整段收件信息，如：张三 13800138000 广东省广州市白云区…" />
                                                    <el-button size="mini" type="primary" :disabled="!contacts.pastedAddress.trim()" @click="recognizeContact">识别并填入</el-button>
                                                </el-form-item>
                                                <el-form-item label="主联系人">
													<el-switch v-model="contacts.form.main"></el-switch>
												</el-form-item>
												<el-form-item label="联系人员" prop="name">
													<el-input placeholder="请输入联系人员" v-model="contacts.form.name"></el-input>
												</el-form-item>
												<el-form-item label="联系号码" prop="tel">
													<el-input placeholder="请输入联系号码" v-model="contacts.form.tel"></el-input>
												</el-form-item>
												<el-form-item label="联系地址">
													<el-input placeholder="请输入联系地址" v-model="contacts.form.add"></el-input>
												</el-form-item>
												<el-form-item label="备注信息">
													<el-input placeholder="请输入备注信息" v-model="contacts.form.data"></el-input>
												</el-form-item>
											</el-form>
										</template>
									</transition>
									<span slot="footer" class="dialog-footer">
										<el-button @click="contacts.dialog = false" >取消</el-button>
										<el-button @click="saveContacts" type="primary" >保存</el-button>
									</span>
								</el-dialog>
							</el-tab-pane>
							<el-tab-pane label="完成订单" name="orders">
								<div class="ordersPane">
									<el-table
										:data="orders.tableData"
										height="320px"
										border
										v-loading="orders.loading"
									>
										<el-table-column prop="bill" label="单据类型" align="center" width="90px"></el-table-column>
										<el-table-column prop="time" label="单据时间" align="center" width="120px"></el-table-column>
										<el-table-column prop="number" label="单据编号" align="center" width="180px">
											<template slot-scope="scope">
												<span class="orderNumberLink" @click.stop="openOrderPreview(scope.row)">{{ scope.row.number }}</span>
											</template>
										</el-table-column>
										<el-table-column prop="total" label="单据金额" align="center" width="120px"></el-table-column>
										<el-table-column prop="discount" label="优惠金额" align="center" width="120px"></el-table-column>
										<el-table-column prop="actual" label="实际金额" align="center" width="120px"></el-table-column>
										<el-table-column prop="act" label="成本" align="center" width="120px"></el-table-column>
										<el-table-column prop="gpt" label="毛利润" align="center" width="120px"></el-table-column>
										<el-table-column prop="gpr" label="毛利率" align="center" width="120px"></el-table-column>
										<el-table-column prop="cost" label="单据费用" align="center" width="120px"></el-table-column>
										<el-table-column prop="npt" label="净利润" align="center" width="120px"></el-table-column>
										<el-table-column prop="npr" label="净利率" align="center" width="120px"></el-table-column>
										<el-table-column prop="extension.amount" label="核销金额" align="center" width="120px"></el-table-column>
										<el-table-column prop="extension.nucleus" label="核销状态" align="center" width="120px"></el-table-column>
										<el-table-column prop="userData.name" label="制单人" align="center" width="120px"></el-table-column>
										<el-table-column prop="peopleData.name" label="关联人员" align="center" width="120px"></el-table-column>
										<el-table-column prop="data" label="备注信息" align="center" min-width="160px"></el-table-column>
									</el-table>
									<div class="ordersFooter">
										<el-pagination
											class="tablePagination orderPagination"
											:current-page.sync="orders.page.current"
											:total="orders.page.total"
											:page-size.sync="orders.page.size"
											:page-sizes="orders.page.sizes"
											:pager-count="orders.page.count"
											@size-change="recordOrders(1)"
											@current-change="recordOrders(0)"
											layout="prev,pager,next,jumper,sizes,total"
										>
										</el-pagination>
										<div class="ordersSummaryBar">
											<div class="ordersSummaryItem">总销售额：{{ orders.summary.salesText }}</div>
											<div class="ordersSummaryItem">总利润：{{ orders.summary.profitText }}</div>
											<div class="ordersSummaryItem">总利润率：{{ orders.summary.rateText }}</div>
										</div>
									</div>
								</div>
							</el-tab-pane>
							<template v-if="store.fields.hasOwnProperty($route.name)">
								<el-tab-pane label="扩展信息" name="more">
									<FieldForm v-model="form.more" rule="customer" prefix="more."></FieldForm>
								</el-tab-pane>
							</template>
						</el-tabs>
					</el-form>
				</template>
			</transition>
			<span slot="footer" class="dialog-footer">
				<el-button @click="dialog.show = false" >取消</el-button>
				<template v-if="form.id==0 || $lib.getUserRoot(store.root,'base','edit')">
					<el-button @click="save" type="primary" >保存</el-button>
				</template>
			</span>
		</el-dialog>
		<OrderPreviewDialog v-model="print.dialog" :number="print.number" @closed="printDestroy"></OrderPreviewDialog>
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
										:action="$base.web+'customer/import'"
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
	import FieldForm from "@/components/lib/FieldForm";
	import OrderPreviewDialog from "@/components/dialog/OrderPreviewDialog";
	export default {
		name: "Customer",
		components: {
			NodTree,
			NodList,
			FieldForm,
			OrderPreviewDialog
		},
		data() {
			return {
				searchFrom: {
					name: "",
					number:"",
					category:"",
					grade:"",
					contacts:"",
					tel:"",
					user:null,
					data: ""
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
				dialog:{
					show:false,
					active:'base'
				},
				orders: {
					loading: false,
					loadedCustomerId: 0,
					tableData: [],
					summary: {
						sales: 0,
						profit: 0,
						rate: "0.00%",
						salesText: "0.00",
						profitText: "0.00",
						rateText: "0.00%"
					},
					page: {
						current: 1,
						total: 0,
						size: 20,
						sizes: [20, 40, 60, 100],
						count: 5
					}
				},
				print: {
					dialog: false,
					number: ""
				},
				form: {
					id: 0,
					name: "",
					number:"",
					frame:null,
					user:null,
					category:"常规类别",
					grade: "常规等级",
					bank: "",
					account: "",
					tax: "",
					data: "",
					contacts: [],
					more: {},
				},
				rules: {
					name: {
						required: true,
						message: "请输入客户名称",
						trigger: "blur"
					},
					number: {
						required: true,
						message: "请输入客户编号",
						trigger: "blur"
					},
					frame: {
						required: true,
						message: "请选择所属组织",
						trigger: "change"
					},
					user: {
						required: true,
						message: "请选择所属用户",
						trigger: "change"
					}
				},
				contacts:{
                    pastedAddress: "",
					index: -1,
					dialog:false,
					form:{
						main:true,
						name:"",
						tel:"",
						add:"",
						data:""
					},
					rules: {
						name: {
							required: true,
							message: "请输入联系人员",
							trigger: "blur"
						},
						tel: {
							required: true,
							message: "请输入联系号码",
							trigger: "blur"
						}
					}
				},
				batch:{
					dialog:false,
					active:"import"
				}
			};
		},
		created() {
			this.record(1); //获取数据
		},
		computed: {
			//读取数据中心
			store() {
				return this.$store.state;
			}
		},
		methods: {
			cleanCustomerNumber(text) {
				return String(text == null ? "" : text).replace(/\s+/g, "");
			},
			onSearchNumberInput(val) {
				this.searchFrom.number = this.cleanCustomerNumber(val);
			},
			onFormNumberInput(val) {
				this.form.number = this.cleanCustomerNumber(val);
			},
			copyText(text) {
				const val = text == null ? "" : String(text);
				if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
					return navigator.clipboard.writeText(val);
				}
				return new Promise((resolve, reject) => {
					try {
						const el = document.createElement("textarea");
						el.value = val;
						el.setAttribute("readonly", "");
						el.style.position = "fixed";
						el.style.opacity = "0";
						el.style.left = "-9999px";
						el.style.top = "0";
						document.body.appendChild(el);
						el.select();
						el.setSelectionRange(0, el.value.length);
						const ok = document.execCommand("copy");
						document.body.removeChild(el);
						ok ? resolve(true) : reject(new Error("copy failed"));
					} catch (e) {
						reject(e);
					}
				});
			},
			copyContacts(row) {
				const r = row || {};
				const mark = r.data == null ? "" : String(r.data);
				const name = r.name == null ? "" : String(r.name);
				const tel = r.tel == null ? "" : String(r.tel);
				const add = r.add == null ? "" : String(r.add);
				const text = ["唛头：" + mark, "联系人:" + name + "+" + tel, "地址：" + add].join("\n");
				this.copyText(text).then(() => {
					this.$message({
						type: "success",
						message: "复制成功!"
					});
				}).catch(() => {
					this.$message({
						type: "warning",
						message: "复制失败,请手动复制!"
					});
				});
			},
			openAmapAddress(address) {
				const text = address == null ? "" : String(address).trim();
				if (!text) {
					this.$message({ type: "warning", message: "联系地址为空!" });
					return;
				}
				window.open(`https://www.amap.com/search?query=${encodeURIComponent(text)}`, "_blank");
			},
			//获取数据
			record(page) {
				page==0||(this.page.current=page);
				let parm = Object.assign({
					page: this.page.current,
					limit: this.page.size
				}, this.searchFrom);
				this.$axios.post("customer/record", parm).then(result => {
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
				this.orders = this.$lib.extend(true, {}, this.$options.data().orders);
				this.dialog.active = 'base';
				//2.请求数据
				if (id > 0) {
					this.$axios.post("customer/get", {
						id: id
					}).then(result => {
						if (result.state == "success") {
							this.form = result.info;
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
					this.form.frame=this.store.user.frame;//赋值所属组织
					this.form.user=this.store.user.id;//赋值所属用户
					this.dialog.show = true; //显示弹层
				}
			},
			tabChange(tab) {
				if (!tab || tab.name !== "orders") return;
				this.recordOrders(1);
			},
			recordOrders(page) {
				if (!this.form || !this.form.id) {
					this.orders.tableData = [];
					this.orders.page.total = 0;
					this.orders.summary = this.$lib.extend(true, {}, this.$options.data().orders.summary);
					return;
				}
				page == 0 || (this.orders.page.current = page);
				const customerId = Number(this.form.id) || 0;
				if (!customerId) return;
				this.orders.loading = true;
				const parm = {
					page: this.orders.page.current,
					limit: this.orders.page.size,
					customer: customerId,
					type: 0,
					mold: ["sell", "sre"]
				};
				this.$axios.post("mrt/mpt", parm).then(result => {
					if (result.state == "success") {
						this.orders.tableData = Array.isArray(result.info) ? result.info : [];
						this.orders.page.total = Number(result.count) || 0;
						this.orders.loadedCustomerId = customerId;
						const sum = result.sum || {};
						const sales = Number(sum.sales);
						const profit = Number(sum.profit);
						const rate = typeof sum.rate === "string" ? sum.rate : "0.00%";
						if (Number.isFinite(sales) && Number.isFinite(profit)) {
							this.orders.summary.sales = sales;
							this.orders.summary.profit = profit;
							this.orders.summary.rate = rate;
							this.orders.summary.salesText = sales.toFixed(2);
							this.orders.summary.profitText = profit.toFixed(2);
							this.orders.summary.rateText = rate;
						} else {
							const rows = this.orders.tableData.filter(r => r && r.bill);
							const fallbackSales = rows.reduce((s, r) => s + Number(r.actual || 0), 0);
							const fallbackProfit = rows.reduce((s, r) => s + Number(r.npt || 0), 0);
							const fallbackRate = fallbackSales === 0 ? 0 : (fallbackProfit / fallbackSales) * 100;
							this.orders.summary.sales = fallbackSales;
							this.orders.summary.profit = fallbackProfit;
							this.orders.summary.rate = `${fallbackRate.toFixed(2)}%`;
							this.orders.summary.salesText = fallbackSales.toFixed(2);
							this.orders.summary.profitText = fallbackProfit.toFixed(2);
							this.orders.summary.rateText = this.orders.summary.rate;
						}
					} else if (result.state == "error") {
						this.orders.tableData = [];
						this.orders.page.total = 0;
						this.orders.summary = this.$lib.extend(true, {}, this.$options.data().orders.summary);
						this.$message({
							type: "warning",
							message: result.info
						});
					} else {
						this.orders.tableData = [];
						this.orders.page.total = 0;
						this.orders.summary = this.$lib.extend(true, {}, this.$options.data().orders.summary);
						this.$message({
							type: "error",
							message: "[ ERROR ] 服务器响应超时!"
						});
					}
				}).finally(() => {
					this.orders.loading = false;
				});
			},
			openOrderPreview(row) {
				const number = row && row.number != null ? String(row.number).trim() : "";
				const mold = row && row.mold ? String(row.mold) : "";
				const bill = row && row.bill ? String(row.bill) : "";
				if (!number) {
					this.$message({ type: "warning", message: "单据编号不存在!" });
					return;
				}
				if (mold && mold !== "sell") {
					this.$message({ type: "warning", message: "当前单据暂不支持订单预览!" });
					return;
				}
				if (!mold && bill && bill !== "销售单") {
					this.$message({ type: "warning", message: "当前单据暂不支持订单预览!" });
					return;
				}
				this.print.number = number;
				this.print.dialog = true;
			},
			printDestroy() {
				this.print.dialog = false;
				this.print.number = "";
			},
			//保存数据
			save() {
				this.$refs["form"].validate(valid => {
					if (valid) {
						this.$axios.post("customer/save", this.form).then(result => {
							if (result.state == "success") {
								this.record(0);
								this.dialog.show = false;
								this.$message({
									type: "success",
									message: "详情保存成功!"
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
			//删除数据
			del(parm) {
				this.$confirm("您确定要删除选中数据吗?", "提示", {
					confirmButtonText: "确定",
					cancelButtonText: "取消",
					type: "warning"
				}).then(() => {
					this.$axios.post("customer/del", {
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
            recognizeContact() {
                const text = this.contacts.pastedAddress.trim();
                const labels = /(?:收件人(?:姓名)?|收货人|联系人(?:员)?|姓名|联系(?:电话|号码|地址)|手机号(?:码)?|电话|收(?:货|件)地址|详细地址|地址|备注(?:信息)?|唛头)\s*[:：]/g;
                const phonePattern = /(?<!\d)(?:\+86[ -]*)?1[3-9]\d(?:[ -]?\d){8}(?!\d)|(?<!\d)(?:\+\d{1,3}[ -]+\d(?:[ -]?\d){6,13}|0\d{2,3}[- ]\d{7,8})(?!\d)/;
                const clean = value => value.replace(/^[\s,，;；+]+|[\s,，;；+]+$/g, "");
                const fields = {};
                const matches = Array.from(text.matchAll(labels));
                matches.forEach((match, index) => {
                    const label = match[0];
                    const next = matches[index + 1];
                    const value = clean(text.slice(match.index + label.length, next ? next.index : text.length));
                    if (/地址/.test(label)) fields.add = value;
                    else if (/备注|唛头/.test(label)) fields.data = /唛头/.test(label) ? "唛头：" + value : value;
                    else if (/电话|号码|手机号/.test(label)) fields.tel = value;
                    else {
                        const phone = value.match(phonePattern);
                        fields.name = clean(phone ? value.slice(0, phone.index) : value);
                        if (phone) fields.tel = phone[0];
                    }
                });
                if (!matches.length) {
                    const phone = text.match(phonePattern);
                    if (phone) {
                        fields.tel = phone[0];
                        const before = clean(text.slice(0, phone.index));
                        const after = clean(text.slice(phone.index + phone[0].length));
                        const looksLikeName = value => /^(?:[\u4e00-\u9fff·]{2,5}|[A-Za-z]+(?:[ .'-][A-Za-z]+){0,4})$/.test(value)
                            && !/省|市|区|县|镇|村|路|街|号/.test(value);
                        if (looksLikeName(before)) {
                            fields.name = before;
                            fields.add = after;
                        } else if (looksLikeName(after)) {
                            fields.name = after;
                            fields.add = before;
                        } else {
                            fields.add = [before, after].filter(Boolean).join(" ");
                        }
                    } else {
                        fields.add = text;
                    }
                }
                Object.keys(fields).forEach(key => {
                    if (fields[key]) this.contacts.form[key] = fields[key].replace(/\s*\n\s*/g, " ");
                });
                this.$refs.contactsForm.clearValidate();
                if (!fields.name || !fields.tel || !fields.add) {
                    this.$message.warning("已填入识别到的信息，请核对并补全");
                }
            },
			//添加联系资料
			setContacts(index) {
				this.contacts.form=index==-1?Object.assign({},this.$options.data().contacts.form):Object.assign({},this.form.contacts[index]);
				this.contacts.pastedAddress = "";
				this.contacts.index = index; //转存INDEX
				this.contacts.dialog = true; //显示弹层
			},
			//保存联系资料
			saveContacts() {
				this.$refs["contactsForm"].validate(valid => {
					if (valid) {
						//主联系人|首为为主|新数据为主时处理原数据为否
						if(this.form.contacts.length==0){
							this.contacts.form.main=true;
						}else{
							if(this.contacts.form.main==true){
								for (let key in this.form.contacts) {
									this.form.contacts[key].main=false;
								}
							}
						}
						if (this.contacts.index > -1) {
							this.form.contacts.splice(this.contacts.index, 1, this.contacts.form);
						} else {
							this.form.contacts.push(this.contacts.form);
						}
						this.$message({
							type: "success",
							message: "更新联系资料成功,保存后生效!"
						});
						this.contacts.dialog = false; //关闭弹层
					}
				});
			},
			//删除联系资料
			delContacts(index) {
				let source = this.form.contacts[index].main;
				this.form.contacts.splice(index, 1);
				if(source==true && this.form.contacts.length>0){
					this.form.contacts[0].main=true;
				}
				this.$message({
					type: "success",
					message: "删除联系资料成功,保存后生效!"
				});
			},
			//下载模板
			downTemplate(){
				this.$message({
					type: "success",
					message: "[ 数据模板 ] 下载请求中..."
				});
				setTimeout(() => {
					window.open(this.store.base.cdnSite+"/erp/batch/客户导入模板.xlsx")
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
						window.open(this.$base.web+'customer/exports?'+parm)
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
			//页面刷新
			reload() {
				this.$bus.emit('homeReload',this.$options.name);
				this.$message({
					type: "success",
					message: "页面刷新成功!"
				});
			},
			//打开客户报表页面
			goReport() {
				if (this.store.root != 'all') {
					this.$message({ type: "warning", message: "仅管理员可查看客户数据报表!" });
					return;
				}
				this.$router.push({ path: "/system/customerReport" });
			}
		}
	};
</script>

<style scoped>
	.layout {
		display: flex;
		justify-content: space-between;
	}
	.ordersPane {
		width: 100%;
	}
	.ordersFooter {
		display: flex;
		align-items: center;
		margin-top: 10px;
	}
	.orderPagination {
		margin-top: 0;
	}
	.ordersSummaryBar {
		display: flex;
		gap: 18px;
		margin-left: 18px;
		flex-wrap: wrap;
	}
	.ordersSummaryItem {
		padding: 6px 12px;
		border: 1px solid #dcdfe6;
		border-radius: 4px;
		background: #fff;
		font-size: 12px;
		color: #606266;
	}
	.orderNumberLink {
		color: #409eff;
		cursor: pointer;
	}
	.addressLink {
		color: #409eff;
		cursor: pointer;
	}
</style>
