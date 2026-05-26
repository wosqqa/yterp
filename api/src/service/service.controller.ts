import { Controller, Post, UseGuards, Request, Body, Res } from '@nestjs/common';
import { ServiceService } from './service.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';

@ApiTags('service')
@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post('out')
  @ApiOperation({ summary: 'Logout' })
  out() {
    return { state: 'success' };
  }

  @Post('roleRecord')
  @ApiOperation({ summary: 'Get Role List' })
  roleRecord(@Body() body: any) {
    return this.serviceService.roleRecord(body);
  }

  @Post('store')
  @ApiOperation({ summary: 'Get Store Data' })
  store(@Request() req) {
    req.user = { userId: 1, role: 0, frame: 0 };
    return this.serviceService.store(req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('getScene')
  @ApiOperation({ summary: 'Get Scene Data' })
  getScene(@Body() body: any) {
    return this.serviceService.getScene(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('userRecord')
  @ApiOperation({ summary: 'Get User List' })
  userRecord(@Body() body: any, @Request() req) {
    return this.serviceService.userRecord(body, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('goodsRecord')
  @ApiOperation({ summary: 'Get Goods List' })
  goodsRecord(@Body() body: any, @Request() req) {
    return this.serviceService.goodsRecord(body, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('goodsDepot')
  @ApiOperation({ summary: 'Get Goods Stock By Warehouse' })
  goodsDepot(@Body() body: any, @Request() req) {
    return this.serviceService.goodsDepot(body, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('accountRecord')
  @ApiOperation({ summary: 'Get Account List' })
  accountRecord(@Body() body: any, @Request() req) {
    return this.serviceService.accountRecord(body, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('supplierRecord')
  @ApiOperation({ summary: 'Get Supplier List' })
  supplierRecord(@Body() body: any, @Request() req) {
    return this.serviceService.supplierRecord(body, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('peopleRecord')
  @ApiOperation({ summary: 'Get People List' })
  peopleRecord(@Body() body: any, @Request() req) {
    return this.serviceService.peopleRecord(body, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('customerRecord')
  @ApiOperation({ summary: 'Get Customer List' })
  customerRecord(@Body() body: any, @Request() req) {
    return this.serviceService.customerRecord(body, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('exportXlsx')
  exportXlsx(@Body() body: any, @Request() req, @Res() res: Response) {
    return Promise.resolve(this.serviceService.exportXlsx(body, req.user)).then((result: any) => {
      if (!result || result.state !== 'success') {
        return res.json(result || { state: 'error', info: '内部错误' });
      }
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(result.fileName || 'export.xlsx')}`);
      res.send(result.buffer);
    });
  }
}
