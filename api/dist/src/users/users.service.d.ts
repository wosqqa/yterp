import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findOne(username: string): Promise<User | null>;
    record(body: any, currentUser: any): Promise<{
        state: string;
        count: number;
        info: {
            frameData: {
                name: string;
                id: number;
                data: string;
                pid: number;
                sort: number | null;
            } | null;
            roleData: {
                name: string;
                id: number;
                data: string;
                root: string;
                auth: string;
            } | null;
            user: string;
            role: number;
            frame: number;
            name: string;
            id: number;
            py: string;
            tel: string;
            img: string;
            token: string | null;
            expire: number;
            data: string;
            more: string;
        }[];
    }>;
    save(body: any, currentUser: any): Promise<{
        state: string;
        info: string;
    } | {
        state: string;
        info?: undefined;
    }>;
    get(body: any): Promise<{
        state: string;
        info: {
            user: string;
            role: number;
            frame: number;
            name: string;
            id: number;
            py: string;
            tel: string;
            img: string;
            token: string | null;
            expire: number;
            data: string;
            more: string;
        };
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
