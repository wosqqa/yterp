<template>
	<div class="allowance">
		<div class="title">
			<span>{{title}} </span>
			<el-popover popper-class="allowancePopper" ref="popover"  @show="showPopper">
				<i class="el-icon-sort" slot="reference"></i>
				<el-input ref="taxInput" v-model="value" @keydown.enter.native="save" :placeholder="placeholder" size="mini" clearable>
					<template slot="append">
						<span class="btn" @click="save">保存</span>
					</template>
				</el-input>
			</el-popover>
		</div>
	</div>
</template>
<script>
	//头组件|批量折扣率
	import Vue from 'vue';
    export default Vue.extend({
        name: 'Allowance',
        data() {
            return {
				title:'',
				value:'',
				placeholder:''
            }
        },
        created(){
			this.title=this.params.dispose.title;
			const key=this.params && this.params.dispose ? this.params.dispose.key : '';
			this.placeholder=(key==='priceDelta' || key==='numsDelta') ? '输入增减值，如 2 或 -2' : this.title;
        },
        methods:{
			save(){
				const key=this.params.dispose.key;
				if(key==='discount'){
					if(this.$lib.validate('percentage',this.value)){
						this.params.api.forEachNode((node) => {
							if(node.data.key!=null){
								this.$grid.updateGridData(this.params,node.data.uniqid,key,this.value);
							}
						});
						this.params.context.runHandleGrid();
						this.$refs.popover.showPopper=false;
						this.$message({
							type: "success",
							message: "批量设置完成!"
						});
					}else{
						this.$message({
							type: "warning",
							message: "折扣率不正确!"
						});
					}
					return;
				}
				if(key==='dsc'){
					const n=Number(String(this.value==null?'':this.value).replace(/,/g,''));
					const ok=(String(this.value||'').trim()==='') || (Number.isFinite(n) && this.$lib.synValidate('money',String(n)));
					if(!ok){
						this.$message({
							type: "warning",
							message: "折扣额不正确!"
						});
						return;
					}
					const reduce=String(this.value||'').trim()===''?0:n;
					this.params.api.forEachNode((node) => {
						if(node.data.key!=null){
							const price=Number(node.data.price);
							let discount=0;
							if(Number.isFinite(price) && price>0){
								discount = this.$calc.chain(reduce).divide(price).multiply(100).done();
								discount = Math.max(0, Math.min(100, Number(discount) || 0));
								discount = this.$calc.chain(discount).round(2).done();
							}
							this.$grid.updateGridData(this.params,node.data.uniqid,'discount',discount);
						}
					});
					this.params.context.runHandleGrid();
					this.$refs.popover.showPopper=false;
					this.$message({
						type: "success",
						message: "批量设置完成!"
					});
					return;
				}
				if(key==='priceDelta'){
					const n=Number(String(this.value==null?'':this.value).replace(/,/g,''));
					if(!Number.isFinite(n)){
						this.$message({
							type: "warning",
							message: "单价格式不正确!"
						});
						return;
					}
					const delta=n;
					this.params.api.forEachNode((node) => {
						if(node.data.key!=null){
							const cur=Number(node.data.price);
							const base=Number.isFinite(cur)?cur:0;
							let next=this.$calc.chain(base).add(delta).done();
							next = Number.isFinite(next) ? next : base;
							next = Math.max(0, next);
							next = this.$calc.chain(next).round(4).done();
							this.$grid.updateGridData(this.params,node.data.uniqid,'price',next);
						}
					});
					this.params.context.runHandleGrid();
					this.$refs.popover.showPopper=false;
					this.$message({
						type: "success",
						message: "批量设置完成!"
					});
					return;
				}
				if(key==='numsDelta'){
					const n=Number(String(this.value==null?'':this.value).replace(/,/g,''));
					if(!Number.isFinite(n)){
						this.$message({
							type: "warning",
							message: "数量格式不正确!"
						});
						return;
					}
					const delta=n;
					let applied=0;
					let skipped=0;
					this.params.api.forEachNode((node) => {
						if(node.data.key!=null){
							if(node.data.serialType){
								skipped++;
								return;
							}
							const cur=Number(node.data.nums);
							const base=Number.isFinite(cur)?cur:0;
							let next=this.$calc.chain(base).add(delta).done();
							next = Number.isFinite(next) ? next : base;
							next = Math.max(0, next);
							next = this.$calc.chain(next).round(4).done();
							this.$grid.updateGridData(this.params,node.data.uniqid,'nums',next);
							applied++;
						}
					});
					this.params.context.runHandleGrid();
					this.$refs.popover.showPopper=false;
					this.$message({
						type: "success",
						message: skipped>0 ? `批量设置完成! 已更新 ${applied} 行，跳过 ${skipped} 行（序列号商品）` : "批量设置完成!"
					});
					return;
				}
			},
			showPopper(){
				this.$nextTick(()=>{
					this.$refs.taxInput.focus();
				});
			}
        }
    })
</script>
<style>
	.allowancePopper{
		width: 160px;
	}
	.allowancePopper .el-input-group__append{
		padding: 0 12px;
	}
	.allowancePopper .el-input-group__append span{
		cursor: pointer;
	}
</style>
<style scoped>
	.allowance{
		width: 100%;
	}
	.title{
		text-align: center;
	}
</style>
