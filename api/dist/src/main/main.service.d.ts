import { PrismaService } from '../prisma/prisma.service';
export declare class MainService {
    private prisma;
    constructor(prisma: PrismaService);
    record(user: any): Promise<{
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
