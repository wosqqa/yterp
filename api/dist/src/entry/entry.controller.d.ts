import { EntryService } from './entry.service';
export declare class EntryController {
    private readonly entryService;
    constructor(entryService: EntryService);
    save(body: any, req: any): Promise<{
        state: string;
        info: string;
        error?: undefined;
    } | {
        state: string;
        info: number;
        error?: undefined;
    } | {
        state: string;
        info: string;
        error: any;
    }>;
    record(body: any): Promise<{
        state: string;
        info: string;
        count?: undefined;
    } | {
        state: string;
        count: number;
        info: {
            time: string;
            total: number;
            logistics: any;
            file: any[];
            more: any;
            frameData: any;
            peopleData: any;
            userData: any;
            supplierData: any;
            costData: any[];
            recordData: any[];
            extension: {
                type: string;
                logistics: string;
                cse: string;
                examine: string;
                check: string;
            };
            number: string;
            user: number;
            supplier: number | null;
            frame: number;
            people: number | null;
            id: number;
            data: string | null;
            type: boolean;
            examine: boolean;
            cse: number;
            check: boolean;
        }[];
    }>;
    get(body: any): Promise<{
        state: string;
        info: string;
    } | {
        state: string;
        info: {
            class: {
                number: string;
                user: number;
                supplier: number | null;
                frame: number;
                people: number | null;
                id: number;
                data: string | null;
                more: string | null;
                file: string | null;
                type: boolean;
                time: number;
                total: import("@prisma/client/runtime/library").Decimal;
                logistics: string | null;
                examine: boolean;
                cse: number;
                check: boolean;
            } | null;
            info: {
                goods: number;
                warehouse: number | null;
                batch: string | null;
                serial: string | null;
                id: number;
                data: string | null;
                pid: number;
                total: import("@prisma/client/runtime/library").Decimal;
                mfd: number | null;
                price: import("@prisma/client/runtime/library").Decimal;
                nums: import("@prisma/client/runtime/library").Decimal;
                attr: string | null;
                unit: string | null;
            }[];
            cost: {
                iet: number;
                id: number;
                data: string | null;
                type: string;
                time: number;
                money: import("@prisma/client/runtime/library").Decimal;
                class: number;
                settle: import("@prisma/client/runtime/library").Decimal;
                state: number;
            }[];
        };
    }>;
    del(body: any, req: any): Promise<{
        state: string;
        info?: undefined;
    } | {
        state: string;
        info: any;
    }>;
    check(body: any, req: any): Promise<{
        state: string;
        info?: undefined;
    } | {
        state: string;
        info: any;
    }>;
    examine(body: any, req: any): Promise<{
        state: string;
        info?: undefined;
    } | {
        state: string;
        info: any;
    }>;
}
