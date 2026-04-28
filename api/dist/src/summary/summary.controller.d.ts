import { SummaryService } from './summary.service';
export declare class SummaryController {
    private readonly summaryService;
    constructor(summaryService: SummaryService);
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
