import { Test, TestingModule } from '@nestjs/testing';
import { SysController } from './sys.controller';

describe('SysController', () => {
  let controller: SysController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SysController],
    }).compile();

    controller = module.get<SysController>(SysController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
