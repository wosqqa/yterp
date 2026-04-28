import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
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
    buildEntry(body: any): Promise<{
        state: string;
        info: string;
    } | {
        state: string;
        info: {
            class: {
                total: number;
                type: number;
            };
            info: any[];
        };
    }>;
    buildExtry(body: any): Promise<{
        state: string;
        info: string;
    } | {
        state: string;
        info: {
            class: {
                total: number;
                type: number;
            };
            info: any[];
        };
    }>;
}
