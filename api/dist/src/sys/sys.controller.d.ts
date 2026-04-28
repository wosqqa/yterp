import { SysService } from './sys.service';
export declare class SysController {
    private readonly sysService;
    constructor(sysService: SysService);
    record(): Promise<{
        state: string;
        info: {};
    }>;
    save(body: any): Promise<{
        state: string;
        info?: undefined;
    } | {
        state: string;
        info: string;
    }>;
}
