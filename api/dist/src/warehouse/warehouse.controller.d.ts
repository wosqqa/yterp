import { WarehouseService } from './warehouse.service';
export declare class WarehouseController {
    private readonly warehouseService;
    constructor(warehouseService: WarehouseService);
    record(body: any, req: any): Promise<{
        state: string;
        count: number;
        info: {
            frameData: {
                name: string;
                id: number;
                data: string;
                pid: number;
                sort: number | null;
            } | null;
            number: string;
            frame: number;
            name: string;
            id: number;
            tel: string;
            data: string;
            contacts: string;
            add: string;
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
            number: string;
            frame: number;
            name: string;
            id: number;
            tel: string;
            data: string;
            contacts: string;
            add: string;
        };
    } | {
        state: string;
        info: string;
    }>;
    del(body: any): Promise<{
        state: string;
        info?: undefined;
    } | {
        state: string;
        info: string;
    }>;
}
