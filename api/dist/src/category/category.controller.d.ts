import { CategoryService } from './category.service';
export declare class CategoryController {
    private readonly categoryService;
    constructor(categoryService: CategoryService);
    record(): Promise<{
        state: string;
        info: any[];
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
            name: string;
            id: number;
            data: string;
            pid: number;
            sort: number | null;
        } | null;
    } | {
        state: string;
        info: string;
    }>;
    del(body: any): Promise<{
        state: string;
        info: string;
    } | {
        state: string;
        info?: undefined;
    }>;
}
