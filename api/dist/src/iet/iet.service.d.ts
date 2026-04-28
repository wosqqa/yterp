import { PrismaService } from '../prisma/prisma.service';
export declare class IetService {
    private prisma;
    constructor(prisma: PrismaService);
    record(body: any): Promise<{
        state: string;
        count: number;
        info: {
            type: number;
            extension: {
                type: string;
            };
            name: string;
            id: number;
            data: string;
            sort: number;
        }[];
    }>;
    save(body: any): Promise<{
        state: string;
        info?: undefined;
    } | {
        state: string;
        info: string;
    }>;
    get(body: any): Promise<{
        state: string;
        info: {
            type: number;
            name: string;
            id: number;
            data: string;
            sort: number;
        };
    } | {
        state: string;
        info: string;
    }>;
    del(body: any): Promise<{
        state: string;
        info: string;
    } | {
        state: string;
        info?: undefined;
    }>;
}
