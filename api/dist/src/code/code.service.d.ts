import { PrismaService } from '../prisma/prisma.service';
export declare class CodeService {
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
            info: string;
            name: string;
            id: number;
            data: string | null;
        }[];
    }>;
    save(body: any): Promise<{
        state: string;
    }>;
    get(body: any): Promise<{
        state: string;
        info: {
            type: number;
            info: string;
            name: string;
            id: number;
            data: string | null;
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
