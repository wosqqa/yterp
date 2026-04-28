import { PrismaService } from '../prisma/prisma.service';
export declare class StockService {
    private prisma;
    constructor(prisma: PrismaService);
    private md5_16;
    private add;
    private toNum;
    private parseJson;
    private unitSwitch;
    private findCategoryTreeIds;
    record(body: any): Promise<{
        state: string;
        info: string;
        count?: undefined;
        column?: undefined;
    } | {
        state: string;
        count: number;
        info: any[];
        column: {
            id: number;
            key: string;
            name: string;
        }[];
    }>;
    exports(query: any): Promise<{
        state: string;
        buffer: any;
    }>;
    detailRecord(body: any): Promise<{
        state: string;
        info: string;
        count?: undefined;
    } | {
        state: string;
        count: number;
        info: any[];
    }>;
    private getSourceTable;
    private getExtension;
    detailExports(query: any): Promise<{
        state: string;
        info: string;
        buffer?: undefined;
    } | {
        state: string;
        buffer: any;
        info?: undefined;
    }>;
}
