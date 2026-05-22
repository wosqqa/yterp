<template>
  <div class="sorPrint">
    <div class="floatTools">
      <el-button size="mini" @click="toggleImgQty">{{ imgQtyHidden ? "显示数量" : "隐藏数量" }}</el-button>
      <el-button size="mini" @click="toggleUnitPrice">{{ unitPriceHidden ? "显示单价" : "隐藏单价" }}</el-button>
    </div>
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
    <div class="paper" :class="{ comboMode: groupBy === 'combo', invoiceMode: headerMode === 'invoice' }">
      <div v-if="headerMode !== 'invoice'" class="header">
        <div class="headerLeft">
          <div class="brandRow">
            <div class="brand">Kim Bags</div>
            <div class="title">CUSTOMER ORDER</div>
            <div class="cnTitle">希悦箱包</div>
          </div>
          <div class="line">地址：湖南省邵东市国际商贸城東二区二楼207#783号</div>
          <div class="line">
            ADD：No. 783, 207 Gallery, Second Floor, East Second District, Shaodong International Business City,
            Shaodong City, Hunan Province
          </div>
          <div class="line">EMAIL：kimbagfactory@outlook.com</div>
          <div class="line red">MOB & WhatsApp：+8619535838073 Kim</div>
        </div>
        <div class="headerRight">
          <div class="qrGroup">
            <div class="qrBox">
              <div class="qr"></div>
              <div class="qrLabel">WeChat</div>
            </div>
            <div class="qrBox">
              <div class="qr"></div>
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
            <div class="en red">1USD={{ exchangeRate }}RMB</div>
          </div>
        </div>

        <div class="tr" v-for="row in rows" :key="row.key">
          <div class="td no">{{ row.no }}</div>
          <div class="td desc big">{{ row.desc }}</div>
          <div class="td pic">
            <div class="picGrid">
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
        </div>

        <div class="tr foot">
          <div class="td no"></div>
          <div class="td desc footLabel">Freight</div>
          <div class="td pic"></div>
          <div class="td qty big">{{ totalQty }}</div>
          <div class="td price">
            <el-input
              class="freightInput"
              size="mini"
              :value="freightManual"
              @input="freightManual = $event"
              @blur="freightManualBlur"
            ></el-input>
          </div>
          <div class="td amount">￥{{ totalRmb }}</div>
          <div class="td usd">${{ totalUsd }}</div>
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
                class="depositInput"
                size="mini"
                :value="depositManual"
                @input="depositManual = $event"
                @blur="depositManualBlur"
              ></el-input>
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
</template>

<script>
export default {
  name: "SorPrint",
  props: {
    action: {
      type: String,
      default: "sor/get"
    },
    source: {
      default: null
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
      freightManual: 30,
      depositManual: 0,
      imgQtyHidden: false,
      unitPriceHidden: false,
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
        data: ""
      },
      detailRows: [],
      totalPay: "0.00"
    };
  },
  created() {
    this.loadInvoiceDraft();
    this.load();
  },
  watch: {
    source() {
      this.load();
    }
  },
  computed: {
    store() {
      return this.$store.state;
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
    orderDateDisplay() {
      return this.formatDate(this.classData.time);
    },
    deliveryDateDisplay() {
      const base = this.classData.time || this.classData.arrival;
      const added = this.addDaysToDate(base, 7);
      return added || this.formatDate(this.classData.arrival);
    },
    rows() {
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
            unitPriceVal: null
          };
          order.push(key);
        }
        const qty = Number(item.nums) || 0;
        const amt = item.tpt != null && item.tpt !== "" ? Number(item.tpt) : Number(item.total) || 0;
        map[key].ttQty = this.$calc.chain(map[key].ttQty).add(qty).done();
        map[key].amountVal = this.$calc.chain(map[key].amountVal).add(amt).done();
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
        return sa.localeCompare(sb);
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
        return sa.localeCompare(sb);
      };
      const rowMap = {};
      baseRows.forEach(r => (rowMap[r.key] = r));
      const out = [];
      if (this.groupBy === "warehouse") {
        warehouseOrder.sort(sortWarehouseKey).forEach(warehouseKey => {
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
        return sa.localeCompare(sb);
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
      return total.done();
    },
    totalRmb() {
      return this.formatMoney(this.totalRmbVal, 2);
    },
    totalUsd() {
      const usd = this.exchangeRate ? this.totalRmbVal / this.exchangeRate : 0;
      return this.formatMoney(usd, 2);
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
    setGroupBy(val) {
      this.groupBy = val;
      this.headerMode = "order";
    },
    enterInvoice() {
      this.headerMode = "invoice";
      this.ensureInvoiceDefaults();
    },
    getInvoiceKey(part) {
      return "sorPrint:commercialInvoice:" + String(part || "");
    },
    loadInvoiceDraft() {
      try {
        const seller = localStorage.getItem(this.getInvoiceKey("seller"));
        const to = localStorage.getItem(this.getInvoiceKey("to"));
        const totalText = localStorage.getItem(this.getInvoiceKey("totalText"));
        const wordsText = localStorage.getItem(this.getInvoiceKey("wordsText"));
        const bankText = localStorage.getItem(this.getInvoiceKey("bankText"));
        this.invoiceSeller = seller != null ? seller : "";
        this.invoiceTo = to != null ? to : "";
        this.invoiceTotalText = totalText != null ? totalText : "";
        this.invoiceWordsText = wordsText != null ? wordsText : "";
        this.invoiceBankText = bankText != null ? bankText : "";
      } catch (e) {
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
      } catch (e) {}
    },
    persistInvoiceDraftDebounced() {
      this.invoiceSaveTimer && clearTimeout(this.invoiceSaveTimer);
      this.invoiceSaveTimer = setTimeout(() => {
        this.persistInvoiceDraft();
      }, 200);
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
        "Beneficiary account number: 7996000652695",
        "Beneficiary bank address: 11th Floor, The Center, 99 Queen's Road Central, Central, Hong Kong",
        "Beneficiary bank swift code: DHBKKHH"
      ].join("\n");
    },
    ensureInvoiceDefaults() {
      const seller = String(this.invoiceSeller || "").trim();
      const to = String(this.invoiceTo || "").trim();
      if (!seller) this.invoiceSeller = this.getDefaultInvoiceSeller();
      if (!to) this.invoiceTo = this.getDefaultInvoiceTo();
      const totalText = String(this.invoiceTotalText || "").trim();
      const wordsText = String(this.invoiceWordsText || "").trim();
      const bankText = String(this.invoiceBankText || "").trim();
      if (!totalText) this.invoiceTotalText = this.getDefaultInvoiceTotalText();
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
    ensureStoreLoaded() {
      const hasCategory = Array.isArray(this.store.category) && this.store.category.length > 0;
      const hasWarehouse = Array.isArray(this.store.warehouse) && this.store.warehouse.length > 0;
      if (hasCategory && hasWarehouse) return Promise.resolve(true);
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
    freightManualBlur() {
      const n = Number(String(this.freightManual).replace(/,/g, ""));
      this.freightManual = Number.isFinite(n) ? n : 30;
    },
    depositManualBlur() {
      const n = Number(String(this.depositManual).replace(/,/g, ""));
      this.depositManual = Number.isFinite(n) ? n : 0;
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
            data: cls.data || ""
          };
          this.detailRows = Array.isArray(result.info.info) ? result.info.info : [];
          const customerId =
            cls.customer ||
            (cls.customerData && cls.customerData.id) ||
            (cls.customerData && cls.customerData.key) ||
            null;
          const customerData = cls.customerData || null;
          Promise.resolve()
            .then(() => this.ensureStoreLoaded())
            .then(() => {
              if (customerData) {
                this.setCustomerInfoFromCustomerData(customerData);
                return true;
              }
              return this.fetchCustomerInfo(customerId);
            });
        } else if (result.state == "error") {
          this.$message({ type: "warning", message: result.info });
        } else {
          this.$message({ type: "error", message: "[ ERROR ] 服务器响应超时!" });
        }
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
    formatMoney(num, digits) {
      const n = Number(num);
      if (!Number.isFinite(n)) return "0.00";
      const fixed = n.toFixed(digits);
      const parts = fixed.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
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
.switchBar {
  width: 760px;
  margin: 0 auto 10px auto;
  display: flex;
  justify-content: space-between;
}
.paper {
  width: 760px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #dcdfe6;
}
.paper.invoiceMode {
  border-color: #333;
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
  .sorPrint {
    padding: 0 !important;
    background: #fff !important;
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
  width: 50px;
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
.depositInput {
  width: 100%;
}
.depositInput >>> input {
  text-align: right;
  padding: 0;
  border: none;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  color: #d40000;
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
