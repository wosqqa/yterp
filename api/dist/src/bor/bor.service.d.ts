import { PrismaService } from '../prisma/prisma.service';
export declare class BorService {
    private prisma;
    constructor(prisma: PrismaService);
    record(body: any, user: any): Promise<{
        state: string;
        count: number;
        info: {
            supplierData: {
                number: string;
                user: number;
                account: string;
                category: string;
                frame: number;
                name: string;
                id: number;
                py: string;
                data: string;
                more: string;
                bank: string;
                tax: string;
                contacts: string;
                balance: import("@prisma/client/runtime/library").Decimal;
                rate: import("@prisma/client/runtime/library").Decimal;
            } | null;
            peopleData: {
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
            } | null;
            frameData: {
                name: string;
                id: number;
                data: string;
                pid: number;
                sort: number | null;
            } | null;
            relation: {
                type: string;
                time: string;
                number: string;
                sort: number;
                types: string;
                id: number;
            }[];
            extension: {};
            number: string;
            user: number;
            supplier: number;
            frame: number;
            people: number | null;
            id: number;
            data: string | null;
            more: string | null;
            file: string | null;
            time: number;
            actual: import("@prisma/client/runtime/library").Decimal;
            source: number | null;
            total: import("@prisma/client/runtime/library").Decimal;
            logistics: string | null;
            examine: boolean;
            state: number;
            arrival: number;
        }[];
    }>;
    save(body: any, user: any): Promise<{
        state: string;
        info: string;
    } | {
        state: string;
        info?: undefined;
    }>;
}
