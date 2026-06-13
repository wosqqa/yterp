<template>
  <div class="goodsView">
    <el-dialog
      :visible.sync="dialog"
      fullscreen
      :title="title"
      :append-to-body="true"
      :close-on-click-modal="false"
      @closed="close"
      v-madeDialog
    >
      <div class="viewLayout">
        <div class="leftPanel">
          <div class="panelHeader">
            <div class="panelTitle">已选商品</div>
            <div class="panelActions">
              <el-input
                class="batchInput"
                size="mini"
                placeholder="数量"
                v-model="batchNums"
                clearable
              ></el-input>
              <el-button size="mini" type="danger" @click="applyBatchNums">修改</el-button>
              <el-button size="mini" @click="clearSelected">清空</el-button>
            </div>
          </div>
          <div class="panelBody">
            <el-table
              ref="selectedTable"
              :data="selectedList"
              height="calc(100vh - 220px)"
              size="mini"
              border
              v-madeTable
              @selection-change="selectedSelectionChange"
              @row-click="selectedRowClick"
            >
              <el-table-column type="selection" width="44px" align="center"></el-table-column>
              <el-table-column label="图片" width="90px" align="center">
                <template slot-scope="scope">
                  <div class="selectedImg">
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
              <el-table-column label="数量" width="90px" align="center">
                <template slot-scope="scope">
                  <el-input size="mini" v-model="scope.row.nums" @input="numsChange(scope.row)"></el-input>
                </template>
              </el-table-column>
              <el-table-column label="" width="60px" align="center">
                <template slot-scope="scope">
                  <el-button size="mini" type="text" @click="removeSelected(scope.row)">移除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
        <div class="rightPanel">
          <div class="toolbar">
            <el-input
              class="toolbarItem"
              placeholder="名称 | 编号 | 型号"
              v-model="searchFrom.mate"
              clearable
              @keyup.enter.native="record(1)"
            ></el-input>
            <el-input
              ref="comboInput"
              class="toolbarItem"
              placeholder="商品组合"
              v-model="searchFrom.data"
              clearable
              @keyup.enter.native="record(1)"
            ></el-input>
            <nodTree
              class="toolbarItem"
              v-model="searchFrom.category"
              :treeData="store.category"
              placeholder="商品类别"
            ></nodTree>
            <el-button class="toolbarItem" type="primary" @click="record(1)">搜索</el-button>
            <el-button class="toolbarItem" @click="pickAll">一键选择</el-button>
          </div>
          <div class="gridWrap">
            <div class="goodsGrid">
              <div
                v-for="item in tableData"
                :key="item.id"
                class="goodsCard"
              >
                <div class="cardImg" @click.stop="onCardImgClick(item)">
                  <el-image v-if="getImgUrl(item)" :src="getImgUrl(item)" fit="contain">
                    <div slot="error" class="imgError">
                      <i class="el-icon-picture-outline"></i>
                    </div>
                  </el-image>
                  <div v-else class="imgError">
                    <i class="el-icon-picture-outline"></i>
                  </div>
                </div>
                <div class="cardMeta" @click.stop="onCardMetaClick(item)">
                  <span class="metaLeft">{{ item.number }}</span>
                  <span class="metaRight">{{ item.sell }}</span>
                </div>
                <div v-if="isPicked(item.id)" class="pickedMask">已选</div>
              </div>
            </div>
          </div>
          <div class="footerBar">
            <div class="footerLeft">
              <el-pagination
                class="tablePagination"
                :current-page.sync="page.current"
                :total="page.total"
                :page-size.sync="page.size"
                :page-sizes="page.sizes"
                :pager-count="page.count"
                @size-change="record(1)"
                @current-change="record(0)"
                layout="prev,pager,next,jumper,sizes,total"
              >
              </el-pagination>
              <div class="footerStats">已选数量：{{ selectedTotalQty }}</div>
            </div>
            <div class="footerBtns">
              <el-button @click="dialog = false">取消</el-button>
              <el-button type="primary" @click="confirm">确定</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import NodTree from "@/components/lib/NodTree";
export default {
  name: "GoodsView",
  components: {
    NodTree
  },
  props: {
    value: {
      type: Array,
      default: null
    },
    title: {
      type: String,
      default: "商品视图"
    },
    recordAction: {
      type: String,
      default: "service/goodsRecord"
    },
    parm: {
      required: true,
      type: Object
    }
  },
  data() {
    return {
      dialog: true,
      tableData: [],
      page: {
        current: 1,
        total: 0,
        size: 30,
        sizes: [30, 60, 90, 150, 300],
        count: 5
      },
      searchFrom: {
        mate: "",
        data: "",
        category: []
      },
      batchNums: "",
      batchSelected: [],
      selectedLines: [],
      syncing: false,
      lastComboClickAt: 0
    };
  },
  created() {
    const nextSearch = Object.assign({}, this.searchFrom);
    this.parm && this.parm.hasOwnProperty("mate") && (nextSearch.mate = this.parm.mate);
    if (this.parm && this.parm.hasOwnProperty("data")) nextSearch.data = this.parm.data;
    if (this.parm && this.parm.hasOwnProperty("code") && !nextSearch.data) nextSearch.data = this.parm.code;
    if (this.parm && this.parm.hasOwnProperty("category")) {
      const c = this.parm.category;
      if (Array.isArray(c)) {
        nextSearch.category = c;
      } else if (c != null && c !== "") {
        nextSearch.category = [c];
      } else {
        nextSearch.category = [];
      }
    }
    this.searchFrom = nextSearch;

    const selected = Array.isArray(this.value)
      ? this.value
      : (this.parm && (this.parm.selectedList || this.parm.selected)) || [];
    this.initSelected(selected);
    this.record(1);
  },
  watch: {
    value: {
      deep: true,
      handler(next) {
        if (this.syncing) return;
        Array.isArray(next) && this.initSelected(next);
      }
    }
  },
  computed: {
    store() {
      return this.$store.state;
    },
    selectedList() {
      return this.selectedLines;
    },
    selectedTotalQty() {
      let total = this.$calc.chain(0);
      this.selectedList.forEach(item => {
        total.add(Number(item.nums) || 0);
      });
      return total.done();
    }
  },
  methods: {
    onCardImgClick(item) {
      this.pickIncLast(item);
    },
    onCardMetaClick(item) {
      if (Date.now() - Number(this.lastComboClickAt || 0) < 500) return;
      const text = item && item.data != null ? String(item.data).trim() : "";
      if (!text) {
        this.$message && this.$message({ type: "warning", message: "该商品未设置 data 字段!" });
        this.lastComboClickAt = Date.now();
        return;
      }
      this.searchFrom = Object.assign({}, this.searchFrom, { data: text });
      this.lastComboClickAt = Date.now();
      this.$nextTick(() => {
        this.$refs.comboInput && this.$refs.comboInput.focus && this.$refs.comboInput.focus();
      });
      this.recordComboOnly(text);
    },
    normalizeSelectedLine(item, fallbackLineId) {
      const goodsId = Number(item && item.id);
      if (!goodsId) return null;
      const lineIdRaw = item && item.lineId != null ? String(item.lineId) : "";
      const lineId =
        lineIdRaw ||
        (fallbackLineId != null ? String(fallbackLineId) : "") ||
        String(goodsId) + "-" + String(this.$lib.getUniqid());
      return Object.assign({}, item, {
        lineId,
        id: goodsId,
        name: item && item.name ? item.name : "",
        nums: item && item.nums != null && item.nums !== "" ? item.nums : 1,
        attr: ""
      });
    },
    initSelected(list) {
      if (!Array.isArray(list)) return;
      const next = [];
      list.forEach((item, idx) => {
        const normalized = this.normalizeSelectedLine(item, String(Number(item && item.id) || 0) + "-" + String(idx));
        normalized && next.push(normalized);
      });
      this.selectedLines = next;
    },
    emitInput() {
      if (!Array.isArray(this.value)) return;
      this.syncing = true;
      this.$emit("input", this.selectedList);
      this.$nextTick(() => {
        this.syncing = false;
      });
    },
    record(page) {
      page == 0 || (this.page.current = page);
      let parm = Object.assign(
        {
          page: this.page.current,
          limit: this.page.size
        },
        this.searchFrom
      );
      const dataText = this.searchFrom && this.searchFrom.data != null ? String(this.searchFrom.data).trim() : "";
      if (!dataText && this.recordAction && /goodsRecord/i.test(String(this.recordAction))) {
        parm.sort = "numberAsc";
      }
      if (Array.isArray(parm.category) && parm.category.length === 0) {
        delete parm.category;
      }
      this.$axios.post(this.recordAction, parm).then(result => {
        if (result.state == "success") {
          for (let item of result.info) {
            item.nums = "";
            if (item.attr && item.attr.length > 0) {
              for (let attr of item.attr) {
                attr.nums = "";
              }
            }
          }
          const list = Array.isArray(result.info) ? result.info.slice() : [];
          const selectedRoots = Array.isArray(this.searchFrom.category)
            ? this.searchFrom.category
                .map(v => Number(v))
                .filter(v => Number.isFinite(v) && v > 0)
            : [];
          const selectedIndex = {};
          selectedRoots.forEach((id, idx) => (selectedIndex[id] = idx));
          const parentMap = {};
          const walk = (nodes, pid) => {
            if (!Array.isArray(nodes)) return;
            nodes.forEach(n => {
              if (!n) return;
              const id = Number(n.id);
              if (Number.isFinite(id) && id > 0) parentMap[id] = pid;
              const sub = n.sub || n.children;
              Array.isArray(sub) && walk(sub, id);
            });
          };
          walk(this.store && this.store.category ? this.store.category : [], 0);
          const groupIdx = item => {
            if (selectedRoots.length === 0) return 0;
            let cid = Number(item && item.category);
            if (!Number.isFinite(cid) || cid <= 0) return selectedRoots.length + 1;
            let guard = 0;
            while (!selectedIndex.hasOwnProperty(cid) && parentMap.hasOwnProperty(cid) && guard < 30) {
              cid = Number(parentMap[cid]) || 0;
              guard++;
              if (!cid) break;
            }
            return selectedIndex.hasOwnProperty(cid) ? selectedIndex[cid] : selectedRoots.length + 1;
          };
          const sortByNumberOnly = !(this.searchFrom && String(this.searchFrom.data || "").trim());
          const cmp = (a, b) => {
            const na = a && a.number != null ? String(a.number).trim() : "";
            const nb = b && b.number != null ? String(b.number).trim() : "";
            if (sortByNumberOnly) {
              const c2 = na.localeCompare(nb, undefined, { numeric: true, sensitivity: "base" });
              if (c2 !== 0) return c2;
              return (Number(b && b.id) || 0) - (Number(a && a.id) || 0);
            }

            const sa = a && a.data != null ? String(a.data).trim() : "";
            const sb = b && b.data != null ? String(b.data).trim() : "";
            if (!sa && !sb) {
              const c2 = na.localeCompare(nb, undefined, { numeric: true, sensitivity: "base" });
              if (c2 !== 0) return c2;
              return (Number(b && b.id) || 0) - (Number(a && a.id) || 0);
            }
            if (!sa) return 1;
            if (!sb) return -1;
            const c = sa.localeCompare(sb, undefined, { numeric: true, sensitivity: "base" });
            if (c !== 0) return c;
            const gi = groupIdx(a);
            const gj = groupIdx(b);
            if (gi !== gj) return gi - gj;
            const c2 = na.localeCompare(nb, undefined, { numeric: true, sensitivity: "base" });
            if (c2 !== 0) return c2;
            return (Number(b && b.id) || 0) - (Number(a && a.id) || 0);
          };
          list.sort(cmp);
          this.tableData = list;
          this.page.total = result.count;
        } else if (result.state == "error") {
          this.$message({ type: "warning", message: result.info });
        } else {
          this.$message({ type: "error", message: "[ ERROR ] 服务器响应超时!" });
        }
      });
    },
    recordComboOnly(dataText) {
      const text = dataText != null ? String(dataText).trim() : "";
      if (!text) return;
      this.page.current = 1;
      const parm = { page: 1, limit: this.page.size, data: text };
      this.$axios.post(this.recordAction, parm).then(result => {
        if (result.state == "success") {
          for (let item of result.info) {
            item.nums = "";
            if (item.attr && item.attr.length > 0) {
              for (let attr of item.attr) {
                attr.nums = "";
              }
            }
          }
          const list = Array.isArray(result.info) ? result.info.slice() : [];
          list.sort((a, b) => {
            const sa = a && a.data != null ? String(a.data).trim() : "";
            const sb = b && b.data != null ? String(b.data).trim() : "";
            if (!sa && !sb) return (Number(b && b.id) || 0) - (Number(a && a.id) || 0);
            if (!sa) return 1;
            if (!sb) return -1;
            const c = sa.localeCompare(sb, undefined, { numeric: true, sensitivity: "base" });
            if (c !== 0) return c;
            const na = a && a.number != null ? String(a.number).trim() : "";
            const nb = b && b.number != null ? String(b.number).trim() : "";
            const c2 = na.localeCompare(nb, undefined, { numeric: true, sensitivity: "base" });
            if (c2 !== 0) return c2;
            return (Number(b && b.id) || 0) - (Number(a && a.id) || 0);
          });
          this.tableData = list;
          this.page.total = result.count;
        } else if (result.state == "error") {
          this.$message({ type: "warning", message: result.info });
        } else {
          this.$message({ type: "error", message: "[ ERROR ] 服务器响应超时!" });
        }
      });
    },
    findLastIndexByGoodsId(id) {
      const gid = Number(id);
      if (!gid) return -1;
      for (let i = this.selectedLines.length - 1; i >= 0; i--) {
        if (Number(this.selectedLines[i] && this.selectedLines[i].id) === gid) return i;
      }
      return -1;
    },
    pickOnce(item) {
      if (!item || !item.id) return;
      if (this.isPicked(item.id)) return;
      const line = this.normalizeSelectedLine(this.$lib.extend(true, {}, item, { nums: 1, attr: "" }));
      if (!line) return;
      this.selectedLines = this.selectedLines.concat([line]);
      this.emitInput();
    },
    pickIncLast(item) {
      if (!item || !item.id) return;
      const idx = this.findLastIndexByGoodsId(item.id);
      if (idx === -1) {
        this.pickOnce(item);
        return;
      }
      const row = this.selectedLines[idx];
      const next = this.$calc
        .chain(Number(row.nums) || 0)
        .add(1)
        .done();
      row.nums = next;
      this.selectedLines = this.selectedLines.slice();
      this.emitInput();
    },
    pickAll() {
      const list = Array.isArray(this.tableData) ? this.tableData : [];
      if (list.length === 0) {
        this.$message && this.$message({ type: "warning", message: "暂无可选择的商品数据!" });
        return;
      }
      let added = 0;
      list.forEach(item => {
        if (!item || !item.id) return;
        if (this.isPicked(item.id)) return;
        const line = this.normalizeSelectedLine(this.$lib.extend(true, {}, item, { nums: 1, attr: "" }));
        if (!line) return;
        this.selectedLines.push(line);
        added++;
      });
      this.selectedLines = this.selectedLines.slice();
      this.emitInput();
      this.$message && this.$message({ type: "success", message: added > 0 ? `已加入 ${added} 个商品` : "已全部加入" });
    },
    isPicked(id) {
      const gid = Number(id);
      if (!gid) return false;
      return this.selectedLines.some(r => Number(r && r.id) === gid);
    },
    removeSelected(row) {
      const lid = row && row.lineId != null ? String(row.lineId) : "";
      if (!lid) return;
      this.selectedLines = this.selectedLines.filter(r => String(r && r.lineId) !== lid);
      this.emitInput();
    },
    clearSelected() {
      this.selectedLines = [];
      this.emitInput();
      this.$refs.selectedTable && this.$refs.selectedTable.clearSelection();
    },
    selectedSelectionChange(rows) {
      this.batchSelected = Array.isArray(rows) ? rows : [];
    },
    selectedRowClick(row, column, event) {
      if (!row) return;
      const target = event && event.target ? event.target : null;
      if (target && typeof target.closest === "function") {
        if (target.closest(".el-checkbox")) return;
        if (target.closest(".el-input")) return;
        if (target.closest("button")) return;
        if (target.closest("a")) return;
      }
      const selected =
        Array.isArray(this.batchSelected) &&
        this.batchSelected.some(r => String(r && r.lineId) === String(row && row.lineId));
      this.$refs.selectedTable && this.$refs.selectedTable.toggleRowSelection(row, !selected);
    },
    applyBatchNums() {
      const next = Number(this.batchNums);
      if (!Number.isFinite(next) || next <= 0) {
        this.$message && this.$message({ type: "warning", message: "请输入有效数量!" });
        return;
      }
      if (!Array.isArray(this.batchSelected) || this.batchSelected.length === 0) {
        this.$message && this.$message({ type: "warning", message: "请先勾选需要修改的商品!" });
        return;
      }
      this.batchSelected.forEach(row => {
        if (!row) return;
        row.nums = next;
      });
      this.selectedLines = this.selectedLines.slice();
      this.emitInput();
    },
    numsChange(row) {
      if (this.$lib.validate("empty", row.nums)) {
        row.nums = 1;
      }
      this.emitInput();
    },
    confirm() {
      const selection = this.selectedList;
      if (selection.length == 0) {
        this.$message({ type: "warning", message: "您还未选择商品数据!" });
        return;
      }
      this.emitInput();
      this.dialog = false;
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
    close() {
      this.$emit("destroy", true);
    }
  }
};
</script>
<style scoped>
.viewLayout {
  height: calc(100vh - 80px);
  display: flex;
  gap: 10px;
}
.leftPanel {
  width: 320px;
  border-right: 1px solid #ebeef5;
  padding-right: 10px;
  display: flex;
  flex-direction: column;
}
.panelHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
}
.panelTitle {
  font-weight: 600;
}
.panelActions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.batchInput {
  width: 60px;
}
.panelBody {
  flex: 1;
}
.rightPanel {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  padding-bottom: 10px;
}
.toolbarItem {
  width: 220px;
}
.gridWrap {
  flex: 1;
  overflow: auto;
  border-top: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  padding: 10px 0;
}
.goodsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 100px);
  justify-content: start;
  gap: 8px;
  padding-right: 10px;
}
.goodsCard {
  position: relative;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fff;
  width: 100px;
  padding: 6px;
  cursor: pointer;
}
.cardImg {
  width: 100%;
  height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cardImg >>> .el-image {
  width: 100%;
  height: 100%;
}
.imgError {
  width: 100%;
  height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  background: #fafafa;
  border-radius: 4px;
}
.cardMeta {
  margin-top: 4px;
  display: flex;
  justify-content: space-between;
  color: #909399;
  font-size: 12px;
}
.metaRight {
  color: #f56c6c;
}
.pickedMask {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(64, 158, 255, 0.9);
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}
.footerBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
}
.footerLeft {
  display: flex;
  align-items: center;
  gap: 14px;
}
.footerStats {
  color: #606266;
  font-size: 13px;
  white-space: nowrap;
}
.footerBtns {
  display: flex;
  gap: 10px;
}
.selectedImg {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}
.selectedImg >>> .el-image {
  width: 100%;
  height: 100%;
}
.imgErrorMini {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  background: #fafafa;
  border-radius: 4px;
}
</style>
