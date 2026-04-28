import { PrismaService } from '../prisma/prisma.service';
export declare class SysService {
    private prisma;
    constructor(prisma: PrismaService);
    getSys(keys?: string[]): Promise<{}>;
    record(): Promise<{
        state: string;
        info: {};
    }>;
    save(body: any): Promise<{
        state: string;
        info?: undefined;
    } | {
        state: string;
        info: string;
    }>;
}
