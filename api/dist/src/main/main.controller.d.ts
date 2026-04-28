import { MainService } from './main.service';
export declare class MainController {
    private readonly mainService;
    constructor(mainService: MainService);
    record(req: any): Promise<{
        state: string;
        info: {
            lattice: any;
            summary: any;
            option: any[];
            assets: any;
            fund: any;
            load: {
                cache: {
                    size: string;
                    rate: number;
                };
                mysql: {
                    size: string;
                    rate: number;
                };
            };
            run: {
                os: NodeJS.Platform;
                soft: string;
                php: string;
                mysql: any;
                protocol: string;
            };
        };
    }>;
}
