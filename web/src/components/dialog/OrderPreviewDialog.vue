<template>
  <el-dialog
    class="billDialog"
    :visible.sync="visible"
    title="订单"
    :fullscreen="true"
    @close="close"
  >
    <transition name="el-fade-in">
      <template v-if="visible && sourceNumber">
        <SorPrint action="sell/get" :source="sourceNumber"></SorPrint>
      </template>
    </transition>
  </el-dialog>
</template>

<script>
import SorPrint from "@/views/sale/SorPrint";

export default {
  name: "OrderPreviewDialog",
  components: {
    SorPrint,
  },
  props: {
    value: {
      default: false,
    },
    number: {
      type: String,
      default: "",
    },
  },
  computed: {
    visible: {
      get() {
        return !!this.value;
      },
      set(val) {
        this.$emit("input", val);
      },
    },
    sourceNumber() {
      return this.number == null ? "" : String(this.number).trim();
    },
  },
  methods: {
    close() {
      this.visible = false;
      this.$emit("closed");
    },
  },
};
</script>
