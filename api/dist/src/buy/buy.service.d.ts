import { PrismaService } from '../prisma/prisma.service';
export declare class BuyService {
    private prisma;
    constructor(prisma: PrismaService);
    record(body: any, user: any): Promise<{
        state: string;
        count: number;
        info: {
            time: string;
            total: number;
            actual: number;
            money: number;
            cost: number;
            logistics: {
                key: string;
                name: string;
                number: string;
            };
            more: {};
            file: never[];
            examine: number;
            nucleus: number;
            cse: number;
            invoice: number;
            check: number;
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
            billData: never[];
            costData: never[];
            invoiceData: never[];
            recordData: never[];
            extension: {
                logistics: string;
                examine: string;
                nucleus: string;
                cse: string;
                invoice: string;
                check: string;
                amount: number;
                anwo: number;
            };
            number: string;
            user: number;
            supplier: number;
            account: number | null;
            frame: number;
            people: number | null;
            id: number;
            data: string | null;
            source: number;
        }[];
    }>;
    save(body: any, user: any): Promise<{
        state: string;
        info?: undefined;
    } | {
        state: string;
        info: any;
    }>;
    get(body: any): Promise<{
        state: string;
        info: any;
    }>;
    del(body: any): Promise<{
        state: string;
        info: string;
    }>;
    check(body: any): Promise<{
        state: string;
        info: string;
    }>;
    examine(body: any): Promise<{
        state: string;
        info: string;
    }>;
}
