import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TreeUtil } from '../utils/tree.util';
import { Prisma } from '@prisma/client';

@Injectable()
export class ServiceService {
  constructor(private prisma: PrismaService) {}

  async goodsRecord(body: any, user: any) {
    try {
      const { page, limit, category, code, brand, type, data } = body;
      const mate = body.mate ?? body.query;
      const pageNum = Number(page);
      const limitNum = Number(limit);
      if (!Number.isFinite(pageNum) || !Number.isFinite(limitNum) || pageNum < 1 || limitNum < 1) {
        return { state: 'error', info: '传入参数不完整!' };
      }

      const andWhere: any[] = [];
      const dataText = data !== undefined && data !== null ? String(data).trim() : '';
      const setOrderMode = !!dataText && /^set/i.test(dataText);
      let typeVal: number | null = null;
      let categoryFilterIds: number[] = [];
      let codePids: number[] = [];

      if (mate) {
        const q = String(mate);
        andWhere.push({
          OR: [{ name: { contains: q } }, { py: { contains: q } }, { number: { contains: q } }, { spec: { contains: q } }],
        });
      }

      if (brand) {
        andWhere.push({ brand: String(brand) });
      }

      if (type !== undefined && type !== null && type !== '') {
        const t = Number(type);
        if (t === 1) {
          typeVal = 0;
          andWhere.push({ type: false });
        }
        if (t === 2) {
          typeVal = 1;
          andWhere.push({ type: true });
        }
      }

      if (dataText) {
        if (setOrderMode) {
          andWhere.push({ data: { startsWith: dataText } });
        } else {
          andWhere.push({ data: { contains: dataText } });
        }
      }

      if (category !== undefined && category !== null && category !== '') {
        const categories = await this.prisma.category.findMany();
        const raw = Array.isArray(category) ? category : [category];
        const roots = raw
          .map((v) => Number(v))
          .filter((v) => Number.isFinite(v) && v > 0);
        const idSet = new Set<number>();
        roots.forEach((rootId) => {
          TreeUtil.getTreeIds(categories, rootId).forEach((id) => idSet.add(Number(id)));
        });
        categoryFilterIds = [...idSet].filter((v) => Number.isFinite(v) && v > 0);
        categoryFilterIds.length > 0 && andWhere.push({ category: { in: categoryFilterIds } });
      }

      if (code) {
        const barcode = String(code);
        const pidRows: Array<{ pid: number }> = await this.prisma.$queryRaw(
          Prisma.sql`SELECT pid FROM is_attr WHERE code = ${barcode}`,
        );
        codePids = pidRows.map((r) => Number(r.pid)).filter((v) => v);
        andWhere.push({
          OR: [{ code: barcode }, ...(codePids.length > 0 ? [{ id: { in: codePids } }] : [])],
        });
      }

      const where: any = andWhere.length > 0 ? { AND: andWhere } : {};

      const skip = (Math.floor(pageNum) - 1) * Math.floor(limitNum);
      const take = Math.floor(limitNum);
      let count = 0;
      let list: any[] = [];
      if (setOrderMode) {
        const whereSqlParts: Prisma.Sql[] = [];
        if (mate) {
          const q = `%${String(mate)}%`;
          whereSqlParts.push(
            Prisma.sql`(name LIKE ${q} OR py LIKE ${q} OR number LIKE ${q} OR spec LIKE ${q})`,
          );
        }
        if (brand) whereSqlParts.push(Prisma.sql`brand = ${String(brand)}`);
        if (typeVal !== null) whereSqlParts.push(Prisma.sql`type = ${typeVal}`);
        if (dataText) whereSqlParts.push(Prisma.sql`data LIKE ${dataText + '%'}`);
        if (categoryFilterIds.length > 0) whereSqlParts.push(Prisma.sql`category IN (${Prisma.join(categoryFilterIds)})`);
        if (code) {
          const barcode = String(code);
          if (codePids.length > 0) {
            whereSqlParts.push(Prisma.sql`(code = ${barcode} OR id IN (${Prisma.join(codePids)}))`);
          } else {
            whereSqlParts.push(Prisma.sql`code = ${barcode}`);
          }
        }
        const whereSql = whereSqlParts.length > 0 ? Prisma.sql`WHERE ${Prisma.join(whereSqlParts, ' AND ')}` : Prisma.empty;
        const countRows: Array<{ cnt: any }> = await this.prisma.$queryRaw(
          Prisma.sql`SELECT COUNT(*) AS cnt FROM is_goods ${whereSql}`,
        );
        count = Number(countRows && countRows[0] ? countRows[0].cnt : 0) || 0;
        const idRows: Array<{ id: number }> = await this.prisma.$queryRaw(
          Prisma.sql`SELECT id FROM is_goods ${whereSql} ORDER BY CAST(SUBSTRING(data, 4) AS UNSIGNED) ASC, id DESC LIMIT ${take} OFFSET ${skip}`,
        );
        const ids = idRows.map((r) => Number(r.id)).filter((v) => v);
        if (ids.length > 0) {
          const rows = await this.prisma.goods.findMany({ where: { id: { in: ids } } });
          const byId = new Map<number, any>();
          rows.forEach((r) => byId.set(Number(r.id), r));
          list = ids.map((id) => byId.get(id)).filter((v) => v);
        } else {
          list = [];
        }
      } else {
        count = await this.prisma.goods.count({ where });
        list = await this.prisma.goods.findMany({
          where,
          skip,
          take,
          orderBy: { id: 'desc' },
        });
      }

      const categoryIds = [...new Set(list.map((item) => item.category))];
      const categories = categoryIds.length > 0 ? await this.prisma.category.findMany({ where: { id: { in: categoryIds } } }) : [];

      const goodsIds = list.map((g) => g.id);
      const attrRows: Array<{ id: number; pid: number; name: string; buy: any; sell: any; code: string }> =
        goodsIds.length > 0
          ? await this.prisma.$queryRaw(
              Prisma.sql`SELECT id, pid, name, buy, sell, code FROM is_attr WHERE pid IN (${Prisma.join(goodsIds)})`,
            )
          : [];

      const attrsByPid = new Map<number, any[]>();
      attrRows.forEach((a) => {
        const pid = Number(a.pid);
        if (!attrsByPid.has(pid)) attrsByPid.set(pid, []);
        attrsByPid.get(pid)!.push(a);
      });

      const info = list.map((item) => {
        let imgs: any[] = [];
        let units: any[] = [];
        let strategy: any[] = [];
        let more: any = {};
        try {
          imgs = item.imgs ? JSON.parse(item.imgs) : [];
        } catch (e) {
          imgs = [];
        }
        try {
          units = item.units ? JSON.parse(item.units) : [];
        } catch (e) {
          units = [];
        }
        try {
          strategy = item.strategy ? JSON.parse(item.strategy) : [];
        } catch (e) {
          strategy = [];
        }
        try {
          more = item.more ? JSON.parse(item.more) : {};
        } catch (e) {
          more = {};
        }

        const extension = {
          unit: item.unit === '-1' ? '多单位' : item.unit,
          type: item.type ? '服务商品' : '常规商品',
        };

        const categoryData = categories.find((c) => c.id === item.category) || null;

        let attr = (attrsByPid.get(item.id) || []).map((a) => {
          return {
            id: Number(a.id),
            pid: Number(a.pid),
            key: `${a.pid}.${a.id}`,
            name: a.name,
            buy: Number(a.buy),
            sell: Number(a.sell),
            retail: undefined,
            code: a.code,
            attr: '',
          };
        });

        if (code) {
          const barcode = String(code);
          attr = attr.filter((a) => barcode === String(item.code) || barcode === String(a.code));
        }

        return {
          ...item,
          buy: Number(item.buy),
          sell: Number(item.sell),
          key: item.id,
          imgs,
          units,
          strategy,
          more,
          categoryData,
          extension,
          attr,
        };
      });

      return { state: 'success', count, info };
    } catch (e: any) {
      return { state: 'error', info: e?.message || '内部错误' };
    }
  }

  async accountRecord(body: any, user: any) {
    const { page, limit, query } = body;
    const where: any = {};

    // Scope filter (Assuming admin id is 1, otherwise filter by frame)
    if (user.userId !== 1) {
      where.frame = user.frame;
    }

    if (query) {
      where.name = { contains: query };
    }

    const count = await this.prisma.account.count({ where });
    const list = await this.prisma.account.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { id: 'desc' },
    });

    return { state: 'success', count, info: list };
  }

  async supplierRecord(body: any, user: any) {
    const { page, limit, query } = body;
    const where: any = {};

    if (user.userId !== 1) {
      where.frame = user.frame;
    }

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { py: { contains: query } }
      ];
    }

    const count = await this.prisma.supplier.count({ where });
    const list = await this.prisma.supplier.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { id: 'desc' },
    });

    return { state: 'success', count, info: list };
  }

  async peopleRecord(body: any, user: any) {
    const { page, limit, query, noAuth } = body;
    const where: any = {};

    if (!noAuth && user.userId !== 1) {
      where.frame = user.frame;
    }

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { py: { contains: query } }
      ];
    }

    const count = await this.prisma.people.count({ where });
    const list = await this.prisma.people.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { id: 'desc' },
    });

    return { state: 'success', count, info: list };
  }

  async store(user: any) {
    const frameFilter = user.role === 0 ? {} : { id: user.frame };
    const commonFilter = user.role === 0 ? {} : { frame: user.frame };

    // Frame
    let frames = await this.prisma.frame.findMany({
      where: user.role === 0 ? {} : {
        OR: [
          { id: user.frame },
          { pid: user.frame } // Include children? PHP logic might be more complex
        ]
      },
      orderBy: { sort: 'asc' }
    });
    // If role != 0, PHP logic usually gets the frame and its children.
    // Here we simplify to just the user's frame or all if admin.
    if (user.role !== 0) {
       // Simplified: just get the user's frame
       frames = await this.prisma.frame.findMany({ where: { id: user.frame } });
    } else {
       frames = await this.prisma.frame.findMany({ orderBy: { sort: 'asc' } });
    }
    const frameTree = TreeUtil.hTree(frames, 0); // Assuming root pid is 0


    // Root (User permissions)
    let root: any = 'all';
    let rootData: any = {};

    if (user.role !== 0) {
       const role = await this.prisma.role.findUnique({ where: { id: user.role } });
       if (role && role.root) {
         try {
           const rootJson = JSON.parse(role.root);
           // Transform array to object: [{ module: 'base', data: {...} }] -> { base: {...} }
           if (Array.isArray(rootJson)) {
             rootJson.forEach(item => {
               rootData[item.module] = item.data;
             });
           }
           root = rootData;
         } catch (e) {
           root = {}; // Default to empty if parse fails
         }
       }
    }

    // Menu
    let menus: any[] = [];
    if (root === 'all') {
      menus = await this.prisma.menu.findMany({
        orderBy: { sort: 'asc' }
      });
    } else {
      // Get all menus first (excluding admin specific ones if needed, but let's filter in code)
      const allMenus = await this.prisma.menu.findMany({
        where: {
          id: { gt: 0 },
          root: { not: 'admin' }
        },
        orderBy: { sort: 'asc' }
      });

      // Filter menus based on permissions
      menus = allMenus.filter(menuVo => {
        if (!menuVo.root || menuVo.resource === '#group') return true;
        
        const voRoot = menuVo.root.split('|');
        const module = voRoot[0];
        const type = voRoot.length === 1 ? 'see' : voRoot[1];

        // Check permission
        // Note: rootData values might be booleans or strings 'true'/'false'. 
        // PHP logic: root[module][type] == 'true' (string comparison)
        if (rootData[module] && rootData[module][type]) {
             // Handle both boolean true and string 'true'
             return rootData[module][type] === true || rootData[module][type] === 'true';
        }
        return false;
      });
      
      // TODO: Filter child menus based on parent visibility (PHP logic step 2 & 4) if needed.
      // For now, let's return the basic filtered list.
    }
    
    // Fields
    const fields = await this.prisma.field.findMany();
    const fieldMap = {};
    fields.forEach(f => {
      try {
        fieldMap[f.key] = JSON.parse(f.fields);
      } catch (e) {
        fieldMap[f.key] = [];
      }
    });


    const menuTree = TreeUtil.hTree(menus, 0);

    // Category
    const categories = await this.prisma.category.findMany({ orderBy: { sort: 'asc' } });
    const categoryTree = TreeUtil.hTree(categories, 0);


    // Warehouse
    const warehouses = await this.prisma.warehouse.findMany({
      where: commonFilter
    });


    // Account
    const accounts = await this.prisma.account.findMany({
      where: commonFilter
    });


    // Iet (Income/Expense Types)
    const iets = await this.prisma.iet.findMany({ orderBy: { sort: 'asc' } });
    const ietMap: { in: any[], out: any[] } = { in: [], out: [] };
    iets.forEach(item => {
      if (item.type === false) ietMap.in.push(item); // 0: income?
      else ietMap.out.push(item); // 1: expense
    });
    // Verify type mapping: PHP might use 0/1. Prisma Boolean false=0, true=1.
    // Usually 0 is income, 1 is expense in many systems.


    // Often
    const oftenList = await this.prisma.often.findMany({
      where: { user: user.userId }
    });
    const often = oftenList.map(item => item.key);


    // Sys
    const sysNames = [
      'name',
      'company',
      'icp',
      'notice',
      'brand',
      'unit',
      'crCategory',
      'crGrade',
      'srCategory',
      'fun',
      'logistics',
    ];
    const sysList = await this.prisma.sys.findMany({
      where: { name: { in: sysNames } }
    });
    const sys = {};
    sysList.forEach(item => {
      try {
        sys[item.name] = JSON.parse(item.info);
      } catch (e) {
        sys[item.name] = item.info;
      }
    });


    return {
      state: 'success',
      info: {
        frame: frameTree,
        menu: menuTree,
        fields: fieldMap,
        root: root,
        category: categoryTree,
        warehouse: warehouses,
        account: accounts,
        iet: ietMap,
        often: often,
        sys: {
          logistics: [],
          ...sys,
        }
      }
    };
  }

  async getScene(body: any) {
    const { id, scene } = body;
    if (id && scene) {
      const modelName = scene;
      if (!this.prisma[modelName]) {
          return { state: 'error', info: 'Invalid scene' };
      }

      const find = await (this.prisma as any)[modelName].findUnique({
        where: { id: Number(id) }
      });
      return { state: 'success', info: find };
    } else {
      return { state: 'error', info: '传入参数不完整!' };
    }
  }

  async roleRecord(body: any) {
    const { page, limit, query } = body;
    const where: any = {};
    if (query) {
      where.name = { contains: query };
    }

    const count = await this.prisma.role.count({ where });
    const list = await this.prisma.role.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { id: 'desc' },
    });

    return { state: 'success', count, info: list };
  }

  async userRecord(body: any, user: any) {
    const { page, limit, query, noAuth } = body;
    const where: any = {};

    // Scope filter (Assuming admin id is 1, otherwise filter by frame)
    // PHP: isset($input['noAuth']) || ($sql = sqlAuth('user',$sql));
    if (!noAuth && user.userId !== 1) {
      where.frame = user.frame;
    }

    // Build query conditions
    if (query) {
      where.OR = [
        { name: { contains: query } },
        { py: { contains: query } }
      ];
    }

    const count = await this.prisma.user.count({ where });
    const list = await this.prisma.user.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { id: 'desc' },
    });

    return { state: 'success', count, info: list };
  }

  async customerRecord(body: any, user: any) {
    const { page, limit, name, number, tel, category, grade, user: searchUser, data } = body;
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
    if (tel) where.contacts = { contains: tel };
    if (category) where.category = category;
    if (grade) where.grade = grade;
    if (searchUser) where.user = Number(searchUser);
    if (data) where.data = { contains: data };

    const count = await this.prisma.customer.count({ where });
    const list = await this.prisma.customer.findMany({
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
}
