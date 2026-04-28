import { AttributeService } from './attribute.service';
export declare class AttributeController {
    private readonly attributeService;
    constructor(attributeService: AttributeService);
    record(body: any): Promise<{
        state: string;
        count: number;
        info: {
            name: string;
            id: number;
            data: string | null;
            sort: number | null;
        }[];
    }>;
    save(body: any): Promise<{
        state: string;
        info: string;
    } | {
        state: string;
        info?: undefined;
    }>;
    get(body: any): Promise<{
        state: string;
        info: {
            info: {
                name: string;
                id: number;
                pid: number;
            }[];
            name: string;
            id: number;
            data: string | null;
            sort: number | null;
        };
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
    select(): Promise<{
        state: string;
        info: {
            info: {
                name: string;
                id: number;
                pid: number;
            }[];
            name: string;
            id: number;
            data: string | null;
            sort: number | null;
        }[];
    }>;
}
