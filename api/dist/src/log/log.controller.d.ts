import { LogService } from './log.service';
export declare class LogController {
    private readonly logService;
    constructor(logService: LogService);
    record(body: any, req: any): Promise<{
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
            info: string;
            user: number;
            id: number;
            time: number;
        }[];
    }>;
    empty(): Promise<{
        state: string;
        info?: undefined;
    } | {
        state: string;
        info: string;
    }>;
}
