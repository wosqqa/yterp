import { PrismaService } from '../prisma/prisma.service';
export declare class RoleService {
    private prisma;
    constructor(prisma: PrismaService);
    record(body: any): Promise<{
        state: string;
        count: number;
        info: {
            name: string;
            id: number;
            data: string;
            root: string;
            auth: string;
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
        info: any;
    }>;
    del(body: any): Promise<{
        state: string;
        info: string;
    } | {
        state: string;
        info?: undefined;
    }>;
}
