import { Test, TestingModule } from '@nestjs/testing';
import { BreController } from './bre.controller';

describe('BreController', () => {
  let controller: BreController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BreController],
    }).compile();

    controller = module.get<BreController>(BreController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
