import { Test, TestingModule } from '@nestjs/testing';
import { BrtController } from './brt.controller';

describe('BrtController', () => {
  let controller: BrtController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrtController],
    }).compile();

    controller = module.get<BrtController>(BrtController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
