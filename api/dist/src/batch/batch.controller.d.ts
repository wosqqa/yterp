import { BatchService } from './batch.service';
export declare class BatchController {
    private readonly batchService;
    constructor(batchService: BatchService);
    record(body: any): Promise<{
        state: string;
        count: number;
        info: never[];
        column: never[];
    }>;
    exports(query: any): Promise<{
        state: string;
        info: string;
    }>;
    detailRecord(body: any): Promise<{
        state: string;
        info: string;
    }>;
}
