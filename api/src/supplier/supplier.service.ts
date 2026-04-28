import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService) {}

  async record(body: any, user: any) {
    const { page, limit, name, number, tel, category, user: searchUser, data } = body;
    const where: any = {};

    // Scope filter (Assuming admin id is 1, otherwise filter by frame)
    if (user.userId !== 1) {
      where.frame = user.frame;
    }

    // Build query conditions
    if (name) {
      where.OR = [
        { name: { contains: name } },
        { py: { contains: name } }
      ];
    }
    if (number) where.number = { contains: number };
    if (tel) where.contacts = { contains: tel }; // PHP maps tel to contacts
    if (category) where.category = category;
    if (searchUser) where.user = Number(searchUser);
    if (data) where.data = { contains: data };

    const count = await this.prisma.supplier.count({ where });
    const list = await this.prisma.supplier.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { id: 'desc' },
    });

    // Manually fetch related data (Frame, User)
    const frameIds = [...new Set(list.map(item => item.frame))].filter(id => typeof id === 'number') as number[];
    const userIds = [...new Set(list.map(item => item.user))].filter(id => typeof id === 'number') as number[];

    const frames = await this.prisma.frame.findMany({ where: { id: { in: frameIds } } });
    const users = await this.prisma.user.findMany({ where: { id: { in: userIds } } });

    const info = list.map(item => {
      let contacts: any[] = [];
      try { contacts = item.contacts ? JSON.parse(item.contacts) : []; } catch (e) {}
      
      let more: any = {};
      try { more = item.more ? JSON.parse(item.more) : {}; } catch (e) {}

      // Calculate extension.contact
      let contactStr = '';
      if (contacts && contacts.length > 0) {
        // PHP: search($contact)->where([['main','=',true]])->find()
        const main = contacts.find((c: any) => c.main);
        if (main) {
           contactStr = `${main.name} | ${main.tel} | ${main.add}`;
        }
      }

      const frameData = frames.find(f => f.id === item.frame) || null;
      const userData = users.find(u => u.id === item.user) || null;

      // Remove sensitive data
      if (userData) {
          delete (userData as any).pwd;
          delete (userData as any).token;
      }

      return {
        ...item,
        balance: Number(item.balance),
        contacts,
        more,
        frameData,
        userData,
        extension: {
            contact: contactStr
        }
      };
    });

    return { state: 'success', count, info };
  }

  async save(body: any, user: any) {
    const { id, name, number, category, rate, bank, account, tax, data, contacts, more } = body;

    // Use loose check for id to handle '0', 0, undefined, etc.
    if (id !== undefined) {
      
      const inputData: any = {
        name,
        number,
        category,
        rate: rate ? Number(rate) : 0,
        bank,
        account,
        tax,
        data,
        contacts: typeof contacts === 'string' ? contacts : JSON.stringify(contacts || []),
        more: typeof more === 'string' ? more : JSON.stringify(more || []),
        py: name // Simplified pinyin
      };

      if (!id || id == 0) {
        inputData.frame = user.frame;
        inputData.user = user.userId;
        // Balance default 0
        inputData.balance = 0; 
        
        await this.prisma.supplier.create({ data: inputData });
      } else {
        await this.prisma.supplier.update({
          where: { id: Number(id) },
          data: inputData
        });
      }
      return { state: 'success' };
    } else {
      return { state: 'error', info: '传入参数不完整!' };
    }
  }

  async get(body: any) {
    const { id } = body;
    if (id) {
      const info = await this.prisma.supplier.findUnique({ where: { id: Number(id) } });
      if (info) {
          // Parse JSON fields
          try { (info as any).contacts = info.contacts ? JSON.parse(info.contacts) : []; } catch (e) { (info as any).contacts = []; }
          try { (info as any).more = info.more ? JSON.parse(info.more) : {}; } catch (e) { (info as any).more = {}; }
          
          return { state: 'success', info };
      }
      return { state: 'error', info: '数据不存在!' };
    } else {
      return { state: 'error', info: '传入参数不完整!' };
    }
  }

  async del(body: any, user: any) {
    const { parm } = body;
    if (parm && Array.isArray(parm)) {
      // TODO: Check relations (bor, buy, bre, entry, omy, bill, oce)
      
      await this.prisma.supplier.deleteMany({
        where: { id: { in: parm.map(Number) } }
      });
      return { state: 'success' };
    } else {
      return { state: 'error', info: '传入参数不完整!' };
    }
  }
}
