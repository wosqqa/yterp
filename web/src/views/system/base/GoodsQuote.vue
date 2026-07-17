<template>
	<div class="goodsQuote area">
		<div class="quoteHeader">
			<div class="quoteBanner">
				<div class="bannerText">
					<p class="bannerEyebrow">2026 {{ brandTitle }} Hot Selling Ready Stock</p>
					<h1>{{ bannerTitle }}</h1>
					<p class="bannerLine">Schoolbag ODM available, single color MOQ 500 pcs</p>
					<p class="bannerLine">stock MOQ 50 pcs</p>
				</div>
				<div class="bannerActions">
					<el-button size="mini" @click="$router.push({ name: 'goods' })">返回商品管理</el-button>
					<el-button size="mini" type="primary" @click="resetAndLoad">刷新报价表</el-button>
				</div>
			</div>
			<div class="quoteToolbar">
				<div class="toolbarBlock">
					<div class="toolbarTitle">Current Filters</div>
					<div class="filterTags">
						<span v-if="filterTags.length === 0" class="filterTag empty">All Products</span>
						<span v-for="tag in filterTags" :key="tag.key" class="filterTag">
							{{ tag.label }}: {{ tag.value }}
						</span>
					</div>
				</div>
				<div class="toolbarStats">
					<div class="statCard">
						<span>Loaded</span>
						<b>{{ goodsList.length }}</b>
					</div>
					<div class="statCard">
						<span>Groups</span>
						<b>{{ quoteSections.length }}</b>
					</div>
					<div class="statCard">
						<span>Total</span>
						<b>{{ page.total }}</b>
					</div>
				</div>
			</div>
		</div>
		<div ref="scrollWrap" class="quoteScroll" @scroll.passive="handleScroll">
			<div class="quoteSheet">
				<div class="sheetHead">
					<div class="headCell no">NO.</div>
					<div class="headCell picture">PICTURE</div>
					<div class="headCell price">RMB/PRICE</div>
					<div class="headCell usd">
						<div class="usdTitle">USD</div>
						<div class="usdTitle">Price</div>
						<div class="usdRate">1USD={{ exchangeRate }}RMB</div>
					</div>
				</div>
				<el-empty v-if="loaded && quoteSections.length === 0" description="当前筛选条件下暂无商品"></el-empty>
				<div v-for="section in quoteSections" :key="section.key" class="sheetRow">
					<div class="rowNo">{{ section.code }}</div>
					<div class="rowPicture">
						<div class="sectionTitle">{{ section.title }}</div>
						<div class="sectionGrid">
							<div v-for="item in section.items" :key="item.id" class="sectionItem">
								<div class="sectionImage">
									<img v-if="getImgUrl(item)" :src="getImgUrl(item)" :alt="item.number || item.name" loading="lazy" />
									<div v-else class="sectionPlaceholder">
										<span>{{ item.number || "--" }}</span>
									</div>
								</div>
								<div class="sectionNo">{{ item.number || "--" }}</div>
							</div>
						</div>
					</div>
					<div class="rowPrice">
						<div class="priceMain">{{ section.rmbPriceText }}</div>
					</div>
					<div class="rowUsd">
						<div class="priceMain">{{ section.usdPriceText }}</div>
					</div>
				</div>
			</div>
			<div v-if="quoteSections.length > 0" class="quoteFooter">
				<div v-if="loading" class="loadingText">正在加载更多商品...</div>
				<div v-else-if="loaded && !hasMore" class="loadingText done">已加载全部商品</div>
				<div v-else class="loadingText">下滑继续加载</div>
			</div>
		</div>
	</div>
</template>

<script>
	export default {
		name: "GoodsQuote",
		data() {
			return {
				searchFrom: {
					name: "",
					number: "",
					spec: "",
					category: null,
					brand: "",
					code: "",
					type: "",
					data: ""
				},
				goodsList: [],
				page: {
					current: 1,
					total: 0,
					size: 18
				},
				loading: false,
				loaded: false
			};
		},
		created() {
			this.syncFromRoute();
		},
		watch: {
			$route() {
				this.syncFromRoute();
			}
		},
		computed: {
			store() {
				return this.$store.state;
			},
			exchangeRate() {
				return 6.8;
			},
			hasMore() {
				return !this.loaded || this.goodsList.length < this.page.total;
			},
			brandTitle() {
				return this.store && this.store.sys && this.store.sys.name ? this.store.sys.name : "Smiggle";
			},
			bannerTitle() {
				const title = this.searchFrom && this.searchFrom.name ? this.searchFrom.name : this.brandTitle + " Product Quotation";
				return title;
			},
			filterTags() {
				const typeMap = {
					1: "常规商品",
					2: "服务商品"
				};
				const categoryName = this.getCategoryLabel(this.searchFrom.category);
				const tags = [
					{ key: "name", label: "商品名称", value: this.searchFrom.name },
					{ key: "number", label: "商品编号", value: this.searchFrom.number },
					{ key: "spec", label: "规格型号", value: this.searchFrom.spec },
					{ key: "category", label: "商品类别", value: categoryName },
					{ key: "brand", label: "商品品牌", value: this.searchFrom.brand },
					{ key: "code", label: "商品条码", value: this.searchFrom.code },
					{ key: "type", label: "商品类型", value: typeMap[this.searchFrom.type] || "" },
					{ key: "data", label: "备注信息", value: this.searchFrom.data }
				];
				return tags.filter(tag => !this.$lib.validate("empty", tag.value));
			},
			quoteSections() {
				const groups = {};
				const order = [];
				this.goodsList.forEach(item => {
					const categoryName = this.getCategoryName(item.categoryData);
					const key = item && item.categoryData && item.categoryData.id ? `c_${item.categoryData.id}` : `n_${categoryName}`;
					if (!groups[key]) {
						groups[key] = {
							key,
							title: this.buildSectionTitle(categoryName, item),
							categoryName,
							items: [],
							prices: []
						};
						order.push(key);
					}
					groups[key].items.push(item);
					const sell = Number(item.sell);
					Number.isFinite(sell) && groups[key].prices.push(sell);
				});
				return order.map((key, index) => {
					const group = groups[key];
					const price = this.getPriceInfo(group.prices);
					return Object.assign(group, {
						code: `S${index + 1}`,
						rmbPriceText: price.rmb,
						usdPriceText: price.usd
					});
				});
			}
		},
		methods: {
			getDefaultSearch() {
				return {
					name: "",
					number: "",
					spec: "",
					category: null,
					brand: "",
					code: "",
					type: "",
					data: ""
				};
			},
			syncFromRoute() {
				this.searchFrom = this.parseSearch(this.$route.query.quoteSearch);
				this.resetAndLoad();
			},
			parseSearch(text) {
				if (this.$lib.validate("empty", text)) {
					return this.getDefaultSearch();
				}
				try {
					return Object.assign(this.getDefaultSearch(), JSON.parse(decodeURIComponent(text)));
				} catch (error) {
					return this.getDefaultSearch();
				}
			},
			resetAndLoad() {
				this.goodsList = [];
				this.page.current = 1;
				this.page.total = 0;
				this.loaded = false;
				this.loadGoods(true);
			},
			loadGoods(reset = false) {
				if (this.loading) {
					return;
				}
				if (!reset && this.loaded && this.goodsList.length >= this.page.total) {
					return;
				}
				this.loading = true;
				const params = Object.assign(
					{
						page: this.page.current,
						limit: this.page.size,
						sort: "numberAsc"
					},
					this.searchFrom
				);
				this.$axios.post("goods/record", params).then(result => {
					if (result.state == "success") {
						const currentRows = Array.isArray(result.info) ? result.info : [];
						const rowMap = {};
						const merged = reset ? [] : this.goodsList.slice();
						merged.forEach(item => {
							rowMap[item.id] = true;
						});
						currentRows.forEach(item => {
							if (!rowMap[item.id]) {
								rowMap[item.id] = true;
								merged.push(item);
							}
						});
						this.goodsList = merged;
						this.page.total = Number(result.count) || 0;
						this.loaded = true;
						this.page.current += 1;
						this.$nextTick(() => {
							this.checkNeedMore();
						});
					} else if (result.state == "error") {
						this.loaded = true;
						this.$message({
							type: "warning",
							message: result.info
						});
					} else {
						this.loaded = true;
						this.$message({
							type: "error",
							message: "[ ERROR ] 服务器响应超时!"
						});
					}
				}).finally(() => {
					this.loading = false;
				});
			},
			checkNeedMore() {
				const wrap = this.$refs.scrollWrap;
				if (!wrap || this.loading || !this.hasMore) {
					return;
				}
				if (wrap.scrollHeight <= wrap.clientHeight + 120) {
					this.loadGoods();
				}
			},
			handleScroll() {
				const wrap = this.$refs.scrollWrap;
				if (!wrap || this.loading || !this.hasMore) {
					return;
				}
				const remain = wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight;
				if (remain <= 260) {
					this.loadGoods();
				}
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
			formatMoney(value) {
				const num = Number(value);
				return Number.isFinite(num) ? num.toFixed(2) : "0.00";
			},
			buildSectionTitle(categoryName, item) {
				const spec = item && item.spec ? String(item.spec).trim() : "";
				return spec ? `${categoryName} (${spec})` : categoryName;
			},
			getPriceInfo(prices) {
				if (!prices || prices.length === 0) {
					return {
						rmb: "￥0.00",
						usd: "$0.00"
					};
				}
				const min = Math.min(...prices);
				const max = Math.max(...prices);
				const same = Math.abs(max - min) < 0.0001;
				if (same) {
					return {
						rmb: `￥${this.formatMoney(min)}`,
						usd: `$${this.formatMoney(min / this.exchangeRate)}`
					};
				}
				return {
					rmb: `￥${this.formatMoney(min)} - ￥${this.formatMoney(max)}`,
					usd: `$${this.formatMoney(min / this.exchangeRate)} - $${this.formatMoney(max / this.exchangeRate)}`
				};
			},
			getCategoryName(categoryData) {
				if (!categoryData) {
					return "未设置分类";
				}
				return categoryData.name || "未设置分类";
			},
			getCategoryLabel(id) {
				if (id === null || id === undefined || id === "") {
					return "";
				}
				const target = String(id);
				const queue = Array.isArray(this.store.category) ? this.store.category.slice() : [];
				while (queue.length > 0) {
					const item = queue.shift();
					if (String(item.id) === target) {
						return item.name || "";
					}
					if (Array.isArray(item.children) && item.children.length > 0) {
						queue.push(...item.children);
					}
				}
				return "";
			}
		}
	};
</script>

<style scoped>
	.goodsQuote{
		display: flex;
		flex-direction: column;
		background: #f1f4f8;
	}
	.quoteHeader{
		padding: 16px 16px 0;
	}
	.quoteBanner{
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 18px 24px;
		border-radius: 14px 14px 0 0;
		background: linear-gradient(180deg, #13a3e7 0%, #1aa8ed 100%);
		color: #fff;
		box-shadow: 0 8px 24px rgba(17, 163, 231, 0.18);
	}
	.bannerEyebrow{
		margin: 0 0 8px;
		font-size: 14px;
		font-weight: 700;
		letter-spacing: 0.4px;
		opacity: 0.95;
	}
	.quoteBanner h1{
		margin: 0;
		font-size: 22px;
		line-height: 1.2;
		font-weight: 700;
	}
	.bannerLine{
		margin: 6px 0 0;
		font-size: 14px;
		line-height: 1.5;
		max-width: 720px;
		font-weight: 600;
		opacity: 0.96;
	}
	.bannerActions{
		display: flex;
		align-items: center;
		gap: 10px;
		flex-shrink: 0;
	}
	.quoteToolbar{
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		padding: 14px 18px;
		border-radius: 0 0 14px 14px;
		background: #fff;
		box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
	}
	.toolbarBlock{
		flex: 1;
		min-width: 0;
	}
	.toolbarTitle{
		font-size: 13px;
		font-weight: 600;
		color: #5b6475;
		margin-bottom: 10px;
	}
	.filterTags{
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.filterTag{
		display: inline-flex;
		align-items: center;
		padding: 6px 10px;
		border-radius: 4px;
		background: #f3f7fb;
		color: #3b4a5e;
		font-size: 12px;
		line-height: 1.4;
		border: 1px solid #dde5ef;
	}
	.filterTag.empty{
		background: #f4f4f5;
		color: #606266;
	}
	.toolbarStats{
		display: grid;
		grid-template-columns: repeat(3, minmax(92px, 1fr));
		gap: 10px;
		min-width: 320px;
	}
	.statCard{
		padding: 10px 14px;
		border-radius: 6px;
		background: #f8fafc;
		text-align: center;
		border: 1px solid #e4eaf3;
	}
	.statCard span{
		display: block;
		font-size: 12px;
		color: #64748b;
	}
	.statCard b{
		display: block;
		margin-top: 8px;
		font-size: 22px;
		color: #0f172a;
	}
	.quoteScroll{
		flex: 1;
		margin: 16px;
		padding: 0 0 24px;
		overflow-y: auto;
	}
	.quoteSheet{
		background: #fff;
		border: 1px solid #8b8b8b;
	}
	.sheetHead{
		display: grid;
		grid-template-columns: 72px 1fr 116px 116px;
		background: #f2f2f2;
		border-bottom: 1px solid #8b8b8b;
	}
	.headCell{
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		min-height: 58px;
		padding: 8px;
		border-right: 1px solid #8b8b8b;
		font-size: 12px;
		font-weight: 700;
		color: #111827;
		text-align: center;
	}
	.headCell:last-child{
		border-right: 0;
	}
	.usdRate{
		margin-top: 2px;
		color: #c81e1e;
		font-weight: 700;
	}
	.usdTitle{
		line-height: 1.15;
	}
	.sheetRow{
		display: grid;
		grid-template-columns: 72px 1fr 116px 116px;
		border-bottom: 1px solid #8b8b8b;
	}
	.sheetRow:last-child{
		border-bottom: 0;
	}
	.rowNo,
	.rowPrice,
	.rowUsd{
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px 10px;
		border-right: 1px solid #8b8b8b;
		background: #fff;
		text-align: center;
	}
	.rowNo{
		font-size: 20px;
		font-weight: 700;
		color: #222;
	}
	.rowPicture{
		padding: 14px 18px 18px;
		background: #fff;
		border-right: 1px solid #8b8b8b;
	}
	.sectionTitle{
		margin-bottom: 12px;
		text-align: center;
		font-size: 13px;
		font-weight: 700;
		color: #d93535;
	}
	.sectionGrid{
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 12px 10px;
	}
	.sectionItem{
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.sectionImage{
		position: relative;
		width: 100%;
		padding-top: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}
	.sectionImage img,
	.sectionPlaceholder{
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
		position: absolute;
		top: 0;
		left: 0;
	}
	.sectionPlaceholder{
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px dashed #d6d6d6;
		background: #fafafa;
		color: #8b8b8b;
		font-size: 12px;
		text-align: center;
		padding: 8px;
	}
	.sectionNo{
		margin-top: 6px;
		font-size: 12px;
		font-weight: 700;
		color: #d93535;
		line-height: 1.2;
	}
	.priceMain{
		font-size: 26px;
		font-weight: 700;
		color: #111827;
		line-height: 1.35;
		word-break: break-word;
	}
	.quoteFooter{
		padding: 18px 0 12px;
	}
	.loadingText{
		text-align: center;
		font-size: 13px;
		color: #64748b;
	}
	.loadingText.done{
		color: #94a3b8;
	}
	@media (max-width: 992px){
		.quoteBanner,
		.quoteToolbar{
			flex-direction: column;
			align-items: stretch;
		}
		.bannerActions{
			justify-content: flex-end;
		}
		.toolbarStats{
			grid-template-columns: repeat(3, minmax(0, 1fr));
			min-width: 0;
		}
		.sheetHead,
		.sheetRow{
			grid-template-columns: 64px 1fr 96px 96px;
		}
		.sectionGrid{
			grid-template-columns: repeat(7, minmax(0, 1fr));
		}
		.priceMain{
			font-size: 20px;
		}
	}
	@media (max-width: 768px){
		.quoteHeader{
			padding: 12px 12px 0;
		}
		.quoteBanner{
			padding: 18px;
			border-radius: 12px 12px 0 0;
		}
		.quoteBanner h1{
			font-size: 20px;
		}
		.quoteScroll{
			margin: 12px;
		}
		.quoteToolbar{
			border-radius: 0 0 12px 12px;
		}
		.sheetHead{
			display: none;
		}
		.sheetRow{
			grid-template-columns: 1fr;
		}
		.rowNo,
		.rowPicture,
		.rowPrice,
		.rowUsd{
			border-right: 0;
			border-bottom: 1px solid #8b8b8b;
		}
		.rowNo{
			min-height: 52px;
			background: #f5f5f5;
			font-size: 18px;
		}
		.rowPicture{
			padding: 12px;
		}
		.sectionGrid{
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 10px 8px;
		}
		.rowPrice,
		.rowUsd{
			justify-content: space-between;
			padding: 12px 16px;
		}
		.rowPrice::before{
			content: "RMB/PRICE";
			font-size: 12px;
			font-weight: 700;
			color: #475569;
		}
		.rowUsd::before{
			content: "USD PRICE";
			font-size: 12px;
			font-weight: 700;
			color: #475569;
		}
	}
	@media (max-width: 480px){
		.bannerActions{
			flex-direction: column;
		}
		.bannerActions .el-button{
			width: 100%;
		}
		.toolbarStats{
			grid-template-columns: 1fr;
		}
		.sectionGrid{
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.priceMain{
			font-size: 18px;
		}
	}
</style>
