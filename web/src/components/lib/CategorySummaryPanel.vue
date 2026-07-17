<template>
	<div class="categorySummary">
		<div class="categorySummaryTitle">{{ title }}</div>
		<el-table
			:data="summaryRows"
			:height="tableHeight || null"
			border
			size="mini"
			class="categorySummaryTable"
		>
			<el-table-column prop="name" label="商品类别" align="center" min-width="120px"></el-table-column>
			<el-table-column :label="priceLabel" align="center" width="90px">
				<template slot-scope="scope">
					<template v-if="editablePrice">
						<el-input
							size="mini"
							:value="getCategoryBuyDraft(scope.row.key, scope.row.buyDefault)"
							@input="setCategoryBuyDraft(scope.row.key, $event)"
							@blur="applyCategoryBuy(scope.row.key, scope.row.buyDefault)"
							class="buyInput"
						></el-input>
					</template>
					<template v-else>
						{{ scope.row.buyDefault }}
					</template>
				</template>
			</el-table-column>
			<el-table-column prop="numsText" label="数量" align="center" width="90px"></el-table-column>
			<el-table-column prop="moneyText" :label="moneyLabel" align="center" width="90px"></el-table-column>
		</el-table>
		<div class="categorySummaryFooter">
			<div>总数量：{{ totalNumsText }}</div>
			<div>{{ totalMoneyLabel }}：{{ totalMoneyText }}</div>
		</div>
	</div>
</template>

<script>
export default {
	name: "CategorySummaryPanel",
	props: {
		title: {
			type: String,
			default: "分类汇总"
		},
		priceLabel: {
			type: String,
			default: "采购价"
		},
		moneyLabel: {
			type: String,
			default: "金额"
		},
		totalMoneyLabel: {
			type: String,
			default: "总金额"
		},
		rows: {
			type: Array,
			default: () => []
		},
		categoryPath: {
			type: String,
			default: "goodsData.category"
		},
		qtyPath: {
			type: String,
			default: "summary.nums"
		},
		defaultPricePath: {
			type: String,
			default: "goodsData.buy"
		},
		editablePrice: {
			type: Boolean,
			default: true
		},
		tableHeight: {
			type: [String, Number],
			default: "100%"
		}
	},
	data() {
		return {
			buyOverride: {},
			buyDraft: {}
		};
	},
	computed: {
		store() {
			return this.$store.state;
		},
		categoryNodeMap() {
			const map = {};
			const walk = (list) => {
				for (const node of list || []) {
					const id = Number(node && node.id);
					if (Number.isFinite(id)) {
						map[id] = {
							name: node && node.name != null ? String(node.name) : "",
							factory_price: node && node.factory_price != null ? node.factory_price : "0.00",
						};
					}
					const sub = node && (node.sub || node.children);
					sub && sub.length && walk(sub);
				}
			};
			walk(this.store.category || []);
			return map;
		},
		summaryRows() {
			const map = {};
			const order = [];
			for (const row of this.rows || []) {
				const rawCategory = this.getValueByPath(row, this.categoryPath, -1);
				const cid = Number(rawCategory);
				const key = Number.isFinite(cid) ? cid : -1;
				const qty = Number(this.getValueByPath(row, this.qtyPath, 0)) || 0;
				const factoryPrice = this.categoryNodeMap[key] ? Number(this.categoryNodeMap[key].factory_price) : NaN;
				const defaultPrice = Number.isFinite(factoryPrice)
					? factoryPrice
					: Number(this.getValueByPath(row, this.defaultPricePath, 0)) || 0;
				if (!map.hasOwnProperty(key)) {
					map[key] = { key, qty: 0, price: Number.isFinite(defaultPrice) ? defaultPrice : 0 };
					order.push(key);
				}
				map[key].qty += qty;
				if (!Number.isFinite(map[key].price) || map[key].price === 0) {
					map[key].price = Number.isFinite(defaultPrice) ? defaultPrice : 0;
				}
			}
			return order.map((key) => {
				const item = map[key];
				const qtyVal = Number(item.qty) || 0;
				const override = this.buyOverride.hasOwnProperty(key) ? Number(this.buyOverride[key]) : NaN;
				const priceVal = Number.isFinite(override) ? override : Number(item.price) || 0;
				const moneyVal = this.$calc.chain(qtyVal).multiply(priceVal).done();
				return {
					key,
					name: key === -1 ? "未分类" : (this.categoryNodeMap[key] && this.categoryNodeMap[key].name) || "未分类",
					qtyVal,
					priceVal,
					moneyVal,
					buyDefault: this.formatMoney(Number(item.price) || 0, 2),
					numsText: String(qtyVal),
					moneyText: this.formatMoney(moneyVal, 2)
				};
			});
		},
		totalNumsText() {
			const totalNums = this.summaryRows.reduce((sum, row) => sum + (Number(row.qtyVal) || 0), 0);
			return String(totalNums);
		},
		totalMoneyText() {
			const totalMoney = this.summaryRows.reduce((sum, row) => sum + (Number(row.moneyVal) || 0), 0);
			return this.formatMoney(totalMoney, 2);
		}
	},
	methods: {
		getValueByPath(source, path, fallback) {
			if (!source || !path) return fallback;
			const keys = String(path).split(".");
			let current = source;
			for (const key of keys) {
				if (current == null || !Object.prototype.hasOwnProperty.call(current, key)) {
					return fallback;
				}
				current = current[key];
			}
			return current == null ? fallback : current;
		},
		formatMoney(num, digits) {
			const n = Number(num);
			if (!Number.isFinite(n)) return (0).toFixed(digits);
			return n.toFixed(digits);
		},
		getCategoryBuyDraft(key, fallback) {
			if (this.buyDraft.hasOwnProperty(key)) {
				return this.buyDraft[key];
			}
			if (this.buyOverride.hasOwnProperty(key)) {
				const n = Number(this.buyOverride[key]);
				return Number.isFinite(n) ? this.formatMoney(n, 2) : "0.00";
			}
			return fallback == null ? "0.00" : String(fallback);
		},
		setCategoryBuyDraft(key, value) {
			this.$set(this.buyDraft, key, value == null ? "" : String(value));
		},
		applyCategoryBuy(key, fallback) {
			const raw = this.buyDraft.hasOwnProperty(key) ? String(this.buyDraft[key]) : "";
			const text = raw.trim();
			if (text === "") {
				this.buyDraft.hasOwnProperty(key) && this.$delete(this.buyDraft, key);
				this.buyOverride.hasOwnProperty(key) && this.$delete(this.buyOverride, key);
				return;
			}
			const n = Number(text);
			if (!Number.isFinite(n)) {
				this.$set(this.buyDraft, key, fallback == null ? "0.00" : String(fallback));
				return;
			}
			this.$set(this.buyOverride, key, n);
			this.$set(this.buyDraft, key, this.formatMoney(n, 2));
		}
	}
};
</script>

<style scoped>
.categorySummary{
	width: 420px;
	margin-left: 12px;
	display: flex;
	flex-direction: column;
}
.categorySummaryTitle{
	height: 38px;
	line-height: 38px;
	text-align: center;
	font-weight: 700;
	border: 1px solid #dcdfe6;
	border-bottom: none;
	background: #fff;
}
.categorySummaryTable{
	flex: 1;
}
.categorySummaryFooter{
	display: flex;
	justify-content: space-between;
	padding: 6px 12px;
	border: 1px solid #dcdfe6;
	border-top: none;
	background: #fff;
	font-size: 12px;
	color: #606266;
}
.buyInput >>> input{
	text-align: center;
	padding: 0 6px;
}
</style>
