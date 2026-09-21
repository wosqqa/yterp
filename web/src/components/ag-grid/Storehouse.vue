<template>
	<div class="storehouse" tabindex="-1" @keydown.stop.prevent="storehouseEvent">
		<el-popover popper-class="agGridSelect" ref="popover" trigger="manual">
			<p slot="reference">{{value}}</p>
			<ul class="list">
				<template v-for="(item,index) in list">
					<li :key="item.id || index" @click="choice(item)" :class="{hover:index==hover}">{{item.name}}</li>
				</template>
			</ul>
		</el-popover>
	</div>

</template>
<script>
	//内容组件|仓库组件
	import Vue from 'vue';
	const stockCache = {};
    export default Vue.extend({
        name: 'Storehouse',
        data() {
            return {
                value: null,
				list:[],
				hover:0
            }
        },
        created(){
			if(this.hasData){
				this.value = this.params.node.data[this.params.dispose.text];
				this.list = this.store.warehouse;
				//匹配索引
				let findIndex=this.list.findIndex(item=>item.name==this.value);
				findIndex==-1||(this.hover=findIndex);
			}
        },
		computed: {
			//读取数据中心
			store() {
				return this.$store.state;
			},
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
			isIosTouch(){
				if (typeof window === 'undefined') return false;
				return /iPhone|iPad|iPod/i.test(window.navigator.userAgent || '');
			},
			cacheKey(goodsId, attr){
				return String(Number(goodsId) || 0) + "||" + String(attr == null ? "" : attr);
			},
			setStockVal(val){
				try{
					this.params && this.params.node && this.params.node.setDataValue && this.params.node.setDataValue("stock", val);
				}catch(e){
					try{
						this.params.node.data.stock = val;
					}catch(e2){}
				}
			},
			fetchGoodsDepot(goodsId, attr){
				const key = this.cacheKey(goodsId, attr);
				if (stockCache[key]) return stockCache[key];
				stockCache[key] = new Promise((resolve) => {
					this.$axios.post("service/goodsDepot", {
						page: 1,
						limit: 300,
						goods: goodsId,
						attr: attr == null ? "" : attr
					}).then((result) => {
						if (result && result.state == "success") {
							resolve(Array.isArray(result.info) ? result.info : []);
						} else {
							resolve([]);
						}
					}).catch(() => resolve([]));
				});
				return stockCache[key];
			},
			updateStockForWarehouse(warehouseId){
				const data = this.params && this.params.node ? this.params.node.data : null;
				if (!data) return;
				const goodsId = Number(data.key);
				const goodsType = Number(data.goodsType);
				const wid = Number(warehouseId);
				if (!goodsId || goodsType !== 0 || !wid) {
					this.setStockVal("");
					return;
				}
				const attr = data.attr == null ? "" : String(data.attr);
				this.fetchGoodsDepot(goodsId, attr).then((list) => {
					const hit = Array.isArray(list) ? list.find((it) => Number(it && it.warehouse) === wid) : null;
					const nums = hit && hit.nums != null && hit.nums !== "" ? hit.nums : 0;
					this.setStockVal(nums);
				});
			},
			choice(parm){
				this.value=parm.name;
				try{
					this.params.node.setDataValue(this.params.dispose.text, parm.name);
					this.params.node.setDataValue(this.params.dispose.key, parm.id);
				}catch(e){
					this.params.node.data[this.params.dispose.text]=parm.name;
					this.params.node.data[this.params.dispose.key]=parm.id;
				}
				this.updateStockForWarehouse(parm.id);
				const node = this.params && this.params.node ? this.params.node : null;
				const api = this.params && this.params.api ? this.params.api : null;
				const forceRefreshCurrentRowTotal = () => {
					try{
						if (api && node) {
							api.refreshCells({
								force: true,
								rowNodes: [node],
								columns: ['total', 'dsc', 'tat', 'tpt', 'stock', 'warehouse']
							});
						}
					}catch(e){}
				};
				forceRefreshCurrentRowTotal();
				const finalize = () => {
					this.$el.parentNode.focus();
					this.params.api.stopEditing();
					try{
						this.params.context && this.params.context.runHandleGrid && this.params.context.runHandleGrid();
					}catch(e){}
					try {
						if (api) {
							api.refreshCells({
								force: true,
								columns: ['total', 'dsc', 'tat', 'tpt']
							});
						}
					} catch (e) {}
				};
				// iOS 触摸兼容：选择后延迟 100ms 再退出编辑模式，防止 iOS WebKit 「blur 立即销毁节点 → 后续数据更新不生效」经典 bug
				if (this.isIosTouch()) {
					// 先手动关 popover，避免节点被销毁导致 popover 无法优雅关闭
					try {
						this.$refs.popover.showPopper = false;
					} catch (e) {}
					this.$nextTick(() => {
						setTimeout(finalize, 100);
					});
				} else {
					// 桌面端：和原代码一致，立即 finalize
					finalize();
				}
			},
			storehouseEvent(e){
				let keyCode=e.keyCode;
				if(keyCode==13){
					this.choice(this.list[this.hover]);
				}else if(keyCode==27){
					this.$el.parentNode.focus();
					this.params.api.stopEditing();
				}else if(keyCode==38){
					this.list.hasOwnProperty(this.hover-1)&&this.hover--;
				}else if(keyCode==40){
					this.list.hasOwnProperty(this.hover+1)&&this.hover++;
				}
			},
			//返回内容
            getValue(){
				return this.value;
            },
			//编辑状态
			isCancelBeforeStart() {
				return !this.hasData;
			},
			_iosBindTouchOnce(){
				if (this._iosTouchedBound) return;
				if (!this.isIosTouch()) return;
				this._iosTouchedBound = true;
				const vm = this;
				// 给 reference（显示「湖北」的 <p>）加原生 touchend 监听：防止 iOS 点击被吞事件
				try {
					const pop = vm.$refs && vm.$refs.popover;
					const refEl = pop && pop.$refs && pop.$refs.reference;
					const triggerEl = (refEl && refEl.length ? refEl[0] : (refEl ? refEl : null)) || (vm.$el && vm.$el.querySelector('[slot="reference"]'));
					if (triggerEl) {
						triggerEl.style.touchAction = 'manipulation';
						triggerEl.style.webkitTapHighlightColor = 'transparent';
						triggerEl.style.cursor = 'pointer';
						// 原生事件：touchend 保证点击
						triggerEl.addEventListener('touchend', function(ev){
							try { ev.preventDefault(); } catch(e){}
							try { ev.stopPropagation(); } catch(e){}
							vm.$nextTick(() => {
								try {
									if (vm.$refs && vm.$refs.popover) vm.$refs.popover.showPopper = true;
								} catch (e2) {}
							});
						}, { passive: false, capture: false });
					}
				} catch (e) {}
				// 给列表的每个 li 加原生 touchend 监听，防止 iOS click 被 blur 吞掉
				try {
					const listEl = vm.$el && vm.$el.querySelector ? vm.$el.querySelector('ul.list') : null;
					if (listEl) {
						// 事件委托在 ul 上（每次 v-for 重渲染也不用重新绑）
						listEl.addEventListener('touchend', function(ev){
							const target = ev && ev.target ? ev.target : null;
							if (!target) return;
							const li = target.closest ? target.closest('li') : (target.tagName === 'LI' ? target : null);
							if (!li || !listEl.contains(li)) return;
							const idx = Array.prototype.indexOf.call(listEl.children, li);
							if (idx < 0 || !vm.list[idx]) return;
							ev.preventDefault();
							ev.stopPropagation();
							vm.hover = idx;
							vm.choice(vm.list[idx]);
						}, { passive: false, capture: false });
					}
				} catch (e) {}
			}
        },
		mounted() {
			if(this.hasData){
				this.$nextTick(()=>{
					this.$el.focus();
					if (this.isIosTouch()) {
						// iOS：先绑定触摸事件，popover 不立即打开，等用户再次触摸 reference
						this._iosBindTouchOnce();
					} else {
						// 桌面端：和原代码一致，mounted 后立即弹下拉
						this.$refs.popover.showPopper=true;
					}
				});
			}
		}
    })
</script>
<style scoped>
	.storehouse{
		outline:none;
	}
	.hover{
		background: #f2f2f2;
	}
</style>
