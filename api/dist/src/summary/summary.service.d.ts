import { PrismaService } from '../prisma/prisma.service';
import { PeriodService } from '../period/period.service';
import { SysService } from '../sys/sys.service';
export declare class SummaryService {
    private prisma;
    private periodService;
    private sysService;
    constructor(prisma: PrismaService, periodService: PeriodService, sysService: SysService);
    private getPeriodTime;
    init(): Promise<{
        state: string;
        count: number;
        info: {
            valuation: any;
            branch: string;
            rule: any;
        };
    }>;
}
