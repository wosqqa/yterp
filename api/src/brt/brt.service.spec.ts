import { Test, TestingModule } from '@nestjs/testing';
import { BrtService } from './brt.service';

describe('BrtService', () => {
  let service: BrtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BrtService],
    }).compile();

    service = module.get<BrtService>(BrtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
