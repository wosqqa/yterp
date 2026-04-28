import { Test, TestingModule } from '@nestjs/testing';
import { OftenController } from './often.controller';

describe('OftenController', () => {
  let controller: OftenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OftenController],
    }).compile();

    controller = module.get<OftenController>(OftenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
