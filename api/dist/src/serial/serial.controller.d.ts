import { SerialService } from './serial.service';
export declare class SerialController {
    private readonly serialService;
    constructor(serialService: SerialService);
    record(body: any): Promise<{
        state: string;
        count: number;
        info: never[];
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
