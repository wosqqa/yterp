import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { PeopleService } from './people.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('people')
@UseGuards(AuthGuard('jwt'))
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Post('record')
  record(@Body() body: any, @Req() req: any) {
    return this.peopleService.record(body, req.user);
  }

  @Post('save')
  save(@Body() body: any, @Req() req: any) {
    return this.peopleService.save(body, req.user);
  }

  @Post('get')
  get(@Body() body: any) {
    return this.peopleService.get(body);
  }

  @Post('del')
  del(@Body() body: any) {
    return this.peopleService.del(body);
  }
}
