import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { EntryService } from './entry.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('entry')
export class EntryController {
  constructor(private readonly entryService: EntryService) {}

  @Post('save')
  // @UseGuards(AuthGuard('jwt'))
  async save(@Body() body: any, @Req() req: any) {
    // Mock user for now if auth is not working or disabled
    const user = req.user || { userId: 1, frame: 1 }; 
    return this.entryService.save(body, user);
  }

  @Post('record')
  async record(@Body() body: any) {
    return this.entryService.record(body);
  }
  
  @Post('get')
  async get(@Body() body: any) {
    return this.entryService.get(body);
  }

  @Post('del')
  async del(@Body() body: any, @Req() req: any) {
    const user = req.user || { userId: 1, frame: 1 };
    return this.entryService.del(body, user);
  }

  @Post('check')
  async check(@Body() body: any, @Req() req: any) {
    const user = req.user || { userId: 1, frame: 1 };
    return this.entryService.check(body, user);
  }

  @Post('examine')
  async examine(@Body() body: any, @Req() req: any) {
    const user = req.user || { userId: 1, frame: 1 };
    return this.entryService.examine(body, user);
  }
}
