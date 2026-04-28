import { PrismaService } from '../prisma/prisma.service';
export declare class BatchService {
    private prisma;
    constructor(prisma: PrismaService);
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
    detailRecord(body: any): Promise<{
        state: string;
        info: string;
    }>;
}
