<template>
  <div class="sorPrint">
    <div class="floatTools">
      <el-button size="mini" @click="toggleImgQty">{{ imgQtyHidden ? "显示数量" : "隐藏数量" }}</el-button>
      <el-button size="mini" @click="toggleUnitPrice">{{ unitPriceHidden ? "显示单价" : "隐藏单价" }}</el-button>
      <el-button size="mini" @click="toggleHideWarehouse2">{{ hideWarehouse2 ? "显示仓库" : "隐藏仓库" }}</el-button>
      <el-button size="mini" @click="toggleRowDisplay">{{ rowDisplay === "single" ? "合并显示" : "单列显示" }}</el-button>
      <el-button size="mini" @click="toggleMetrics">{{ showMetrics ? "隐藏重量" : "显示重量" }}</el-button>
    </div>
    <div class="previewWorkbench" :class="{ metricsMode: showMetrics }">
      <div class="switchBar">
        <el-button-group>
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
        <el-button-group>
          <el-button size="mini" :type="headerMode === 'invoice' ? 'primary' : 'info'" @click="enterInvoice"
            >商业发票</el-button
          >
        </el-button-group>
        <el-button-group>
          <el-button size="mini" type="success" @click="exportXlsx">导出XLSX</el-button>
          <el-button size="mini" type="primary" @click="openPdfPreview">PDF预览</el-button>
        </el-button-group>
      </div>
      <div class="paper" :class="{ comboMode: groupBy === 'combo', invoiceMode: headerMode === 'invoice', metricsMode: showMetrics }">
          <div v-if="headerMode !== 'invoice'" class="header">
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

          <div v-if="headerMode === 'invoice'" class="invoiceHeader">
        <div class="invoiceGrid">
          <div class="invoiceCell invoiceSellerCell">
            <div class="invoiceLabel">Seller</div>
            <el-input
              class="invoiceInput"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 7 }"
              :value="invoiceSeller"
              @input="onInvoiceSellerInput"
            ></el-input>
            <div class="invoicePrintText">{{ invoiceSeller }}</div>
          </div>

          <div class="invoiceCell invoiceTitleCell">
            <div class="invoiceTitle">COMMERCIAL INVOICE</div>
          </div>

          <div class="invoiceCell invoiceToCell">
            <div class="invoiceLabel">To</div>
            <el-input
              class="invoiceInput"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 7 }"
              :value="invoiceTo"
              @input="onInvoiceToInput"
            ></el-input>
            <div class="invoicePrintText">{{ invoiceTo }}</div>
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

          <div v-if="headerMode !== 'invoice'" class="meta">
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
        <div class="metaRow">
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
          <div class="td no">NO.</div>
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
          <div class="td price">
            <div class="uPriceHead" :style="{ visibility: unitPriceHidden ? 'hidden' : 'visible' }">
              <div>单价</div>
              <div class="en">U/PRICE</div>
            </div>
          </div>
          <div class="td amount">
            <div>总金额</div>
            <div class="en">AMOUNT</div>
          </div>
          <div class="td usd">
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
            <div class="td metric">
              <div>重量</div>
              <div class="en">KG</div>
            </div>
            <div class="td metric">
              <div>体积</div>
              <div class="en">CBM</div>
            </div>
          </template>
        </div>

        <div class="tr" v-for="row in rows" :key="row.key">
          <div
            class="td no"
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
          <div class="td price big">
            <div class="uPriceCell" :style="{ visibility: unitPriceHidden ? 'hidden' : 'visible' }">
              <template v-if="groupBy === 'combo'">{{ row.uPriceText }}</template>
              <template v-else>{{ row.uPrice }}</template>
            </div>
          </div>
          <div class="td amount big">￥{{ row.amount }}</div>
          <div class="td usd big">${{ row.usd }}</div>
          <template v-if="showMetrics">
            <div class="td metric big">{{ row.weight }}</div>
            <div class="td metric big">{{ row.volume }}</div>
          </template>
        </div>

        <div class="tr foot">
          <div class="td no"></div>
          <div class="td desc footLabel">Freight</div>
          <div class="td pic"></div>
          <div class="td qty big">{{ totalQty }}</div>
          <div class="td price">
            <el-input
              class="freightInput freightInputScreen"
              size="mini"
              :value="freightManual"
              @input="freightManual = $event"
              @blur="freightManualBlur"
            ></el-input>
            <span class="freightStaticPrint">￥{{ formatMoney(freightVal, 0) }}</span>
          </div>
          <div class="td amount">￥{{ totalRmb }}</div>
          <div class="td usd">${{ totalUsd }}</div>
          <template v-if="showMetrics">
            <div class="td metric">{{ totalWeight }}</div>
            <div class="td metric">{{ totalVolume }}</div>
          </template>
        </div>
      </div>

          <div v-if="headerMode === 'invoice'" class="invoiceFooter">
        <div class="invoiceFooterBox">
          <div class="invoiceFooterTable">
            <div class="invoiceFooterCell invoiceFooterLabel">Total:</div>
            <div class="invoiceFooterCell invoiceFooterVal">
              <el-input class="invoiceInput" :value="invoiceTotalText" @input="onInvoiceTotalInput"></el-input>
              <div class="invoicePrintText">{{ invoiceTotalText }}</div>
            </div>
            <div class="invoiceFooterCell invoiceFooterLabel">Total Amount in Words:</div>
            <div class="invoiceFooterCell invoiceFooterVal">
              <el-input class="invoiceInput" :value="invoiceWordsText" @input="onInvoiceWordsInput"></el-input>
              <div class="invoicePrintText">{{ invoiceWordsText }}</div>
            </div>
          </div>
          <div class="invoiceFooterTerms">
            <div>1.delivery time:delivery one week after payment.</div>
            <div>2.payment terms:50% TT in advance,and the balanced should be paid before shipping</div>
          </div>
          <div class="invoiceFooterBank">
            <el-input
              class="invoiceInput"
              type="textarea"
              :autosize="{ minRows: 5, maxRows: 10 }"
              :value="invoiceBankText"
              @input="onInvoiceBankInput"
            ></el-input>
            <div class="invoicePrintText">{{ invoiceBankText }}</div>
          </div>
        </div>
      </div>

          <div v-if="headerMode !== 'invoice'" class="summary">
        <div class="sumLeft">
          <div class="sumTitle">NOTE：</div>
          <div class="sumNoteWrap">
            <textarea
              class="sumNoteInput sumNoteInputScreen"
              rows="3"
              v-model="noteManual"
              placeholder="在这里输入备注（打印时会显示）..."
            ></textarea>
            <div class="sumNoteStaticPrint">{{ noteText }}</div>
          </div>
        </div>
        <div class="sumRight">
          <div class="sumRow">
            <div class="sumLabel">TOTAL</div>
            <div class="sumVal">￥ {{ totalWithFreight }}</div>
          </div>
          <div class="sumRow">
            <div class="sumLabel redLabel">DEPOSIT</div>
            <div class="sumVal redVal">
              <el-input
                class="depositInput depositInputScreen"
                size="mini"
                :value="depositManual"
                @input="depositManual = $event"
                @blur="depositManualBlur"
              ></el-input>
              <span class="depositStaticPrint">￥ {{ formatMoney(depositVal, 2) }}</span>
            </div>
          </div>
          <div class="sumRow">
            <div class="sumLabel">BALANCE</div>
            <div class="sumVal">￥ {{ balance }}</div>
          </div>
        </div>
      </div>
      </div>
    </div>
    <div v-if="showCategorySummary" class="summaryFloat" :class="{ metricsMode: showMetrics }">
      <div class="summaryFilterBar">
        <span class="summaryFilterLabel">仓库</span>
        <el-select
          size="mini"
          clearable
          :value="summaryWarehouse"
          placeholder="全部仓库"
          @change="summaryWarehouse = $event"
        >
          <el-option
            v-for="item in summaryWarehouseOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          ></el-option>
        </el-select>
      </div>
      <CategorySummaryPanel
        class="summaryAside"
        :rows="summaryRows"
        :category-path="'goodsData.category'"
        :qty-path="'nums'"
        :default-price-path="'goodsData.buy'"
        :table-height="null"
      ></CategorySummaryPanel>
    </div>
  </div>
</template>

<script>
import CategorySummaryPanel from "@/components/lib/CategorySummaryPanel";

export default {
  name: "SorPrint",
  components: {
    CategorySummaryPanel
  },
  props: {
    action: {
      type: String,
      default: "sor/get"
    },
    source: {
      default: null
    },
    summaryEnabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      headerMode: "order",
      invoiceSeller: "",
      invoiceTo: "",
      invoiceTotalText: "",
      invoiceWordsText: "",
      invoiceBankText: "",
      invoiceSaveTimer: null,
      exchangeRate: 6.85,
      exchangeRateManual: "6.85",
      freightManual: 30,
      depositManual: 0,
      noteManual: "",
      imgQtyHidden: false,
      unitPriceHidden: false,
      hideWarehouse2: false,
      showMetrics: false,
      rowDisplay: "merge",
      groupBy: "category",
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
      sellerInfo: {
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
      },
      sellerInfoLoaded: false,
      summaryWarehouse: "",
      detailRows: [],
      totalPay: "0.00"
    };
  },
  created() {
    this.load();
  },
  watch: {
    source() {
      this.load();
    },
    totalRmbVal() {
      this.refreshInvoiceTotalIfNeeded();
    },
    freightVal() {
      this.refreshInvoiceTotalIfNeeded();
      this.persistFreightDebounced();
    },
    noteManual() {
      this.persistInvoiceDraftDebounced();
    }
  },
  computed: {
    store() {
      return this.$store.state;
    },
    showCategorySummary() {
      return this.summaryEnabled && this.headerMode !== "invoice" && String(this.action || "").trim() === "sell/get";
    },
    summaryWarehouseOptions() {
      const map = {};
      const list = [];
      for (const item of this.detailRows || []) {
        const idRaw = item && item.warehouse != null ? item.warehouse : "";
        const id = String(idRaw).trim();
        if (!id || map[id]) continue;
        const label =
          this.$lib.objectSeek(item, "warehouseData.name") ||
          this.getWarehouseName(idRaw) ||
          "未分配仓库";
        map[id] = true;
        list.push({ value: id, label });
      }
      return list;
    },
    summaryRows() {
      const selected = String(this.summaryWarehouse || "").trim();
      if (!selected) return this.detailRows;
      return (this.detailRows || []).filter(item => String(item && item.warehouse != null ? item.warehouse : "").trim() === selected);
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
      return this.formatDate(this.classData.time);
    },
    deliveryDateDisplay() {
      const base = this.classData.time || this.classData.arrival;
      const added = this.addDaysToDate(base, 7);
      return added || this.formatDate(this.classData.arrival);
    },
    rows() {
      if (this.rowDisplay === "single" && this.groupBy === "warehouse") {
        const map = {};
        const order = [];
        const warehouseCategoryOrder = {};
        const warehouseOrder = [];

        for (const item of this.detailRows) {
          const goods = this.$lib.objectSeek(item, "goodsData") || {};
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
          const amt = this.normalizeMoneyValue(
            item && item.tpt != null && item.tpt !== "" ? item.tpt : item && item.total
          );
          const itemMetrics = this.getItemMetrics(item);
          map[key].ttQty = this.$calc.chain(map[key].ttQty).add(qty).done();
          map[key].amountVal = this.$calc.chain(map[key].amountVal).add(amt).done();
          map[key].weightVal = this.$calc.chain(map[key].weightVal).add(itemMetrics.weightVal).done();
          map[key].volumeVal = this.$calc.chain(map[key].volumeVal).add(itemMetrics.volumeVal).done();
          map[key].unitPriceVal == null && (map[key].unitPriceVal = Number(item && item.price) || 0);

          const picKey = item && item.id != null ? String(item.id) : this.$lib.getUniqid();
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

        const sortWarehouseKey = (a, b) => {
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
          return sa.localeCompare(sb);
        };

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
          const goods = this.$lib.objectSeek(item, "goodsData") || {};
          const categoryInfo = this.getCategoryInfo(item, goods);
          const qty = Number(item && item.nums) || 0;
          const amt = this.normalizeMoneyValue(
            item && item.tpt != null && item.tpt !== "" ? item.tpt : item && item.total
          );
          const usdVal = this.exchangeRate ? amt / this.exchangeRate : 0;
          const itemMetrics = this.getItemMetrics(item);
          const wid = item && item.warehouse != null ? String(item.warehouse) : "";
          if (this.hideWarehouse2 && wid === "2") continue;
          const desc = goods.data || goods.name || goods.number || (categoryInfo && categoryInfo.label) || "";
          const picKey =
            (goods.id != null ? String(goods.id) : goods.number != null ? String(goods.number) : "") ||
            (item && item.id != null ? "row-" + item.id : this.$lib.getUniqid());
          out.push({
            key: item && item.id != null ? "row-" + item.id : this.$lib.getUniqid(),
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
            uPrice: this.formatMoney(Number(item && item.price) || 0, 0),
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
        const goods = this.$lib.objectSeek(item, "goodsData") || {};
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
        const amt = this.normalizeMoneyValue(item.tpt != null && item.tpt !== "" ? item.tpt : item.total);
        const itemMetrics = this.getItemMetrics(item);
        map[key].ttQty = this.$calc.chain(map[key].ttQty).add(qty).done();
        map[key].amountVal = this.$calc.chain(map[key].amountVal).add(amt).done();
        map[key].weightVal = this.$calc.chain(map[key].weightVal).add(itemMetrics.weightVal).done();
        map[key].volumeVal = this.$calc.chain(map[key].volumeVal).add(itemMetrics.volumeVal).done();
        if (this.groupBy === "combo") {
          map[key].unitPriceVal = map[key].amountVal;
        } else {
          map[key].unitPriceVal == null && (map[key].unitPriceVal = Number(item.price) || 0);
        }

        const gid = goods.id == null ? "" : String(goods.id);
        const picKey = gid || this.$lib.getUniqid();
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
        map[key].picsMap[picKey].qty = this.$calc.chain(map[key].picsMap[picKey].qty).add(qty).done();
      }
      const baseRows = order.map(k => {
        const row = map[k];
        const pics = Object.values(row.picsMap);
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
      const sortWarehouseKey = (a, b) => {
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
      };
      const sortPackKey = (a, b) => {
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
      };
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
    comboGroups() {
      if (this.groupBy !== "combo") return [];
      const groupMap = {};
      const order = [];
      for (const item of this.detailRows) {
        const goods = this.$lib.objectSeek(item, "goodsData") || {};
        const raw = goods.data == null ? "" : String(goods.data).trim();
        const key = raw ? raw : "__empty__";
        if (!groupMap[key]) {
          groupMap[key] = { key, label: raw ? raw : "未分类", picsMap: {} };
          order.push(key);
        }
        const gid = goods.id != null ? String(goods.id) : goods.number != null ? String(goods.number) : "";
        const picKey = gid || (item && item.id != null ? "row-" + item.id : this.$lib.getUniqid());
        if (!groupMap[key].picsMap[picKey]) {
          groupMap[key].picsMap[picKey] = {
            key: key + "-" + picKey,
            url: this.getImgUrl(goods)
          };
        }
      }
      const sortKey = (a, b) => {
        const sa = a === "__empty__" ? "" : String(a).trim();
        const sb = b === "__empty__" ? "" : String(b).trim();
        if (!sa && !sb) return 0;
        if (!sa) return 1;
        if (!sb) return -1;
        return sa.localeCompare(sb, undefined, { numeric: true, sensitivity: "base" });
      };
      return order
        .slice()
        .sort(sortKey)
        .map(k => {
          const g = groupMap[k];
          return Object.assign({}, g, { pics: Object.values(g.picsMap) });
        });
    },
    totalQty() {
      if (this.groupBy === "combo") {
        let total = this.$calc.chain(0);
        for (const item of this.detailRows) total.add(Number(item && item.nums) || 0);
        return total.done();
      }
      let total = this.$calc.chain(0);
      for (const row of this.rows) total.add(Number(row.ttQty) || 0);
      return total.done();
    },
    totalRmbVal() {
      let total = this.$calc.chain(0);
      for (const row of this.rows) total.add(Number(row.amountVal) || 0);
      return this.normalizeMoneyValue(total.done());
    },
    totalRmb() {
      return this.formatMoney(this.totalRmbVal, 2);
    },
    totalUsd() {
      const usd = this.exchangeRate ? this.totalRmbVal / this.exchangeRate : 0;
      return this.formatMoney(usd, 2);
    },
    totalWeightVal() {
      let total = this.$calc.chain(0);
      for (const row of this.rows) total.add(Number(row && row.weightVal) || 0);
      return total.done();
    },
    totalWeight() {
      return this.formatMeasure(this.totalWeightVal);
    },
    totalVolumeVal() {
      let total = this.$calc.chain(0);
      for (const row of this.rows) total.add(Number(row && row.volumeVal) || 0);
      return total.done();
    },
    totalVolume() {
      return this.formatMeasure(this.totalVolumeVal);
    },
    noteText() {
      const raw = (this.noteManual != null && this.noteManual !== undefined) ? String(this.noteManual) : "";
      return raw;
    },
    freightVal() {
      const n = Number(String(this.freightManual).replace(/,/g, ""));
      return Number.isFinite(n) ? n : 0;
    },
    freight() {
      return this.formatMoney(this.freightVal, 2);
    },
    totalWithFreightVal() {
      return this.$calc.chain(this.totalRmbVal).add(this.freightVal).done();
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
      return this.$calc.chain(this.totalWithFreightVal).subtract(this.depositVal).done();
    },
    balance() {
      return this.formatMoney(this.balanceVal, 2);
    }
  },
  methods: {
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
    getInvoiceScope() {
      const num = this.classData && this.classData.number != null ? String(this.classData.number).trim() : "";
      if (num) return encodeURIComponent(num);
      const src = this.source != null ? String(this.source).trim() : "";
      if (src) return encodeURIComponent(src);
      return "global";
    },
    getInvoiceLegacyKey(part) {
      return "sorPrint:commercialInvoice:" + String(part || "");
    },
    getInvoiceKey(part) {
      return "sorPrint:commercialInvoice:" + this.getInvoiceScope() + ":" + String(part || "");
    },
    loadInvoiceDraft() {
      try {
        const scope = this.getInvoiceScope();
        this.freightManual = 30;
        this.depositManual = 0;
        this.noteManual = "";
        const seller = localStorage.getItem(this.getInvoiceKey("seller"));
        const to = localStorage.getItem(this.getInvoiceKey("to"));
        const wordsText = localStorage.getItem(this.getInvoiceKey("wordsText"));
        const bankText = localStorage.getItem(this.getInvoiceKey("bankText"));
        const freightRaw = localStorage.getItem(this.getInvoiceKey("freight"));
        const noteRaw = localStorage.getItem(this.getInvoiceKey("note"));

        const hasAnyScoped =
          seller != null || to != null || wordsText != null || bankText != null || freightRaw != null || noteRaw != null;

        const legacySeller = !hasAnyScoped && scope !== "global" ? localStorage.getItem(this.getInvoiceLegacyKey("seller")) : null;
        const legacyTo = !hasAnyScoped && scope !== "global" ? localStorage.getItem(this.getInvoiceLegacyKey("to")) : null;
        const legacyWordsText = !hasAnyScoped && scope !== "global" ? localStorage.getItem(this.getInvoiceLegacyKey("wordsText")) : null;
        const legacyBankText = !hasAnyScoped && scope !== "global" ? localStorage.getItem(this.getInvoiceLegacyKey("bankText")) : null;

        this.invoiceSeller = "";
        this.invoiceTo = "";
        this.invoiceTotalText = "";
        this.invoiceWordsText = "";
        this.invoiceBankText = "";

        this.invoiceSeller = seller != null ? seller : legacySeller != null ? legacySeller : "";
        this.invoiceTo = to != null ? to : legacyTo != null ? legacyTo : "";
        this.invoiceWordsText = wordsText != null ? wordsText : legacyWordsText != null ? legacyWordsText : "";
        this.invoiceBankText = bankText != null ? bankText : legacyBankText != null ? legacyBankText : "";

        if (freightRaw != null) {
          const freightNum = Number(String(freightRaw).replace(/,/g, ""));
          if (Number.isFinite(freightNum)) this.freightManual = freightNum;
        }
        if (noteRaw != null) {
          this.noteManual = String(noteRaw);
        }

        if (!hasAnyScoped && scope !== "global") this.persistInvoiceDraftDebounced();
      } catch (e) {
        this.freightManual = 30;
        this.depositManual = 0;
        this.noteManual = "";
        this.invoiceSeller = "";
        this.invoiceTo = "";
        this.invoiceTotalText = "";
        this.invoiceWordsText = "";
        this.invoiceBankText = "";
      }
    },
    persistInvoiceDraft() {
      try {
        localStorage.setItem(this.getInvoiceKey("seller"), this.invoiceSeller || "");
        localStorage.setItem(this.getInvoiceKey("to"), this.invoiceTo || "");
        localStorage.setItem(this.getInvoiceKey("totalText"), this.invoiceTotalText || "");
        localStorage.setItem(this.getInvoiceKey("wordsText"), this.invoiceWordsText || "");
        localStorage.setItem(this.getInvoiceKey("bankText"), this.invoiceBankText || "");
        localStorage.setItem(this.getInvoiceKey("freight"), String(this.freightManual != null ? this.freightManual : ""));
        localStorage.setItem(this.getInvoiceKey("note"), this.noteManual != null ? String(this.noteManual) : "");
      } catch (e) {}
    },
    persistInvoiceDraftDebounced() {
      this.invoiceSaveTimer && clearTimeout(this.invoiceSaveTimer);
      this.invoiceSaveTimer = setTimeout(() => {
        this.persistInvoiceDraft();
      }, 200);
    },
    persistFreightDebounced() {
      try {
        localStorage.setItem(this.getInvoiceKey("freight"), String(this.freightManual != null ? this.freightManual : ""));
      } catch (e) {}
    },
    refreshInvoiceTotalIfNeeded() {
      if (this.headerMode === "invoice") {
        this.invoiceTotalText = this.getDefaultInvoiceTotalText();
        this.persistInvoiceDraftDebounced();
      }
    },
    getDefaultInvoiceSeller() {
      return [
        "XiYue Bags",
        "+8619535838073",
        "ADD：No. 783, 207 Gallery, Second Floor, East Second District, Shaodong International Business City",
        "City：Shaodong City, Hunan Province",
        "EMAIL：kimbagfactory@outlook.com"
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
      this.persistInvoiceDraftDebounced();
    },
    onInvoiceSellerInput(val) {
      this.invoiceSeller = val;
      this.persistInvoiceDraftDebounced();
    },
    onInvoiceToInput(val) {
      this.invoiceTo = val;
      this.persistInvoiceDraftDebounced();
    },
    onInvoiceTotalInput(val) {
      this.invoiceTotalText = val;
      this.persistInvoiceDraftDebounced();
    },
    onInvoiceWordsInput(val) {
      this.invoiceWordsText = val;
      this.persistInvoiceDraftDebounced();
    },
    onInvoiceBankInput(val) {
      this.invoiceBankText = val;
      this.persistInvoiceDraftDebounced();
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

      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map(el => el.outerHTML)
        .join("\n");

      const win = window.open("", "_blank");
      if (!win) {
        this.$message && this.$message({ type: "warning", message: "浏览器拦截了预览窗口，请允许弹窗后重试。" });
        return;
      }

      const mmdd = this.$moment ? this.$moment().format("MMDD") : "";
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
    ${styles}
    <style>
      body { margin: 0; background: #f5f5f5; }
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
      .pdfPreviewBody .freightInputScreen{ display:none !important; }
      .pdfPreviewBody .freightStaticPrint{ display:inline-block !important; }
      .pdfPreviewBody .depositInputScreen{ display:none !important; }
      .pdfPreviewBody .depositStaticPrint{ display:inline-block !important; }
      .pdfPreviewBody .exchangeRateInputScreen,
      .pdfPreviewBody .exchangeRatePrefixScreen{ display:none !important; }
      .pdfPreviewBody .exchangeRateStaticPrint{ display:inline-block !important; }

      @media print {
        @page { size: A4; margin: 10mm; }
        body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .pdfPreviewToolbar{ display:none !important; }
        .pdfPreviewBody{ padding: 0 !important; }
        .paper { margin: 0 auto !important; border: 0 !important; }
        .tr { break-inside: avoid; page-break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    <div class="pdfPreviewToolbar">
      <button class="primary" onclick="window.print()">确认导出</button>
      <button onclick="window.close()">关闭预览</button>
      <div class="pdfTitle">${safeToolbarTitle}</div>
      <div class="pdfTip">如需去掉浏览器顶部日期/底部地址，请在打印设置里关闭“页眉页脚”。</div>
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
    toggleImgQty() {
      this.imgQtyHidden = !this.imgQtyHidden;
      try {
        [...document.getElementsByClassName("imgQty")].forEach(el => (el.hidden = this.imgQtyHidden));
      } catch (e) {}
    },
    toggleUnitPrice() {
      this.unitPriceHidden = !this.unitPriceHidden;
      const next = this.unitPriceHidden ? "hidden" : "visible";
      try {
        [...document.getElementsByClassName("uPriceHead")].forEach(el => (el.style.visibility = next));
        [...document.getElementsByClassName("uPriceCell")].forEach(el => (el.style.visibility = next));
      } catch (e) {}
    },
    exportXlsx() {
      if (!this.source) return;
      const mmdd = this.$moment ? this.$moment().format("MMDD") : "";
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

      this.$axios({
        url: "service/exportXlsx",
        method: "post",
        data: {
          template: "sorPrint",
          fileName,
          sheetName: "Order",
          payload: {
            groupBy: this.groupBy,
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
            totalUsd: this.exchangeRate ? this.totalRmbVal / this.exchangeRate : 0,
            totalWithFreight: this.totalWithFreightVal,
            balance: this.balanceVal,
            rows
          }
        },
        responseType: "blob"
      }).then(blob => {
        if (!blob) return;
        const isJson = blob && blob.type && /application\/json/i.test(blob.type);
        if (isJson) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const obj = JSON.parse(String(reader.result || "{}"));
              this.$message && this.$message({ type: "warning", message: obj.info || "导出失败!" });
            } catch (e) {
              this.$message && this.$message({ type: "warning", message: "导出失败!" });
            }
          };
          reader.readAsText(blob);
          return;
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      });
    },
    formatDate(val) {
      if (!val) return "";
      const m = this.$moment ? this.$moment(val) : null;
      return m && m.isValid && m.isValid() ? m.format("YYYY-MM-DD") : String(val);
    },
    addDaysToDate(val, days) {
      if (!val) return "";
      const m = this.$moment ? this.$moment(val) : null;
      if (!m || !m.isValid || !m.isValid()) return "";
      return m.add(days, "days").format("YYYY-MM-DD");
    },
    ensureStoreLoaded(force = false) {
      const hasCategory = Array.isArray(this.store.category) && this.store.category.length > 0;
      const hasWarehouse = Array.isArray(this.store.warehouse) && this.store.warehouse.length > 0;
      if (!force && hasCategory && hasWarehouse) return Promise.resolve(true);
      return this.$axios.post("service/store").then(res => {
        if (res && res.state === "success") {
          res.info && res.info.category && this.$store.commit("upState", { key: "category", val: res.info.category });
          res.info &&
            res.info.warehouse &&
            this.$store.commit("upState", { key: "warehouse", val: res.info.warehouse });
        }
        return true;
      });
    },
    getWarehouseName(id) {
      const target = String(id == null ? "" : id).trim();
      if (!target) return "";
      const hit = (this.store.warehouse || []).find(item => String(item && item.id != null ? item.id : "").trim() === target);
      return hit && hit.name ? String(hit.name) : "";
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
      this.headerMode === "invoice" && this.ensureInvoiceDefaults();
    },
    fetchCustomerInfo(customerId) {
      if (!customerId) {
        this.customerInfo = { name: "", add: "", data: "" };
        this.headerMode === "invoice" && this.ensureInvoiceDefaults();
        return Promise.resolve(true);
      }
      return this.$axios.post("customer/get", { id: customerId }).then(res => {
        if (!res || res.state !== "success") {
          this.customerInfo = { name: "", add: "", data: "" };
          this.headerMode === "invoice" && this.ensureInvoiceDefaults();
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
      return walk(this.store.category || []);
    },
    getCategoryMetrics(item) {
      const goods = this.$lib.objectSeek(item, "goodsData") || {};
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
        weightVal: this.$calc.chain(qty).multiply(metrics.weight).done(),
        volumeVal: this.$calc.chain(qty).multiply(metrics.volume).done()
      };
    },
    freightManualBlur() {
      const n = Number(String(this.freightManual).replace(/,/g, ""));
      this.freightManual = Number.isFinite(n) ? n : 30;
      this.persistFreightDebounced();
      this.refreshInvoiceTotalIfNeeded();
    },
    depositManualBlur() {
      const n = Number(String(this.depositManual).replace(/,/g, ""));
      this.depositManual = Number.isFinite(n) ? n : 0;
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
    load() {
      if (!this.source) return;
      this.$axios.post(this.action, { parm: this.source }).then(result => {
        if (result.state == "success") {
          const cls = result.info.class || {};
          this.classData = {
            number: cls.number || "",
            time: this.formatDate(cls.time || ""),
            arrival: this.formatDate(cls.arrival || ""),
            data: cls.data || "",
            user: cls.user || ""
          };
          this.loadInvoiceDraft();
          this.detailRows = Array.isArray(result.info.info) ? result.info.info : [];
          const customerId =
            cls.customer ||
            (cls.customerData && cls.customerData.id) ||
            (cls.customerData && cls.customerData.key) ||
            null;
          const customerData = cls.customerData || null;
          Promise.resolve()
            .then(() => this.ensureStoreLoaded(true))
            .then(() => {
              if (customerData) {
                this.setCustomerInfoFromCustomerData(customerData);
                return true;
              }
              return this.fetchCustomerInfo(customerId);
            });
          const sellerIdRaw = this.classData.user || (cls.userData && (cls.userData.id || cls.userData.key)) || "";
          const sellerId = Number(sellerIdRaw);
          if (Number.isFinite(sellerId) && sellerId > 0) {
            this.fetchSellerInfo(sellerId);
          } else {
            this.resetSellerInfoToDefaults();
          }
        } else if (result.state == "error") {
          this.$message({ type: "warning", message: result.info });
        } else {
          this.$message({ type: "error", message: "[ ERROR ] 服务器响应超时!" });
        }
      });
    },
    resetSellerInfoToDefaults() {
      const base = this.$options.data().sellerInfo;
      this.sellerInfo = this.$lib.extend(true, {}, base || {});
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
      this.$axios.post("user/get", { id: userId }).then(result => {
        if (result.state === "success" && result.info) {
          const info = result.info || {};
          const rawMore = info.more && typeof info.more === "object" && info.more !== null ? info.more : {};
          const defaults = this.$options.data().sellerInfo || {};
          const more = {
            companyEn: rawMore.companyEn || defaults.companyEn || "",
            companyCn: rawMore.companyCn || defaults.companyCn || "",
            addressCn: rawMore.addressCn || defaults.addressCn || "",
            addressEn: rawMore.addressEn || defaults.addressEn || "",
            email: rawMore.email || defaults.email || "",
            whatsapp: rawMore.whatsapp || defaults.whatsapp || "",
            contactName: rawMore.contactName || defaults.contactName || "",
            wechatQr: rawMore.wechatQr || defaults.wechatQr || "",
            whatsappQr: rawMore.whatsappQr || defaults.whatsappQr || "",
            exchangeRate: rawMore.exchangeRate != null ? String(rawMore.exchangeRate) : defaults.exchangeRate || ""
          };
          this.sellerInfo = Object.assign({}, defaults, more, {
            tel: info.tel || (more && more.whatsapp) || defaults.tel || ""
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
    getCategoryName(id) {
      const tree = this.store.category || [];
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
    getWarehouseName(id) {
      const target = Number(id);
      if (target === -1) return "未指定仓库";
      const list = this.store.warehouse || [];
      const hit = list.find(w => Number(w.id) === target);
      return hit ? hit.name || "未指定仓库" : "未指定仓库";
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
      const $lib = this.$lib;
      const $calc = this.$calc;
      for (const item of this.detailRows) {
        const pk = item && item.data != null ? String(item.data) : "";
        if (pk !== pKey) continue;
        const goods = ($lib && $lib.objectSeek ? $lib.objectSeek(item, "goodsData") : null) || (item && item.goodsData) || {};
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
        const add = (a, b) => $calc && $calc.chain ? Number($calc.chain(a || 0).add(b || 0).done()) : Number(a || 0) + Number(b || 0);
        qtyMap[cKey] = add(qtyMap[cKey], qty);
        total = add(total, qty);
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
        .sort((a, b) => {
          if (a.sort !== b.sort) return a.sort - b.sort;
          const a2 = String(a.k), b2 = String(b.k);
          return a2 < b2 ? -1 : a2 > b2 ? 1 : 0;
        });
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
        try { this.$message && this.$message.info("当前箱无分类明细"); } catch (e) { alert("当前箱无分类明细"); }
        return;
      }
      const ok = await this.copyTextToClipboard(text);
      const msg = ok ? "已复制：" + text : "复制失败，请手动复制：" + text;
      try {
        this.$message && this.$message({ message: msg, type: "success", duration: 2000 });
      } catch (e) {
        alert(msg);
      }
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
      if (this.$lib.validate("empty", val)) return "";
      if (/^https?:\/\//.test(val)) return val;
      return (this.store.base && this.store.base.cdnSite ? this.store.base.cdnSite : "") + val;
    },
    normalizeMoneyValue(num) {
      const n = Number(String(num == null ? 0 : num).replace(/,/g, ""));
      if (!Number.isFinite(n)) return 0;
      return this.$calc.chain(n).round(2).done();
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
    }
  }
};
</script>

<style scoped>
.floatTools {
  position: fixed;
  right: 18px;
  top: 140px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sorPrint {
  padding: 12px;
  background: #f5f5f5;
  height: 100%;
  overflow: auto;
}
.previewWorkbench {
  width: 812px;
  margin: 0 auto;
}
.previewWorkbench.metricsMode {
  width: 992px;
}
.switchBar {
  width: 100%;
  margin: 0 0 10px 0;
  display: flex;
  justify-content: space-between;
}
.paper {
  /* 内容宽度等于固定列宽之和，外边框另计。 */
  width: 810px;
  box-sizing: content-box;
  background: #fff;
  border: 1px solid #dcdfe6;
  flex: 0 0 auto;
}
.paper.metricsMode {
  width: 990px;
}
.paper.invoiceMode {
  border-color: #333;
}
.summaryFloat {
  position: fixed;
  top: 52px;
  left: calc(50% - 886px);
  z-index: 40;
  width: 420px;
}
.summaryFloat.metricsMode {
  left: calc(50% - 976px);
}
.summaryFilterBar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 8px 10px;
  border: 1px solid #dcdfe6;
  background: #fff;
}
.summaryFilterLabel {
  font-size: 12px;
  color: #606266;
  flex: 0 0 auto;
}
.summaryFilterBar .el-select {
  flex: 1;
}
.summaryAside {
  max-height: none;
}
.comboWrap {
  padding: 12px 12px 18px 12px;
}
.comboGroup {
  margin-bottom: 14px;
}
.comboTitle {
  font-size: 14px;
  font-weight: 700;
  margin: 2px 0 8px 0;
  text-align: left;
}
.comboGrid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}
.comboImgBox {
  width: 100%;
  height: 92px;
  background: #fff;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
}
.comboImgBox img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

@media print {
  .switchBar {
    display: none !important;
  }
  .summaryFloat {
    display: none !important;
  }
  .sorPrint {
    padding: 0 !important;
    background: #fff !important;
  }
  .previewWorkbench,
  .previewWorkbench.metricsMode {
    width: auto !important;
  }
  .paper {
    border: 0 !important;
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
.qr {
  width: 76px;
  height: 76px;
  border: 1px solid #333;
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
.invoiceInput {
  width: 100%;
}
.invoiceInput >>> .el-input__inner {
  border: 0;
  padding: 0;
  line-height: 16px;
  height: auto;
  font-size: 12px;
  color: #303133;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  text-align: center;
}
.invoiceInput >>> .el-textarea__inner {
  border: 0;
  padding: 0;
  line-height: 16px;
  font-size: 12px;
  color: #303133;
  border-radius: 0;
  resize: none;
  box-shadow: none;
  background: transparent;
  overflow: hidden;
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
.invoiceFooterVal .invoicePrintText {
  text-align: center;
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
.invoiceFooterBank .invoiceInput >>> .el-textarea__inner {
  text-align: left;
  overflow: visible;
}
.invoiceFooterBank .invoicePrintText {
  display: none;
  white-space: pre-wrap;
  line-height: 18px;
  font-size: 12px;
  color: #303133;
  text-align: left;
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
  flex-wrap: nowrap;
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
  flex-shrink: 0;
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
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
}
.pic {
  width: 250px;
}
.qty {
  width: 80px;
}
.price {
  width: 80px;
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
}
.usd {
  width: 100px;
}
.metric {
  width: 90px;
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
.freightInput {
  width: 70px;
}
.freightInput >>> input {
  text-align: center;
  padding: 0 6px;
  border: none;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
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
  .freightInputScreen,
  .depositInputScreen,
  .sumNoteInputScreen {
    display: none !important;
  }
  .freightStaticPrint,
  .depositStaticPrint {
    display: inline-block !important;
  }
  .sumNoteStaticPrint {
    display: block !important;
  }
}
.freightStaticPrint,
.depositStaticPrint {
  display: none;
}
.depositInput {
  width: 100%;
}
.depositInput >>> .el-input__inner {
  border: none;
  background: transparent;
  box-shadow: none;
  text-align: right;
  color: #d40000;
  font-weight: 700;
  padding: 0;
}
.depositInput >>> .el-input__inner:focus {
  background: #fff;
}
.sumNoteWrap { position: relative; width: 100%; }
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
.sumNoteInput {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.5;
  color: #303133;
  background: transparent;
  border: none;
  outline: none;
  resize: vertical;
  min-height: 80px;
  margin-top: 8px;
}
.sumNoteInput:focus {
  background: #fff;
}
.sumNoteStaticPrint { display: none; margin-top: 8px; }
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
