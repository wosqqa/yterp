<template>
  <div class="customerReport">
    <div class="searchBar">
      <el-form inline>
        <el-form-item label="客户名称">
          <el-input placeholder="请输入客户名称" v-model="searchForm.name" clearable></el-input>
        </el-form-item>
        <el-form-item label="客户编号">
          <el-input placeholder="请输入客户编号" v-model="searchForm.number" clearable></el-input>
        </el-form-item>
        <el-form-item label="客户类别">
          <el-select v-model="searchForm.category" placeholder="全部类别" clearable style="width:160px;">
            <template v-for="category in store.sys.crCategory">
              <el-option :key="category" :label="category" :value="category"></el-option>
            </template>
          </el-select>
        </el-form-item>
        <el-form-item label="客户等级">
          <el-select v-model="searchForm.grade" placeholder="全部等级" clearable style="width:160px;">
            <template v-for="grade in store.sys.crGrade">
              <el-option :key="grade" :label="grade" :value="grade"></el-option>
            </template>
          </el-select>
        </el-form-item>
        <el-form-item label="联系人员">
          <el-input placeholder="请输入联系人员" v-model="searchForm.contacts" clearable></el-input>
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input placeholder="请输入联系电话" v-model="searchForm.tel" clearable></el-input>
        </el-form-item>
        <el-form-item label="所属用户">
          <nodList v-model="searchForm.user" placeholder="全部用户" action="service/userRecord" scene="user"></nodList>
        </el-form-item>
        <el-form-item label="国家/备注">
          <el-input placeholder="请输入国家/备注信息" v-model="searchForm.data" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="record" :loading="loading">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <el-divider></el-divider>
    <div class="summaryBar">
      <div class="sumItem"><span class="sumLabel">客户总数：</span><span class="sumVal">{{ totalCount }}</span></div>
      <div class="sumItem"><span class="sumLabel">国家数量：</span><span class="sumVal">{{ countryCount }}</span></div>
      <div class="sumItem" v-if="loading" style="color:#909399;">正在加载数据...</div>
    </div>
    <div class="chartWrap">
      <div ref="countryBar" class="chartBox"></div>
    </div>
    <el-divider></el-divider>
    <div class="tableWrap">
      <el-table :data="countryTable" height="420" border stripe>
        <el-table-column type="index" label="排名" align="center" width="80"></el-table-column>
        <el-table-column prop="country" label="国家/备注" align="center" min-width="240"></el-table-column>
        <el-table-column prop="count" label="客户数量" align="center" width="160" sortable></el-table-column>
        <el-table-column label="占比" align="center" width="200">
          <template slot-scope="scope">
            <el-progress
              :percentage="Number(scope.row && scope.row.percent ? scope.row.percent : 0)"
              :stroke-width="14"
            ></el-progress>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import * as echarts from "echarts";

export default {
  name: "CustomerReport",
  data() {
    return {
      loading: false,
      searchForm: {
        name: "",
        number: "",
        category: "",
        grade: "",
        contacts: "",
        tel: "",
        user: "",
        data: ""
      },
      allRows: [],
      countryData: [],
      chartInstance: null,
      resizeTimer: null
    };
  },
  computed: {
    store() {
      return this.$store.state;
    },
    totalCount() {
      return Array.isArray(this.allRows) ? this.allRows.length : 0;
    },
    countryCount() {
      return Array.isArray(this.countryData) ? this.countryData.length : 0;
    },
    countryTable() {
      const total = Number(this.totalCount) || 0;
      return (this.countryData || []).map(item => {
        const count = Number(item && item.count) || 0;
        const percent = total === 0 ? 0 : Math.min(100, (count / total) * 100);
        return {
          country: item.country,
          count,
          percent: Number(percent.toFixed(2))
        };
      });
    }
  },
  created() {
    if (this.store.root != "all") {
      this.$message &&
        this.$message({
          type: "warning",
          message: "仅管理员可查看客户数据报表!"
        });
      this.$router.replace({ path: "/system/customer" });
      return;
    }
    this.record();
  },
  mounted() {
    this.initChart();
    window.addEventListener("resize", this.onWinResize);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.onWinResize);
    if (this.chartInstance) {
      this.chartInstance.dispose();
      this.chartInstance = null;
    }
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
    }
  },
  methods: {
    reset() {
      this.searchForm = {
        name: "",
        number: "",
        category: "",
        grade: "",
        contacts: "",
        tel: "",
        user: "",
        data: ""
      };
      this.record();
    },
    onWinResize() {
      if (!this.chartInstance) return;
      this.resizeTimer && clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        try {
          this.chartInstance.resize();
        } catch (e) {}
      }, 120);
    },
    initChart() {
      if (!this.$refs.countryBar) return;
      if (this.chartInstance) {
        try {
          this.chartInstance.dispose();
        } catch (e) {}
        this.chartInstance = null;
      }
      this.chartInstance = echarts.init(this.$refs.countryBar);
      this.renderChart();
    },
    renderChart() {
      if (!this.chartInstance) return;
      const list = (this.countryData || []).slice();
      const categories = list.map(i => (i && i.country != null ? String(i.country) : ""));
      const values = list.map(i => Number(i && i.count ? i.count : 0));
      const total = Number(this.totalCount) || 0;
      const option = {
        title: {
          text: "客户国家/地区分布",
          subtext: total ? "客户总数：" + total : "",
          left: "left"
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          formatter: params => {
            const p = params && params[0] ? params[0] : null;
            if (!p) return "";
            const name = p.name || "未填写";
            const val = Number(p.value) || 0;
            const per = total ? ((val / total) * 100).toFixed(2) : "0.00";
            return `${name}<br/>客户数：${val}<br/>占比：${per}%`;
          }
        },
        grid: {
          left: 60,
          right: 40,
          top: 80,
          bottom: 80,
          containLabel: true
        },
        dataZoom:
          categories.length > 20
            ? [
                { type: "slider", start: 0, end: 100, height: 20, bottom: 10 },
                { type: "inside" }
              ]
            : undefined,
        xAxis: {
          type: "category",
          data: categories,
          axisLabel: {
            rotate: categories.length > 8 ? 30 : 0,
            interval: 0
          }
        },
        yAxis: {
          type: "value",
          minInterval: 1,
          axisLabel: { formatter: val => Number.isFinite(val) ? Math.round(val) : val }
        },
        series: [
          {
            name: "客户数量",
            type: "bar",
            data: values,
            barMaxWidth: 56,
            itemStyle: {
              color: "#409EFF"
            },
            label: {
              show: true,
              position: "top",
              formatter: "{c}"
            }
          }
        ]
      };
      this.chartInstance.setOption(option, true);
    },
    buildCountryData(rows) {
      const map = {};
      const emptyKey = "__EMPTY__";
      for (const row of rows || []) {
        const raw = row && row.data != null ? String(row.data) : "";
        const key = raw.trim() ? raw.trim() : emptyKey;
        if (!map[key]) map[key] = { country: key === emptyKey ? "(未填写国家)" : key, count: 0 };
        map[key].count += 1;
      }
      const arr = Object.values(map);
      arr.sort((a, b) => {
        const ca = Number(a && a.count) || 0;
        const cb = Number(b && b.count) || 0;
        if (cb !== ca) return cb - ca;
        return String(a && a.country ? a.country : "").localeCompare(String(b && b.country ? b.country : ""));
      });
      return arr;
    },
    record() {
      const parm = Object.assign(
        {
          page: 1,
          limit: 1000000
        },
        this.searchForm || {}
      );
      this.loading = true;
      this.$axios
        .post("customer/record", parm)
        .then(result => {
          if (result.state == "success") {
            this.allRows = Array.isArray(result.info) ? result.info : [];
          } else if (result.state == "error") {
            this.allRows = [];
            this.$message({ type: "warning", message: result.info });
          } else {
            this.allRows = [];
            this.$message({ type: "error", message: "[ ERROR ] 服务器响应超时!" });
          }
          this.countryData = this.buildCountryData(this.allRows);
          this.renderChart();
        })
        .catch(() => {
          this.allRows = [];
          this.countryData = [];
          this.renderChart();
          this.$message({ type: "error", message: "[ ERROR ] 数据加载失败!" });
        })
        .then(() => {
          this.loading = false;
        });
    }
  }
};
</script>

<style scoped>
.customerReport {
  padding: 14px;
  height: 100%;
  box-sizing: border-box;
  overflow: auto;
  background: #f5f7fa;
}
.searchBar {
  background: #fff;
  padding: 12px 16px 0 16px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}
.summaryBar {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  padding: 4px 4px 0 4px;
  margin-bottom: 6px;
}
.sumItem {
  font-size: 14px;
  color: #303133;
}
.sumLabel {
  color: #606266;
  margin-right: 4px;
}
.sumVal {
  font-weight: 600;
  color: #303133;
}
.chartWrap {
  background: #fff;
  padding: 12px 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
.chartBox {
  width: 100%;
  height: 420px;
}
.tableWrap {
  background: #fff;
  padding: 12px 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
</style>
