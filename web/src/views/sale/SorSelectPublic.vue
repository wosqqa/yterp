<template>
  <div class="publicPickerPage" lang="en">
    <div class="pickerShell">
      <div class="catalogSurface" :inert="selectedPanelOpen || submitDialogVisible || successDialogVisible">
      <div class="topBanner">
        <div class="brandBlock">
          <div class="brandIcon">
            <i class="el-icon-shopping-bag-2"></i>
          </div>
          <div class="brandText">
            <div class="brandTitle">Yuetuo Bags</div>
            <div class="brandSub">Wholesale Selection</div>
          </div>
        </div>
        <button ref="selectedTrigger" class="selectedBtn" type="button" @click="openSelectedPanel">
          <span class="cartIcon"><i class="el-icon-shopping-cart-2"></i><b v-if="selectedTotalQty">{{ selectedTotalQty }}</b></span>
          Selected ({{ selectedTotalQty }})
        </button>
      </div>

      <div class="toolbarCard">
        <div class="toolbarLeft">
          <select v-model="searchForm.type" class="toolbarItem typeItem" aria-label="Product type">
            <option value="">Type</option>
            <option
              v-for="item in typeOptions"
              :key="item.value"
              :value="item.value"
            >{{ item.label }}</option>
          </select>
          <input
            v-model.trim="searchForm.code"
            class="toolbarItem"
            placeholder="Product Code"
            aria-label="Product code"
            @keyup.enter="applyFilters"
          >
          <input
            v-model.trim="searchForm.keyword"
            class="toolbarItem"
            placeholder="Keyword"
            aria-label="Keyword"
            @keyup.enter="applyFilters"
          >
          <button type="button" class="primary searchBtn" @click="applyFilters">{{ loading ? 'Searching...' : 'Search' }}</button>
        </div>
        <div class="catalogStatus">
          <span v-if="exchangeRate" :title="'Reference: ' + exchangeRate.raw + ' CNY/USD. Rounded down to 2 decimals, then minus 0.02.'">
            USD prices · $1 = CNY {{ Number(exchangeRate.effective).toFixed(2) }}
            · {{ exchangeRate.date }} · {{ exchangeRate.source }}
          </span>
          <span v-else-if="priceWarning" class="priceWarning">{{ priceWarning }} <button type="button" @click="loadProducts">Retry</button></span>
          <button v-if="appliedFilters.setGoods" class="backToCatalog" type="button" @click="clearFilters">All styles</button>
        </div>
      </div>

      <div class="contentLayout">
        <div class="catalogCard">
          <div class="gridWrap" :aria-busy="loading">
            <div v-if="loading" class="emptyState" role="status"><i class="el-icon-loading"></i> Loading styles...</div>
            <div v-else-if="loadError" class="emptyState" role="alert">{{ loadError }} <button type="button" class="retryBtn" @click="loadProducts">Retry</button></div>
            <div v-else class="goodsGrid">
              <div
                v-for="item in pagedProducts"
                :key="item.id"
                class="goodsCard"
                :class="{ active: pickedQty(item.id) > 0 }"
              >
                <button type="button" class="cardImageWrap" :aria-label="'Add ' + item.code" @click="addProduct(item)">
                  <el-image
                    v-if="item.image"
                    :src="item.image"
                    fit="contain"
                    class="cardImage"
                  >
                    <span slot="error" class="imageError">Image unavailable</span>
                  </el-image>
                  <span v-else class="imageError">Image unavailable</span>
                </button>
                <div class="cardMeta">
                  <div class="codeRow">
                    <span class="codeText">{{ item.code }}</span>
                    <span class="priceText">{{ formatUsd(item.price) }}</span>
                  </div>
                </div>
                <div class="cardActions">
                  <div v-if="pickedQty(item.id)" class="qtyStepper cardQtyStepper">
                    <button type="button" :aria-label="'Decrease ' + item.code" @click="decreaseProduct(item)">-</button>
                    <input
                      :value="qtyDraftValue(item.id)"
                      class="qtyInput"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      :aria-label="'Quantity for ' + item.code"
                      @focus="$event.target.select()"
                      @input="handleQtyDraftInput(item, $event.target.value)"
                      @blur="commitQtyDraft(item)"
                      @keyup.enter="$event.target.blur()"
                    >
                    <button type="button" :aria-label="'Increase ' + item.code" @click="addProduct(item)">+</button>
                  </div>
                  <template v-else>
                    <button
                      type="button"
                      class="setBtn cardSetBtn"
                      :disabled="!item.combo"
                      @click="viewSet(item)"
                    >
                      View set <span aria-hidden="true">›</span>
                    </button>
                    <button type="button" class="addBtn" :aria-label="'Add ' + item.code" @click="addProduct(item)">
                      <i class="el-icon-plus"></i>
                    </button>
                  </template>
                </div>
              </div>
            </div>
            <div v-if="!loading && !loadError && !products.length" class="emptyState">No matching styles. Try another search.</div>
          </div>

          <div class="catalogFooter">
            <div class="footerStats">
              <span>Total: {{ page.total }}</span>
              <span>Selected Qty: {{ selectedTotalQty }}</span>
            </div>
            <nav class="pagination" aria-label="Product pages">
              <button type="button" :disabled="page.current === 1" aria-label="Previous page" @click="handlePageChange(page.current - 1)"><i class="el-icon-arrow-left"></i></button>
              <span class="mobilePage">{{ page.current }} / {{ pageCount }}</span>
              <template v-for="(number, index) in visiblePages">
                <span v-if="number === '...'" :key="'gap-' + index" class="desktopPage">...</span>
                <button v-else :key="number" type="button" class="desktopPage" :class="{ current: number === page.current }" :aria-current="number === page.current ? 'page' : null" @click="handlePageChange(number)">{{ number }}</button>
              </template>
              <button type="button" :disabled="page.current === pageCount" aria-label="Next page" @click="handlePageChange(page.current + 1)"><i class="el-icon-arrow-right"></i></button>
            </nav>
            <label class="pageJump">Go to <input v-model="pageInput" type="number" min="1" :max="pageCount" aria-label="Go to page" @change="handlePageChange(pageInput)" @keyup.enter="handlePageChange(pageInput)"></label>
            <select v-model.number="page.size" class="pageSize" aria-label="Items per page" @change="handleSizeChange(page.size)">
              <option v-for="size in page.sizes" :key="size" :value="size">{{ size }} / page</option>
            </select>
          </div>
        </div>
      </div>
      <div v-if="isCompactLayout" class="mobileActionBar">
        <button type="button" class="selectedBtn" @click="openSelectedPanel"><i class="el-icon-shopping-cart-2"></i> Selected ({{ selectedTotalQty }})</button>
        <button type="button" class="primary" :disabled="!selectedCount" @click="openSubmitDialog">Submit Order</button>
      </div>
      </div>

      <transition name="mask">
        <div v-if="selectedPanelOpen" class="selectionMask" @click="closeSelectedPanel"></div>
      </transition>
      <transition name="drawer" @after-enter="focusDrawer">
        <aside
          v-show="selectedPanelOpen"
          ref="drawer"
          class="selectionCard"
          role="dialog"
          aria-modal="true"
          aria-labelledby="selectionTitle"
          @keydown.esc="closeSelectedPanel"
          @keydown.tab="trapDrawerFocus"
        >
          <div class="selectionHeader">
            <div>
              <div id="selectionTitle" class="selectionTitle">Selected Items ({{ selectedTotalQty }})</div>
            </div>
            <button ref="drawerClose" type="button" class="closeBtn" aria-label="Close selected items" @click="closeSelectedPanel">
              <i class="el-icon-close"></i>
            </button>
          </div>

          <div class="selectionBody">
            <div v-if="selectedList.length === 0" class="emptyState">
              No items selected yet. Choose your favorite styles to get started.
            </div>
            <div v-for="item in selectedList" :key="item.id" class="selectedItem">
              <div class="selectedThumb">
                <el-image
                  v-if="item.image"
                  :src="item.image"
                  fit="contain"
                  class="selectedThumbImage"
                >
                  <span slot="error" class="imageError">Image unavailable</span>
                </el-image>
                <span class="selectedCode">{{ item.code }}</span>
              </div>
              <div class="selectedInfo">
                <div class="selectedActionsRow">
                  <div class="selectedMainRow">
                    <div class="qtyStepper">
                      <button type="button" :aria-label="'Decrease ' + item.code" @click="decreaseProduct(item)">-</button>
                      <input
                        :value="qtyDraftValue(item.id)"
                        class="qtyInput"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        :aria-label="'Quantity for ' + item.code"
                        @focus="$event.target.select()"
                        @input="handleQtyDraftInput(item, $event.target.value)"
                        @blur="commitQtyDraft(item)"
                        @keyup.enter="$event.target.blur()"
                      >
                      <button type="button" :aria-label="'Increase ' + item.code" @click="addProduct(item)">+</button>
                    </div>
                    <div class="selectedItemPrice">{{ selectedItemAmount(item) }}</div>
                  </div>
                  <div class="selectedItemButtons">
                    <button type="button" class="setBtn" :disabled="!item.combo" @click="viewSet(item)">View Set</button>
                    <button type="button" class="removeBtn" @click="removeProduct(item)">Remove</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="selectionFooter">
            <div class="selectionFooterTop">
              <span>Total Qty: {{ selectedTotalQty }}</span>
              <span>Total Price: {{ selectedTotalAmount }}</span>
            </div>
            <el-button
              type="primary"
              class="submitBtn"
              :disabled="selectedList.length === 0"
              @click="openSubmitDialog"
            >
              <i class="el-icon-shopping-cart-2"></i>
              Submit Order
            </el-button>
          </div>
        </aside>
      </transition>
    </div>

    <el-dialog
      :title="'Product Set · ' + setDialog.code"
      :visible.sync="setDialog.visible"
      custom-class="publicSetDialog"
      :fullscreen="isCompactLayout"
      width="900px"
      :close-on-click-modal="false"
      append-to-body
      @close="closeSetDialog"
    >
      <div v-if="setDialog.loading" class="emptyState" role="status"><i class="el-icon-loading"></i> Loading set...</div>
      <div v-else-if="setDialog.error" class="emptyState" role="alert">
        {{ setDialog.error }} <button type="button" class="retryBtn" @click="loadSetProducts(setDialog.page)">Retry</button>
      </div>
      <div v-else-if="!setDialog.products.length" class="emptyState">No matching products in this set.</div>
      <div v-else class="goodsGrid setGoodsGrid">
              <div
                v-for="item in setDialog.products"
                :key="item.id"
                class="goodsCard"
                :class="{ active: pickedQty(item.id) > 0 }"
              >
                <button type="button" class="cardImageWrap" :aria-label="'Add ' + item.code" @click="addProduct(item)">
                  <el-image
                    v-if="item.image"
                    :src="item.image"
                    fit="contain"
                    class="cardImage"
                  >
                    <span slot="error" class="imageError">Image unavailable</span>
                  </el-image>
                  <span v-else class="imageError">Image unavailable</span>
                </button>
                <div class="cardMeta">
                  <div class="codeRow">
                    <span class="codeText">{{ item.code }}</span>
                    <span class="priceText">{{ formatUsd(item.price) }}</span>
                  </div>
                </div>
                <div class="cardActions">
                  <div v-if="pickedQty(item.id)" class="qtyStepper cardQtyStepper">
                    <button type="button" :aria-label="'Decrease ' + item.code" @click="decreaseProduct(item)">-</button>
                    <input
                      :value="qtyDraftValue(item.id)"
                      class="qtyInput"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      :aria-label="'Quantity for ' + item.code"
                      @focus="$event.target.select()"
                      @input="handleQtyDraftInput(item, $event.target.value)"
                      @blur="commitQtyDraft(item)"
                      @keyup.enter="$event.target.blur()"
                    >
                    <button type="button" :aria-label="'Increase ' + item.code" @click="addProduct(item)">+</button>
                  </div>
                  <template v-else>

                    <button type="button" class="addBtn" :aria-label="'Add ' + item.code" @click="addProduct(item)">
                      <i class="el-icon-plus"></i>
                    </button>
                  </template>
                </div>
              </div>
      </div>
      <div slot="footer" class="setDialogFooter">
        <div class="setDialogPagination" v-if="setDialog.count > 60">
          <el-button size="small" :disabled="setDialog.loading || setDialog.page <= 1" @click="loadSetProducts(setDialog.page - 1)">Previous</el-button>
          <span>{{ setDialog.page }} / {{ Math.max(1, Math.ceil(setDialog.count / 60)) }}</span>
          <el-button size="small" :disabled="setDialog.loading || setDialog.page * 60 >= setDialog.count" @click="loadSetProducts(setDialog.page + 1)">Next</el-button>
        </div>
        <span>Selected Qty: {{ selectedTotalQty }}</span>
        <el-button type="primary" @click="setDialog.visible = false">Continue browsing</el-button>
      </div>
    </el-dialog>

    <el-dialog
      title="Confirm Your Order"
      :visible.sync="submitDialogVisible"
      custom-class="publicSelectionDialog"
      :fullscreen="isCompactLayout"
      width="420px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form ref="submitForm" :model="customerForm" :rules="customerRules" label-position="top">
        <el-form-item label="Name" prop="name">
          <el-input maxlength="32" v-model.trim="customerForm.name" placeholder="Enter your name"></el-input>
        </el-form-item>
        <el-form-item label="WhatsApp / Phone" prop="phone">
          <el-input maxlength="32" v-model.trim="customerForm.phone" placeholder="e.g. +233 20 123 4567"></el-input>
        </el-form-item>
        <el-form-item label="Country" prop="country">
          <el-input v-model.trim="customerForm.country" placeholder="Enter your country (e.g. Ghana)"></el-input>
        </el-form-item>
        <el-form-item label="Notes">
          <el-input type="textarea" maxlength="100" v-model.trim="customerForm.note" placeholder="Additional requests (optional)"></el-input>
        </el-form-item>
      </el-form>
      <p class="prototypeNote">Your order will be sent to your salesperson for review.</p>
      <div slot="footer" class="dialogFooter">
        <el-button @click="submitDialogVisible = false">Back</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitSelection">Confirm Order</el-button>
      </div>
    </el-dialog>

    <el-dialog
      title=""
      :visible.sync="successDialogVisible"
      custom-class="publicSelectionDialog publicSelectionSuccess"
      :fullscreen="isCompactLayout"
      width="420px"
      append-to-body
      class="successDialog"
    >
      <div class="successBody">
        <div class="successIcon">
          <i class="el-icon-check"></i>
        </div>
        <div class="successTitle">Order Submitted!</div>
        <div class="successText">Thank you! Your salesperson will review your order.</div>
        <p class="prototypeNote">Order: {{ submittedNumber }}</p>
      </div>
      <div slot="footer" class="dialogFooter">
        <el-button type="primary" @click="acknowledgeSuccess">OK</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { queryPublicProducts, submitPublicSelection } from "@/config/publicSelection";

export default {
  name: "SorSelectPublic",
  data() {
    return {
      searchForm: {
        type: "",
        code: "",
        keyword: ""
      },
      appliedFilters: { type: "", code: "", keyword: "", setGoods: 0 },
      typeOptions: [],
      loading: false,
      loadError: "",
      priceWarning: "",
      exchangeRate: null,
      requestId: 0,
      pageInput: 1,
      page: {
        current: 1,
        total: 0,
        size: 30,
        sizes: [12, 30, 60]
      },
      selectedMap: {},
      qtyDrafts: {},
      selectedPanelOpen: false,
      viewportWidth: typeof window !== "undefined" ? window.innerWidth : 1440,
      products: [],
      setDialog: { visible: false, loading: false, error: "", products: [], source: 0, code: "", page: 1, count: 0 },
      setRequestId: 0,
      submitDialogVisible: false,
      successDialogVisible: false,
      submitLoading: false,
      submissionKey: "",
      submittedNumber: "",
      customerForm: {
        name: "",
        phone: "",
        country: "",
        note: ""
      },
      customerRules: {
        name: [{ required: true, message: "Please enter your name", trigger: "blur" }],
        phone: [{ required: true, message: "Please enter your phone or WhatsApp", trigger: "blur" }],
        country: [{ required: true, message: "Please enter your country", trigger: "blur" }]
      }
    };
  },
  watch: {
    "$route.query.brand"() {
      this.setDialog.visible = false;
      this.closeSetDialog();
      this.selectedMap = {};
      this.qtyDrafts = {};
      this.clearFilters();
    }
  },
  computed: {
    contextBrand() {
      const brand = (this.$route.query || {}).brand;
      return typeof brand === "string" ? brand.trim() : "";
    },
    contextOrderId() {
      const route = this.$route || {};
      const params = route.params || {};
      const query = route.query || {};
      return String(params.orderId || params.id || query.orderId || query.id || "").trim();
    },
    isCompactLayout() {
      return Number(this.viewportWidth) < 768;
    },
    pageCount() {
      return Math.max(1, Math.ceil(this.page.total / this.page.size));
    },
    visiblePages() {
      if (this.pageCount <= 7) return Array.from({ length: this.pageCount }, (_, i) => i + 1);
      const current = this.page.current;
      const pages = [1];
      const start = Math.max(2, Math.min(current - 1, this.pageCount - 4));
      const end = Math.min(this.pageCount - 1, Math.max(current + 1, 5));
      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < this.pageCount - 1) pages.push("...");
      pages.push(this.pageCount);
      return pages;
    },
    pagedProducts() {
      return this.products;
    },
    selectedList() {
      const dict = this.selectedMap || {};
      return Object.keys(dict)
        .map(key => dict[key])
        .filter(Boolean)
        .sort((a, b) => String(a.code || "").localeCompare(String(b.code || ""), undefined, { numeric: true, sensitivity: "base" }));
    },
    selectedCount() {
      return this.selectedList.length;
    },
    selectedTotalQty() {
      return this.selectedList.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    },
    selectedTotalAmount() {
      const total = this.selectedList.reduce((sum, item) => {
        const price = Number(item && item.price);
        const qty = Number(item && item.qty) || 0;
        return Number.isFinite(price) ? sum + price * qty : sum;
      }, 0);
      return this.formatUsd(total, true);
    }
  },
  created() {
    this.loadProducts();
  },
  mounted() {
    this.syncViewport();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", this.syncViewport);
    }
  },
  beforeDestroy() {
    this.closeSetDialog();
    this.requestId++;
    if (this.pendingRequest) this.pendingRequest.abort();
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", this.syncViewport);
    }
  },
  methods: {
    syncViewport() {
      this.viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1440;
    },
    applyFilters() {
      this.appliedFilters = Object.assign({ setGoods: 0 }, this.searchForm);
      this.handlePageChange(1);
    },
    clearFilters() {
      this.searchForm = { type: "", code: "", keyword: "" };
      this.applyFilters();
    },
    handlePageChange(page) {
      this.page.current = Math.max(1, Math.min(this.pageCount, Math.floor(Number(page) || 1)));
      this.pageInput = this.page.current;
      this.loadProducts();
      this.$nextTick(() => {
        const grid = this.$el.querySelector(".gridWrap");
        if (grid) grid.scrollTop = 0;
      });
    },
    handleSizeChange(size) {
      this.page.size = size;
      this.handlePageChange(1);
    },
    openSelectedPanel() {
      this.selectedPanelOpen = true;
    },
    focusDrawer() {
      if (this.selectedPanelOpen && this.$refs.drawerClose) {
        this.$refs.drawerClose.focus({ preventScroll: true });
      }
    },
    closeSelectedPanel() {
      this.selectedPanelOpen = false;
      this.$nextTick(() => this.$refs.selectedTrigger && this.$refs.selectedTrigger.focus({ preventScroll: true }));
    },
    trapDrawerFocus(event) {
      const controls = this.$refs.drawer.querySelectorAll("button:not([disabled]), input, select");
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    },
    openSubmitDialog() {
      if (this.selectedList.length === 0) {
        this.$message({
          type: "warning",
          message: "Please select at least one item before submitting."
        });
        return;
      }
      this.selectedPanelOpen = false;
      this.submitDialogVisible = true;
    },
    async loadProducts() {
      if (this.pendingRequest) this.pendingRequest.abort();
      const controller = new AbortController();
      this.pendingRequest = controller;
      const id = ++this.requestId;
      this.loading = true;
      this.loadError = "";
      try {
        const result = await queryPublicProducts({
          brand: this.contextBrand,
          page: this.page.current,
          limit: this.page.size,
          category: this.appliedFilters.type || 0,
          code: this.appliedFilters.code,
          keyword: this.appliedFilters.keyword,
          setGoods: this.appliedFilters.setGoods || 0
        }, controller.signal);
        if (id !== this.requestId) return;
        this.products = result.info;
        this.page.total = Number(result.count) || 0;
        this.page.current = result.page;
        this.pageInput = result.page;
        this.typeOptions = result.categories || [];
        this.exchangeRate = result.exchangeRate;
        this.priceWarning = result.priceWarning || "";
        // 翻页不清空选款；同一商品返回新报价时同步已选栏。
        const selected = Object.assign({}, this.selectedMap);
        this.products.forEach(item => {
          if (selected[item.id]) selected[item.id] = Object.assign({}, item, { qty: selected[item.id].qty });
        });
        this.selectedMap = selected;
      } catch (error) {
        if (id !== this.requestId || controller.signal.aborted) return;
        this.products = [];
        this.page.total = 0;
        this.loadError = error.message;
      } finally {
        if (id === this.requestId) this.loading = false;
      }
    },
    formatUsd(price, keepZeros) {
      if (price == null || price === "" || !Number.isFinite(Number(price))) return "--";
      const fixed = Number(price).toFixed(2);
      return "$" + (keepZeros ? fixed : fixed.replace(/\.00$/, ""));
    },
    qtyDraftValue(id) {
      const key = String(id);
      if (Object.prototype.hasOwnProperty.call(this.qtyDrafts, key)) {
        return this.qtyDrafts[key];
      }
      return String(this.pickedQty(id) || "");
    },
    handleQtyDraftInput(product, value) {
      if (!product || !product.id) return;
      const key = String(product.id);
      const cleaned = String(value == null ? "" : value).replace(/[^\d]/g, "").slice(0, 4);
      this.qtyDrafts = Object.assign({}, this.qtyDrafts, { [key]: cleaned });
    },
    commitQtyDraft(product) {
      if (!product || !product.id) return;
      const key = String(product.id);
      const draft = Object.prototype.hasOwnProperty.call(this.qtyDrafts, key)
        ? this.qtyDrafts[key]
        : String(this.pickedQty(product.id) || "");
      const next = Object.assign({}, this.qtyDrafts);
      delete next[key];
      this.qtyDrafts = next;
      const qty = Number.parseInt(String(draft || "").replace(/[^\d]/g, ""), 10);
      if (!Number.isFinite(qty) || qty <= 0) {
        this.removeProduct(product);
        return;
      }
      this.setProductQty(product, qty);
    },
    setProductQty(product, qty) {
      if (!product || !product.id) return;
      const key = String(product.id);
      const nextQty = Math.max(1, Math.min(9999, Math.floor(Number(qty) || 0)));
      this.selectedMap = Object.assign({}, this.selectedMap, {
        [key]: Object.assign({}, this.selectedMap[key] || product, { qty: nextQty })
      });
      this.qtyDrafts = Object.assign({}, this.qtyDrafts, { [key]: String(nextQty) });
    },
    selectedItemAmount(item) {
      const price = Number(item && item.price);
      const qty = Number(item && item.qty) || 0;
      if (!Number.isFinite(price)) return "--";
      return this.formatUsd(price * qty, true);
    },
    pickedQty(id) {
      const item = this.selectedMap[String(id)];
      return item ? Number(item.qty) || 0 : 0;
    },
    addProduct(product) {
      if (!product || !product.id) return;
      const key = String(product.id);
      const nextQty = this.pickedQty(product.id) + 1 || 1;
      this.setProductQty(product, nextQty);
    },
    decreaseProduct(product) {
      if (!product || !product.id) return;
      const nextQty = this.pickedQty(product.id) - 1;
      if (nextQty <= 0) {
        this.removeProduct(product);
        return;
      }
      this.setProductQty(product, nextQty);
    },
    removeProduct(product) {
      if (!product || !product.id) return;
      const key = String(product.id);
      const next = Object.assign({}, this.selectedMap);
      delete next[key];
      this.selectedMap = next;
      const drafts = Object.assign({}, this.qtyDrafts);
      delete drafts[key];
      this.qtyDrafts = drafts;
    },
    clearSelection() {
      this.selectedMap = {};
      this.qtyDrafts = {};
    },
    viewSet(product) {
      if (!product || !product.combo) return;
      this.setDialog.source = product.id;
      this.setDialog.code = product.code;
      this.setDialog.products = [];
      this.setDialog.count = 0;
      this.setDialog.visible = true;
      this.loadSetProducts(1);
    },
    closeSetDialog() {
      this.setRequestId++;
      if (this.pendingSetRequest) this.pendingSetRequest.abort();
      this.setDialog.loading = false;
    },
    async loadSetProducts(page) {
      if (this.pendingSetRequest) this.pendingSetRequest.abort();
      const controller = new AbortController();
      this.pendingSetRequest = controller;
      const requestId = ++this.setRequestId;
      this.setDialog.page = page;
      this.setDialog.loading = true;
      this.setDialog.error = "";
      try {
        const result = await queryPublicProducts({
          brand: this.contextBrand,
          setGoods: this.setDialog.source,
          page,
          limit: 60
        }, controller.signal);
        if (requestId !== this.setRequestId || !this.setDialog.visible) return;
        this.setDialog.products = result.info;
        this.setDialog.page = result.page;
        this.setDialog.count = Number(result.count) || 0;
      } catch (error) {
        if (requestId === this.setRequestId && !controller.signal.aborted) {
          this.setDialog.error = error.message;
        }
      } finally {
        if (requestId === this.setRequestId) this.setDialog.loading = false;
      }
    },
    submitSelection() {
      if (this.submitLoading || !this.selectedCount) return;
      this.$refs.submitForm.validate(async valid => {
        if (!valid) return;
        const payload = {
          salesId: (this.$route.query || {}).salesId || (this.$route.query || {}).userId || (this.$route.query || {}).id,
          submissionKey: this.submissionKey || (this.submissionKey = Array.from(window.crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, "0")).join("")),
          customer: Object.assign({}, this.customerForm),
          items: this.selectedList.map(item => ({
            id: item.id,
            code: item.code,
            type: item.type,
            combo: item.combo,
            qty: item.qty,
            price: item.price
          })),
          totalQty: this.selectedTotalQty,
          source: "public-picker"
        };
        this.submitLoading = true;
        try {
          const result = await submitPublicSelection(payload);
          this.submittedNumber = result.number;
          this.submitDialogVisible = false;
          this.successDialogVisible = true;
        } catch (error) {
          this.$message.error(error.message || "Order could not be submitted. Please retry.");
        } finally {
          this.submitLoading = false;
        }
      });
    },
    acknowledgeSuccess() {
      this.successDialogVisible = false;
      this.selectedMap = {};
      this.submissionKey = "";
      this.customerForm = {
        name: "",
        phone: "",
        country: "",
        note: ""
      };
      this.$nextTick(() => {
        this.$refs.submitForm && this.$refs.submitForm.clearValidate && this.$refs.submitForm.clearValidate();
      });
    }
  }
};
</script>

<style scoped>
.setGoodsGrid { grid-template-columns: repeat(auto-fill, minmax(125px, 1fr)); }
.setDialogFooter { display: flex; align-items: center; justify-content: flex-end; gap: 12px; flex-wrap: wrap; }
.setDialogPagination { display: flex; align-items: center; gap: 8px; margin-right: auto; }
.setGoodsGrid .cardActions { justify-content: flex-end; }
.setGoodsGrid .addBtn { width: 30px; height: 28px; border: 0; border-radius: 8px; background: #f0f1f3; color: #374151; }
.setGoodsGrid .addBtn:hover { background: #e4efff; color: #0759b7; }

.publicPickerPage {
  --blue: #0065e8;
  --ink: #101b43;
  height: 100vh;
  height: 100dvh;
  padding: 18px;
  background: #f7faff;
  color: var(--ink);
  font: 14px Arial, sans-serif;
}
.publicPickerPage, .publicPickerPage * { box-sizing: border-box; }
.publicPickerPage button, .publicPickerPage input, .publicPickerPage select { font: inherit; color: inherit; }
.publicPickerPage button { cursor: pointer; }
.publicPickerPage button:disabled { opacity: .4; cursor: not-allowed; }
.publicPickerPage button:focus-visible, .publicPickerPage input:focus, .publicPickerPage select:focus { outline: 2px solid #0065e8; outline-offset: 2px; }
.pickerShell { position: relative; height: 100%; border: 1px solid #cbd9e9; border-radius: 14px; background: #fff; overflow: hidden; box-shadow: 0 3px 16px #2344780b; }
.catalogSurface { display: flex; flex-direction: column; height: 100%; min-height: 0; }
.topBanner { flex-shrink: 0; height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; border-bottom: 1px solid #e8edf5; background: #f9fbff; }
.brandBlock { display: flex; align-items: center; gap: 12px; }
.brandIcon { font-size: 38px; color: #0865cd; }
.brandTitle { font-size: 23px; font-weight: 800; letter-spacing: -.8px; }
.brandSub { font-size: 13px; margin-top: 2px; }
.selectedBtn { display: inline-flex; align-items: center; justify-content: center; gap: 12px; background: #fff; border: 1px solid #d3deec; border-radius: 7px; height: 38px; padding: 0 14px; font-weight: 700 !important; white-space: nowrap; }
.cartIcon { position: relative; color: var(--blue); font-size: 28px; }
.cartIcon b { position: absolute; top: -7px; right: -6px; background: #ed2436; color: white; font-size: 10px; min-width: 17px; padding: 3px; border-radius: 12px; line-height: 1; }
.toolbarCard { flex-shrink: 0; padding: 12px 18px; }
.toolbarLeft { display: grid; grid-template-columns: 170px minmax(120px, 280px) minmax(120px, 280px) 110px; gap: 14px; }
.toolbarItem { min-width: 0; width: 100%; height: 36px; border: 1px solid #cfd6e1; border-radius: 7px; background: #fff; padding: 0 12px; }
.toolbarItem::placeholder { color: #536077; opacity: 1; }
.catalogStatus { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px; color: #68758a; font-size: 11px; line-height: 1.5; }
.catalogStatus:empty { display: none; }
.catalogStatus button, .retryBtn { padding: 3px 9px; background: #eef5ff; border: 1px solid #cbdff8; border-radius: 5px; color: #0759b7; }
.priceWarning { color: #a05a14; }
.retryBtn { display: block; margin: 12px auto 0; }
.publicPickerPage .primary { background: var(--blue); border: 1px solid var(--blue); color: #fff; border-radius: 6px; font-weight: 700; }
.primary:hover { background: #075bcc; }
.contentLayout, .catalogCard { display: flex; flex: 1; min-height: 0; flex-direction: column; min-width: 0; }
.catalogCard { padding: 0 18px; }
.gridWrap { flex: 1; min-height: 0; overflow: auto; scrollbar-gutter: stable; overscroll-behavior: contain; padding: 4px 1px 12px; }
.goodsGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); gap: 8px; align-content: start; }
.goodsCard { min-width: 0; padding: 6px; border: 1px solid #e2e7ef; border-radius: 10px; background: white; }
.goodsCard.active { border-color: #237dd6; background: #f4faff; box-shadow: 0 0 0 2px #1984eb16; }
.cardImageWrap { display: block; width: 100%; height: clamp(110px, 17vh, 185px); padding: 2px; background: transparent; border: 0; border-radius: 6px; }
.cardImage { display: block; width: 100%; height: 100%; }
.cardImage >>> .el-image__inner { object-fit: contain; transition: transform .18s; }
@media (hover: hover) { .cardImageWrap:hover >>> .el-image__inner { transform: scale(1.09); } }
.imageError { display: flex; align-items: center; justify-content: center; height: 100%; font-size: 10px; color: #8a94a6; }
.codeRow { display: flex; align-items: center; justify-content: space-between; gap: 4px; padding: 4px 2px; font-size: 12px; font-weight: 700; }
.priceText { color: #dc242b; }
.cardActions { height: 32px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.publicPickerPage .cardSetBtn { flex: 1; height: 30px; min-width: 0; padding: 0 2px; background: transparent; border: 0; color: #68717f !important; text-align: left; font-size: 11px; white-space: nowrap; }
.cardSetBtn span { margin-left: 2px; }
.publicPickerPage .cardSetBtn:hover:not(:disabled) { color: #0759b7 !important; }
.publicPickerPage .cardSetBtn:disabled { color: #a6adb7 !important; }
.publicPickerPage .addBtn { flex: 0 0 30px; width: 30px; height: 28px; padding: 0; border: 0; border-radius: 8px; background: #f0f1f3; color: #374151; font-size: 17px !important; transition: background .15s, color .15s; }
.publicPickerPage .addBtn:hover { background: #e4efff; color: #0759b7; }
.cardActions button:focus-visible, .cardQtyStepper input:focus-visible { outline: 2px solid #6aa9eb; outline-offset: 2px; }
.goodsCard .cardQtyStepper { width: 100%; border-color: #c9def6; background: #edf5ff; color: #175896; }
.goodsCard .cardQtyStepper button { color: #175896; border-radius: 5px; }
.goodsCard .cardQtyStepper button:hover { background: #daeaff; }
.goodsCard .cardQtyStepper input { color: #175896; }
.qtyStepper { display: inline-flex; align-items: center; justify-content: center; border: 1px solid #d3dbe8; border-radius: 6px; background: white; min-width: 0; }
.qtyStepper button { width: 30px; height: 28px; border: 0; background: transparent; font-size: 20px; font-weight: 700; }
.qtyInput { width: 38px; min-width: 0; height: 28px; padding: 0 2px; border: 0; background: transparent; text-align: center; font-weight: 700; }
.qtyInput::-webkit-outer-spin-button, .qtyInput::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.qtyInput[type="number"] { -moz-appearance: textfield; }
.catalogFooter { display: flex; align-items: center; flex-shrink: 0; gap: 16px; padding: 12px 0; border-top: 1px solid #edf0f6; }
.footerStats { display: flex; gap: 22px; margin-left: auto; order: 4; font-size: 13px; font-weight: 700; white-space: nowrap; }
.pagination { display: flex; align-items: center; gap: 3px; border: 1px solid #e0e6ef; border-radius: 6px; padding: 2px; }
.pagination button { width: 30px; height: 28px; border: 0; background: transparent; font-weight: 700; border-radius: 4px; }
.pagination .current { color: var(--blue); background: #edf5ff; }
.mobilePage { display: none; }
.pageJump { display: flex; gap: 7px; align-items: center; white-space: nowrap; }
.pageJump input { width: 48px; height: 30px; border: 1px solid #d7dde8; border-radius: 6px; text-align: center; }
.pageSize { height: 32px; padding: 0 8px; border: 1px solid #d7dde8; border-radius: 6px; background: #fff; font-size: 12px !important; }
.selectionMask { position: absolute; inset: 0; background: #16243c99; z-index: 10; }
.selectionCard { position: absolute; right: 0; top: 0; bottom: 0; width: 390px; max-width: 100%; display: flex; flex-direction: column; padding: 20px; background: #fff; z-index: 11; box-shadow: -8px 0 24px #0f244820; }
.selectionHeader { display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; margin-bottom: 12px; }
.selectionTitle { font-size: 19px; font-weight: 800; letter-spacing: -.5px; }
.closeBtn { border: 0; background: transparent; width: 30px; height: 30px; font-size: 18px !important; }
.selectionBody { flex: 1; min-height: 0; overflow: auto; scrollbar-gutter: stable; overscroll-behavior: contain; }
.selectedItem { display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #eff2f7; padding: 12px 0; }
.selectedThumb { width: 64px; flex: 0 0 64px; text-align: center; }
.selectedThumbImage { width: 64px; height: 70px; display: block; }
.selectedCode { display: block; font-size: 10px; color: #67748a; margin-top: 2px; }
.selectedInfo { flex: 1; min-width: 0; }
.selectedActionsRow { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.selectedMainRow { display: flex; align-items: center; gap: 12px; min-width: 0; }
.selectedActionsRow .qtyStepper button { width: 32px; height: 34px; }
  .selectedActionsRow .qtyInput { height: 34px; font-size: 18px; }
.selectedItemPrice { min-width: 72px; text-align: right; font-size: 18px; font-weight: 700; color: #dc242b; }
.selectedItemButtons { display: flex; flex-direction: column; gap: 5px; }
.selectedItemButtons button { height: 28px; min-width: 84px; border-radius: 5px; padding: 0 9px; font-size: 12px; font-weight: 700; }
.setBtn { background: #e7f2ff; border: 1px solid #d2e3fb; color: #0759b7 !important; }
.removeBtn { background: #ffecef; border: 1px solid #f9d7dc; color: #c72839 !important; }
.selectionFooter { flex-shrink: 0; padding-top: 16px; border-top: 1px solid #e8edf4; }
.selectionFooterTop { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 16px; font-weight: 700; }
.submitBtn { margin-top: 16px; width: 100%; height: 44px; background: var(--blue); border-color: var(--blue); color: white !important; font-size: 16px !important; font-weight: 700 !important; }
.emptyState { padding: 60px 20px; text-align: center; color: #758198; line-height: 1.7; }
.drawer-enter-active, .drawer-leave-active { transition: transform .28s cubic-bezier(.22, 1, .36, 1); will-change: transform; }
.drawer-enter, .drawer-leave-to { transform: translate3d(100%, 0, 0); }
.mask-enter-active, .mask-leave-active { transition: opacity .2s; }
.mask-enter, .mask-leave-to { opacity: 0; }
.mobileActionBar { display: flex; flex-shrink: 0; gap: 10px; padding: 8px 10px calc(10px + env(safe-area-inset-bottom)); border-top: 1px solid #edf0f6; background: #fff; }
.mobileActionBar button { flex: 1; min-width: 0; height: 44px; font-size: 13px; }
.dialogFooter { display: flex; gap: 10px; }
.dialogFooter .el-button { flex: 1; margin: 0; height: 44px; font-weight: 700; }
.dialogFooter .el-button--primary { background: #0065e8; border-color: #0065e8; }
.prototypeNote { font: 12px/1.6 Arial, sans-serif; color: #7f8b9e; margin-top: 16px; }
.successBody { text-align: center; padding: 44px 0 24px; color: #101b43; }
.successIcon { width: 72px; height: 72px; margin: 0 auto 22px; border-radius: 50%; background: #04ae56; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 38px; }
.successTitle { font-size: 25px; font-weight: 800; line-height: 1.25; letter-spacing: -.7px; }
.successText { margin-top: 18px; line-height: 1.8; }
@media (min-width: 1500px) { .goodsGrid { grid-template-columns: repeat(10, minmax(0, 1fr)); } }
@media (min-width: 768px) and (max-width: 1000px) {
  .toolbarLeft { grid-template-columns: 130px 1fr 1fr 100px; }
  .catalogFooter { gap: 8px; flex-wrap: wrap; }
  .footerStats { gap: 12px; }
}
@media (max-width: 767px) {
  .publicPickerPage { padding: 0; background: #fff; }
  .pickerShell { border: 0; border-radius: 0; box-shadow: none; }
  .topBanner { height: 60px; padding: 0 10px; background: #fff; }
  .brandBlock { gap: 6px; }
  .brandIcon { font-size: 28px; }
  .brandTitle { font-size: 17px; letter-spacing: -.6px; }
  .brandSub { font-size: 10px; }
  .topBanner .selectedBtn { gap: 6px; padding: 0 6px; font-size: 11px; height: 30px; }
  .cartIcon { font-size: 22px; }
  .toolbarCard { padding: 5px 10px 9px; }
  .toolbarLeft { grid-template-columns: 1fr 1fr 1fr; gap: 7px; }
  .toolbarItem { height: 32px; font-size: 11px !important; padding: 0 7px; border-radius: 5px; }
  .searchBtn { grid-column: 1 / -1; height: 32px; }
  .catalogCard { padding: 0 10px; }
  .goodsGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .goodsCard { padding: 6px; border-radius: 7px; }
  .cardImageWrap { height: clamp(96px, 18vh, 180px); }
  .codeRow { padding: 3px 3px; font-size: 12px; }
  .cardActions { height: 34px; }
  .cardSetBtn { height: 30px; font-size: 11px; }
  .addBtn { width: 32px; height: 30px; }
  .qtyStepper button { width: 34px; height: 30px; }
  .qtyInput { height: 30px; }
  .catalogFooter { padding: 8px 0; gap: 6px; }
  .pagination { border: 0; gap: 4px; }
  .pagination button { width: 28px; }
  .mobilePage { display: inline; min-width: 48px; text-align: center; font-weight: 700; }
  .desktopPage, .pageJump, .footerStats { display: none; }
  .pageSize { margin-left: auto; height: 30px; font-size: 11px !important; }
  .selectionCard { width: 100%; padding: 18px 16px calc(16px + env(safe-area-inset-bottom)); box-shadow: none; }
  .selectionTitle { font-size: 20px; }
  .selectionFooter { padding-top: 12px; }
  .selectedActionsRow .qtyStepper button { width: 34px; height: 38px; }
  .selectedActionsRow .qtyInput { height: 38px; }
  .selectedMainRow { flex: 1; }
  .selectedItemPrice { min-width: 64px; font-size: 16px; }
  .selectedItemButtons button { height: 32px; }
}
@media (prefers-reduced-motion: reduce) {
  .drawer-enter-active, .drawer-leave-active, .mask-enter-active, .mask-leave-active, .cardImage >>> .el-image__inner { transition: none; }
}
</style>
<style>
/* 弹窗挂载到 body，使用专属类名隔离内部 ERP 样式。 */
.publicSelectionDialog { border-radius: 12px; font-family: Arial, sans-serif; color: #101b43; }
.publicSelectionDialog .el-dialog__header { padding: 24px 24px 0; }
.publicSelectionDialog .el-dialog__title { color: #101b43; font-size: 20px; font-weight: 800; }
.publicSelectionDialog .el-dialog__body { padding: 24px; color: #101b43; }
.publicSelectionDialog .el-form-item__label { padding-bottom: 6px; line-height: 24px; color: #101b43; font-weight: 700; }
.publicSelectionDialog .el-input__inner { height: 42px; border-radius: 6px; border-color: #d4dae4; }
.publicSelectionDialog .el-dialog__footer { padding: 0 24px 24px; }
.publicSelectionSuccess .el-dialog__footer { padding: 0 44px 32px; }
@media (max-width: 767px) {
  .publicSelectionDialog.is-fullscreen { display: flex; flex-direction: column; height: 100vh; height: 100dvh; border-radius: 0; overflow: auto; }
  .publicSelectionDialog .el-dialog__header { padding: 30px 20px 0; }
  .publicSelectionDialog .el-dialog__body { flex: 1; padding: 26px 20px; }
  .publicSelectionDialog .el-dialog__footer { padding: 16px 20px calc(20px + env(safe-area-inset-bottom)); }
  .publicSelectionSuccess .el-dialog__body { display: flex; align-items: center; justify-content: center; }
  .publicSelectionSuccess .el-dialog__footer { padding-bottom: calc(60px + env(safe-area-inset-bottom)); }
}
</style>

<style>
.publicSetDialog { max-width: calc(100vw - 24px); }
.publicSetDialog .el-dialog__body { max-height: 65vh; overflow-y: auto; overscroll-behavior: contain; }
.publicSetDialog.is-fullscreen { max-width: 100%; display: flex; flex-direction: column; }
.publicSetDialog.is-fullscreen .el-dialog__body { flex: 1; max-height: none; }
</style>
