import { PrismaService } from '../prisma/prisma.service';
export declare class PeriodService {
    private prisma;
    constructor(prisma: PrismaService);
    record(body: any, user: any): Promise<{
        state: string;
        count: number;
        info: {
            userData: {
                user: string;
                role: number;
                frame: number;
                name: string;
                id: number;
                py: string;
                tel: string;
                pwd: string;
                img: string;
                token: string | null;
                expire: number;
                data: string;
                more: string;
            } | undefined;
            user: number;
            id: number;
            date: number;
            time: number;
        }[];
    }>;
    save(body: any, user: any): Promise<{
        state: string;
        info?: undefined;
    } | {
        state: string;
        info: string;
    }>;
    back(): Promise<{
        state: string;
    }>;
    private getPeriod;
}
