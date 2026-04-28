import { PrismaService } from '../prisma/prisma.service';
export declare class AccountService {
    private prisma;
    constructor(prisma: PrismaService);
    record(body: any, user: any): Promise<{
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
    save(body: any, user: any): Promise<{
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
