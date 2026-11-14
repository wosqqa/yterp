<template>
	<div class="category area">
		<div class="layout">
			<el-button-group>
				<template v-if="$lib.getUserRoot(store.root,'assist','add')">
					<el-button @click="set(0)" >新增</el-button>
				</template>
				<el-button @click="reload" >刷新</el-button>
			</el-button-group>
		</div>
		<el-divider></el-divider>
		<el-table :data="tableData" height="calc(100% - 60px)" :tree-props="{children:'sub'}" row-key="id" border>
			<el-table-column prop="name" label="类别名称" width="220px"></el-table-column>
            <el-table-column prop="name_en" label="英文名称" min-width="200px"></el-table-column>
			<el-table-column prop="sort" label="类别排序" align="center" width="100px"></el-table-column>
			<el-table-column label="重量(kg)" align="center" width="120px">
				<template slot-scope="scope">
					{{ formatDecimal(scope.row.weight) }}
				</template>
			</el-table-column>
			<el-table-column label="体积(cbm)" align="center" width="120px">
				<template slot-scope="scope">
					{{ formatDecimal(scope.row.volume) }}
				</template>
			</el-table-column>
			<el-table-column label="出厂价" align="center" width="120px">
				<template slot-scope="scope">
					{{ formatMoney(scope.row.factory_price) }}
				</template>
			</el-table-column>
			<el-table-column prop="data" label="备注信息" align="center" width="200px"></el-table-column>
			<el-table-column prop="set" label="相关操作" align="center" width="160px">
				<template slot-scope="scope">
					<el-button-group>
						<el-button @click="set(scope.row.id)" size="mini">详情</el-button>
						<template v-if="$lib.getUserRoot(store.root,'assist','del')">
							<el-button @click="del(scope.row.id)" size="mini">删除</el-button>
						</template>
					</el-button-group>
				</template>
			</el-table-column>
		</el-table>
		<el-dialog :visible.sync="dialog" title="详情" width="460px" v-madeDialog>
			<transition name="el-fade-in">
				<template v-if="dialog">
					<el-form :model="form" :rules="rules" ref="form" label-width="90px" >
						<el-form-item label="类别名称" prop="name">
							<el-input placeholder="请输入类别名称" v-model="form.name"></el-input>
						</el-form-item>
						<el-form-item label="英文名称" prop="name_en">
                            <el-input placeholder="请输入类别英文名称" v-model.trim="form.name_en" maxlength="100" show-word-limit></el-input>
                        </el-form-item>
                        <el-form-item label="所属类别" prop="pid">
							<nodTree v-model="form.pid" :treeData="treeData" placeholder="请选择所属类别"></nodTree>
						</el-form-item>
						<el-form-item label="类别排序" prop="sort">
							<el-input placeholder="请输入类别排序" v-model="form.sort"></el-input>
						</el-form-item>
						<el-form-item label="重量" prop="weight">
							<el-input placeholder="请输入重量" v-model="form.weight" @blur="formatField('weight')">
								<template slot="append">kg</template>
							</el-input>
						</el-form-item>
						<el-form-item label="体积" prop="volume">
							<el-input placeholder="请输入体积" v-model="form.volume" @blur="formatField('volume')">
								<template slot="append">cbm</template>
							</el-input>
						</el-form-item>
						<el-form-item label="出厂价" prop="factory_price">
							<el-input placeholder="请输入出厂价" v-model="form.factory_price" @blur="formatMoneyField('factory_price')"></el-input>
						</el-form-item>
						<el-form-item label="备注信息">
							<el-input placeholder="请输入备注信息" v-model="form.data"></el-input>
						</el-form-item>
					</el-form>
				</template>
			</transition>
			<span slot="footer" class="dialog-footer">
				<el-button @click="dialog = false" >取消</el-button>
				<template v-if="form.id==0 || $lib.getUserRoot(store.root,'assist','edit')">
					<el-button @click="save" type="primary" >保存</el-button>
				</template>
			</span>
		</el-dialog>
	</div>
</template>
<script>
	import NodTree from "@/components/lib/NodTree";
	export default {
		name: "Category",
		components: {
			NodTree
		},
		data(){
			return {
				tableData:[],
				dialog: false,
				form:{
					id:0,
					name:"",
                    name_en:"",
					pid:null,
					sort:0,
					weight:"0.00000",
					volume:"0.00000",
					factory_price:"0.00",
					data:""
				},
				rules:{
					name:{
						required: true,
						message: "请输入类别名称",
						trigger: "blur"
					},
					pid:{
						required: true,
						message: "请选择所属类别",
						trigger: "change"
					},
					sort: [
						{
							required: true,
							message: "请选择类别排序",
							trigger: "blur"
						},
						{
							validator: (_rule,value,callback)=>{
								this.$lib.validate('number',value)?callback():callback(new Error('类别排序不正确'));
							},
							trigger: "blur"
						}
					],
					weight: [
						{
							validator: (_rule,value,callback)=>{
								this.validateDecimalField(value, '重量', callback);
							},
							trigger: "blur"
						}
					],
					volume: [
						{
							validator: (_rule,value,callback)=>{
								this.validateDecimalField(value, '体积', callback);
							},
							trigger: "blur"
						}
					],
					factory_price: [
						{
							validator: (_rule,value,callback)=>{
								this.validateMoneyField(value, '出厂价', callback);
							},
							trigger: "blur"
						}
					]
				}
			}
		},
		created() {
			this.record(); //获取数据
		},
		computed: {
			//读取数据中心
			store() {
				return this.$store.state;
			},
			//详情菜单数据
			treeData() {
				return [{
					id: 0,
					name: "默认类别",
					sub: this.tableData
				}];
			}
		},
		methods:{
			formatDecimal(value) {
				return this.normalizeDecimal(value);
			},
			formatMoney(value) {
				return this.normalizeMoney(value);
			},
			normalizeDecimal(value) {
				const text = value === null || value === undefined || value === "" ? "0" : String(value).trim();
				const number = Number(text);
				if (!Number.isFinite(number) || number < 0) {
					return "0.00000";
				}
				return number.toFixed(5);
			},
			normalizeMoney(value) {
				const text = value === null || value === undefined || value === "" ? "0" : String(value).trim();
				const number = Number(text);
				if (!Number.isFinite(number) || number < 0) {
					return "0.00";
				}
				return number.toFixed(2);
			},
			validateDecimalField(value, label, callback) {
				const text = value === null || value === undefined || value === "" ? "0" : String(value).trim();
				if (!/^\d+(\.\d+)?$/.test(text)) {
					callback(new Error(`${label}格式不正确`));
					return;
				}
				callback();
			},
			validateMoneyField(value, label, callback) {
				const text = value === null || value === undefined || value === "" ? "0" : String(value).trim();
				if (!/^\d+(\.\d+)?$/.test(text)) {
					callback(new Error(`${label}格式不正确`));
					return;
				}
				callback();
			},
			formatField(field) {
				this.form[field] = this.normalizeDecimal(this.form[field]);
			},
			formatMoneyField(field) {
				this.form[field] = this.normalizeMoney(this.form[field]);
			},
			//获取数据
			record(){
				this.$axios.post("category/record").then(result => {
					if (result.state == "success") {
						this.tableData = result.info;
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
				//1.初始化操作
				this.form=Object.assign({},this.$options.data().form);
				//2.请求数据
				if (id > 0) {
					this.$axios.post("category/get", {id: id}).then(result => {
						if (result.state == "success") {
							this.form = Object.assign({}, this.$options.data().form, result.info);
							this.form.weight = this.normalizeDecimal(this.form.weight);
							this.form.volume = this.normalizeDecimal(this.form.volume);
							this.form.factory_price = this.normalizeMoney(this.form.factory_price);
							this.dialog = true;//显示弹层
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
				}else{
					this.dialog = true;//显示弹层
				}
			},
			//保存数据
			save() {
				this.$refs["form"].validate(valid => {
					if (valid) {
						const form = Object.assign({}, this.form, {
							weight: this.normalizeDecimal(this.form.weight),
							volume: this.normalizeDecimal(this.form.volume),
							factory_price: this.normalizeMoney(this.form.factory_price)
						});
						this.$axios.post("category/save", form).then(result => {
							if (result.state == "success") {
								this.record();
								this.dialog=false;
								this.$lib.updateStore(this);
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
					}
				});
			},
			//删除数据
			del(id) {
				this.$confirm("您确定要删除该数据吗?", "提示", {
					confirmButtonText: "确定",
					cancelButtonText: "取消",
					type: "warning"
				}).then(() => {
					this.$axios.post("category/del", {id: id}).then(result => {
						if (result.state == "success") {
							this.record();
							this.$lib.updateStore(this);
							this.$message({type: "success",message: "删除成功!"});
						} else if (result.state == "error") {
							this.$message({type: "warning",message: result.info});
						} else {
							this.$message({type: "error",message: "[ ERROR ] 服务器响应超时!"});
						}
					});
				}).catch(()=>{});
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
	}
	
</script>

<style scoped>
	.layout {
		display: flex;
		justify-content: flex-end;
	}
</style>
