import { RoleService } from './role.service';
export declare class RoleController {
    private readonly roleService;
    constructor(roleService: RoleService);
    record(body: any): Promise<{
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
    save(body: any): Promise<{
        state: string;
        info?: undefined;
    } | {
        state: string;
        info: string;
    }>;
    get(body: any): Promise<{
        state: string;
        info: any;
    }>;
    del(body: any): Promise<{
        state: string;
        info: string;
    } | {
        state: string;
        info?: undefined;
    }>;
}
