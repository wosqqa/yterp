import { PrismaService } from '../prisma/prisma.service';
export declare class FrameService {
    private prisma;
    constructor(prisma: PrismaService);
    record(): Promise<{
        state: string;
        info: any[];
    }>;
    save(body: any): Promise<{
        state: string;
        info: string;
    } | {
        state: string;
        info?: undefined;
    }>;
    get(body: any): Promise<{
        state: string;
        info: {
            name: string;
            id: number;
            data: string;
            pid: number;
            sort: number | null;
        } | null;
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
    private getAllChildrenIds;
}
