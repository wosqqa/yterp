import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { SysModule } from './sys/sys.module';
import { MainModule } from './main/main.module';
import { ServiceModule } from './service/service.module';
import { CustomerModule } from './customer/customer.module';
import { SupplierModule } from './supplier/supplier.module';
import { GoodsModule } from './goods/goods.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { AccountModule } from './account/account.module';
import { AttributeModule } from './attribute/attribute.module';
import { FrameModule } from './frame/frame.module';
import { RoleModule } from './role/role.module';
import { PeopleModule } from './people/people.module';
import { LogModule } from './log/log.module';
import { PeriodModule } from './period/period.module';
import { SummaryModule } from './summary/summary.module';
import { BackupModule } from './backup/backup.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CategoryModule } from './category/category.module';
import { IetModule } from './iet/iet.module';
import { CodeModule } from './code/code.module';
import { OftenModule } from './often/often.module';
import { BorModule } from './bor/bor.module';
import { BuyModule } from './buy/buy.module';
import { EntryModule } from './entry/entry.module';
import { StockModule } from './stock/stock.module';
import { BatchModule } from './batch/batch.module';
import { SerialModule } from './serial/serial.module';
import { InventoryModule } from './inventory/inventory.module';
import { SwapModule } from './swap/swap.module';
import { BreModule } from './bre/bre.module';
import { SellModule } from './sell/sell.module';
import { MenuModule } from './menu/menu.module';
import { BrtModule } from './brt/brt.module';
import { SrtModule } from './srt/srt.module';
import { MrtModule } from './mrt/mrt.module';
import { SorModule } from './sor/sor.module';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 60000, // 60 seconds
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/static/upload',
    }),
    PrismaModule, 
    UsersModule, 
    AuthModule, SysModule, MainModule, ServiceModule, CustomerModule, SupplierModule, GoodsModule, WarehouseModule, AccountModule, AttributeModule, FrameModule, RoleModule, PeopleModule, LogModule, PeriodModule, SummaryModule, BackupModule, CategoryModule, IetModule, CodeModule, OftenModule, BorModule, BuyModule, EntryModule, StockModule, BatchModule, SerialModule, InventoryModule, SwapModule, BreModule, SellModule, MenuModule, BrtModule, SrtModule, MrtModule, SorModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
