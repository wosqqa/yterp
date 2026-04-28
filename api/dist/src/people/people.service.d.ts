import { PrismaService } from '../prisma/prisma.service';
export declare class PeopleService {
    private prisma;
    constructor(prisma: PrismaService);
    record(body: any, user: any): Promise<{
        state: string;
        count: number;
        info: {
            frameData: {
                name: string;
                id: number;
                data: string;
                pid: number;
                sort: number | null;
            } | null;
            extension: {
                sex: string;
            };
            number: string;
            frame: number;
            name: string;
            id: number;
            py: string;
            tel: string | null;
            data: string | null;
            more: string | null;
            add: string | null;
            sex: boolean;
            card: string | null;
        }[];
    }>;
    save(body: any, user: any): Promise<{
        state: string;
    }>;
    get(body: any): Promise<{
        state: string;
        info: {
            number: string;
            frame: number;
            name: string;
            id: number;
            py: string;
            tel: string | null;
            data: string | null;
            more: string | null;
            add: string | null;
            sex: boolean;
            card: string | null;
        } | null;
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
