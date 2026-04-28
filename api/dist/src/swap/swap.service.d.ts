import { PrismaService } from '../prisma/prisma.service';
export declare class SwapService {
    private prisma;
    constructor(prisma: PrismaService);
    record(body: any, user: any): Promise<{
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
    save(body: any, user: any): Promise<{
        state: string;
        info: string;
    } | {
        state: string;
        info: number;
    }>;
}
