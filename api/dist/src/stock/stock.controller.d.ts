import { StockService } from './stock.service';
import type { Response } from 'express';
export declare class StockController {
    private readonly stockService;
    constructor(stockService: StockService);
    record(body: any): Promise<{
        state: string;
        info: string;
        count?: undefined;
        column?: undefined;
    } | {
        state: string;
        count: number;
        info: any[];
        column: {
            id: number;
            key: string;
            name: string;
        }[];
    }>;
    exports(query: any, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    detailRecord(body: any): Promise<{
        state: string;
        info: string;
        count?: undefined;
    } | {
        state: string;
        count: number;
        info: any[];
    }>;
    detailExports(query: any, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
