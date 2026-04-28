import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import type { Cache } from 'cache-manager';
export declare class AuthService {
    private usersService;
    private jwtService;
    private cacheManager;
    constructor(usersService: UsersService, jwtService: JwtService, cacheManager: Cache);
    validateUser(username: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        state: string;
        info: any;
        token: string;
    }>;
    createCaptcha(): Promise<{
        state: string;
        info: {
            uuid: `${string}-${string}-${string}-${string}-${string}`;
            data: string;
        };
    }>;
    checkLogin(token: string): Promise<boolean>;
}
