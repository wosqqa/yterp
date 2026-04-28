"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const cache_manager_1 = require("@nestjs/cache-manager");
const sys_module_1 = require("./sys/sys.module");
const main_module_1 = require("./main/main.module");
const service_module_1 = require("./service/service.module");
const customer_module_1 = require("./customer/customer.module");
const supplier_module_1 = require("./supplier/supplier.module");
const goods_module_1 = require("./goods/goods.module");
const warehouse_module_1 = require("./warehouse/warehouse.module");
const account_module_1 = require("./account/account.module");
const attribute_module_1 = require("./attribute/attribute.module");
const frame_module_1 = require("./frame/frame.module");
const role_module_1 = require("./role/role.module");
const people_module_1 = require("./people/people.module");
const log_module_1 = require("./log/log.module");
const period_module_1 = require("./period/period.module");
const summary_module_1 = require("./summary/summary.module");
const backup_module_1 = require("./backup/backup.module");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const category_module_1 = require("./category/category.module");
const iet_module_1 = require("./iet/iet.module");
const code_module_1 = require("./code/code.module");
const often_module_1 = require("./often/often.module");
const bor_module_1 = require("./bor/bor.module");
const buy_module_1 = require("./buy/buy.module");
const entry_module_1 = require("./entry/entry.module");
const stock_module_1 = require("./stock/stock.module");
const batch_module_1 = require("./batch/batch.module");
const serial_module_1 = require("./serial/serial.module");
const inventory_module_1 = require("./inventory/inventory.module");
const swap_module_1 = require("./swap/swap.module");
const bre_module_1 = require("./bre/bre.module");
const sell_module_1 = require("./sell/sell.module");
const menu_module_1 = require("./menu/menu.module");
const brt_module_1 = require("./brt/brt.module");
const srt_module_1 = require("./srt/srt.module");
const mrt_module_1 = require("./mrt/mrt.module");
const sor_module_1 = require("./sor/sor.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            cache_manager_1.CacheModule.register({
                isGlobal: true,
                ttl: 60000,
            }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'uploads'),
                serveRoot: '/static/upload',
            }),
            prisma_module_1.PrismaModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule, sys_module_1.SysModule, main_module_1.MainModule, service_module_1.ServiceModule, customer_module_1.CustomerModule, supplier_module_1.SupplierModule, goods_module_1.GoodsModule, warehouse_module_1.WarehouseModule, account_module_1.AccountModule, attribute_module_1.AttributeModule, frame_module_1.FrameModule, role_module_1.RoleModule, people_module_1.PeopleModule, log_module_1.LogModule, period_module_1.PeriodModule, summary_module_1.SummaryModule, backup_module_1.BackupModule, category_module_1.CategoryModule, iet_module_1.IetModule, code_module_1.CodeModule, often_module_1.OftenModule, bor_module_1.BorModule, buy_module_1.BuyModule, entry_module_1.EntryModule, stock_module_1.StockModule, batch_module_1.BatchModule, serial_module_1.SerialModule, inventory_module_1.InventoryModule, swap_module_1.SwapModule, bre_module_1.BreModule, sell_module_1.SellModule, menu_module_1.MenuModule, brt_module_1.BrtModule, srt_module_1.SrtModule, mrt_module_1.MrtModule, sor_module_1.SorModule
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map