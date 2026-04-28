import { Test, TestingModule } from '@nestjs/testing';
import { OftenService } from './often.service';

describe('OftenService', () => {
  let service: OftenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OftenService],
    }).compile();

    service = module.get<OftenService>(OftenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
