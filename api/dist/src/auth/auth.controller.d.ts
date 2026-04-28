import { AuthService } from './auth.service';
import { SysService } from '../sys/sys.service';
export declare class AuthController {
    private authService;
    private sysService;
    constructor(authService: AuthService, sysService: SysService);
    captcha(): Promise<{
        state: string;
        info: {
            uuid: `${string}-${string}-${string}-${string}-${string}`;
            data: string;
        };
    }>;
    runData(req: any): Promise<{
        state: string;
        info: {
            login: boolean;
            sys: {};
            ver: string;
        };
    }>;
    login(req: any): Promise<{
        access_token: string;
        state: string;
        info: any;
        token: string;
    }>;
    getProfile(req: any): any;
}
