<template>
	<div class="user area">
		<div class="layout">
			<el-popover ref="searchPopover" popper-class="searchPopover" placement="bottom-start">
				<el-form class="searchFrom" ref="searchFrom"  inline>
					<el-form-item>
						<el-input placeholder="请输入用户名称" v-model="searchFrom.name" clearable></el-input>
					</el-form-item>
					<el-form-item>
						<el-input placeholder="请输入用户账号" v-model="searchFrom.user" clearable></el-input>
					</el-form-item>
					<el-form-item>
						<el-input placeholder="请输入手机号码" v-model="searchFrom.tel" clearable></el-input>
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
				<template v-if="$lib.getUserRoot(store.root,'senior','add')">
					<el-button @click="set(0)" >新增</el-button>
				</template>
				<el-button @click="reload" >刷新</el-button>
			</el-button-group>
		</div>
		<el-divider></el-divider>
		<el-table :data="tableData" height="calc(100% - 90px)" border v-madeTable>
			<el-table-column prop="name" label="用户名称" align="center" width="160px"></el-table-column>
			<el-table-column prop="frameData.name" label="所属架构" align="center" width="120px"></el-table-column>
			<el-table-column prop="roleData.name" label="用户角色" align="center" width="120px"></el-table-column>
			<el-table-column prop="user" label="用户账号" align="center" width="120px"></el-table-column>
			<el-table-column prop="tel" label="手机号码" align="center" width="160px"></el-table-column>
			<el-table-column prop="data" label="备注信息 " align="center" width="200px"></el-table-column>
			<el-table-column prop="set" label="相关操作" align="center" width="160px">
				<template slot-scope="scope">
					<el-button-group>
						<el-button @click="set(scope.row.id)" size="mini">详情</el-button>
						<template v-if="$lib.getUserRoot(store.root,'senior','del')">
							<template v-if="scope.row.id!=store.user.id">
								<el-button @click="del(scope.row.id)" size="mini">删除</el-button>
							</template>
						</template>
					</el-button-group>
				</template>
			</el-table-column>
		</el-table>
		<el-pagination class="tablePagination" :current-page.sync="page.current" :total="page.total" :page-size.sync="page.size"
		 :page-sizes="page.sizes" :pager-count="page.count" @size-change="record(1)" @current-change="record(0)" layout="prev,pager,next,jumper,sizes,total">
		</el-pagination>
		<el-dialog :visible.sync="dialog" title="详情" width="720px" v-madeDialog>
			<transition name="el-fade-in">
				<template v-if="dialog">
					<el-form :model="form" :rules="rules" ref="form" label-width="80px" >
						<el-form-item label="用户名称" prop="name">
							<el-input placeholder="请输入用户名称" v-model="form.name"></el-input>
						</el-form-item>
						<template v-if="form.id!=store.user.id">
							<!-- 非当前用户显示 -->
							<el-form-item label="所属组织" prop="frame">
								<nodTree v-model="form.frame" :treeData="store.frame" placeholder="请选择所属组织"></nodTree>
							</el-form-item>
							<template v-if="(form.frame!=null&&form.frame!=0)">
								<!-- 非默认架构显示 -->
								<el-form-item label="用户角色" prop="role">
									<nodList v-model="form.role" placeholder="请选择用户角色" action="service/roleRecord" scene="role"></nodList>
								</el-form-item>
							</template>
						</template>
						<el-form-item label="用户账号" prop="user">
							<el-input placeholder="请输入用户账号" v-model="form.user"></el-input>
						</el-form-item>
						<el-form-item label="手机号码" prop="tel">
							<el-input placeholder="请输入手机号码" v-model="form.tel"></el-input>
						</el-form-item>
						<el-form-item label="用户密码" prop="pwd">
							<el-input :placeholder="form.id==0?'请输入用户密码':'不修改密码请留空'" v-model="form.pwd"></el-input>
						</el-form-item>
						<el-form-item label="用户头像" prop="img">
							<el-upload class="avatar-uploader" :action="$base.web+'user/upload'" :headers="{Token:$store.state.token}" :show-file-list="false" :on-success="uploadSuccess">
								<el-tooltip v-if="form.img!=''" content="单击鼠标右键删除头像">
									<img class="userAvatar" :src="form.img" @click.right="form.img=''">
								</el-tooltip>
								<i v-else class="el-icon-plus avatar-uploader-icon"></i>
							</el-upload>
						</el-form-item>
						<FieldForm v-model="form.more" rule="user" prefix="more."></FieldForm>
						<el-divider content-position="left">公司信息</el-divider>
						<div class="companyInfoBlock">
							<div class="companyRow">
								<el-form-item label="公司中文名" label-width="100px" prop="more.companyCn" class="companyFormItem">
									<el-input placeholder="例：希悦箱包" v-model="form.more.companyCn"></el-input>
								</el-form-item>
								<el-form-item label="公司英文名" label-width="100px" prop="more.companyEn" class="companyFormItem">
									<el-input placeholder="例：Kim Bags" v-model="form.more.companyEn"></el-input>
								</el-form-item>
							</div>
							<el-form-item label="中文地址" label-width="100px" prop="more.addressCn">
								<el-input type="textarea" :rows="2" placeholder="请输入公司中文地址" v-model="form.more.addressCn"></el-input>
							</el-form-item>
							<el-form-item label="英文地址" label-width="100px" prop="more.addressEn">
								<el-input type="textarea" :rows="2" placeholder="Please input company address in English" v-model="form.more.addressEn"></el-input>
							</el-form-item>
							<div class="companyRow">
								<el-form-item label="邮箱" label-width="100px" prop="more.email" class="companyFormItem">
									<el-input placeholder="company email" v-model="form.more.email"></el-input>
								</el-form-item>
								<el-form-item label="WhatsApp" label-width="100px" prop="more.whatsapp" class="companyFormItem">
									<el-input placeholder="WhatsApp号码，含国家区号" v-model="form.more.whatsapp"></el-input>
								</el-form-item>
							</div>
							<div class="companyRow">
								<el-form-item label="联系电话" label-width="100px" prop="tel" class="companyFormItem">
									<el-input placeholder="联系电话（复用手机号）" v-model="form.tel"></el-input>
								</el-form-item>
								<el-form-item label="联系人" label-width="100px" prop="more.contactName" class="companyFormItem">
									<el-input placeholder="打印在手机/WhatsApp后面的联系人，例：Kim" v-model="form.more.contactName"></el-input>
								</el-form-item>
							</div>
							<div class="companyRow">
								<el-form-item label="汇率" label-width="100px" prop="more.exchangeRate" class="companyFormItem">
									<el-input placeholder="USD/CNY 汇率，例：6.85（空则默认6.85）" v-model="form.more.exchangeRate"></el-input>
								</el-form-item>
							</div>
							<div class="qrRow">
								<div class="qrItem">
									<div class="qrLabel">微信二维码</div>
									<el-upload
										class="avatar-uploader qrUploader"
										:action="$base.web+'user/upload'"
										:headers="{Token:$store.state.token}"
										:show-file-list="false"
										:on-success="(res, f, list) => onQrUploadSuccess('wechatQr', res, f, list)"
									>
										<el-tooltip v-if="form.more.wechatQr" content="右键删除图片">
											<img class="qrImg" :src="form.more.wechatQr" @click.right.prevent="form.more.wechatQr=''">
										</el-tooltip>
										<i v-else class="el-icon-plus qr-uploader-icon"></i>
									</el-upload>
								</div>
								<div class="qrItem">
									<div class="qrLabel">WhatsApp二维码</div>
									<el-upload
										class="avatar-uploader qrUploader"
										:action="$base.web+'user/upload'"
										:headers="{Token:$store.state.token}"
										:show-file-list="false"
										:on-success="(res, f, list) => onQrUploadSuccess('whatsappQr', res, f, list)"
									>
										<el-tooltip v-if="form.more.whatsappQr" content="右键删除图片">
											<img class="qrImg" :src="form.more.whatsappQr" @click.right.prevent="form.more.whatsappQr=''">
										</el-tooltip>
										<i v-else class="el-icon-plus qr-uploader-icon"></i>
									</el-upload>
								</div>
							</div>
						</div>
						<el-form-item label="备注信息">
							<el-input placeholder="请输入备注信息" v-model="form.data"></el-input>
						</el-form-item>
					</el-form>
				</template>
			</transition>
			<span slot="footer" class="dialog-footer">
				<el-button @click="dialog = false" >取消</el-button>
				<template v-if="form.id==0 || $lib.getUserRoot(store.root,'senior','edit')">
					<el-button @click="save" type="primary" >保存</el-button>
				</template>
			</span>
		</el-dialog>
	</div>
</template>
<script>
	import NodTree from "@/components/lib/NodTree";
	import NodList from "@/components/lib/NodList";
	import FieldForm from "@/components/lib/FieldForm";
	export default {
		name: "User",
		components: {
			NodTree,
			NodList,
			FieldForm
		},
		data() {
			return {
				searchFrom: {
					name: "",
					user: "",
					tel: "",
					data: ""
				},
				tableData:[],
				page: {
					current: 1,
					total: 0,
					size: 30,
					sizes: [30, 60, 90, 150, 300],
					count: 5
				},
				dialog: false,
				form: {
					id: 0,
					name:"",
					frame:null,
					role:null,
					user: "",
					tel: "",
					pwd: "",
					img: "",
					data: "",
					more: {
						companyCn:"",
						companyEn:"",
						addressCn:"",
						addressEn:"",
						email:"",
						whatsapp:"",
						contactName:"",
						wechatQr:"",
						whatsappQr:"",
						exchangeRate:""
					}
				},
				rules: {
					name: {
						required: true,
						message: "请输入用户名称",
						trigger: "blur"
					},
					frame: {
						required: true,
						message: "请选择所属组织",
						trigger: "change"
					},
					role: {
						required:true,
						message:'请选择用户角色',
						trigger:'change',
					},
					user: {
						required: true,
						message: "请输入用户账号",
						trigger: "blur"
					},
					tel: [
						{
							required:true,
							message:'请输入手机号码',
							trigger:'blur',
						},
						{
							validator: (rule,value,callback)=>{
								this.$lib.validate('tel',value)?callback():callback(new Error('手机号码不正确'));
							},
							trigger: "blur"
						}
					]
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
			},
			//监听架构数据
			formFrame() {
		　　　　return this.form.frame
		　　}
		},
		watch: {
			//监听默认架构|用户角色初始化
		　　formFrame(val) {
				val==0&&(this.form.role=null);
		　　}
		},
		methods: {
			//获取数据
			record(page) {
				page==0||(this.page.current=page);
				let parm = Object.assign({
					page: this.page.current,
					limit: this.page.size
				}, this.searchFrom);
				this.$axios.post("user/record", parm).then(result => {
					if (result.state == "success") {
						this.tableData = result.info;
						this.page.total = result.count;
						this.$refs["searchPopover"].showPopper=false;
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
				this.form=this.$lib.extend(true,{},this.$options.data().form);
				//2.请求数据
				if (id > 0) {
					this.$axios.post("user/get", {
						id: id
					}).then(result => {
						if (result.state == "success") {
							result.info.pwd = "";
							const baseMore = (this.$options.data().form && this.$options.data().form.more) ? this.$lib.extend(true,{},this.$options.data().form.more) : {};
							const infoMore = (result.info && result.info.more && typeof result.info.more === "object" && result.info.more !== null) ? result.info.more : {};
							result.info.more = Object.assign({}, baseMore, infoMore);
							this.form = result.info;
							this.dialog = true; //显示弹层
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
					this.dialog = true; //显示弹层
				}
			},
			//保存数据
			save() {
				this.$refs["form"].validate(valid => {
					if (valid) {
						if (this.form.id == 0 && this.$lib.validate('empty', this.form.pwd)) {
							this.$message({
								type: "warning",
								message: "用户密码不可为空!"
							});
							return false;
						}
						const rateRaw = (this.form && this.form.more && this.form.more.exchangeRate != null) ? String(this.form.more.exchangeRate).trim() : "";
						if (rateRaw !== "") {
							const num = Number(rateRaw);
							if (!isFinite(num) || !(num > 0)) {
								this.$message({type: "warning",message: "汇率必须是大于0的数字，或留空使用默认值!"});
								return false;
							}
							if (num < 0.0001 || num > 9999.9999) {
								this.$message({type: "warning",message: "汇率超出允许范围(0.0001~9999.9999)!"});
								return false;
							}
							this.$set(this.form.more, "exchangeRate", String(num));
						} else {
							this.$set(this.form.more, "exchangeRate", "");
						}
						this.$axios.post("user/save", this.form).then(result => {
							if (result.state == "success") {
								this.record(0);
								this.dialog = false;
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
					this.$axios.post("user/del", {
						id: id
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
			//头像上传成功
			uploadSuccess(result, file, fileList) {
				if (result.state == 'success') {
					this.form.img = result.info;
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
			//二维码上传成功
			onQrUploadSuccess(field, result, file, fileList) {
				if (result.state == 'success') {
					this.$set(this.form.more, field, result.info);
				} else if (result.state == "error") {
					fileList && fileList.splice && fileList.splice(fileList.findIndex(obj => obj.uid == file.uid), 1);
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
	.userAvatar {
		width: 100px;
		height: 100px;
		display: block;
	}
	.avatar-uploader >>> .el-upload {
		border: 1px dashed #d9d9d9;
		border-radius: 6px;
		cursor: pointer;
		position: relative;
		overflow: hidden;
	}
	.avatar-uploader >>> .el-upload:hover {
		border-color: #409EFF;
	}
	.avatar-uploader-icon {
		font-size: 28px;
		color: #8c939d;
		width: 100px;
		height: 100px;
		line-height: 100px;
		text-align: center;
	}
	.companyInfoBlock {
		padding: 0 2px 8px 2px;
	}
	.companyRow {
		display: flex;
		gap: 16px;
	}
	.companyFormItem {
		flex: 1 1 0;
		min-width: 0;
	}
	.qrRow {
		display: flex;
		gap: 28px;
		flex-wrap: wrap;
	}
	.qrItem {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
	}
	.qrLabel {
		font-size: 13px;
		color: #606266;
	}
	.qrUploader >>> .el-upload,
	.qr-uploader-icon {
		width: 120px;
		height: 120px;
		line-height: 120px;
		text-align: center;
	}
	.qrImg {
		width: 120px;
		height: 120px;
		object-fit: contain;
		display: block;
		border: 1px solid #ebeef5;
		border-radius: 4px;
		padding: 4px;
		box-sizing: border-box;
		background: #fff;
	}
</style>
