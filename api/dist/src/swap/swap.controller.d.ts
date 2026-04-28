import { SwapService } from './swap.service';
export declare class SwapController {
    private readonly swapService;
    constructor(swapService: SwapService);
    record(body: any, req: any): Promise<{
        state: string;
        info: string;
        count?: undefined;
    } | {
        state: string;
        count: number;
        info: {
            time: string;
            total: number;
            cost: number;
            logistics: null;
            file: never[];
            more: {};
            frameData: any;
            peopleData: any;
            userData: any;
            costData: any[];
            recordData: any[];
            extension: {
                type: string;
                examine: string;
                cse: string;
            };
            number: string;
            user: number;
            frame: number;
            people: number | null;
            id: number;
            data: string;
            examine: boolean | null;
            cse: number | null;
        }[];
    }>;
    save(body: any, req: any): Promise<{
        state: string;
        info: string;
    } | {
        state: string;
        info: number;
    }>;
}
