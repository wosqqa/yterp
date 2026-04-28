import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          let token: string | null = null;
          if (request && request.headers) {
            // Check for standard Bearer token
            if (request.headers.authorization && request.headers.authorization.split(' ')[0] === 'Bearer') {
                token = request.headers.authorization.split(' ')[1];
            }
            // Check for custom Token header (case-insensitive in Node.js)
            if (!token && request.headers.token) {
                token = request.headers.token as string;
            }
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username, role: payload.role, frame: payload.frame };
  }
}
