import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OftenService {
  constructor(private prisma: PrismaService) {}

  async record(user: any) {
    const userId = user.userId;
    const info = await this.prisma.often.findMany({
        where: { user: userId }
    });
    return { state: 'success', info };
  }

  async save(body: any, user: any) {
    const { parm } = body;
    const userId = user.userId;

    if (parm && Array.isArray(parm)) {
        // Transaction not strictly necessary for simple delete-insert but good for consistency
        // Prisma transactions are sequential promises array
        
        await this.prisma.$transaction(async (prisma) => {
            await prisma.often.deleteMany({
                where: { user: userId }
            });

            if (parm.length > 0) {
                const data = parm.map((item: any) => ({
                    user: userId,
                    name: item.name,
                    key: item.key
                }));
                await prisma.often.createMany({
                    data
                });
            }
        });

        return { state: 'success' };
    }
    return { state: 'error', info: '传入参数不完整!' };
  }
}
