import { GoodsService } from './goods.service';
import type { Response } from 'express';
export declare class GoodsController {
    private readonly goodsService;
    constructor(goodsService: GoodsService);
    record(body: any, req: any): Promise<{
        state: string;
        count: number;
        info: {
            imgs: any;
            units: any;
            strategy: any;
            more: any;
            categoryData: {
                name: string;
                id: number;
                data: string;
                pid: number;
                sort: number | null;
            } | null;
            extension: {
                unit: string;
                type: string;
            };
            number: string;
            code: string;
            batch: boolean;
            sell: import("@prisma/client/runtime/library").Decimal;
            buy: import("@prisma/client/runtime/library").Decimal;
            category: number;
            serial: boolean;
            name: string;
            id: number;
            py: string;
            data: string;
            type: boolean;
            brand: string;
            spec: string;
            unit: string;
            location: string;
            stock: import("@prisma/client/runtime/library").Decimal;
            details: string;
            validity: boolean;
            protect: number;
            threshold: number;
        }[];
    }>;
    save(body: any, req: any): Promise<{
        state: string;
        info: string;
    } | {
        state: string;
        info?: undefined;
    }>;
    get(body: any): Promise<{
        state: string;
        info: {
            attr: never[];
            type: number;
            serial: boolean;
            batch: boolean;
            validity: boolean;
            number: string;
            code: string;
            sell: import("@prisma/client/runtime/library").Decimal;
            buy: import("@prisma/client/runtime/library").Decimal;
            category: number;
            name: string;
            id: number;
            py: string;
            data: string;
            more: string;
            brand: string;
            spec: string;
            unit: string;
            location: string;
            stock: import("@prisma/client/runtime/library").Decimal;
            imgs: string;
            details: string;
            units: string;
            strategy: string;
            protect: number;
            threshold: number;
        };
    } | {
        state: string;
        info: string;
    }>;
    upload(file: Express.Multer.File): Promise<{
        state: string;
        info: string;
    }>;
    import(file: Express.Multer.File, req: any): Promise<{
        state: string;
        info: any;
    }>;
    exports(query: any, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
