import { Test, TestingModule } from '@nestjs/testing';
import { IetController } from './iet.controller';

describe('IetController', () => {
  let controller: IetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IetController],
    }).compile();

    controller = module.get<IetController>(IetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
