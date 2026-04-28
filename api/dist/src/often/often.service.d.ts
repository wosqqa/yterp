import { PrismaService } from '../prisma/prisma.service';
export declare class OftenService {
    private prisma;
    constructor(prisma: PrismaService);
    record(user: any): Promise<{
        state: string;
        info: {
            user: number;
            name: string;
            id: number;
            key: string;
        }[];
    }>;
    save(body: any, user: any): Promise<{
        state: string;
        info?: undefined;
    } | {
        state: string;
        info: string;
    }>;
}
