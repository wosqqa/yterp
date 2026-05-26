<template>
  <div class="sor bill">
    <el-form
      :model="form"
      :rules="rules"
      ref="form"
      :inline="true"
      :hide-required-asterisk="true"
      style="height: 100%"
    >
      <el-form-item label="客户" prop="customer">
        <template slot="label">
          <span @click="switchPage('customer')">客户</span>
        </template>
        <nodList
          v-model="form.customer"
          placeholder="请选择客户"
          action="service/customerRecord"
          scene="customer"
          @change="customerChange"
        ></nodList>
      </el-form-item>
      <el-form-item label="单据日期" prop="time">
        <el-date-picker
          v-model="form.time"
          value-format="yyyy-MM-dd"
          type="date"
          placeholder="请选择单据日期"
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="单据编号" prop="number">
        <el-input
          placeholder="请输入单据编号"
          v-model="form.number"
          clearable
        >
          <template slot="append" v-if="form.id != 0 && $lib.getUserRoot(store.root, 'sor', 'add')">
            <el-button icon="el-icon-document-copy" @click="copyAsNew"></el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-divider class="fistDivider"></el-divider>
      <ag-grid-vue
        :class="['ag-theme-balham', picVisible ? 'ag-pic-mode' : '']"
        :context="grid.context"
        :defaultColDef="grid.coldef"
        :gridOptions="grid.options"
        :columnDefs="grid.column"
        :getRowNodeId="grid.getRowNodeId"
        :frameworkComponents="grid.components"
        :tabToNextCell="$grid.gridTabToNextCell"
        @setter="goods.dialog = true"
        @schemeChange="schemeChange"
        @quickEnter="quickEnter"
        style="height: calc(100% - 256px)"
        v-madeAgGrid
      ></ag-grid-vue>
      <Status :config="grid.status" :source="info">
        <img
          v-if="form.examine == 1"
          class="billExamine"
          :src="
            form.state == 3
              ? '/static/images/lib/close.png'
              : '/static/images/lib/examine.png'
          "
        />
      </Status>
      <el-divider></el-divider>
      <LineFeed tag=".el-form-item" :rule="3">
        <el-form-item label="单据金额">
          <el-input
            placeholder="请输入单据金额"
            v-model="form.total"
            :disabled="true"
          ></el-input>
        </el-form-item>
        <el-form-item label="实际金额" prop="actual">
          <el-input
            placeholder="请输入实际金额"
            v-model="form.actual"
            clearable
          >
            <template slot="suffix">
              <i
                class="el-icon-copy-document"
                @click="form.actual = form.total"
              ></i>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="关联人员">
          <nodList
            v-model="form.people"
            placeholder="请选择关联人员"
            action="service/peopleRecord"
            scene="people"
          ></nodList>
        </el-form-item>
        <el-form-item label="到货日期" prop="arrival">
          <el-date-picker
            v-model="form.arrival"
            value-format="yyyy-MM-dd"
            type="date"
            placeholder="请选择单据日期"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="物流信息">
          <Logistics v-model="form.logistics" :more="customer.more"></Logistics>
        </el-form-item>
        <el-form-item label="单据附件">
          <NodUpload
            v-model="form.file"
            :action="$base.web + 'sor/upload'"
          ></NodUpload>
        </el-form-item>
        <FieldForm
          style="display: initial"
          v-model="form.more"
          rule="sor"
          prefix="more."
        ></FieldForm>
        <el-form-item label="备注信息">
          <el-input
            placeholder="请输入备注信息"
            v-model="form.data"
            clearable
          ></el-input>
        </el-form-item>
      </LineFeed>
    </el-form>
    <div class="layerBtn">
      <el-button-group>
        <template
          v-if="
            form.id == 0 ||
            (form.examine == 0 && $lib.getUserRoot(store.root, 'sor', 'edit'))
          "
        >
          <el-button type="info" @click="goodsViewOpen">视图</el-button>
          <el-button type="info" @click="save">保存</el-button>
        </template>
        <el-button type="info" @click="togglePics">{{
          picVisible ? "隐藏图片" : "图片"
        }}</el-button>
        <template v-if="form.id != 0">
          <template
            v-if="form.examine == 1 && (form.state == 0 || form.state == 1)"
          >
            <el-popover
              class="btnGroupPopover"
              type="left"
              popper-class="blockPopover"
              trigger="click"
            >
              <el-button type="info" slot="reference">生成</el-button>
              <ul>
                <li
                  v-if="$lib.getUserRoot(store.root, 'sell', 'add')"
                  @click="buildSell"
                >
                  销售单
                </li>
                <li
                  v-if="$lib.getUserRoot(store.root, 'bor', 'add')"
                  @click="buildBor"
                >
                  采购订单
                </li>
              </ul>
            </el-popover>
          </template>
          <template v-if="$lib.getUserRoot(store.root, 'sor', 'examine')">
            <template v-if="form.state != 3">
              <el-button type="info" @click="examine">{{
                form.examine == 0 ? "审核" : "反审核"
              }}</el-button>
            </template>
            <template
              v-if="form.examine == 1 && (form.state == 1 || form.state == 3)"
            >
              <el-button type="info" @click="update">{{
                form.state == 1 ? "关闭" : "开启"
              }}</el-button>
            </template>
          </template>
        </template>
        <template v-if="source == null">
          <el-button type="info" @click="reload">刷新</el-button>
        </template>
      </el-button-group>
    </div>
    <GoodsList
      v-if="goods.dialog"
      @destroy="goodsDestroy"
      :parm="goods.parm"
      @choice="pushGrid"
    ></GoodsList>
    <GoodsView
      v-if="goods.viewDialog"
      @destroy="goodsViewDestroy"
      :parm="goods.parm"
      :value="goodsViewValue"
      @input="goodsViewInput"
    ></GoodsView>
  </div>
</template>
<script>
import { AgGridVue } from "ag-grid-vue";
import Dispose from "@/components/ag-grid/Dispose";
import Scheme from "@/components/ag-grid/Scheme";
import Storeroom from "@/components/ag-grid/Storeroom";
import Allowance from "@/components/ag-grid/Allowance";
import TaxRate from "@/components/ag-grid/TaxRate";
import Setter from "@/components/ag-grid/Setter";
import QuickInput from "@/components/ag-grid/QuickInput";
import Company from "@/components/ag-grid/Company";
import Depot from "@/components/ag-grid/Depot";
import Storehouse from "@/components/ag-grid/Storehouse";
import Price from "@/components/ag-grid/Price";
import Status from "@/components/ag-grid/Status";
import LineFeed from "@/components/lib/LineFeed";
import NodList from "@/components/lib/NodList";
import NodUpload from "@/components/lib/NodUpload";
import Logistics from "@/components/lib/Logistics";
import FieldForm from "@/components/lib/FieldForm";
import GoodsList from "@/components/dialog/GoodsList";
import GoodsView from "@/components/dialog/GoodsView";

export default {
  name: "Sor",
  components: {
    AgGridVue,
    Status,
    LineFeed,
    NodList,
    NodUpload,
    Logistics,
    FieldForm,
    GoodsList,
    GoodsView,
  },
  props: {
    source: {
      default: null,
    },
  },
  data() {
    return {
      form: {
        id: 0,
        customer: null,
        time: "",
        number: "",
        total: 0,
        actual: "",
        people: null,
        arrival: "",
        logistics: { key: "auto", name: "自动识别", number: "" },
        file: [],
        data: "",
        examine: 0,
        state: 0,
        more: {},
      },
      rules: {
        customer: {
          required: true,
          message: "请选择客户",
          trigger: "change",
        },
        time: {
          required: true,
          message: "请选择单据日期",
          trigger: "change",
        },
        number: {
          required: true,
          message: "请输入单据编号",
          trigger: "blur",
        },
        actual: [
          {
            required: true,
            message: "请输入实际金额",
            trigger: "blur",
          },
          {
            validator: (rule, value, callback) => {
              this.$lib.synValidate("money", value)
                ? callback()
                : callback(new Error("实际金额不正确"));
            },
            trigger: "blur",
          },
        ],
      },
      customer: {
        grade: "",
        more: [],
      },
      info: [],
      grid: {
        options: {
          onGridReady: () => {
            this.$grid.addGridRow(this.grid.options);
          },
          getRowHeight: (params) => {
            return params.context.isPicVisible() ? 60 : 32;
          },
          onCellEditingStopped: (grid) => {
            grid.context.runHandleGrid();
          },
        },
        context: {
          row: { uniqid: this.$lib.getUniqid(), key: null },
          runHandleGrid: () => {
            if (this.grid.options.api == null) {
              return false;
            } else {
              this.handleGrid();
            }
          },
          isPicVisible: () => {
            return this.picVisible;
          },
        },
        coldef: {
          suppressMenu: false,
          resizable: true,
          singleClickEdit: true,
          suppressMovable: true,
        },
        components: {
          dispose: Dispose,
          scheme: Scheme,
          storeroom: Storeroom,
          allowance: Allowance,
          taxRate: TaxRate,
          setter: Setter,
          quickInput: QuickInput,
          company: Company,
          depot: Depot,
          storehouse: Storehouse,
          price: Price,
        },
        getRowNodeId(row) {
          return row.uniqid;
        },
        column: [
          {
            headerName: "序号",
            width: 50,
            field: "sequence",
            headerComponent: "dispose",
            headerComponentParams: { dispose: { key: "sor" } },
            valueGetter: (params) => params.node.rowIndex + 1,
            hide: false,
            dispose: false,
          },
          {
            headerName: "操作",
            width: 50,
            field: "setter",
            cellRenderer: "setter",
            hide: false,
            dispose: false,
          },
          {
            headerName: "图片",
            width: 70,
            field: "imgs",
            hide: true,
            dispose: false,
            cellRenderer: (params) => {
              const url = this.getImgUrl(params.data);
              if (!url) return "";
              return (
                '<div style="width:100%;display:flex;align-items:center;justify-content:center;">' +
                '<img src="' +
                url +
                '" style="width:54px;height:54px;object-fit:contain;" />' +
                "</div>"
              );
            },
          },
          {
            headerName: "商品名称",
            width: 150,
            field: "name",
            headerComponent: "scheme",
            headerComponentParams: { dispose: { title: "商品名称" } },
            editable: true,
            cellEditor: "quickInput",
            hide: false,
            dispose: true,
          },
          {
            headerName: "商品编号",
            width: 120,
            field: "number",
            hide: false,
            dispose: true,
          },
          {
            headerName: "规格型号",
            width: 120,
            field: "spec",
            hide: false,
            dispose: true,
          },
          {
            headerName: "辅助属性",
            width: 120,
            field: "attr",
            hide: false,
            dispose: true,
          },
          {
            headerName: "单位",
            width: 120,
            field: "unit",
            editable: true,
            cellEditor: "company",
            hide: false,
            dispose: true,
          },
          {
            headerName: "仓库",
            width: 120,
            field: "warehouse",
            headerComponent: "storeroom",
            headerComponentParams: {
              dispose: { title: "仓库", key: "warehouseId", text: "warehouse" },
            },
            cellRenderer: "depot",
            cellRendererParams: {
              dispose: { key: "warehouseId", text: "warehouse" },
            },
            editable: true,
            cellEditor: "storehouse",
            cellEditorParams: {
              dispose: { key: "warehouseId", text: "warehouse" },
            },
            hide: false,
            dispose: true,
          },
          {
            headerName: "库存",
            width: 90,
            field: "stock",
            hide: false,
            dispose: false,
          },
          {
            headerName: "单价",
            width: 90,
            field: "price",
            headerComponent: "allowance",
            headerComponentParams: {
              dispose: { title: "单价", key: "priceDelta" },
            },
            editable: true,
            cellEditor: "price",
            cellEditorParams: {
              dispose: {
                model: "sor",
                source: () => {
                  return this.form.customer;
                },
              },
            },
            hide: false,
            dispose: true,
          },
          {
            headerName: "数量",
            width: 90,
            field: "nums",
            headerComponent: "allowance",
            headerComponentParams: {
              dispose: { title: "数量", key: "numsDelta" },
            },
            editable: true,
            hide: false,
            dispose: true,
          },
          {
            headerName: "出库数量",
            width: 90,
            field: "handle",
            hide: true,
            dispose: false,
          },
          {
            headerName: "折扣率(%)",
            width: 90,
            field: "discount",
            headerComponent: "allowance",
            headerComponentParams: {
              dispose: { title: "折扣率(%)", key: "discount" },
            },
            editable: true,
            hide: true,
            dispose: true,
          },
          {
            headerName: "折扣额",
            width: 90,
            field: "dsc",
            headerComponent: "allowance",
            headerComponentParams: {
              dispose: { title: "折扣额", key: "dsc" },
            },
            hide: true,
            dispose: true,
          },
          {
            headerName: "金额",
            width: 120,
            field: "total",
            hide: false,
            dispose: true,
          },
          {
            headerName: "税率(%)",
            width: 90,
            field: "tax",
            headerComponent: "taxRate",
            headerComponentParams: {
              dispose: { title: "税率(%)", key: "tax" },
            },
            editable: true,
            hide: true,
            dispose: false,
          },
          {
            headerName: "税额",
            width: 90,
            field: "tat",
            hide: true,
            dispose: false,
          },
          {
            headerName: "价税合计",
            width: 120,
            field: "tpt",
            hide: true,
            dispose: false,
          },
          {
            headerName: "备注信息",
            width: 120,
            field: "data",
            editable: true,
            hide: false,
            dispose: true,
          },
        ],
        status: [
          { text: "总条数", type: "count" },
          { text: "总合计", type: "sum", key: "tpt" },
        ],
      },
      scan: false,
      goods: {
        dialog: false,
        viewDialog: false,
        parm: {},
      },
      goodsViewValue: [],
      goodsViewSyncingFromView: false,
      goodsViewSyncingFromGrid: false,
      picVisible: false,
    };
  },
  computed: {
    //读取数据中心
    store() {
      return this.$store.state;
    },
  },
  created() {
    this.init();
  },
  methods: {
    goodsViewInput(val) {
      this.goodsViewValue = Array.isArray(val) ? val : [];
      this.goodsViewSyncingFromView = true;
      this.syncGridFromGoodsView(this.goodsViewValue);
      this.$nextTick(() => {
        this.goodsViewSyncingFromView = false;
      });
    },
    goodsViewChoice() {
      this.goods.viewDialog = false;
      this.goods.parm = {};
    },
    buildGridRowFromGoods(item) {
      const goods = item || {};
      const priceType = "sell";
      const unitData = Array.isArray(goods.units) ? goods.units : [];
      const unitVal = goods.unit == null ? "" : goods.unit;
      const row = {
        uniqid: this.$lib.getUniqid(),
        key: goods.id,
        goodsType: goods.type,
        imgs: goods.imgs,
        unitData,
        unitRelation: {
          valence: goods[priceType],
          multiple: 1,
        },
        warehouseId: null,
        name: goods.name,
        number: goods.number,
        spec: goods.spec,
        attr: "",
        unit: unitVal == "-1" ? "点击选择" : unitVal,
        warehouse: goods.type == 0 ? "点击选择" : "",
        stock: "",
        price: goods[priceType] == null || goods[priceType] === "" ? 0 : goods[priceType],
        nums: item.nums == null || item.nums === "" ? 1 : item.nums,
        handle: 0,
        discount: this.$lib.gradeDiscount(this.customer.grade, goods.strategy),
        dsc: 0,
        total: null,
        tax: this.store.sys.fun.rate,
        tat: null,
        tpt: null,
        data: "",
      };
      return row;
    },
    syncGridFromGoodsView(selection) {
      const api = this.grid.options.api;
      if (!api) return;

      const list = Array.isArray(selection) ? selection : [];
      const current = this.$grid.getGridData(this.grid.options).filter((r) => r && r.key != null);
      const currentLineMap = {};
      current.forEach((row) => {
        const lineId = row && row.uniqid != null ? String(row.uniqid) : "";
        if (!lineId) return;
        currentLineMap[lineId] = row;
      });

      const next = [];
      list.forEach((item, idx) => {
        if (!item) return;
        const id = Number(item.id);
        if (!id) return;
        const nums = item.nums == null || item.nums === "" ? 1 : Number(item.nums);
        const lineIdRaw = item.lineId != null ? String(item.lineId) : "";
        const lineId = lineIdRaw ? lineIdRaw : String(id) + "-" + String(idx);
        const exist = currentLineMap[lineId];
        if (exist) {
          exist.nums = nums;
          next.push(exist);
        } else {
          const row = this.buildGridRowFromGoods(item);
          row.uniqid = lineId;
          row.nums = nums;
          next.push(row);
        }
      });

      api.setRowData(next);
      this.$grid.addGridRow(this.grid.options);
      this.handleGrid();
    },
    getGoodsViewSelected() {
      const api = this.grid.options.api;
      if (!api) return [];
      const rows = [];
      api.forEachNode((node) => {
        if (!node || !node.data) return;
        if (node.data.key == null) return;
        rows.push(node.data);
      });
      return rows.map((r) => {
        const unitData = Array.isArray(r.unitData) ? r.unitData : [];
        return {
          lineId: r.uniqid,
          id: r.key,
          name: r.name,
          number: r.number,
          spec: r.spec,
          type: r.goodsType,
          unit: unitData.length > 0 ? "-1" : r.unit,
          units: unitData,
          imgs: r.imgs,
          sell: r.price,
          strategy: [],
          nums: r.nums == null || r.nums === "" ? 1 : r.nums,
        };
      });
    },
    togglePics() {
      this.picVisible = !this.picVisible;
      const api = this.grid.options.api;
      const colApi = this.grid.options.columnApi;
      if (!api || !colApi) return;
      colApi.setColumnVisible("imgs", this.picVisible);
      api.resetRowHeights && api.resetRowHeights();
      api.sizeColumnsToFit && api.sizeColumnsToFit();
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
    goodsViewOpen() {
      this.goods.viewDialog = true;
      this.goodsViewValue = this.getGoodsViewSelected();
      this.goods.parm = {};
    },
    //初始化
    init() {
      if (this.source == null) {
        this.form.time = this.$moment().format("YYYY-MM-DD");
        this.form.number = "XSDD" + this.$moment().format("YYMMDDHHmmssS");
      } else {
        this.$axios.post("sor/get", { parm: this.source }).then((result) => {
          if (result.state == "success") {
            this.form = result.info.class;
            this.pushGrid(result.info.info, false);
          } else if (result.state == "error") {
            this.$message({
              type: "warning",
              message: result.info,
            });
          } else {
            this.$message({
              type: "error",
              message: "[ ERROR ] 服务器响应超时!",
            });
          }
        });
      }
    },
    //保存单据
    save() {
      let form = this.$refs["form"];
      this.$lib
        .aloneValidate(form, ["customer", "time", "number"])
        .then(() => {
          let effect = this.handleGrid();
          if (effect == true) {
            if (this.info.length == 0) {
              this.$message({
                type: "warning",
                message: "商品信息不可为空!",
              });
            } else {
              this.$lib
                .aloneValidate(form, ["actual"])
                .then(() => {
                  if (this.form.actual - 0 > this.form.total - 0) {
                    this.$message({
                      type: "warning",
                      message: "实际金额不可大于单据金额!",
                    });
                  } else {
                    //二次验证|兼容扩展验证
                    form.validate((valid) => {
                      if (valid) {
                        this.$axios
                          .post("sor/save", {
                            class: this.form,
                            info: this.info,
                          })
                          .then((result) => {
                            if (result.state == "success") {
                              if (
                                this.store.sys.fun.examine &&
                                this.form.id == 0
                              ) {
                                this.form.id = result.info;
                                this.$message({
                                  type: "success",
                                  message: "审核单据中...",
                                });
                                setTimeout(() => {
                                  this.examine();
                                }, 996);
                              } else {
                                this.form.id = result.info;
                                this.$message({
                                  type: "success",
                                  message: "单据保存成功!",
                                });
                              }
                            } else if (result.state == "error") {
                              this.$message({
                                type: "warning",
                                message: result.info,
                              });
                            } else {
                              this.$message({
                                type: "error",
                                message: "[ ERROR ] 服务器响应超时!",
                              });
                            }
                          });
                      } else {
                        this.$message({
                          type: "warning",
                          message: "表单验证错误,请检查并修正!",
                        });
                      }
                    });
                  }
                })
                .catch((message) => {
                  this.$message({
                    type: "warning",
                    message: message,
                  });
                });
            }
          } else {
            this.$message({ type: "warning", message: effect });
          }
        })
        .catch((message) => {
          this.$message({
            type: "warning",
            message: message,
          });
        });
    },
    //审核|反审核
    examine() {
      this.$axios
        .post("sor/examine", {
          parm: [this.form.id],
        })
        .then((result) => {
          if (result.state == "success") {
            this.form.examine = this.form.examine == 0 ? 1 : 0;
            this.$message({
              type: "success",
              message:
                (this.form.examine == 0 ? "反审核" : "审核") + "单据成功!",
            });
          } else if (result.state == "error") {
            this.$message({
              type: "warning",
              message: result.info,
            });
          } else {
            this.$message({
              type: "error",
              message: "[ ERROR ] 服务器响应超时!",
            });
          }
        });
    },
    copyAsNew() {
      const form = this.$refs["form"];
      const api = this.grid && this.grid.options ? this.grid.options.api : null;
      api && api.stopEditing && api.stopEditing();
      this.$lib
        .aloneValidate(form, ["customer", "time"])
        .then(() => {
          const effect = this.handleGrid();
          if (effect !== true) {
            this.$message({ type: "warning", message: effect });
            return;
          }
          if (this.info.length === 0) {
            this.$message({ type: "warning", message: "商品信息不可为空!" });
            return;
          }
          this.$lib
            .aloneValidate(form, ["actual"])
            .then(() => {
              if (this.form.actual - 0 > this.form.total - 0) {
                this.$message({ type: "warning", message: "实际金额不可大于单据金额!" });
                return;
              }
              form.validate((valid) => {
                if (!valid) {
                  this.$message({ type: "warning", message: "表单验证错误,请检查并修正!" });
                  return;
                }

                const nextNumber = "XSDD" + this.$moment().format("YYMMDDHHmmssS");
                const classCopy = this.$lib.extend(true, {}, this.form);
                classCopy.id = 0;
                classCopy.examine = 0;
                classCopy.state = 0;
                classCopy.number = nextNumber;
                classCopy.time = classCopy.time || this.$moment().format("YYYY-MM-DD");

                [
                  "frameData",
                  "customerData",
                  "peopleData",
                  "userData",
                  "recordData",
                  "relation",
                  "extension",
                ].forEach((k) => {
                  classCopy[k] != null && delete classCopy[k];
                });

                const infoCopy = (this.info || []).map((it) => Object.assign({}, it));

                this.$axios
                  .post("sor/save", {
                    class: classCopy,
                    info: infoCopy,
                  })
                  .then((result) => {
                    if (result.state == "success") {
                      const newId = result.info;
                      this.$set(this, "form", Object.assign({}, classCopy, { id: newId }));
                      this.$message({
                        type: "success",
                        message: "复制成功,新单编号: " + nextNumber,
                      });
                      if (this.store.sys.fun.examine) {
                        this.$message({ type: "success", message: "审核单据中..." });
                        setTimeout(() => {
                          this.examine();
                        }, 996);
                      }
                    } else if (result.state == "error") {
                      this.$message({ type: "warning", message: result.info });
                    } else {
                      this.$message({ type: "error", message: "[ ERROR ] 服务器响应超时!" });
                    }
                  });
              });
            })
            .catch((message) => {
              this.$message({ type: "warning", message: message });
            });
        })
        .catch((message) => {
          this.$message({ type: "warning", message: message });
        });
    },
    //开启|关闭
    update() {
      this.$axios
        .post("sor/update", {
          id: this.form.id,
        })
        .then((result) => {
          if (result.state == "success") {
            this.form.state = this.form.state == 1 ? 3 : 1;
            this.$message({
              type: "success",
              message: (this.form.state == 1 ? "开启" : "关闭") + "单据成功!",
            });
          } else if (result.state == "error") {
            this.$message({
              type: "warning",
              message: result.info,
            });
          } else {
            this.$message({
              type: "error",
              message: "[ ERROR ] 服务器响应超时!",
            });
          }
        });
    },
    //生成销售单
    buildSell() {
      //请求单据数据
      this.$axios
        .post("sor/buildSell", {
          id: this.form.id,
        })
        .then((result) => {
          if (result.state == "success") {
            this.$emit("destroy"); //关闭弹层
            this.$bus.emit("switchPage", "sell", true); //切换页面
            //等待页面切换完成
            setTimeout(() => {
              this.$bus.emit("buildSell", result.info); //生成单据
            }, 600);
          } else if (result.state == "warning") {
            this.$message({
              type: "warning",
              message: result.info,
            });
          } else if (result.state == "error") {
            this.$message({
              type: "warning",
              message: result.info,
            });
          } else {
            this.$message({
              type: "error",
              message: "[ ERROR ] 服务器响应超时!",
            });
          }
        });
    },
    //生成采购订单
    buildBor() {
      //请求单据数据
      this.$axios
        .post("sor/buildBor", {
          id: this.form.id,
        })
        .then((result) => {
          if (result.state == "success") {
            this.$emit("destroy"); //关闭弹层
            this.$bus.emit("switchPage", "bor", true); //切换页面
            //等待页面切换完成
            setTimeout(() => {
              this.$bus.emit("buildBor", result.info); //生成单据
            }, 600);
          } else if (result.state == "warning") {
            this.$message({
              type: "warning",
              message: result.info,
            });
          } else if (result.state == "error") {
            this.$message({
              type: "warning",
              message: result.info,
            });
          } else {
            this.$message({
              type: "error",
              message: "[ ERROR ] 服务器响应超时!",
            });
          }
        });
    },
    //客户改变[客户等级|物流信息]
    customerChange(parm) {
      this.customer.grade = "";
      this.customer.more = [];
      if (parm) {
        //客户等级
        this.customer.grade = parm.grade;
        //人员信息
        let contacts = [];
        try {
          contacts =
            typeof parm.contacts == "string"
              ? JSON.parse(parm.contacts)
              : Array.isArray(parm.contacts)
              ? parm.contacts
              : [];
        } catch (e) {
          contacts = [];
        }
        if (contacts.length > 0) {
          let contact = contacts.find((item) => item.main);
          if (contact) {
            this.customer.more.push("姓名：" + contact.name);
            this.customer.more.push("电话：" + contact.tel);
            this.customer.more.push("地址：" + contact.add);
          }
        }
      }
    },
    //录入模式切换
    schemeChange(state) {
      this.scan = state;
      this.$grid.startEditingLastCell(this.grid.options, "name");
    },
    //快捷录入数据
    quickEnter(val, rowIndex) {
      let api = this.grid.options.api;
      if (!this.$lib.validate("empty", val)) {
        let parm = this.scan ? { code: val } : { mate: val };
        let condition = Object.assign({ page: 1, limit: 1 }, parm);
        this.$axios.post("service/goodsRecord", condition).then((result) => {
          if (result.state == "success") {
            if (result.count == 0) {
              api.startEditingCell({
                rowIndex: rowIndex,
                colKey: "name",
              });
              this.$message({
                type: "warning",
                message: "未匹配到商品数据!",
              });
            } else if (result.count == 1) {
              let source = result.info[0];
              //匹配辅助属性数量
              if (source.attr.length > 1) {
                this.goods.parm = parm;
                this.goods.dialog = true;
              } else {
                if (source.attr.length == 0) {
                  source.attr = "";
                  source.nums = 1;
                } else {
                  let attr = source.attr[0];
                  source = Object.assign({}, source, {
                    attr: attr.name,
                    buy: attr.buy,
                    sell: attr.sell,
                    retail: attr.retail,
                    code: attr.code,
                    nums: 1,
                  });
                }
                this.pushGrid([source]);
                this.scan &&
                  api.startEditingCell({
                    rowIndex: rowIndex + 1,
                    colKey: "name",
                  });
              }
            } else {
              this.goods.parm = parm;
              this.goods.dialog = true;
            }
          } else if (result.state == "error") {
            this.$message({
              type: "warning",
              message: result.info,
            });
          } else {
            this.$message({
              type: "error",
              message: "[ ERROR ] 服务器响应超时!",
            });
          }
        });
      }
    },
    //添加商品数据
    //scene:[true:常规场景|false:详情场景]
    pushGrid(items, scene = true) {
      let arr = [];
      let priceType = "sell";
      for (let item of items) {
        let goods = scene ? item : item.goodsData;
        let row = {
          uniqid: this.$lib.getUniqid(),
          key: goods.id,
          goodsType: goods.type,
          imgs: goods.imgs,
          unitData: Array.isArray(goods.units) ? goods.units : [],
          unitRelation: {
            valence: goods[priceType],
            multiple: scene ? 1 : null,
          },
          warehouseId: scene ? null : item.warehouse,
          name: goods.name,
          number: goods.number,
          spec: goods.spec,
          attr: item.attr,
          unit: scene
            ? goods.unit == "-1"
              ? "点击选择"
              : goods.unit
            : item.unit,
          warehouse: scene
            ? goods.type == 0
              ? "点击选择"
              : ""
            : this.$lib.objectSeek(item, "warehouseData|name"),
          price: scene ? (goods[priceType] == null || goods[priceType] === "" ? 0 : goods[priceType]) : item.price,
          nums: item.nums == null || item.nums === "" ? 1 : item.nums,
          handle: scene ? 0 : item.handle,
          discount: scene
            ? this.$lib.gradeDiscount(this.customer.grade, item.strategy)
            : item.discount,
          dsc: scene ? 0 : item.dsc,
          total: scene ? null : item.total,
          tax: scene ? this.store.sys.fun.rate : item.tax,
          tat: scene ? null : item.tat,
          tpt: scene ? null : item.tpt,
          data: scene ? "" : item.data,
        };
        //数据处理
        if (scene) {
          //价格计算
          let money = this.$calc
            .chain(row.price)
            .multiply(row.nums)
            .round(this.store.sys.fun.digit.money)
            .done();
          row.dsc = this.$calc
            .chain(money)
            .divide(100)
            .multiply(row.discount)
            .round(this.store.sys.fun.digit.money)
            .done();
          row.total = this.$calc.chain(money).subtract(row.dsc).done();
          row.tat = this.$calc
            .chain(row.total)
            .divide(100)
            .multiply(row.tax)
            .round(2)
            .done();
          row.tpt = this.$calc.chain(row.total).add(row.tat).done();
        } else {
          //单位关系
          if (row.unitData.length > 0) {
            let unitRelation = this.$lib.unitRelation(
              row.unit,
              row.unitData,
              this
            );
            row.unitRelation.multiple = unitRelation.multiple;
          }
        }
        arr.push(row);
      }
      this.$grid.pushGridData(this.grid.options, arr);
      this.handleGrid();
    },
    //数据表格验证
    handleGrid() {
      let effect = true;
      let data = this.$grid.getGridData(this.grid.options);
      for (var i = 0; i < data.length; i++) {
        if (data[i].key == null) {
          data.splice(i, 1);
        } else {
          if (data[i].unitData.length > 0 && data[i].unit == "点击选择") {
            effect == true &&
              (effect = "商品信息第" + (i + 1) + "行单位不可为空!");
            continue;
          } else if (data[i].goodsType == 0 && data[i].warehouseId == null) {
            effect == true &&
              (effect = "商品信息第" + (i + 1) + "行仓库不可为空!");
            continue;
          } else if (!this.$lib.synValidate("money", data[i].price)) {
            effect == true &&
              (effect = "商品信息第" + (i + 1) + "行单价不正确!");
            continue;
          } else if (!this.$lib.synValidate("nums", data[i].nums)) {
            effect == true &&
              (effect = "商品信息第" + (i + 1) + "行数量不正确!");
            continue;
          } else if (!this.$lib.validate("percentage", data[i].discount)) {
            effect == true &&
              (effect = "商品信息第" + (i + 1) + "行折扣率不正确!");
            continue;
          } else if (!this.$lib.validate("percentage", data[i].tax)) {
            effect == true &&
              (effect = "商品信息第" + (i + 1) + "行税率不正确!");
            continue;
          } else {
            let money = this.$calc
              .chain(data[i].price)
              .multiply(data[i].nums)
              .round(this.store.sys.fun.digit.money)
              .done();
            data[i].dsc = this.$calc
              .chain(money)
              .divide(100)
              .multiply(data[i].discount)
              .round(this.store.sys.fun.digit.money)
              .done();
            data[i].total = this.$calc
              .chain(money)
              .subtract(data[i].dsc)
              .done();
            data[i].tat = this.$calc
              .chain(data[i].total)
              .divide(100)
              .multiply(data[i].tax)
              .round(2)
              .done();
            data[i].tpt = this.$calc
              .chain(data[i].total)
              .add(data[i].tat)
              .done();
            this.grid.options.api.applyTransaction({ update: [data[i]] });
          }
        }
      }
      //场景判断
      if (effect == true) {
        //转存数据
        this.$set(
          this,
          "info",
          data.map((item) => {
            return {
              goods: item.key,
              attr: item.attr,
              unit: item.unit,
              warehouse: item.warehouseId,
              price: item.price,
              nums: item.nums,
              discount: item.discount,
              dsc: item.dsc,
              total: item.total,
              tax: item.tax,
              tat: item.tat,
              tpt: item.tpt,
              data: item.data,
            };
          })
        );
        //汇总信息
        this.summary();
        if (this.goods.viewDialog && !this.goodsViewSyncingFromView) {
          this.goodsViewSyncingFromGrid = true;
          this.goodsViewValue = this.getGoodsViewSelected();
          this.$nextTick(() => {
            this.goodsViewSyncingFromGrid = false;
          });
        }
      }
      return effect;
    },
    //汇总数据
    summary() {
      let total = this.$calc.chain(0);
      this.info.forEach((item) => {
        total.add(item.tpt);
      });
      this.form.total = total.done();
    },
    //商品层关闭
    goodsDestroy() {
      this.goods.dialog = false;
      this.goods.parm = {};
      this.$grid.startEditingLastCell(this.grid.options, "name");
    },
    goodsViewDestroy() {
      this.goods.viewDialog = false;
      this.goods.parm = {};
    },

    //切换页面
    switchPage(key) {
      this.$bus.emit("switchPage", key, true); //切换页面
    },
    //页面刷新
    reload() {
      this.$bus.emit("homeReload", this.$options.name);
      this.$message({
        type: "success",
        message: "页面刷新成功!",
      });
    },
  },
  mounted() {
    this.source && this.grid.options.columnApi.setColumnVisible("handle", true);
    this.store.sys.fun.tax &&
      this.grid.options.columnApi.setColumnsVisible(
        ["tax", "tat", "tpt"],
        true
      );
  },
};
</script>
