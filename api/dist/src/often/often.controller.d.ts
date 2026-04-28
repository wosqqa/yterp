import { OftenService } from './often.service';
export declare class OftenController {
    private readonly oftenService;
    constructor(oftenService: OftenService);
    record(req: any): Promise<{
        state: string;
        info: {
            user: number;
            name: string;
            id: number;
            key: string;
        }[];
    }>;
    save(body: any, req: any): Promise<{
        state: string;
        info?: undefined;
    } | {
        state: string;
        info: string;
    }>;
}
