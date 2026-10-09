<template>
  <div class="sorPublicPage">
    <div v-if="!loaded && !hasOrderId" class="entryForm">
      <div class="entryBox">
        <h2 class="entryTitle">销售订单查询</h2>
        <div class="entryTip">请输入订单ID或订单编号</div>
        <el-input
          v-model="orderIdInput"
          placeholder="订单ID / 订单编号"
          class="entryInput"
          size="large"
          clearable
          @keyup.enter.native="onSubmitOrderId"
        ></el-input>
        <el-button
          type="primary"
          size="large"
          class="entryBtn"
          @click="onSubmitOrderId"
          :loading="loading"
        >查询订单</el-button>
        <div v-if="loadError" class="entryError">{{ loadError }}</div>
      </div>
    </div>

    <div v-else>
      <div v-if="loadError" class="errorBar">
        <i class="el-icon-warning"></i>
        <span>{{ loadError }}</span>
        <el-button size="mini" type="primary" @click="backToEntry">重新输入</el-button>
      </div>
      <div v-else-if="loading" class="loadingBar">
        <i class="el-icon-loading"></i>
        <span>订单数据加载中...</span>
      </div>

      <div v-if="loaded && !loadError">
        <div class="floatTools">
          <el-button size="mini" class="publicUiHide" @click="toggleImgQty">{{ imgQtyHidden ? "显示数量" : "隐藏数量" }}</el-button>
          <el-button size="mini" class="publicUiHide" @click="toggleUnitPrice">{{ unitPriceHidden ? "显示单价" : "隐藏单价" }}</el-button>
          <el-button size="mini" class="publicUiHide" @click="toggleHideWarehouse2">{{ hideWarehouse2 ? "显示仓库" : "隐藏仓库" }}</el-button>
          <el-button size="mini" class="publicUiHide" @click="toggleRowDisplay">{{ rowDisplay === "single" ? "合并显示" : "单列显示" }}</el-button>
          <el-button size="mini" @click="backToEntry">重新查询</el-button>
        </div>
        <div class="previewWorkbench" :class="{ metricsMode: showMetrics, hideAmountsMode: hideAmounts }">
          <div class="switchBar">
            <el-button-group :class="{ publicUiHide: !showCategoryTab }">
              <el-button size="mini" :type="groupBy === 'category' ? 'primary' : 'info'" @click="setGroupBy('category')"
                >产品分类</el-button
              >
              <el-button size="mini" :type="groupBy === 'warehouse' ? 'primary' : 'info'" @click="setGroupBy('warehouse')"
                >仓库分类</el-button
              >
              <el-button size="mini" :type="groupBy === 'pack' ? 'primary' : 'info'" @click="setGroupBy('pack')"
                >装箱分类</el-button
              >
              <el-button size="mini" :type="groupBy === 'combo' ? 'primary' : 'info'" @click="setGroupBy('combo')"
                >组合分类</el-button
              >
            </el-button-group>
            <el-button-group class="publicUiHide">
              <el-button size="mini" :type="headerMode === 'invoice' ? 'primary' : 'info'" @click="enterInvoice"
                >商业发票</el-button
              >
            </el-button-group>
            <el-button-group>
              <el-button size="mini" type="success" @click="exportXlsx">导出XLSX</el-button>
              <el-button size="mini" type="primary" @click="openPdfPreview">PDF预览</el-button>
            </el-button-group>
          </div>
          <div class="paper" :class="{ comboMode: groupBy === 'combo', invoiceMode: headerMode === 'invoice', metricsMode: showMetrics, hideAmountsMode: hideAmounts }">
            <div v-if="headerMode !== 'invoice'" class="header" :class="{ publicUiHide: onlyThreeCols }">
              <div class="headerLeft">
                <div class="brandRow">
                  <div class="brand">{{ sellerCompanyEn }}</div>
                  <div class="title">CUSTOMER ORDER</div>
                  <div class="cnTitle">{{ sellerCompanyCn }}</div>
                </div>
                <div class="line">
                  ADD：{{ sellerAddressEn }}
                </div>
                <div class="line">EMAIL：{{ sellerEmail }}</div>
                <div class="line red">MOB & WhatsApp：{{ sellerMobLine }}</div>
              </div>
              <div class="headerRight">
                <div class="qrGroup">
                  <div class="qrBox">
                    <div v-if="sellerWechatQr" class="qrImgBox">
                      <img class="qrImg" :src="sellerWechatQr" alt="WeChat">
                    </div>
                    <div v-else class="qr qrPlaceholder"></div>
                    <div class="qrLabel">WeChat</div>
                  </div>
                  <div class="qrBox">
                    <div v-if="sellerWhatsappQr" class="qrImgBox">
                      <img class="qrImg" :src="sellerWhatsappQr" alt="WhatsApp">
                    </div>
                    <div v-else class="qr qrPlaceholder"></div>
                    <div class="qrLabel">WhatsApp</div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="headerMode === 'invoice'" class="invoiceHeader" :class="{ publicUiHide: onlyThreeCols }">
                <div class="invoiceGrid">
                <div class="invoiceCell invoiceSellerCell">
                  <div class="invoiceLabel">Seller</div>
                  <div class="invoicePrintText" style="display:block;white-space:pre-wrap;">{{ invoiceSeller }}</div>
                </div>
                <div class="invoiceCell invoiceTitleCell">
                  <div class="invoiceTitle">COMMERCIAL INVOICE</div>
                </div>
                <div class="invoiceCell invoiceToCell">
                  <div class="invoiceLabel">To</div>
                  <div class="invoicePrintText" style="display:block;white-space:pre-wrap;">{{ invoiceTo }}</div>
                </div>
                <div class="invoiceCell invoiceNoteCell">Including freight within China</div>
                <div class="invoiceCell invoiceNoDateCell">
                  <div class="invoiceNoDateRow">
                    <div class="invoiceNoDateItem">
                      <span class="invoiceMetaLabel">No.:</span>
                      <span class="invoiceMetaVal">{{ classData.number }}</span>
                    </div>
                    <div class="invoiceNoDateItem">
                      <span class="invoiceMetaLabel">Date:</span>
                      <span class="invoiceMetaVal">{{ orderDateDisplay }}</span>
                    </div>
                  </div>
                </div>
                <div class="invoiceCell invoiceAgreementCell">
                  The soler agrees to sell and buyer agrees to buy the undermentioned goods on the terms and conditions
                  statedbelow.
                </div>
              </div>
            </div>

            <div v-if="headerMode !== 'invoice'" class="meta publicUiHide">
              <div class="metaRow">
                <div class="metaCol">
                  CUSTOMER：<span class="metaVal">{{ customerName }}</span>
                </div>
                <div class="metaCol">
                  ORDER DATE：<span class="metaVal">{{ orderDateDisplay }}</span>
                </div>
              </div>
              <div class="metaRow">
                <div class="metaCol">
                  NUMBER：<span class="metaVal">{{ classData.number }}</span>
                </div>
                <div class="metaCol">
                  DELIVERY DATE：<span class="metaVal">{{ deliveryDateDisplay }}</span>
                </div>
              </div>
              <div class="metaRow hideAmountsUi">
                <div class="metaCol">
                  ADD：<span class="metaVal">{{ customerAdd }}</span>
                </div>
                <div class="metaCol">
                  Shipping Mark : <span class="metaVal">{{ customerMark }}</span>
                </div>
              </div>
            </div>

            <div class="table">
              <div class="tr head">
                <div class="td no hideThreeColsUi">NO.</div>
                <div class="td desc">
                  <div>品名</div>
                  <div class="en">DESCRIPTION</div>
                </div>
                <div class="td pic">
                  <div>图片</div>
                  <div class="en">PICTURE</div>
                </div>
                <div class="td qty">
                  <div>总数量</div>
                  <div class="en">TT QTY</div>
                </div>
                <div class="td price hideAmountsUi">
                  <div class="uPriceHead" :style="{ visibility: unitPriceHidden ? 'hidden' : 'visible' }">
                    <div>单价</div>
                    <div class="en">U/PRICE</div>
                  </div>
                </div>
                <div class="td amount hideAmountsUi">
                  <div>总金额</div>
                  <div class="en">AMOUNT</div>
                </div>
                <div class="td usd hideAmountsUi" :class="{ hideUsdUi: hideUsd }">
                  <div>USD Price</div>
                  <div class="en red exchangeRateCell" v-if="exchangeRate">
                    <span class="exchangeRatePrefix exchangeRatePrefixScreen">$1=￥</span>
                    <el-input
                      class="exchangeRateInput exchangeRateInputScreen"
                      size="mini"
                      v-model="exchangeRateManual"
                      @blur="exchangeRateManualBlur"
                      @focus.native="selectExchangeRateText($event)"
                      @keyup.enter.native="commitExchangeRateFromEnter"
                    ></el-input>
                    <span class="exchangeRateStaticPrint">$1=￥{{ Number(exchangeRate).toFixed(2) }}</span>
                  </div>
                </div>
                <template v-if="showMetrics">
                  <div class="td metric hideThreeColsUi">
                    <div>重量</div>
                    <div class="en">KG</div>
                  </div>
                  <div class="td metric hideThreeColsUi">
                    <div>体积</div>
                    <div class="en">CBM</div>
                  </div>
                </template>
              </div>

              <div class="tr" v-for="row in rows" :key="row.key">
                <div
                  class="td no hideThreeColsUi"
                  :class="{ noCopyable: groupBy === 'pack' && row.no != null && String(row.no) !== '' }"
                  @click="groupBy === 'pack' && row.no != null && String(row.no) !== '' && onPackNoClick(row)"
                >{{ row.no }}</div>
                <div class="td desc big">{{ row.desc }}</div>
                <div class="td pic">
                  <div class="picGrid" :class="{ singleCol: rowDisplay === 'single' }">
                    <div class="picItem" v-for="img in row.pics" :key="img.key">
                      <div class="imgBox">
                        <img v-if="img.url" :src="img.url" />
                      </div>
                      <div class="imgQty" :hidden="imgQtyHidden">{{ img.qty }}</div>
                    </div>
                  </div>
                </div>
                <div class="td qty big">{{ row.ttQty }}</div>
                <div class="td price big hideAmountsUi">
                  <div class="uPriceCell" :style="{ visibility: unitPriceHidden ? 'hidden' : 'visible' }">
                    <template v-if="groupBy === 'combo'">{{ row.uPriceText }}</template>
                    <template v-else>
                      <el-input
                        class="uPriceInput uPriceInputScreen"
                        size="mini"
                        :value="displayRowPriceInput(row)"
                        @input="onRowPriceInput(row, $event)"
                        @blur="rowPriceBlur(row, $event)"
                        @keyup.enter.native="rowPriceBlur(row, $event)"
                        @focus.native="selectPriceInputText($event)"
                      ></el-input>
                      <span class="uPriceStaticPrint">{{ formatMoney(getRowOverrideOrFallback(row), 0) }}</span>
                    </template>
                  </div>
                </div>
                <div class="td amount big hideAmountsUi">￥{{ row.amount }}</div>
                <div class="td usd big hideAmountsUi" :class="{ hideUsdUi: hideUsd }">${{ row.usd }}</div>
                <template v-if="showMetrics">
                  <div class="td metric big hideThreeColsUi">{{ row.weight }}</div>
                  <div class="td metric big hideThreeColsUi">{{ row.volume }}</div>
                </template>
              </div>

              <div class="tr foot">
                <div class="td no hideThreeColsUi"></div>
                <div class="td desc footLabel">Freight</div>
                <div class="td pic"></div>
                <div class="td qty big">{{ totalQty }}</div>
                <div class="td price big hideAmountsUi">￥{{ freight }}</div>
                <div class="td amount hideAmountsUi">￥{{ totalRmb }}</div>
                <div class="td usd hideAmountsUi" :class="{ hideUsdUi: hideUsd }">${{ totalUsd }}</div>
                <template v-if="showMetrics">
                  <div class="td metric hideThreeColsUi">{{ totalWeight }}</div>
                  <div class="td metric hideThreeColsUi">{{ totalVolume }}</div>
                </template>
              </div>
            </div>

            <div v-if="headerMode === 'invoice'" class="invoiceFooter">
              <div class="invoiceFooterBox">
                <div class="invoiceFooterTable">
                  <div class="invoiceFooterCell invoiceFooterLabel">Total:</div>
                  <div class="invoiceFooterCell invoiceFooterVal">
                    <div class="invoicePrintText" style="display:block;text-align:center;">{{ invoiceTotalText }}</div>
                  </div>
                  <div class="invoiceFooterCell invoiceFooterLabel">Total Amount in Words:</div>
                  <div class="invoiceFooterCell invoiceFooterVal">
                    <div class="invoicePrintText" style="display:block;text-align:center;">{{ invoiceWordsText }}</div>
                  </div>
                </div>
                <div class="invoiceFooterTerms">
                  <div>1.delivery time:delivery one week after payment.</div>
                  <div>2.payment terms:50% TT in advance,and the balanced should be paid before shipping</div>
                </div>
                <div class="invoiceFooterBank">
                  <div class="invoicePrintText" style="display:block;white-space:pre-wrap;">{{ invoiceBankText }}</div>
                </div>
              </div>
            </div>

            <div v-if="headerMode !== 'invoice'" class="summary hideAmountsUi" :class="{ hideFooterUi: hideFooter }">
              <div class="sumLeft">
                <div class="sumTitle">NOTE：</div>
                <div class="sumNote">{{ noteText }}</div>
              </div>
              <div class="sumRight">
                <div class="sumRow">
                  <div class="sumLabel">TOTAL</div>
                  <div class="sumVal">￥ {{ totalWithFreight }}</div>
                </div>
                <div class="sumRow">
                  <div class="sumLabel redLabel">DEPOSIT</div>
                  <div class="sumVal redVal">￥ {{ deposit }}</div>
                </div>
                <div class="sumRow">
                  <div class="sumLabel">BALANCE</div>
                  <div class="sumVal">￥ {{ balance }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

function getApiBase() {
  try {
    if (typeof window !== "undefined" && window.location) {
      const host = window.location.host;
      const protocol = window.location.protocol || "http:";
      const port = window.location.port || "";
      if (String(port) === "8084") return "http://erp.51ppy.com/";
      return `${protocol}//${host}/`;
    }
  } catch (e) {}
  return "http://127.0.0.1:8000/";
}

const publicAxios = axios.create({
  baseURL: getApiBase(),
  timeout: 30000
});

publicAxios.interceptors.request.use(config => {
  try {
    const apiBase = getApiBase();
    if (apiBase) config.baseURL = apiBase;
  } catch (e) {}
  if (!config.timeout) config.timeout = 30000;
  if (typeof config.url === "string") {
    config.url = config.url.replace(/^\/+/, "");
  }
  return config;
});

publicAxios.interceptors.response.use(
  response => response.data,
  error => {
    let info = "[ ERROR ] 服务器响应超时!";
    try {
      if (error && error.response) {
        const status = error.response.status;
        const data = error.response.data;
        const msg =
          typeof data === "string"
            ? data
            : data && typeof data === "object"
            ? data.info || data.message || data.error || ""
            : "";
        info = "[HTTP " + status + "] " + (msg || info);
      } else if (error) {
        const code = error.code;
        const msg = (error.message || "").toString();
        const isTimeout = code === "ECONNABORTED" || /timeout/i.test(msg);
        const isNetworkError = code === "NETWORK_ERROR" || /Network Error/i.test(msg);
        if (isTimeout) {
          info = "[ TIMEOUT ] 请求超时(30s),请检查手机和电脑是否同一Wi-Fi/热点,然后重试";
        } else if (isNetworkError) {
          info = "[ NETWORK ERROR ] 无法连接服务器,请确认服务器地址是否正确(" + (getApiBase && getApiBase() || "") + ")";
        } else {
          info = "[ NETWORK ERROR ] " + (msg || info);
        }
        info = appendPublicDebugInfo(info, error);
      }
    } catch (e) {}
    try {
      if (info.indexOf('[ DEBUG ]') < 0) info = appendPublicDebugInfo(info, error);
    } catch (e) {}
    return { state: "error", info };
  }
);

function buildPublicDebugUrl(config) {
  let base = "";
  let path = "";
  try { base = (config && (config.baseURL || publicAxios.defaults.baseURL)) || ""; } catch(e){}
  try { path = (config && config.url) || ""; } catch(e){}
  base = String(base || "");
  path = String(path || "");
  if (base && !base.endsWith("/") && path) base = base + "/";
  if (path.startsWith("/")) path = path.slice(1);
  return base + path;
}

function appendPublicDebugInfo(rawInfo, errorOrConfig) {
  try {
    const loc = (typeof window !== "undefined" && window.location && window.location.href) ? window.location.href : "";
    const base = (typeof getApiBase === "function") ? (getApiBase() || "") : "";
    const reqUrl = buildPublicDebugUrl(errorOrConfig && errorOrConfig.config ? errorOrConfig.config : errorOrConfig);
    return rawInfo + "\n\n[ DEBUG ]\n当前页面：" + loc + "\nAPI 基址：" + base + "\n实际请求：" + reqUrl;
  } catch (e) {
    return rawInfo;
  }
}

function objectSeek(obj, path) {
  if (!obj || !path) return "";
  const parts = typeof path === "string" ? path.split("|") : path;
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return "";
    cur = cur[p];
  }
  return cur == null ? "" : cur;
}

function extend(deep, target, src) {
  if (!target || typeof target !== "object") target = {};
  if (!src || typeof src !== "object") return target;
  for (const k in src) {
    if (!Object.prototype.hasOwnProperty.call(src, k)) continue;
    const v = src[k];
    if (deep && v && typeof v === "object" && !Array.isArray(v)) {
      target[k] = extend(true, target[k] && typeof target[k] === "object" ? target[k] : {}, v);
    } else {
      target[k] = v;
    }
  }
  return target;
}

function getUniqid() {
  return "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function formatMoment(val, fmt) {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    const ds = String(val).replace(/-/g, "/");
    const d2 = new Date(ds);
    if (isNaN(d2.getTime())) return String(val);
    return formatDateObj(d2, fmt);
  }
  return formatDateObj(d, fmt);
}

function formatDateObj(d, fmt) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  if (fmt === "YYYY-MM-DD") return `${y}-${m}-${day}`;
  return `${y}-${m}-${day}`;
}

function addDays(val, days) {
  if (!val) return "";
  const ds = String(val).replace(/-/g, "/");
  const d = new Date(ds);
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + Number(days || 0));
  return formatDateObj(d, "YYYY-MM-DD");
}

export default {
  name: "SorPublic",
  data() {
    const defaultSeller = {
      companyEn: "",
      companyCn: "",
      addressCn: "",
      addressEn: "",
      email: "",
      tel: "",
      whatsapp: "",
      contactName: "",
      wechatQr: "",
      whatsappQr: "",
      exchangeRate: ""
    };
    return {
      orderIdInput: "",
      activeOrderId: "",
      loading: false,
      loaded: false,
      loadError: "",
      headerMode: "order",
      invoiceSeller: "",
      invoiceTo: "",
      invoiceTotalText: "",
      invoiceWordsText: "",
      invoiceBankText: "",
      exchangeRate: 6.85,
      exchangeRateManual: "6.85",
      freightManual: 30,
      depositManual: 0,
      imgQtyHidden: false,
      unitPriceHidden: false,
      hideWarehouse2: false,
      showMetrics: true,
      rowDisplay: "merge",
      groupBy: "category",
      hideAmounts: false,
      showCategoryTab: false,
      onlyWarehouseId: null,
      onlyThreeCols: false,
      hideUsd: false,
      hideFooter: false,
      rowOverrides: {},
      customerInfo: {
        name: "",
        add: "",
        data: ""
      },
      classData: {
        number: "",
        time: "",
        arrival: "",
        data: "",
        user: ""
      },
      sellerInfo: extend(true, {}, defaultSeller),
      sellerInfoLoaded: false,
      detailRows: [],
      storeData: {
        category: [],
        warehouse: [],
        base: {
          cdnSite: ""
        }
      }
    };
  },
  computed: {
    hasOrderId() {
      return !!(this.activeOrderId && String(this.activeOrderId).trim());
    },
    customerName() {
      return this.customerInfo.name || "";
    },
    customerAdd() {
      return this.customerInfo.add || "";
    },
    customerMark() {
      return this.customerInfo.data || "";
    },
    sellerCompanyEn() {
      const v = String(this.sellerInfo && this.sellerInfo.companyEn ? this.sellerInfo.companyEn : "").trim();
      return v;
    },
    sellerCompanyCn() {
      const v = String(this.sellerInfo && this.sellerInfo.companyCn ? this.sellerInfo.companyCn : "").trim();
      return v;
    },
    sellerAddressCn() {
      const v = String(this.sellerInfo && this.sellerInfo.addressCn ? this.sellerInfo.addressCn : "").trim();
      return v;
    },
    sellerAddressEn() {
      const v = String(this.sellerInfo && this.sellerInfo.addressEn ? this.sellerInfo.addressEn : "").trim();
      return v ? v : "No. 783, 207 Gallery, Second Floor, East Second District, Shaodong International Business City, Shaodong City, Hunan Province";
    },
    sellerEmail() {
      const v = String(this.sellerInfo && this.sellerInfo.email ? this.sellerInfo.email : "").trim();
      return v ? v : "kimbagfactory@outlook.com";
    },
    sellerTel() {
      const v = String(this.sellerInfo && this.sellerInfo.tel ? this.sellerInfo.tel : "").trim();
      if (v) return v;
      const whatsapp = String(this.sellerInfo && this.sellerInfo.whatsapp ? this.sellerInfo.whatsapp : "").trim();
      return whatsapp ? whatsapp : "+8619535838073";
    },
    sellerWhatsapp() {
      const v = String(this.sellerInfo && this.sellerInfo.whatsapp ? this.sellerInfo.whatsapp : "").trim();
      if (v) return v;
      const tel = String(this.sellerInfo && this.sellerInfo.tel ? this.sellerInfo.tel : "").trim();
      return tel ? tel : "+8619535838073";
    },
    sellerContactName() {
      const v = String(this.sellerInfo && this.sellerInfo.contactName ? this.sellerInfo.contactName : "").trim();
      return v ? v : "Kim";
    },
    sellerMobLine() {
      const parts = [];
      const whatsapp = this.sellerWhatsapp;
      const tel = this.sellerTel;
      const name = this.sellerContactName;
      if (whatsapp) {
        if (tel && tel !== whatsapp) parts.push(tel + " / " + whatsapp);
        else parts.push(whatsapp);
      } else if (tel) {
        parts.push(tel);
      }
      if (name) parts.push(name);
      return parts.join(" ");
    },
    sellerWechatQr() {
      return this.sellerInfo && this.sellerInfo.wechatQr ? this.sellerInfo.wechatQr : "";
    },
    sellerWhatsappQr() {
      return this.sellerInfo && this.sellerInfo.whatsappQr ? this.sellerInfo.whatsappQr : "";
    },
    orderDateDisplay() {
      return formatMoment(this.classData.time, "YYYY-MM-DD");
    },
    deliveryDateDisplay() {
      const base = this.classData.time || this.classData.arrival;
      const added = addDays(base, 7);
      return added || formatMoment(this.classData.arrival, "YYYY-MM-DD");
    },
    rows() {
      if (this.rowDisplay === "single" && this.groupBy === "warehouse") {
        const map = {};
        const order = [];
        const warehouseCategoryOrder = {};
        const warehouseOrder = [];

        for (const item of this.detailRows) {
          if (this.onlyWarehouseId != null) {
            const wid = item && item.warehouse != null ? Number(item.warehouse) : null;
            if (wid !== Number(this.onlyWarehouseId)) continue;
          }
          const goods = objectSeek(item, "goodsData") || {};
          const categoryInfo = this.getCategoryInfo(item, goods);
          const warehouseRaw = item && item.warehouse != null ? item.warehouse : -1;
          const warehouseKey = String(warehouseRaw);
          const key = warehouseKey + "||" + categoryInfo.key;

          if (warehouseOrder.indexOf(warehouseKey) === -1) warehouseOrder.push(warehouseKey);
          if (!warehouseCategoryOrder[warehouseKey]) warehouseCategoryOrder[warehouseKey] = [];
          if (warehouseCategoryOrder[warehouseKey].indexOf(key) === -1) warehouseCategoryOrder[warehouseKey].push(key);

          if (!map[key]) {
            map[key] = {
              key,
              desc: categoryInfo.label,
              pics: [],
              ttQty: 0,
              amountVal: 0,
              unitPriceVal: null,
              weightVal: 0,
              volumeVal: 0
            };
            order.push(key);
          }

          const qty = Number(item && item.nums) || 0;
          const rawPrice = Number(item && item.price) || 0;
          const override = (this.rowOverrides && this.rowOverrides[key]) || {};
          const hasOverride = override && override.uPrice != null && String(override.uPrice) !== "" && !Number.isNaN(Number(override.uPrice));
          const useUnitPrice = hasOverride ? Number(override.uPrice) : rawPrice;
          let amt = item && item.tpt != null && item.tpt !== "" ? Number(item.tpt) : Number(item && item.total) || 0;
          if (hasOverride) amt = Number(qty) * useUnitPrice;
          const itemMetrics = this.getItemMetrics(item);
          map[key].ttQty = chainAdd(map[key].ttQty, qty);
          if (hasOverride) {
            map[key].amountVal = Number(map[key].ttQty) * useUnitPrice;
          } else {
            map[key].amountVal = chainAdd(map[key].amountVal, amt);
          }
          map[key].weightVal = chainAdd(map[key].weightVal, itemMetrics.weightVal);
          map[key].volumeVal = chainAdd(map[key].volumeVal, itemMetrics.volumeVal);
          map[key].unitPriceVal = hasOverride ? useUnitPrice : (map[key].unitPriceVal == null ? rawPrice : map[key].unitPriceVal);

          const picKey = item && item.id != null ? String(item.id) : getUniqid();
          map[key].pics.push({
            key: key + "-row-" + picKey,
            picKey: "row-" + picKey,
            url: this.getImgUrl(goods),
            qty
          });
        }

        const rowMap = {};
        order.forEach(k => {
          const row = map[k];
          const override = (this.rowOverrides && this.rowOverrides[k]) || {};
          const hasOverride = override && override.uPrice != null && String(override.uPrice) !== "" && !Number.isNaN(Number(override.uPrice));
          if (hasOverride) {
            const price = Number(override.uPrice) || 0;
            row.unitPriceVal = price;
            row.amountVal = Number(row.ttQty) * price;
          }
          const usdVal = this.exchangeRate ? row.amountVal / this.exchangeRate : 0;
          const r = {
            key: row.key,
            warehouseKey: String(row.key).split("||")[0],
            desc: row.desc,
            pics: row.pics,
            ttQty: row.ttQty,
            uPrice: this.formatMoney(row.unitPriceVal || 0, 0),
            uPriceText: "",
            amountVal: row.amountVal,
            usdVal,
            weightVal: row.weightVal,
            volumeVal: row.volumeVal,
            weight: this.formatMeasure(row.weightVal),
            volume: this.formatMeasure(row.volumeVal),
            amount: this.formatMoney(row.amountVal, 2),
            usd: this.formatMoney(usdVal, 2)
          };
          rowMap[r.key] = r;
        });

        const sortWarehouseKey = (a, b) => sortNumStr(a, b);
        const out = [];
        warehouseOrder.sort(sortWarehouseKey).forEach(wKey => {
          if (this.hideWarehouse2 && String(wKey) === "2") return;
          const catKeys = warehouseCategoryOrder[wKey] || [];
          catKeys.forEach((k, idx) => {
            const r = rowMap[k];
            if (!r) return;
            out.push(
              Object.assign({}, r, {
                no: idx === 0 ? this.getWarehouseName(wKey) : ""
              })
            );
          });
        });
        return out;
      }

      if (this.rowDisplay === "single") {
        const out = [];
        let idx = 1;
        for (const item of this.detailRows) {
          if (this.onlyWarehouseId != null) {
            const wid = item && item.warehouse != null ? Number(item.warehouse) : null;
            if (wid !== Number(this.onlyWarehouseId)) continue;
          }
          const goods = objectSeek(item, "goodsData") || {};
          const categoryInfo = this.getCategoryInfo(item, goods);
          const qty = Number(item && item.nums) || 0;
          const rawPrice = Number(item && item.price) || 0;
          const rowKeyPre = item && item.id != null ? "row-" + item.id : getUniqid();
          const override = (this.rowOverrides && this.rowOverrides[rowKeyPre]) || {};
          const hasOverride = override && override.uPrice != null && String(override.uPrice) !== "" && !Number.isNaN(Number(override.uPrice));
          const usePrice = hasOverride ? Number(override.uPrice) : rawPrice;
          let amt = item && item.tpt != null && item.tpt !== "" ? Number(item.tpt) : Number(item && item.total) || 0;
          if (hasOverride) amt = Number(qty) * usePrice;
          const usdVal = this.exchangeRate ? amt / this.exchangeRate : 0;
          const itemMetrics = this.getItemMetrics(item);
          const wid = item && item.warehouse != null ? String(item.warehouse) : "";
          if (this.hideWarehouse2 && wid === "2") continue;
          const desc = goods.data || goods.name || goods.number || (categoryInfo && categoryInfo.label) || "";
          const picKey =
            (goods.id != null ? String(goods.id) : goods.number != null ? String(goods.number) : "") ||
            (item && item.id != null ? "row-" + item.id : getUniqid());
          out.push({
            key: rowKeyPre,
            no: idx++,
            desc,
            pics: [
              {
                key: "p-" + picKey,
                picKey,
                url: this.getImgUrl(goods),
                qty
              }
            ],
            ttQty: qty,
            uPrice: this.formatMoney(usePrice || 0, 0),
            uPriceText: "",
            amountVal: amt,
            usdVal,
            weightVal: itemMetrics.weightVal,
            volumeVal: itemMetrics.volumeVal,
            weight: this.formatMeasure(itemMetrics.weightVal),
            volume: this.formatMeasure(itemMetrics.volumeVal),
            amount: this.formatMoney(amt, 2),
            usd: this.formatMoney(usdVal, 2)
          });
        }
        return out;
      }

      const map = {};
      const order = [];
      const packCategoryOrder = {};
      const packOrder = [];
      const warehouseCategoryOrder = {};
      const warehouseOrder = [];
      for (const item of this.detailRows) {
        if (this.onlyWarehouseId != null) {
          const wid = item && item.warehouse != null ? Number(item.warehouse) : null;
          if (wid !== Number(this.onlyWarehouseId)) continue;
        }
        const goods = objectSeek(item, "goodsData") || {};
        const categoryInfo = this.getCategoryInfo(item, goods);
        const packRaw = item.data == null ? "" : item.data;
        const warehouseRaw = item.warehouse == null ? -1 : item.warehouse;
        const comboRaw = goods.data == null ? "" : String(goods.data).trim();
        const groupKeyRaw =
          this.groupBy === "warehouse"
            ? warehouseRaw
            : this.groupBy === "pack"
            ? packRaw
            : this.groupBy === "combo"
            ? comboRaw
            : categoryInfo.key;
        const key =
          this.groupBy === "pack"
            ? String(groupKeyRaw) + "||" + categoryInfo.key
            : this.groupBy === "warehouse"
            ? String(groupKeyRaw) + "||" + categoryInfo.key
            : String(groupKeyRaw);
        if (this.groupBy === "pack") {
          const packKey = String(packRaw);
          if (packOrder.indexOf(packKey) === -1) packOrder.push(packKey);
          if (!packCategoryOrder[packKey]) packCategoryOrder[packKey] = [];
          if (packCategoryOrder[packKey].indexOf(key) === -1) packCategoryOrder[packKey].push(key);
        }
        if (this.groupBy === "warehouse") {
          const warehouseKey = String(warehouseRaw);
          if (warehouseOrder.indexOf(warehouseKey) === -1) warehouseOrder.push(warehouseKey);
          if (!warehouseCategoryOrder[warehouseKey]) warehouseCategoryOrder[warehouseKey] = [];
          if (warehouseCategoryOrder[warehouseKey].indexOf(key) === -1) warehouseCategoryOrder[warehouseKey].push(key);
        }
        if (!map[key]) {
          const nameBase =
            this.groupBy === "warehouse"
              ? this.getWarehouseName(groupKeyRaw)
              : this.groupBy === "pack"
              ? this.getPackName(groupKeyRaw)
              : this.groupBy === "combo"
              ? String(groupKeyRaw).trim()
                ? String(groupKeyRaw).trim()
                : "未分类"
              : categoryInfo.label;
          const name = this.groupBy === "pack" || this.groupBy === "warehouse" ? categoryInfo.label : nameBase;
          map[key] = {
            key,
            desc: name,
            picsMap: {},
            priceByPicKey: {},
            ttQty: 0,
            amountVal: 0,
            unitPriceVal: null,
            weightVal: 0,
            volumeVal: 0
          };
          order.push(key);
        }
        const qty = Number(item.nums) || 0;
        const amt = item.tpt != null && item.tpt !== "" ? Number(item.tpt) : Number(item.total) || 0;
        const itemMetrics = this.getItemMetrics(item);
        map[key].ttQty = chainAdd(map[key].ttQty, qty);
        map[key].amountVal = chainAdd(map[key].amountVal, amt);
        map[key].weightVal = chainAdd(map[key].weightVal, itemMetrics.weightVal);
        map[key].volumeVal = chainAdd(map[key].volumeVal, itemMetrics.volumeVal);
        if (this.groupBy === "combo") {
          map[key].unitPriceVal = map[key].amountVal;
        } else {
          map[key].unitPriceVal == null && (map[key].unitPriceVal = Number(item.price) || 0);
        }

        const gid = goods.id == null ? "" : String(goods.id);
        const picKey = gid || getUniqid();
        if (!map[key].picsMap[picKey]) {
          const priceVal = Number(item.price);
          map[key].picsMap[picKey] = {
            key: key + "-" + picKey,
            picKey,
            url: this.getImgUrl(goods),
            qty: 0
          };
          if (this.groupBy === "combo" && Number.isFinite(priceVal)) {
            map[key].priceByPicKey[picKey] = this.formatMoney(priceVal, 0);
          }
        }
        map[key].picsMap[picKey].qty = chainAdd(map[key].picsMap[picKey].qty, qty);
      }
      const baseRows = order.map(k => {
        const row = map[k];
        const pics = Object.values(row.picsMap);
        const override = (this.rowOverrides && this.rowOverrides[k]) || {};
        const hasOverride = this.groupBy !== "combo" && override && override.uPrice != null && String(override.uPrice) !== "" && !Number.isNaN(Number(override.uPrice));
        if (hasOverride) {
          const price = Number(override.uPrice) || 0;
          row.unitPriceVal = price;
          row.amountVal = Number(row.ttQty) * price;
        }
        const usdVal = this.exchangeRate ? row.amountVal / this.exchangeRate : 0;
        const uPriceText =
          this.groupBy === "combo"
            ? pics
                .map(p => (row.priceByPicKey && row.priceByPicKey[p.picKey] ? row.priceByPicKey[p.picKey] : ""))
                .filter(v => v)
                .join(" + ")
            : "";
        return {
          key: row.key,
          packKey: this.groupBy === "pack" ? String(row.key).split("||")[0] : "",
          warehouseKey: this.groupBy === "warehouse" ? String(row.key).split("||")[0] : "",
          desc: row.desc,
          pics,
          ttQty: row.ttQty,
          uPrice: this.groupBy === "combo" ? "" : this.formatMoney(row.unitPriceVal || 0, 0),
          uPriceText,
          amountVal: row.amountVal,
          usdVal,
          weightVal: row.weightVal,
          volumeVal: row.volumeVal,
          weight: this.formatMeasure(row.weightVal),
          volume: this.formatMeasure(row.volumeVal),
          amount: this.formatMoney(row.amountVal, 2),
          usd: this.formatMoney(usdVal, 2)
        };
      });
      if (this.groupBy !== "pack" && this.groupBy !== "warehouse") {
        return baseRows.map((r, i) => Object.assign({}, r, { no: i + 1 }));
      }
      const sortWarehouseKey = (a, b) => sortNumStr(a, b);
      const sortPackKey = (a, b) => sortNumStr(a, b);
      const rowMap = {};
      baseRows.forEach(r => (rowMap[r.key] = r));
      const out = [];
      if (this.groupBy === "warehouse") {
        warehouseOrder.sort(sortWarehouseKey).forEach(warehouseKey => {
          if (this.hideWarehouse2 && String(warehouseKey) === "2") return;
          const catKeys = warehouseCategoryOrder[warehouseKey] || [];
          catKeys.forEach((k, idx) => {
            const r = rowMap[k];
            if (!r) return;
            out.push(
              Object.assign({}, r, {
                no: idx === 0 ? this.getWarehouseName(warehouseKey) : ""
              })
            );
          });
        });
        return out;
      }
      packOrder.sort(sortPackKey).forEach(packKey => {
        const catKeys = packCategoryOrder[packKey] || [];
        catKeys.forEach((k, idx) => {
          const r = rowMap[k];
          if (!r) return;
          out.push(
            Object.assign({}, r, {
              no: idx === 0 ? this.getPackName(packKey) : ""
            })
          );
        });
      });
      return out;
    },
    totalQty() {
      if (this.groupBy === "combo") {
        let total = 0;
        for (const item of this.detailRows) total = chainAdd(total, Number(item && item.nums) || 0);
        return total;
      }
      let total = 0;
      for (const row of this.rows) total = chainAdd(total, Number(row.ttQty) || 0);
      return total;
    },
    totalRmbVal() {
      let total = 0;
      for (const row of this.rows) total = chainAdd(total, Number(row.amountVal) || 0);
      return total;
    },
    totalRmb() {
      return this.formatMoney(this.totalRmbVal, 2);
    },
    totalUsd() {
      const usd = this.exchangeRate ? this.totalRmbVal / this.exchangeRate : 0;
      return this.formatMoney(usd, 2);
    },
    totalWeightVal() {
      let total = 0;
      for (const row of this.rows) total = chainAdd(total, Number(row && row.weightVal) || 0);
      return total;
    },
    totalWeight() {
      return this.formatMeasure(this.totalWeightVal);
    },
    totalVolumeVal() {
      let total = 0;
      for (const row of this.rows) total = chainAdd(total, Number(row && row.volumeVal) || 0);
      return total;
    },
    totalVolume() {
      return this.formatMeasure(this.totalVolumeVal);
    },
    noteText() {
      return this.classData && this.classData.data != null ? String(this.classData.data).trim() : "";
    },
    freightVal() {
      const n = Number(String(this.freightManual).replace(/,/g, ""));
      return Number.isFinite(n) ? n : 0;
    },
    freight() {
      return this.formatMoney(this.freightVal, 2);
    },
    totalWithFreightVal() {
      return chainAdd(this.totalRmbVal, this.freightVal);
    },
    totalWithFreight() {
      return this.formatMoney(this.totalWithFreightVal, 2);
    },
    depositVal() {
      const n = Number(String(this.depositManual).replace(/,/g, ""));
      return Number.isFinite(n) ? n : 0;
    },
    deposit() {
      return this.formatMoney(this.depositVal, 2);
    },
    balanceVal() {
      return chainSub(this.totalWithFreightVal, this.depositVal);
    },
    balance() {
      return this.formatMoney(this.balanceVal, 2);
    }
  },
  watch: {
    rows: {
      immediate: false,
      handler(next) {
        this.$nextTick(() => {
          this.initRowOverridesFromRows(next);
        });
      }
    },
    detailRows: {
      immediate: false,
      handler() {
        this.$nextTick(() => {
          this.initRowOverridesFromRows(this.rows);
        });
      }
    }
  },
  methods: {
    onSubmitOrderId() {
      const id = String(this.orderIdInput || "").trim();
      if (!id) {
        this.loadError = "请输入订单ID或订单编号";
        return;
      }
      this.activeOrderId = id;
      this.loadError = "";
      this.load();
    },
    backToEntry() {
      this.activeOrderId = "";
      this.loaded = false;
      this.loadError = "";
      this.orderIdInput = "";
      this.detailRows = [];
      this.classData = { number: "", time: "", arrival: "", data: "", user: "" };
    },
    toggleRowDisplay() {
      this.rowDisplay = this.rowDisplay === "single" ? "merge" : "single";
    },
    toggleMetrics() {
      this.showMetrics = !this.showMetrics;
    },
    toggleHideWarehouse2() {
      this.hideWarehouse2 = !this.hideWarehouse2;
    },
    setGroupBy(val) {
      this.groupBy = val;
      this.headerMode = "order";
    },
    enterInvoice() {
      this.headerMode = "invoice";
      this.ensureInvoiceDefaults();
    },
    getDefaultInvoiceSeller() {
      return [
        this.sellerCompanyEn || "XiYue Bags",
        this.sellerTel || this.sellerWhatsapp || "+8619535838073",
        "ADD：" + (this.sellerAddressEn || "No. 783, 207 Gallery, Second Floor, East Second District, Shaodong International Business City"),
        "City：Shaodong City, Hunan Province",
        "EMAIL：" + (this.sellerEmail || "kimbagfactory@outlook.com")
      ].join("\n");
    },
    getDefaultInvoiceTo() {
      const parts = [];
      this.customerName && parts.push(this.customerName);
      this.customerAdd && parts.push(this.customerAdd);
      this.customerMark && parts.push(this.customerMark);
      return parts.join("\n");
    },
    getDefaultInvoiceTotalText() {
      const totalRmb = this.formatMoney(this.totalRmbVal, 2);
      const freight = this.formatMoney(this.freightVal, 2);
      const total = this.formatMoney(this.totalWithFreightVal, 2);
      return "Motor cost add shipping cost " + totalRmb + "RMB+" + freight + "RMB=" + total + "RMB";
    },
    getDefaultInvoiceWordsText() {
      return "SAY RMB SEVEN THOUSAND THREE HUNDRED ONLY.";
    },
    getDefaultInvoiceBankText() {
      return [
        "NAME OF OUR AUTHORISED BENEFICIARY AND BANK AS BELOW:",
        "Beneficiary name: Shaodong XiYue Luggage company",
        "Beneficiary bank: DBS Bank (Hong Kong) Limited",
        "Beneficiary account number: 79969000652695",
        "Beneficiary bank address: 11th Floor, The Center, 99 Queen's Road Central, Central, Hong Kong",
        "Beneficiary bank swift code: DHBKKHH"
      ].join("\n");
    },
    ensureInvoiceDefaults() {
      const seller = String(this.invoiceSeller || "").trim();
      const to = String(this.invoiceTo || "").trim();
      if (!seller) this.invoiceSeller = this.getDefaultInvoiceSeller();
      if (!to) this.invoiceTo = this.getDefaultInvoiceTo();
      const wordsText = String(this.invoiceWordsText || "").trim();
      const bankText = String(this.invoiceBankText || "").trim();
      this.invoiceTotalText = this.getDefaultInvoiceTotalText();
      if (!wordsText) this.invoiceWordsText = this.getDefaultInvoiceWordsText();
      if (!bankText) this.invoiceBankText = this.getDefaultInvoiceBankText();
    },
    escapeHtml(val) {
      const s = val == null ? "" : String(val);
      return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    },
    openPdfPreview() {
      const paper = this.$el && this.$el.querySelector ? this.$el.querySelector(".paper") : null;
      if (!paper) return;

      const stylesText = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map(el => el.outerHTML)
        .join("\n");

      const win = window.open("", "_blank");
      if (!win) {
        alert("浏览器拦截了预览窗口，请允许弹窗后重试。");
        return;
      }

      const mmdd = formatMoment(new Date(), "MMDD");
      const titleName = this.customerName ? String(this.customerName).trim() : "";
      const fileNameTitle = `${mmdd}${mmdd && titleName ? " " : ""}${titleName}`.trim() || "Sales orders";
      const safeTitle = this.escapeHtml(fileNameTitle);
      const toolbarTitle = `${this.customerName} Sales orders`.trim();
      const safeToolbarTitle = this.escapeHtml(toolbarTitle || "Sales orders");
      const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    ${stylesText}
    <style>
      body { margin: 0; background: #f5f5f5; }
      .pdfPreviewBody .paper,
      .pdfPreviewBody .paper.metricsMode {
        width: auto;
        max-width: 100%;
        box-sizing: border-box;
      }
      .pdfPreviewToolbar{
        position: sticky;
        top: 0;
        z-index: 10;
        background: #fff;
        border-bottom: 1px solid #ebeef5;
        padding: 10px 12px;
        display: flex;
        gap: 10px;
        align-items: center;
      }
      .pdfPreviewToolbar button{
        height: 32px;
        padding: 0 14px;
        border-radius: 4px;
        border: 1px solid #dcdfe6;
        background: #fff;
        cursor: pointer;
        font-size: 14px;
      }
      .pdfPreviewToolbar .primary{
        background: #409EFF;
        color: #fff;
        border-color: #409EFF;
      }
      .pdfTitle{ font-size: 13px; color: #303133; font-weight: 600; margin-right: 6px; }
      .pdfTip{ color: #909399; font-size: 12px; margin-left: auto; }
      .pdfPreviewBody{ padding: 12px; }
      .pdfPreviewBody .invoiceInput{ display:none !important; }
      .pdfPreviewBody .invoicePrintText{ display:block !important; }
      .pdfPreviewBody .uPriceInputScreen{ display:none !important; }
      .pdfPreviewBody .uPriceStaticPrint{ display:inline-block !important; width:100%; text-align:center; }
      .pdfPreviewBody .exchangeRateInputScreen,
      .pdfPreviewBody .exchangeRatePrefixScreen{ display:none !important; }
      .pdfPreviewBody .exchangeRateStaticPrint{ display:inline-block !important; }

      @media print {
        @page { size: A4; margin: 10mm; }
        body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .pdfPreviewToolbar{ display:none !important; }
        .pdfPreviewBody{ padding: 0 !important; }
        .paper { margin: 0 auto !important; border: 0 !important; }
        .paper,
        .paper.metricsMode {
          width: 100% !important;
          max-width: none !important;
        }
        .tr { break-inside: avoid; page-break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    <div class="pdfPreviewToolbar">
      <button class="primary" onclick="window.print()">确认导出</button>
      <button onclick="window.close()">关闭预览</button>
      <div class="pdfTitle">${safeToolbarTitle}</div>
      <div class="pdfTip">如需去掉浏览器顶部日期/底部地址，请在打印设置里关闭"页眉页脚"。</div>
    </div>
    <div class="pdfPreviewBody">
      ${paper.outerHTML}
    </div>
  </body>
</html>`;

      win.document.open();
      win.document.write(html);
      win.document.close();
      win.document.title = fileNameTitle;
    },
    exportXlsx() {
      if (!this.loaded) return;
      const mmdd = formatMoment(new Date(), "MMDD");
      const titleName = this.customerName ? String(this.customerName).trim() : "";
      const rawName = `${mmdd}${mmdd && titleName ? " " : ""}${titleName}`.trim() || "Sales orders";
      const fileName = (rawName.replace(/[\\/:*?"<>|]/g, "_") + ".xlsx").trim();

      const rows = (this.rows || []).map(r => {
        const pics = Array.isArray(r && r.pics)
          ? r.pics
              .map(p => {
                return {
                  url: p && p.url ? String(p.url) : "",
                  qty: p && p.qty != null ? p.qty : ""
                };
              })
              .filter(p => p && p.url)
          : [];
        return {
          no: r && r.no != null ? r.no : "",
          desc: r && r.desc != null ? String(r.desc) : "",
          ttQty: r && r.ttQty != null ? Number(r.ttQty) : 0,
          uPrice: r && r.uPrice != null ? String(r.uPrice) : "",
          uPriceText: r && r.uPriceText != null ? String(r.uPriceText) : "",
          amount: r && r.amount != null ? String(r.amount) : "",
          usd: r && r.usd != null ? String(r.usd) : "",
          weight: r && r.weightVal != null ? Number(r.weightVal) : 0,
          volume: r && r.volumeVal != null ? Number(r.volumeVal) : 0,
          pics
        };
      });

      let apiBase = "";
      try { apiBase = (typeof getApiBase === "function") ? (getApiBase() || "") : ""; } catch(e){}
      if (apiBase && !apiBase.endsWith("/")) apiBase = apiBase + "/";
      const exportUrl = apiBase + "open/exportXlsx";
      const postData = {
        template: "sorPrint",
        fileName,
        sheetName: "Order",
        payload: {
          groupBy: this.groupBy,
          onlyWarehouseId: this.onlyWarehouseId,
          onlyThreeCols: !!this.onlyThreeCols,
          hideUsd: !!this.hideUsd,
          hideFooter: !!this.hideFooter,
          exchangeRate: this.exchangeRate,
          customerName: this.customerName || "",
          customerAdd: this.customerAdd || "",
          customerMark: this.customerMark || "",
          orderDate: this.orderDateDisplay || "",
          deliveryDate: this.deliveryDateDisplay || "",
          number: this.classData.number || "",
          freight: this.freightVal,
          deposit: this.depositVal,
          totalWeight: this.totalWeightVal,
          totalVolume: this.totalVolumeVal,
          noteText: this.noteText,
          totalQty: this.totalQty,
          totalRmb: this.totalRmbVal,
          totalUsd: this.exchangeRate ? Number(this.totalRmbVal / this.exchangeRate) : 0,
          totalWithFreight: this.totalWithFreightVal,
          balance: this.balanceVal,
          hideAmounts: !!this.hideAmounts,
          rows
        }
      };
      fetch(exportUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData)
      }).then(res => {
        const ok = res && res.ok;
        const isXlsx = res && /(excel|spreadsheet|octet-stream|xlsx|xls)/i.test(res.headers && res.headers.get("content-type") || "");
        if (ok && isXlsx) return res.blob();
        return res.text().then(txt => {
          try {
            const obj = txt && /^\s*\{/.test(txt) ? JSON.parse(txt) : null;
            const info = (obj && (obj.info || obj.message || obj.error)) || txt || "导出失败";
            throw new Error(String(info).replace(/^<[^>]+>/g, "").slice(0, 400));
          } catch (e) {
            if (e && /^Error: /i.test(String(e))) throw e;
            throw new Error((txt || "导出失败").slice(0, 400));
          }
        });
      }).then(blob => {
        if (!blob) return;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }).catch(err => {
        console.error(err);
        alert("导出失败：" + (err && err.message ? err.message : String(err)));
      });
    },
    toggleImgQty() {
      this.imgQtyHidden = !this.imgQtyHidden;
    },
    toggleUnitPrice() {
      this.unitPriceHidden = !this.unitPriceHidden;
    },
    formatDate(val) {
      return formatMoment(val, "YYYY-MM-DD");
    },
    getWarehouseName(id) {
      const target = String(id == null ? "" : id).trim();
      if (!target) return "";
      const list = this.storeData.warehouse || [];
      const hit = list.find(item => String(item && item.id != null ? item.id : "").trim() === target);
      if (hit && hit.name) return String(hit.name);
      const nid = Number(target);
      if (nid === -1) return "未指定仓库";
      return "";
    },
    parseContacts(val) {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val !== "string") return [];
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    },
    setCustomerInfoFromCustomerData(c) {
      const customer = c || {};
      const contacts = this.parseContacts(customer.contacts);
      const main = contacts.find(x => x && x.main) || contacts[0] || {};
      this.customerInfo = {
        name: customer.name || "",
        add: main.add || "",
        data: main.data || customer.data || ""
      };
      if (this.headerMode === "invoice") this.ensureInvoiceDefaults();
    },
    fetchCustomerInfo(customerId) {
      if (!customerId) {
        this.customerInfo = { name: "", add: "", data: "" };
        if (this.headerMode === "invoice") this.ensureInvoiceDefaults();
        return Promise.resolve(true);
      }
      return publicAxios.post("open/getSorCustomer", { id: customerId }).then(res => {
        if (!res || res.state !== "success") {
          this.customerInfo = { name: "", add: "", data: "" };
          if (this.headerMode === "invoice") this.ensureInvoiceDefaults();
          return true;
        }
        this.setCustomerInfoFromCustomerData(res.info);
        return true;
      });
    },
    getCategoryInfo(item, goods) {
      const fromData = data => {
        if (!data) return null;
        const label = data.data || data.name || "";
        const rawKey = data.id != null ? data.id : data.key != null ? data.key : label;
        return label ? { key: String(rawKey), label } : null;
      };
      const hit = fromData(item && item.categoryData) || fromData(goods && goods.categoryData) || null;
      if (hit) return hit;

      const pickRaw = v => {
        if (v == null) return null;
        const s = String(v).trim();
        if (!s) return null;
        const n = Number(s);
        if (Number.isFinite(n)) return { key: String(n), label: this.getCategoryName(n) };
        return { key: s, label: s };
      };
      return pickRaw(item && item.category) || pickRaw(goods && goods.category) || { key: "-1", label: "未分类" };
    },
    getCategoryNodeById(id) {
      const target = Number(id);
      if (!Number.isFinite(target)) return null;
      const walk = list => {
        for (const node of list || []) {
          if (Number(node && node.id) === target) return node;
          const sub = node && (node.sub || node.children);
          if (sub && sub.length) {
            const hit = walk(sub);
            if (hit) return hit;
          }
        }
        return null;
      };
      return walk(this.storeData.category || []);
    },
    getCategoryMetrics(item) {
      const goods = objectSeek(item, "goodsData") || {};
      const categoryData =
        (item && item.categoryData) ||
        (goods && goods.categoryData) ||
        this.getCategoryNodeById((item && item.category) || (goods && goods.category)) ||
        null;
      const weight = Number(categoryData && categoryData.weight);
      const volume = Number(categoryData && categoryData.volume);
      return {
        weight: Number.isFinite(weight) ? weight : 0,
        volume: Number.isFinite(volume) ? volume : 0
      };
    },
    getItemMetrics(item) {
      const metrics = this.getCategoryMetrics(item);
      const qty = Number(item && item.nums) || 0;
      return {
        weightVal: chainMul(qty, metrics.weight),
        volumeVal: chainMul(qty, metrics.volume)
      };
    },
    load() {
      if (!this.activeOrderId) return;
      this.loading = true;
      this.loadError = "";
      Promise.resolve()
        .then(() => publicAxios.post("open/getSorStore"))
        .then(storeRes => {
          if (storeRes && storeRes.state === "success" && storeRes.info) {
            this.storeData.category = storeRes.info.category || [];
            this.storeData.warehouse = storeRes.info.warehouse || [];
            if (storeRes.info.base) this.storeData.base = Object.assign({}, this.storeData.base, storeRes.info.base);
          }
          return publicAxios.post("open/getSor", { parm: this.activeOrderId });
        })
        .then(result => {
          if (result && result.state === "success") {
            const cls = result.info.class || {};
            this.classData = {
              number: cls.number || "",
              time: formatMoment(cls.time || "", "YYYY-MM-DD"),
              arrival: formatMoment(cls.arrival || "", "YYYY-MM-DD"),
              data: cls.data || "",
              user: cls.user || ""
            };
            this.detailRows = Array.isArray(result.info.info) ? result.info.info : [];

            const clsObj = result.info.class || {};
            const customerId =
              clsObj.customer ||
              (clsObj.customerData && clsObj.customerData.id) ||
              (clsObj.customerData && clsObj.customerData.key) ||
              null;
            const customerData = clsObj.customerData || null;

            const sellerIdRaw = this.classData.user || (clsObj.userData && (clsObj.userData.id || clsObj.userData.key)) || "";
            const sellerId = Number(sellerIdRaw);

            Promise.resolve()
              .then(() => {
                if (customerData) {
                  this.setCustomerInfoFromCustomerData(customerData);
                  return true;
                }
                return this.fetchCustomerInfo(customerId);
              })
              .then(() => {
                if (Number.isFinite(sellerId) && sellerId > 0) {
                  this.fetchSellerInfo(sellerId);
                } else {
                  this.resetSellerInfoToDefaults();
                }
                this.ensureInvoiceDefaults();
                this.loading = false;
                this.loaded = true;
              });
          } else if (result && result.state === "error") {
            this.loadError = result.info || "订单查询失败";
            this.loading = false;
            this.loaded = true;
          } else {
            this.loadError = "[ ERROR ] 服务器响应超时!";
            this.loading = false;
            this.loaded = true;
          }
        })
        .catch(err => {
          this.loadError = err && err.message ? err.message : "请求失败,请检查网络";
          this.loading = false;
          this.loaded = true;
        });
    },
    resetSellerInfoToDefaults() {
      const base = {
        companyEn: "",
        companyCn: "",
        addressCn: "",
        addressEn: "",
        email: "",
        tel: "",
        whatsapp: "",
        contactName: "",
        wechatQr: "",
        whatsappQr: "",
        exchangeRate: ""
      };
      this.sellerInfo = extend(true, {}, base);
      this.sellerInfoLoaded = true;
      this.applySellerExchangeRate();
    },
    parseExchangeRate(v) {
      if (v === undefined || v === null) return null;
      const s = String(v).trim();
      if (!s) return null;
      const n = Number(s);
      if (!Number.isFinite(n) || !(n > 0)) return null;
      return n;
    },
    getSellerExchangeRate() {
      const def = 6.85;
      const raw = this.sellerInfo && this.sellerInfo.exchangeRate != null ? this.sellerInfo.exchangeRate : "";
      const n = this.parseExchangeRate(raw);
      return n != null ? n : def;
    },
    applySellerExchangeRate() {
      const r = this.getSellerExchangeRate();
      this.exchangeRate = r;
      this.exchangeRateManual = Number(r).toFixed(2);
    },
    fetchSellerInfo(userId) {
      if (!userId) {
        this.resetSellerInfoToDefaults();
        return;
      }
      publicAxios.post("open/getSorUser", { id: userId }).then(result => {
        if (result.state === "success" && result.info) {
          const info = result.info || {};
          const defaults = {
            companyEn: "",
            companyCn: "",
            addressCn: "",
            addressEn: "",
            email: "",
            tel: "",
            whatsapp: "",
            contactName: "",
            wechatQr: "",
            whatsappQr: "",
            exchangeRate: ""
          };
          this.sellerInfo = Object.assign({}, defaults, info, {
            tel: info.tel || (info && info.whatsapp) || defaults.tel || ""
          });
          this.sellerInfoLoaded = true;
          this.applySellerExchangeRate();
        } else {
          this.resetSellerInfoToDefaults();
        }
      }).catch(() => {
        this.resetSellerInfoToDefaults();
      });
    },
    onExchangeRateInput(v) {
      this.exchangeRateManual = v == null ? "" : String(v);
    },
    selectExchangeRateText(e) {
      try {
        const t = e && e.target;
        if (t && typeof t.select === "function") t.select();
      } catch (err) {}
    },
    commitExchangeRateFromEnter() {
      this.exchangeRateManualBlur();
      try {
        const el = document.activeElement;
        if (el && el.blur) el.blur();
      } catch (err) {}
    },
    exchangeRateManualBlur() {
      const raw = this.exchangeRateManual;
      const n = this.parseExchangeRate(raw);
      if (n != null) {
        this.exchangeRate = n;
        this.exchangeRateManual = Number(n).toFixed(2);
      } else {
        this.exchangeRateManual = Number(this.exchangeRate).toFixed(2);
      }
    },
    getCategoryName(id) {
      const tree = this.storeData.category || [];
      const target = Number(id);
      if (target === -1) return "未分类";

      const walk = list => {
        for (const node of list) {
          if (Number(node.id) === target) return node.data || node.name || "未分类";
          const sub = node.sub || node.children;
          if (sub && sub.length) {
            const hit = walk(sub);
            if (hit) return hit;
          }
        }
        return "";
      };
      return walk(tree) || "未分类";
    },
    getPackName(val) {
      const s = val == null ? "" : String(val).trim();
      return s ? s : "未装箱";
    },
    buildPackCategorySummary(packKey) {
      const pKey = packKey == null ? "" : String(packKey);
      const qtyMap = {};
      const metaMap = {};
      let total = 0;
      for (const item of this.detailRows) {
        const pk = item && item.data != null ? String(item.data) : "";
        if (pk !== pKey) continue;
        const goods = objectSeek(item, "goodsData") || {};
        const info = this.getCategoryInfo(item, goods) || {};
        const rawKey = info.key != null ? info.key : "-1";
        const cKey = String(rawKey);
        let cName = "";
        let cSort = 999999;
        try {
          const node = this.getCategoryNodeById(cKey);
          if (node) {
            if (node.name) cName = String(node.name);
            if (node.sort != null) cSort = Number(node.sort);
          }
        } catch (e) {}
        if (!cName) {
          const byName = this.getCategoryName(cKey);
          if (byName && String(byName) !== cKey) cName = String(byName);
        }
        if (!cName) cName = cKey === "-1" ? "未分类" : "未分类";
        const qty = Number(item && item.nums) || 0;
        if (qtyMap[cKey] == null) {
          qtyMap[cKey] = 0;
          metaMap[cKey] = { name: cName, sort: cSort };
        } else {
          if (!metaMap[cKey].name && cName) metaMap[cKey].name = cName;
          if (cSort < metaMap[cKey].sort) metaMap[cKey].sort = cSort;
        }
        qtyMap[cKey] = chainAdd(qtyMap[cKey], qty);
        total = chainAdd(total, qty);
      }
      const keys = Object.keys(qtyMap);
      if (!keys.length) return { text: "", total };
      const parts = keys
        .map(k => ({
          k,
          name: (metaMap[k] && metaMap[k].name) || "未分类",
          n: Number(qtyMap[k]) || 0,
          sort: (metaMap[k] && metaMap[k].sort) || 999999
        }))
        .sort((a, b) => a.sort - b.sort || sortNumStr(a.k, b.k));
      const text = parts.map(p => p.name + (Number(p.n) || 0)).join("/") + "共" + total + "件";
      return { text, total, parts };
    },
    async copyTextToClipboard(text) {
      if (!text) return false;
      try {
        if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          return true;
        }
      } catch (e) {}
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
      } catch (e) {
        return false;
      }
    },
    async onPackNoClick(row) {
      if (this.groupBy !== "pack") return;
      const packKey = row && row.packKey != null ? row.packKey : (row && row.no != null ? String(row.no) : "");
      const { text } = this.buildPackCategorySummary(packKey || String(row.no));
      if (!text) {
        this._showToastPublic("当前箱无分类明细");
        return;
      }
      const ok = await this.copyTextToClipboard(text);
      this._showToastPublic(ok ? "已复制：" + text : "复制失败，请手动复制：" + text);
    },
    _showToastPublic(msg) {
      try {
        if (this.$message) {
          this.$message({ message: msg, type: "success", duration: 2000 });
          return;
        }
      } catch (e) {}
      alert(msg);
    },
    getImgUrl(goods) {
      if (!goods) return "";
      const imgs = goods.imgs;
      let val = "";
      if (Array.isArray(imgs) && imgs.length > 0) {
        const first = imgs[0];
        val = typeof first == "string" ? first : first && first.url ? first.url : "";
      } else if (imgs && typeof imgs == "object") {
        val = imgs.url || "";
      } else if (typeof imgs == "string") {
        val = imgs;
      }
      if (!val) return "";
      if (/^https?:\/\//.test(val)) return val;
      return (this.storeData.base && this.storeData.base.cdnSite ? this.storeData.base.cdnSite : "") + val;
    },
    formatMoney(num, digits) {
      const n = Number(num);
      if (!Number.isFinite(n)) return "0.00";
      const fixed = n.toFixed(digits);
      const parts = fixed.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
    },
    formatMeasure(num) {
      const n = Number(num);
      return Number.isFinite(n) ? n.toFixed(3) : "0.000";
    },
    parseRowPrice(v) {
      const raw = v == null ? "" : String(v).replace(/,/g, "").trim();
      if (raw === "" || raw === "-") return null;
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0 || Number.isNaN(n)) return null;
      return n;
    },
    initRowOverridesFromRows(rows) {
      if (!Array.isArray(rows)) return;
      if (!this.rowOverrides) this.$set(this, "rowOverrides", {});
      rows.forEach(row => {
        if (!row || row.key == null) return;
        const key = String(row.key);
        if (!this.rowOverrides[key] || typeof this.rowOverrides[key] !== "object") {
          const fallback = this.parseRowPrice(row && row.uPrice);
          this.$set(this.rowOverrides, key, { uPrice: String(fallback == null ? 0 : fallback) });
        }
      });
    },
    displayRowPriceInput(row) {
      if (!row || row.key == null) return "";
      const key = String(row.key);
      if (!this.rowOverrides) this.$set(this, "rowOverrides", {});
      if (!this.rowOverrides[key] || typeof this.rowOverrides[key] !== "object") {
        const fallback = this.parseRowPrice(row && row.uPrice);
        const v = fallback == null ? 0 : fallback;
        this.$set(this.rowOverrides, key, { uPrice: String(v) });
      }
      const stored = this.rowOverrides[key].uPrice;
      return stored == null ? "" : String(stored);
    },
    onRowPriceInput(row, value) {
      if (!row || row.key == null) return;
      const key = String(row.key);
      if (!this.rowOverrides) this.$set(this, "rowOverrides", {});
      if (!this.rowOverrides[key] || typeof this.rowOverrides[key] !== "object") this.$set(this.rowOverrides, key, {});
      const v = value == null ? "" : String(value);
      if (String(this.rowOverrides[key].uPrice) !== v) {
        this.$set(this.rowOverrides[key], "uPrice", v);
      }
    },
    getRowOverrideOrFallback(row) {
      if (!row || row.key == null) return 0;
      const key = String(row.key);
      const o = (this.rowOverrides && this.rowOverrides[key]) || {};
      const n = this.parseRowPrice(o.uPrice);
      if (n != null) return n;
      const f = this.parseRowPrice(row && row.uPrice);
      return f == null ? 0 : f;
    },
    selectPriceInputText(e) {
      try {
        const t = e && e.target;
        const real = t && typeof t.querySelector === "function" ? t.querySelector(".el-input__inner") || t : t;
        if (real && typeof real.select === "function") real.select();
      } catch (err) {}
    },
    rowPriceBlur(row, e) {
      if (!row || row.key == null) return;
      const key = String(row.key);
      if (!this.rowOverrides) this.$set(this, "rowOverrides", {});
      if (!this.rowOverrides[key] || typeof this.rowOverrides[key] !== "object") this.$set(this.rowOverrides, key, {});
      const target = e && (e.target || (e && e.srcElement));
      const v =
        target && typeof target.value === "string"
          ? target.value
          : target && target.querySelector && target.querySelector(".el-input__inner")
          ? target.querySelector(".el-input__inner").value
          : this.rowOverrides[key].uPrice;
      const n = this.parseRowPrice(v);
      if (n == null) {
        const fallback = this.parseRowPrice(row && row.uPrice);
        const use = fallback == null ? 0 : fallback;
        this.$set(this.rowOverrides[key], "uPrice", String(use));
      } else {
        this.$set(this.rowOverrides[key], "uPrice", String(n));
      }
      try {
        const el = document.activeElement;
        if (el && el.blur) el.blur();
      } catch (err) {}
    }
  },
  created() {
    this._prevBodyOverflow = "";
    this._prevHtmlOverflow = "";
    try {
      if (typeof document !== "undefined") {
        if (document.body) this._prevBodyOverflow = document.body.style.overflow || "";
        const html = document.documentElement;
        if (html) this._prevHtmlOverflow = html.style.overflow || "";
        if (document.body) document.body.style.overflow = "auto";
        if (html) html.style.overflow = "auto";
      }
    } catch (e) {}
    const route = this.$route || {};
    const params = route.params || {};
    const query = route.query || {};
    const allowedMap = {
      "1001": "category",
      "2002": "warehouse",
      "3003": "pack",
      "4004": "combo"
    };
    const typeVal = query.type != null ? String(query.type).trim() : "";
    if (typeVal === "0000") {
      this.showCategoryTab = true;
      this.groupBy = "category";
      this.headerMode = "order";
      this.hideAmounts = false;
      this.onlyWarehouseId = null;
    } else if (typeVal === "6006") {
      this.showCategoryTab = false;
      this.groupBy = "warehouse";
      this.headerMode = "order";
      this.hideAmounts = false;
      this.onlyWarehouseId = 2;
      this.onlyThreeCols = true;
      this.hideUsd = true;
      this.hideFooter = true;
    } else if (typeVal && allowedMap[typeVal]) {
      this.showCategoryTab = false;
      this.groupBy = allowedMap[typeVal];
      this.headerMode = "order";
      this.hideAmounts = false;
      this.onlyWarehouseId = null;
    } else {
      this.showCategoryTab = false;
      this.groupBy = "category";
      this.headerMode = "order";
      this.hideAmounts = true;
      this.onlyWarehouseId = null;
    }
    let fromRoute = params.orderId || params.id || query.orderId || query.id || "";
    fromRoute = String(fromRoute || "").trim();
    if (fromRoute) {
      this.orderIdInput = fromRoute;
      this.activeOrderId = fromRoute;
      this.load();
    }
  },
  beforeDestroy() {
    try {
      if (typeof document !== "undefined") {
        if (document.body) document.body.style.overflow = this._prevBodyOverflow || "";
        const html = document.documentElement;
        if (html) html.style.overflow = this._prevHtmlOverflow || "";
      }
    } catch (e) {}
  }
};

function chainAdd(a, b) {
  return Number((Number(a || 0) + Number(b || 0)).toFixed(10));
}
function chainSub(a, b) {
  return Number((Number(a || 0) - Number(b || 0)).toFixed(10));
}
function chainMul(a, b) {
  return Number((Number(a || 0) * Number(b || 0)).toFixed(10));
}
function sortNumStr(a, b) {
  const sa = a == null ? "" : String(a).trim();
  const sb = b == null ? "" : String(b).trim();
  if (!sa && !sb) return 0;
  if (!sa) return 1;
  if (!sb) return -1;
  const na = Number(sa);
  const nb = Number(sb);
  const fa = Number.isFinite(na);
  const fb = Number.isFinite(nb);
  if (fa && fb) return na - nb;
  if (fa) return -1;
  if (fb) return 1;
  return sa.localeCompare(sb, undefined, { numeric: true, sensitivity: "base" });
}
</script>

<style>
.sorPublicPage .publicUiHide,
.sorPublicPage .publicUiHide.el-button,
.sorPublicPage .publicUiHide.el-button-group,
.pdfPreviewBody .publicUiHide,
.pdfPreviewBody .publicUiHide.el-button,
.pdfPreviewBody .publicUiHide.el-button-group {
  display: none !important;
}
.sorPublicPage .paper .hideThreeColsUi,
.pdfPreviewBody .paper .hideThreeColsUi {
  display: none !important;
}
.sorPublicPage .paper .hideUsdUi,
.pdfPreviewBody .paper .hideUsdUi {
  display: none !important;
}
.sorPublicPage .paper .hideFooterUi,
.pdfPreviewBody .paper .hideFooterUi {
  display: none !important;
}
.sorPublicPage .previewWorkbench.hideAmountsMode .hideAmountsUi,
.sorPublicPage .previewWorkbench.hideAmountsMode .hideAmountsUi.td,
.sorPublicPage .paper.hideAmountsMode .hideAmountsUi,
.sorPublicPage .paper.hideAmountsMode .hideAmountsUi.td,
.pdfPreviewBody .paper.hideAmountsMode .hideAmountsUi,
.pdfPreviewBody .paper.hideAmountsMode .hideAmountsUi.td {
  display: none !important;
}
</style>

<style scoped>
.sorPublicPage {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 12px;
}
.entryForm {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  margin: -12px;
}
.entryBox {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 10px;
  padding: 36px 32px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.18);
}
.entryTitle {
  margin: 0 0 8px 0;
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  text-align: center;
}
.entryTip {
  margin: 0 0 20px 0;
  font-size: 13px;
  color: #909399;
  text-align: center;
}
.entryInput {
  margin-bottom: 16px;
}
.entryBtn {
  width: 100%;
  margin-bottom: 8px;
}
.entryError {
  margin-top: 12px;
  padding: 8px 12px;
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  color: #f56c6c;
  border-radius: 4px;
  font-size: 13px;
  text-align: center;
}
.errorBar,
.loadingBar {
  max-width: 760px;
  margin: 0 auto 12px auto;
  padding: 10px 16px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}
.errorBar {
  border-color: #fbc4c4;
  color: #f56c6c;
}
.errorBar .el-button {
  margin-left: auto;
}
.loadingBar {
  color: #409EFF;
  justify-content: center;
}
.floatTools {
  position: fixed;
  right: 18px;
  top: 24px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.previewWorkbench {
  width: 760px;
  margin: 0 auto;
}
.previewWorkbench.metricsMode {
  width: 940px;
}
.switchBar {
  width: 100%;
  margin: 0 0 10px 0;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.paper {
  width: 760px;
  background: #fff;
  border: 1px solid #dcdfe6;
  flex: 0 0 auto;
}
.paper.metricsMode {
  width: 940px;
}
.paper.invoiceMode {
  border-color: #333;
}
@media print {
  .switchBar {
    display: none !important;
  }
  .floatTools {
    display: none !important;
  }
  .sorPublicPage {
    padding: 0 !important;
    background: #fff !important;
  }
  .previewWorkbench,
  .previewWorkbench.metricsMode {
    width: auto !important;
  }
  .paper {
    border: 0 !important;
    width: 100% !important;
    max-width: none !important;
  }
  .paper.metricsMode {
    width: 100% !important;
    max-width: none !important;
  }
}
.header {
  display: flex;
  border-bottom: 1px solid #333;
}
.headerLeft {
  flex: 1;
  padding: 10px 12px;
}
.headerRight {
  width: 180px;
  border-left: 1px solid #333;
  padding: 10px 12px;
}
.brandRow {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.brand {
  font-size: 20px;
  font-weight: 700;
}
.title {
  font-size: 16px;
  font-weight: 700;
}
.cnTitle {
  font-size: 18px;
  font-weight: 700;
}
.line {
  font-size: 12px;
  line-height: 16px;
}
.red {
  color: #d40000;
}
.qrGroup {
  display: flex;
  gap: 10px;
  justify-content: space-between;
}
.qrBox {
  width: 76px;
  text-align: center;
}
.qrPlaceholder {
  width: 76px;
  height: 76px;
  border: 1px solid #333;
  box-sizing: border-box;
  margin: 0 auto;
  background: #fff;
}
.qrImgBox {
  width: 76px;
  height: 76px;
  border: 1px solid #333;
  margin: 0 auto;
  box-sizing: border-box;
  padding: 2px;
  background: #fff;
}
.qrImg {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.qrLabel {
  font-size: 12px;
  margin-top: 4px;
}
.invoiceHeader {
  border-bottom: 0;
}
.invoiceGrid {
  display: grid;
  grid-template-columns: 1fr 240px;
  grid-template-rows: auto auto auto auto;
}
.invoiceCell {
  padding: 8px 10px;
  font-size: 12px;
  color: #303133;
}
.invoiceSellerCell {
  grid-column: 1;
  grid-row: 1;
  border-right: 1px solid #333;
  border-bottom: 1px solid #333;
  min-height: 78px;
}
.invoiceToCell {
  grid-column: 1;
  grid-row: 2;
  border-right: 1px solid #333;
  border-bottom: 1px solid #333;
  min-height: 58px;
}
.invoiceTitleCell {
  grid-column: 2;
  grid-row: 1 / 3;
  border-bottom: 1px solid #333;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.invoiceNoteCell {
  grid-column: 1;
  grid-row: 3;
  border-right: 1px solid #333;
  border-bottom: 1px solid #333;
  padding: 6px 10px;
  line-height: 16px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}
.invoiceNoDateCell {
  grid-column: 2;
  grid-row: 3;
  border-bottom: 1px solid #333;
  padding: 6px 10px;
}
.invoiceAgreementCell {
  grid-column: 1 / 3;
  grid-row: 4;
  border-bottom: 1px solid #333;
  padding: 10px 10px;
  font-size: 13px;
  line-height: 18px;
  text-align: center;
}
.invoicePrintText {
  display: none;
  white-space: pre-wrap;
  line-height: 16px;
  font-size: 12px;
  color: #303133;
}
.invoiceLabel {
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 4px;
}
.invoiceTitle {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.04em;
}
.invoiceNoDateRow {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 16px;
}
.invoiceFooter {
  border-top: 0;
}
.invoiceFooterBox {
  border-left: 0;
  border-right: 0;
}
.invoiceFooterTable {
  display: grid;
  grid-template-columns: 300px 1fr;
  grid-template-rows: auto auto;
  border-bottom: 1px solid #333;
}
.invoiceFooterCell {
  padding: 8px 10px;
  font-size: 12px;
  line-height: 16px;
  color: #303133;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.invoiceFooterTable .invoiceFooterCell:nth-child(1),
.invoiceFooterTable .invoiceFooterCell:nth-child(2) {
  border-bottom: 1px solid #333;
}
.invoiceFooterLabel {
  border-right: 1px solid #333;
  font-weight: 700;
}
.invoiceFooterTerms {
  padding: 10px 10px;
  font-size: 12px;
  line-height: 18px;
  color: #303133;
  border-bottom: 1px solid #333;
}
.invoiceFooterBank {
  padding: 8px 10px 12px 10px;
}
.invoiceNoDateItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  width: 100%;
}
.invoiceMetaLabel {
  font-weight: 700;
}
.invoiceMetaVal {
  font-weight: 600;
}
.meta {
  border-bottom: 1px solid #333;
}
.metaRow {
  display: flex;
  border-top: 1px solid #333;
}
.metaRow:first-child {
  border-top: 0;
}
.metaCol {
  flex: 1;
  border-right: 1px solid #333;
  padding: 6px 10px;
  font-size: 12px;
}
.metaCol:last-child {
  border-right: 0;
}
.metaVal {
  font-weight: 600;
}
.table {
  border-bottom: 1px solid #333;
}
.tr {
  display: flex;
  border-top: 1px solid #333;
}
.tr:first-child {
  border-top: 0;
}
.td {
  border-right: 1px solid #333;
  padding: 4px 4px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-sizing: border-box;
}
.td:last-child {
  border-right: 0;
}
.head .td {
  font-weight: 700;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
}
.en {
  font-size: 11px;
  font-weight: 700;
}
.no {
  width: 70px;
  flex: 0 0 70px;
  font-size: 25px;
  font-weight: 700;
}
.noCopyable {
  cursor: pointer;
  user-select: none;
  transition: background 0.15s ease, color 0.15s ease;
  position: relative;
}
.noCopyable:hover {
  background: #ecf5ff;
  color: #409eff;
}
.noCopyable::after {
  content: "点击复制分类汇总";
  position: absolute;
  top: 50%;
  left: calc(100% + 8px);
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.78);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: normal;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
  z-index: 99;
}
.noCopyable:hover::after {
  opacity: 1;
}
.desc {
  width: 130px;
  flex: 0 0 130px;
}
.pic {
  width: 250px;
  flex: 0 0 250px;
}
.qty {
  width: 80px;
  flex: 0 0 80px;
}
.price {
  width: 80px;
  flex: 0 0 80px;
}
.td.price .uPriceCell {
  width: 100%;
  min-width: 0;
  white-space: normal;
  word-break: break-all;
  overflow-wrap: anywhere;
  line-height: 1.15;
}
.amount {
  width: 100px;
  flex: 0 0 100px;
}
.usd {
  width: 90px;
  flex: 0 0 90px;
}
.exchangeRateCell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0;
  flex-wrap: nowrap;
}
.exchangeRatePrefix {
  color: inherit;
  font-weight: inherit;
  white-space: nowrap;
}
.exchangeRateStaticPrint {
  display: none;
  white-space: nowrap;
  color: inherit;
  font-weight: inherit;
}
.exchangeRateInput {
  width: 58px;
}
.exchangeRateInput >>> .el-input__inner {
  text-align: left;
  padding: 0 2px;
  border: none;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  color: inherit;
  font-weight: inherit;
  font-size: inherit;
  font-family: inherit;
  height: 22px;
  line-height: 22px;
}
.exchangeRateInput >>> .el-input__inner:focus {
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  background: #fff;
  padding: 0 6px;
}
@media print {
  .exchangeRateInputScreen,
  .exchangeRatePrefixScreen,
  .uPriceInputScreen {
    display: none !important;
  }
  .exchangeRateStaticPrint {
    display: inline-block !important;
  }
  .uPriceStaticPrint {
    display: inline-block !important;
    width: 100%;
    text-align: center;
  }
}
.uPriceStaticPrint {
  display: none;
  color: inherit;
  font-weight: inherit;
  font-size: inherit;
  white-space: nowrap;
}
.uPriceInput {
  width: 72px;
  margin: 0 auto;
}
.uPriceInput >>> .el-input__inner {
  text-align: center;
  padding: 0 4px;
  border: none;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  color: inherit;
  font-weight: inherit;
  font-size: inherit;
  font-family: inherit;
  height: 24px;
  line-height: 24px;
}
.uPriceInput >>> .el-input__inner:focus {
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  background: #fff;
}
.metric {
  width: 90px;
  flex: 0 0 90px;
}
.big {
  font-size: 14px;
  font-weight: 600;
}
.picGrid {
  display: grid;
  grid-template-columns: repeat(4, 50px);
  gap: 8px;
  justify-content: start;
  width: 100%;
  padding: 6px 0;
}
.picGrid.singleCol {
  grid-template-columns: 50px;
  justify-content: end;
  justify-items: end;
}
.picGrid.singleCol .picItem {
  align-items: flex-end;
}
.picGrid.singleCol .imgQty {
  width: 50px;
  text-align: center;
}
.picItem {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.imgBox {
  width: 50px;
  height: 70px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.imgBox img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.imgQty {
  font-size: 16px;
  font-weight: 700;
  color: #d40000;
}
.footLabel {
  font-weight: 700;
}
.redLabel {
  color: #d40000;
}
.redVal {
  color: #d40000;
}
.summary {
  display: flex;
}
.sumLeft {
  flex: 1;
  border-right: 1px solid #333;
  padding: 10px;
  min-height: 120px;
}
.sumTitle {
  font-size: 12px;
  font-weight: 700;
  color: #d40000;
}
.sumNote {
  margin-top: 8px;
  font-size: 12px;
  line-height: 18px;
  color: #303133;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 36px;
}
.sumRight {
  width: 270px;
  flex: 0 0 270px;
}
.sumRow {
  display: flex;
  border-top: 1px solid #333;
}
.sumRow:first-child {
  border-top: 0;
}
.sumLabel {
  width: 110px;
  flex: 0 0 110px;
  border-right: 1px solid #333;
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
}
.sumVal {
  flex: 1;
  padding: 6px 10px;
  font-size: 14px;
  font-weight: 700;
  text-align: right;
}
</style>
