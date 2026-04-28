import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('category')
@UseGuards(AuthGuard('jwt'))
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post('record')
  record() {
    return this.categoryService.record();
  }

  @Post('save')
  save(@Body() body: any) {
    return this.categoryService.save(body);
  }

  @Post('get')
  get(@Body() body: any) {
    return this.categoryService.get(body);
  }

  @Post('del')
  del(@Body() body: any) {
    return this.categoryService.del(body);
  }
}
