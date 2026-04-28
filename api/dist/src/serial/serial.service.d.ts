import { PrismaService } from '../prisma/prisma.service';
export declare class SerialService {
    private prisma;
    constructor(prisma: PrismaService);
    record(body: any): Promise<{
        state: string;
        count: number;
        info: never[];
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
