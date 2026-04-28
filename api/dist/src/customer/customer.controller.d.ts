import { CustomerService } from './customer.service';
export declare class CustomerController {
    private readonly customerService;
    constructor(customerService: CustomerService);
    record(body: any, req: any): Promise<{
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
    save(body: any, req: any): Promise<{
        state: string;
        info?: undefined;
    } | {
        state: string;
        info: string;
    }>;
    del(body: any, req: any): Promise<{
        state: string;
        info?: undefined;
    } | {
        state: string;
        info: string;
    }>;
    get(body: any): Promise<{
        state: string;
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
            grade: string;
            bank: string;
            tax: string;
            contacts: string;
            balance: import("@prisma/client/runtime/library").Decimal;
        };
    } | {
        state: string;
        info: string;
    }>;
}
