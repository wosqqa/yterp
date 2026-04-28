import { AccountService } from './account.service';
export declare class AccountController {
    private readonly accountService;
    constructor(accountService: AccountService);
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
            extension: {
                money: number;
            };
            number: string;
            frame: number;
            name: string;
            id: number;
            data: string | null;
            time: number;
            balance: import("@prisma/client/runtime/library").Decimal;
            initial: import("@prisma/client/runtime/library").Decimal;
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
            data: string | null;
            time: number;
            balance: import("@prisma/client/runtime/library").Decimal;
            initial: import("@prisma/client/runtime/library").Decimal;
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
