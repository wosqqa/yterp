import { ServiceService } from './service.service';
export declare class ServiceController {
    private readonly serviceService;
    constructor(serviceService: ServiceService);
    out(): {
        state: string;
    };
    roleRecord(body: any): Promise<{
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
    store(req: any): Promise<{
        state: string;
        info: {
            frame: any[];
            menu: any[];
            fields: {};
            root: any;
            category: any[];
            warehouse: {
                number: string;
                frame: number;
                name: string;
                id: number;
                tel: string;
                data: string;
                contacts: string;
                add: string;
            }[];
            account: {
                number: string;
                frame: number;
                name: string;
                id: number;
                data: string | null;
                time: number;
                balance: import("@prisma/client/runtime/library").Decimal;
                initial: import("@prisma/client/runtime/library").Decimal;
            }[];
            iet: {
                in: any[];
                out: any[];
            };
            often: string[];
            sys: {
                logistics: never[];
            };
        };
    }>;
    getScene(body: any): Promise<{
        state: string;
        info: any;
    }>;
    userRecord(body: any, req: any): Promise<{
        state: string;
        count: number;
        info: {
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
        }[];
    }>;
    goodsRecord(body: any, req: any): Promise<{
        state: string;
        count: number;
        info: any[];
    } | {
        state: string;
        info: any;
        count?: undefined;
    }>;
    accountRecord(body: any, req: any): Promise<{
        state: string;
        count: number;
        info: {
            number: string;
            frame: number;
            name: string;
            id: number;
            data: string | null;
            time: number;
            balance: import("@prisma/client/runtime/library").Decimal;
            initial: import("@prisma/client/runtime/library").Decimal;
        }[];
    }>;
    supplierRecord(body: any, req: any): Promise<{
        state: string;
        count: number;
        info: {
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
        }[];
    }>;
    peopleRecord(body: any, req: any): Promise<{
        state: string;
        count: number;
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
        }[];
    }>;
    customerRecord(body: any, req: any): Promise<{
        state: string;
        count: number;
        info: {
            balance: number;
            contacts: any[];
            more: any;
            frameData: {
                name: string;
                id: number;
                data: string;
                pid: number;
                sort: number | null;
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
            extension: {
                contact: string;
            };
            number: string;
            user: number;
            account: string;
            category: string;
            frame: number;
            name: string;
            id: number;
            py: string;
            data: string;
            grade: string;
            bank: string;
            tax: string;
        }[];
    }>;
}
