<template>
    <div class="depot">
		<i
			v-if="hasData"
			class="search el-icon-search depotSearchIcon"
			@click.stop="openDialog"
			@touchstart.stop.prevent="openDialog"
		></i>
		<span class="agGridPopup depotValueText">{{ value }}</span>
		<Stock v-if="dialog" :condition="condition" @rowClick="rowClick" @destroy="dialog=false"></Stock>
	</div>
</template>
<script>
	import Vue from 'vue';
	import Stock from "@/components/dialog/Stock";
    export default Vue.extend({
        name: 'Depot',
		components: {Stock},
		data() {
		    return {
		        value: '',
				dialog:false,
				condition:{},
				_lastOpenAt: 0,
		    }
		},
		created(){
			if(this.hasData){
				this.value = this.params.value;
				let data=this.params.node.data;
				this.condition = {
					goods:data.key,
					attr:data.attr
				};
			}
		},
		computed: {
			hasData(){
				let data=this.params.node.data;
				if(data.key==null){
					return false;
				}else{
					if(data.goodsType==0){
						return true
					}else{
						return false;
					}
				}
			}
		},
		methods:{
			openDialog(){
				const now = Date.now();
				if (now - this._lastOpenAt < 80) return;
				this._lastOpenAt = now;
				this.dialog = true;
			},
			rowClick(row){
				let data=this.params.node.data;
				let dispose=this.params.dispose;
				let compId=this.$el.parentNode.getAttribute('comp-id');
				data[dispose.key]=row.warehouse;
				this.$grid.updateGridData(this.params,data.uniqid,dispose.text,row.name);
				try {
					const target = compId ? document.querySelector(".ag-cell[comp-id='"+compId+"']") : (this.$el ? this.$el.parentNode : null);
					if (target && typeof target.focus === 'function') target.focus();
				} catch (e) {}
				// iOS 下 rowClick 后立即刷新金额/合计单元格
				try {
					const api = this.params && this.params.api;
					const node = this.params && this.params.node;
					if (api && node) {
						api.refreshCells({
							force: true,
							rowNodes: [node],
							columns: ['total', 'dsc', 'tat', 'tpt', 'stock', 'warehouse']
						});
					}
					if (api) {
						api.refreshCells({
							force: true,
							columns: ['total', 'dsc', 'tat', 'tpt']
						});
					}
				} catch (e) {}
				try {
					this.params.context && this.params.context.runHandleGrid && this.params.context.runHandleGrid();
				} catch (e) {}
			}
		}
    })
</script>
<style scoped>
	.depot{
		position: relative;
		height: 100%;
		min-height: 24px;
	}
	.depotSearchIcon{
		position: absolute;
		left: 0;
		top: 6px;
		width: 20px;
		height: 20px;
		line-height: 20px;
		display: inline-block;
		cursor: pointer;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
		-webkit-user-select: none;
		user-select: none;
	}
	.depotValueText{
		touch-action: manipulation;
		-webkit-user-select: none;
		user-select: none;
	}
</style>
