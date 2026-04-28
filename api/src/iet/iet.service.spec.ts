import { Test, TestingModule } from '@nestjs/testing';
import { IetService } from './iet.service';

describe('IetService', () => {
  let service: IetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IetService],
    }).compile();

    service = module.get<IetService>(IetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
