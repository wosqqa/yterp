<template>
  <el-dialog class="tabsDialog" :visible.sync="visible" title="详情" width="70%" v-madeDialog>
    <transition name="el-fade-in">
      <template v-if="visible">
        <el-form :model="form" :rules="rules" ref="form" label-width="96px" :inline="true">
          <el-tabs v-model="dialog.active">
            <el-tab-pane label="基础资料" name="base">
              <el-form-item label="客户名称" prop="name">
                <el-input placeholder="请输入客户名称" v-model="form.name" clearable></el-input>
              </el-form-item>
              <el-form-item label="客户编号" prop="number">
                <el-input placeholder="请输入客户编号" v-model="form.number" clearable></el-input>
              </el-form-item>
              <el-form-item label="所属组织" prop="frame">
                <nodTree v-model="form.frame" :treeData="store.frame" placeholder="请选择所属组织"></nodTree>
              </el-form-item>
              <el-form-item label="所属用户" prop="user">
                <nodList v-model="form.user" placeholder="请选择所属用户" action="service/userRecord" scene="user"></nodList>
              </el-form-item>
              <el-form-item label="客户类别">
                <el-select v-model="form.category" placeholder="请选择客户类别">
                  <template v-for="category in store.sys.crCategory">
                    <el-option :key="category" :label="category" :value="category"></el-option>
                  </template>
                </el-select>
              </el-form-item>
              <el-form-item label="客户等级">
                <el-select v-model="form.grade" placeholder="请选择客户等级">
                  <template v-for="grade in store.sys.crGrade">
                    <el-option :key="grade" :label="grade" :value="grade"></el-option>
                  </template>
                </el-select>
              </el-form-item>
              <el-form-item label="开户银行">
                <el-input placeholder="请输入开户银行" v-model="form.bank" clearable></el-input>
              </el-form-item>
              <el-form-item label="银行账号">
                <el-input placeholder="请输入银行账号" v-model="form.account" clearable></el-input>
              </el-form-item>
              <el-form-item label="纳税号码">
                <el-input placeholder="请输入纳税人识别号" v-model="form.tax" clearable></el-input>
              </el-form-item>
              <el-form-item label="备注信息">
                <el-input placeholder="请输入备注信息" v-model="form.data" clearable></el-input>
              </el-form-item>
            </el-tab-pane>
            <el-tab-pane label="联系资料" name="contacts">
              <el-table :data="form.contacts" height="200px" border>
                <el-table-column label="主联系人" align="center" min-width="90px">
                  <template slot-scope="scope">
                    <span>{{ scope.row.main ? "是" : "否" }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="name" label="联系人员" align="center" width="120px"></el-table-column>
                <el-table-column prop="tel" label="联系号码" align="center" width="120px"></el-table-column>
                <el-table-column prop="add" label="联系地址" align="center" width="160px"></el-table-column>
                <el-table-column prop="data" label="备注信息" align="center" min-width="120px"></el-table-column>
                <el-table-column prop="set" align="center" width="160px" fixed="right">
                  <template slot="header">
                    <span style="margin-right: 3px">相关操作</span>
                    <i class="el-icon-circle-plus-outline" @click="setContacts(-1)"></i>
                  </template>
                  <template slot-scope="scope">
                    <el-button-group>
                      <el-button @click="copyContacts(scope.row)" size="mini">复制</el-button>
                      <el-button @click="setContacts(scope.$index)" size="mini">详情</el-button>
                      <el-button @click="delContacts(scope.$index)" size="mini">删除</el-button>
                    </el-button-group>
                  </template>
                </el-table-column>
              </el-table>
              <el-dialog :visible.sync="contacts.dialog" title="联系资料" width="360px" :append-to-body="true" v-madeDialog>
                <transition name="el-fade-in">
                  <template v-if="contacts.dialog">
                    <el-form :model="contacts.form" :rules="contacts.rules" ref="contactsForm" label-width="80px">
                      <el-form-item label="主联系人">
                        <el-switch v-model="contacts.form.main"></el-switch>
                      </el-form-item>
                      <el-form-item label="联系人员" prop="name">
                        <el-input placeholder="请输入联系人员" v-model="contacts.form.name"></el-input>
                      </el-form-item>
                      <el-form-item label="联系号码" prop="tel">
                        <el-input placeholder="请输入联系号码" v-model="contacts.form.tel"></el-input>
                      </el-form-item>
                      <el-form-item label="联系地址">
                        <el-input placeholder="请输入联系地址" v-model="contacts.form.add"></el-input>
                      </el-form-item>
                      <el-form-item label="备注信息">
                        <el-input placeholder="请输入备注信息" v-model="contacts.form.data"></el-input>
                      </el-form-item>
                    </el-form>
                  </template>
                </transition>
                <span slot="footer" class="dialog-footer">
                  <el-button @click="contacts.dialog = false">取消</el-button>
                  <el-button @click="saveContacts" type="primary">保存</el-button>
                </span>
              </el-dialog>
            </el-tab-pane>
            <template v-if="store.fields && store.fields.hasOwnProperty('customer')">
              <el-tab-pane label="扩展信息" name="more">
                <FieldForm v-model="form.more" rule="customer" prefix="more."></FieldForm>
              </el-tab-pane>
            </template>
          </el-tabs>
        </el-form>
      </template>
    </transition>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取消</el-button>
      <template v-if="form.id == 0 || $lib.getUserRoot(store.root, 'base', 'edit')">
        <el-button @click="save" type="primary">保存</el-button>
      </template>
    </span>
  </el-dialog>
</template>

<script>
import NodTree from "@/components/lib/NodTree";
import NodList from "@/components/lib/NodList";
import FieldForm from "@/components/lib/FieldForm";

export default {
  name: "CustomerDetail",
  components: {
    NodTree,
    NodList,
    FieldForm,
  },
  props: {
    value: {
      default: false,
    },
    id: {
      default: 0,
    },
  },
  data() {
    return {
      dialog: {
        active: "base",
      },
      form: {
        id: 0,
        name: "",
        number: "",
        frame: null,
        user: null,
        category: "常规类别",
        grade: "常规等级",
        bank: "",
        account: "",
        tax: "",
        data: "",
        contacts: [],
        more: {},
      },
      rules: {
        name: {
          required: true,
          message: "请输入客户名称",
          trigger: "blur",
        },
        number: {
          required: true,
          message: "请输入客户编号",
          trigger: "blur",
        },
        frame: {
          required: true,
          message: "请选择所属组织",
          trigger: "change",
        },
        user: {
          required: true,
          message: "请选择所属用户",
          trigger: "change",
        },
      },
      contacts: {
        index: -1,
        dialog: false,
        form: {
          main: true,
          name: "",
          tel: "",
          add: "",
          data: "",
        },
        rules: {
          name: {
            required: true,
            message: "请输入联系人员",
            trigger: "blur",
          },
          tel: {
            required: true,
            message: "请输入联系号码",
            trigger: "blur",
          },
        },
      },
      lastLoadedId: null,
    };
  },
  computed: {
    store() {
      return this.$store.state;
    },
    visible: {
      get() {
        return !!this.value;
      },
      set(v) {
        this.$emit("input", v);
      },
    },
  },
  watch: {
    visible(val) {
      if (!val) return;
      this.dialog.active = "base";
      this.set(this.id || 0);
    },
    id(val) {
      if (!this.visible) return;
      const nid = Number(val) || 0;
      if (this.lastLoadedId === nid) return;
      this.set(nid);
    },
  },
  methods: {
    copyText(text) {
      const val = text == null ? "" : String(text);
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(val);
      }
      return new Promise((resolve, reject) => {
        try {
          const el = document.createElement("textarea");
          el.value = val;
          el.setAttribute("readonly", "");
          el.style.position = "fixed";
          el.style.opacity = "0";
          el.style.left = "-9999px";
          el.style.top = "0";
          document.body.appendChild(el);
          el.select();
          el.setSelectionRange(0, el.value.length);
          const ok = document.execCommand("copy");
          document.body.removeChild(el);
          ok ? resolve(true) : reject(new Error("copy failed"));
        } catch (e) {
          reject(e);
        }
      });
    },
    copyContacts(row) {
      const r = row || {};
      const mark = r.data == null ? "" : String(r.data);
      const name = r.name == null ? "" : String(r.name);
      const tel = r.tel == null ? "" : String(r.tel);
      const add = r.add == null ? "" : String(r.add);
      const text = ["唛头：" + mark, "联系人:" + name + "+" + tel, "地址：" + add].join("\n");
      this.copyText(text)
        .then(() => {
          this.$message({ type: "success", message: "复制成功!" });
        })
        .catch(() => {
          this.$message({ type: "warning", message: "复制失败,请手动复制!" });
        });
    },
    resetForm() {
      this.form = this.$lib.extend(true, {}, this.$options.data().form);
    },
    set(id) {
      this.lastLoadedId = Number(id) || 0;
      this.resetForm();
      const cid = this.lastLoadedId;
      if (cid > 0) {
        this.$axios
          .post("customer/get", {
            id: cid,
          })
          .then((result) => {
            if (result.state == "success") {
              this.form = result.info;
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
        this.form.frame = this.store.user.frame;
        this.form.user = this.store.user.id;
      }
    },
    save() {
      this.$refs["form"].validate((valid) => {
        if (valid) {
          this.$axios.post("customer/save", this.form).then((result) => {
            if (result.state == "success") {
              this.visible = false;
              this.$emit("saved", this.form);
              this.$message({
                type: "success",
                message: "详情保存成功!",
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
        } else {
          this.$message({
            type: "warning",
            message: "表单验证错误,请检查并修正!",
          });
        }
      });
    },
    setContacts(index) {
      this.contacts.form =
        index == -1
          ? Object.assign({}, this.$options.data().contacts.form)
          : Object.assign({}, this.form.contacts[index]);
      this.contacts.index = index;
      this.contacts.dialog = true;
    },
    saveContacts() {
      this.$refs["contactsForm"].validate((valid) => {
        if (valid) {
          if (this.form.contacts.length == 0) {
            this.contacts.form.main = true;
          } else {
            if (this.contacts.form.main == true) {
              for (let key in this.form.contacts) {
                this.form.contacts[key].main = false;
              }
            }
          }
          if (this.contacts.index > -1) {
            this.form.contacts.splice(this.contacts.index, 1, this.contacts.form);
          } else {
            this.form.contacts.push(this.contacts.form);
          }
          this.$message({
            type: "success",
            message: "更新联系资料成功,保存后生效!",
          });
          this.contacts.dialog = false;
        }
      });
    },
    delContacts(index) {
      let source = this.form.contacts[index].main;
      this.form.contacts.splice(index, 1);
      if (source == true && this.form.contacts.length > 0) {
        this.form.contacts[0].main = true;
      }
      this.$message({
        type: "success",
        message: "删除联系资料成功,保存后生效!",
      });
    },
  },
};
</script>
