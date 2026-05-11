import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TreeUtil } from '../utils/tree.util';
import { Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ServiceService {
  constructor(private prisma: PrismaService) {}

  async goodsRecord(body: any, user: any) {
    try {
      const { page, limit, category, code, brand, type, data } = body;
      const sort = body.sort !== undefined && body.sort !== null ? String(body.sort).trim() : '';
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
      const whereSqlParts: Prisma.Sql[] = [];

      if (mate) {
        const q = String(mate);
        andWhere.push({
          OR: [{ name: { contains: q } }, { py: { contains: q } }, { number: { contains: q } }, { spec: { contains: q } }],
        });
        const likeQ = `%${q}%`;
        whereSqlParts.push(Prisma.sql`(name LIKE ${likeQ} OR py LIKE ${likeQ} OR number LIKE ${likeQ} OR spec LIKE ${likeQ})`);
      }

      if (brand) {
        andWhere.push({ brand: String(brand) });
        whereSqlParts.push(Prisma.sql`brand = ${String(brand)}`);
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
      if (typeVal !== null) whereSqlParts.push(Prisma.sql`type = ${typeVal}`);

      if (dataText) {
        if (setOrderMode) {
          andWhere.push({ data: { startsWith: dataText } });
          whereSqlParts.push(Prisma.sql`data LIKE ${dataText + '%'}`);
        } else {
          andWhere.push({ data: { contains: dataText } });
          whereSqlParts.push(Prisma.sql`data LIKE ${'%' + dataText + '%'}`);
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
      if (categoryFilterIds.length > 0) whereSqlParts.push(Prisma.sql`category IN (${Prisma.join(categoryFilterIds)})`);

      if (code) {
        const barcode = String(code);
        const pidRows: Array<{ pid: number }> = await this.prisma.$queryRaw(
          Prisma.sql`SELECT pid FROM is_attr WHERE code = ${barcode}`,
        );
        codePids = pidRows.map((r) => Number(r.pid)).filter((v) => v);
        andWhere.push({
          OR: [{ code: barcode }, ...(codePids.length > 0 ? [{ id: { in: codePids } }] : [])],
        });
        if (codePids.length > 0) {
          whereSqlParts.push(Prisma.sql`(code = ${barcode} OR id IN (${Prisma.join(codePids)}))`);
        } else {
          whereSqlParts.push(Prisma.sql`code = ${barcode}`);
        }
      }

      const where: any = andWhere.length > 0 ? { AND: andWhere } : {};
      const whereSql = whereSqlParts.length > 0 ? Prisma.sql`WHERE ${Prisma.join(whereSqlParts, ' AND ')}` : Prisma.empty;

      const skip = (Math.floor(pageNum) - 1) * Math.floor(limitNum);
      const take = Math.floor(limitNum);
      let count = 0;
      let list: any[] = [];
      if (setOrderMode) {
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
      } else if (sort === 'numberAsc') {
        const countRows: Array<{ cnt: any }> = await this.prisma.$queryRaw(
          Prisma.sql`SELECT COUNT(*) AS cnt FROM is_goods ${whereSql}`,
        );
        count = Number(countRows && countRows[0] ? countRows[0].cnt : 0) || 0;
        const idRows: Array<{ id: number }> = await this.prisma.$queryRaw(
          Prisma.sql`
            SELECT id
            FROM is_goods
            ${whereSql}
            ORDER BY
              CASE
                WHEN number REGEXP '^[0-9]+' THEN 0
                WHEN number REGEXP '^[sS][0-9]+' THEN 1
                ELSE 2
              END,
              CASE
                WHEN number REGEXP '^[0-9]+' THEN CAST(number AS UNSIGNED)
                WHEN number REGEXP '^[sS][0-9]+' THEN CAST(SUBSTRING(number, 2) AS UNSIGNED)
                ELSE 999999999
              END ASC,
              number ASC,
              id DESC
            LIMIT ${take} OFFSET ${skip}
          `,
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

  async exportXlsx(body: any, user: any) {
    try {
      const fileNameRaw = body && body.fileName != null ? String(body.fileName).trim() : '';
      const fileName = fileNameRaw && /\.xlsx$/i.test(fileNameRaw) ? fileNameRaw : (fileNameRaw ? fileNameRaw + '.xlsx' : 'export.xlsx');
      const sheetNameRaw = body && body.sheetName != null ? String(body.sheetName).trim() : '';
      const sheetName = (sheetNameRaw || 'Sheet1').slice(0, 31);

      const template = body && body.template != null ? String(body.template).trim() : '';
      if (template === 'sorPrint') {
        const payload = (body && body.payload) || {};
        const exchangeRate = Number(payload.exchangeRate) || 0;
        const groupBy = payload.groupBy != null ? String(payload.groupBy) : '';
        const customerName = payload.customerName != null ? String(payload.customerName) : '';
        const customerAdd = payload.customerAdd != null ? String(payload.customerAdd) : '';
        const customerMark = payload.customerMark != null ? String(payload.customerMark) : '';
        const orderDate = payload.orderDate != null ? String(payload.orderDate) : '';
        const deliveryDate = payload.deliveryDate != null ? String(payload.deliveryDate) : '';
        const number = payload.number != null ? String(payload.number) : '';
        const freight = Number(payload.freight) || 0;
        const deposit = Number(payload.deposit) || 0;
        const totalQty = Number(payload.totalQty) || 0;
        const totalRmb = Number(payload.totalRmb) || 0;
        const totalUsd = Number(payload.totalUsd) || 0;
        const totalWithFreight = Number(payload.totalWithFreight) || 0;
        const balance = Number(payload.balance) || 0;
        const rows = Array.isArray(payload.rows) ? payload.rows : [];

        const wb = new ExcelJS.Workbook();
        wb.creator = 'erp';
        const ws = wb.addWorksheet(sheetName, {
          properties: { defaultRowHeight: 18 },
          pageSetup: {
            paperSize: 9,
            orientation: 'portrait',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
          },
          views: [{ state: 'frozen', ySplit: 10 }],
        });

        ws.columns = [
          { key: 'no', width: 6 },
          { key: 'desc', width: 18 },
          { key: 'p1', width: 16 },
          { key: 'p2', width: 16 },
          { key: 'p3', width: 16 },
          { key: 'p4', width: 16 },
          { key: 'qty', width: 10 },
          { key: 'uprice', width: 10 },
          { key: 'amount', width: 14 },
          { key: 'usd', width: 14 },
        ];

        const borderThin: Partial<ExcelJS.Borders> = {
          top: { style: 'thin', color: { argb: 'FF333333' } },
          left: { style: 'thin', color: { argb: 'FF333333' } },
          bottom: { style: 'thin', color: { argb: 'FF333333' } },
          right: { style: 'thin', color: { argb: 'FF333333' } },
        };

        const setCell = (r: number, c: number, val: any, style?: Partial<ExcelJS.Style>) => {
          const cell = ws.getCell(r, c);
          cell.value = val;
          if (style) cell.style = Object.assign({}, cell.style || {}, style);
          return cell;
        };

        const merge = (r1: number, c1: number, r2: number, c2: number) => {
          ws.mergeCells(r1, c1, r2, c2);
          return ws.getCell(r1, c1);
        };

        const applyRangeBorder = (r1: number, c1: number, r2: number, c2: number) => {
          for (let r = r1; r <= r2; r++) {
            for (let c = c1; c <= c2; c++) {
              ws.getCell(r, c).border = borderThin as any;
            }
          }
        };

        merge(1, 1, 1, 10).value = 'Kim Bags    CUSTOMER ORDER    希悦箱包';
        ws.getRow(1).height = 26;
        ws.getCell(1, 1).font = { bold: true, size: 16 };
        ws.getCell(1, 1).alignment = { horizontal: 'center', vertical: 'middle' };

        merge(2, 1, 2, 6).value = '地址：湖南省邵东市国际商贸城東二区二楼207#783号';
        merge(3, 1, 3, 6).value =
          'ADD：No. 783, 207 Gallery, Second Floor, East Second District, Shaodong International Business City, Shaodong City, Hunan Province';
        merge(4, 1, 4, 6).value = 'EMAIL：kimbagfactory@outlook.com';
        merge(5, 1, 5, 6).value = 'MOB & WhatsApp：+8619535838073 Kim';
        ws.getCell(5, 1).font = { color: { argb: 'FFD40000' }, bold: true };
        for (let r = 2; r <= 5; r++) {
          ws.getRow(r).height = 18;
          ws.getCell(r, 1).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
          ws.getCell(r, 1).font = Object.assign({}, ws.getCell(r, 1).font || {}, { size: 11 });
        }
        merge(2, 7, 5, 10).value = 'WeChat / WhatsApp';
        ws.getCell(2, 7).alignment = { horizontal: 'center', vertical: 'middle' };

        const metaStart = 6;
        merge(metaStart, 1, metaStart, 5).value = `CUSTOMER：${customerName}`;
        merge(metaStart, 6, metaStart, 10).value = `ORDER DATE：${orderDate}`;
        merge(metaStart + 1, 1, metaStart + 1, 5).value = `NUMBER：${number}`;
        merge(metaStart + 1, 6, metaStart + 1, 10).value = `DELIVERY DATE：${deliveryDate}`;
        merge(metaStart + 2, 1, metaStart + 2, 5).value = `ADD：${customerAdd}`;
        merge(metaStart + 2, 6, metaStart + 2, 10).value = `Shipping Mark：${customerMark}`;
        applyRangeBorder(metaStart, 1, metaStart + 2, 10);
        for (let r = metaStart; r <= metaStart + 2; r++) {
          ws.getRow(r).height = 20;
          for (let c = 1; c <= 10; c++) {
            ws.getCell(r, c).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
            ws.getCell(r, c).font = { size: 11 };
          }
        }

        const tableHeaderRow = 10;
        setCell(tableHeaderRow, 1, 'NO.', { font: { bold: true, size: 11 }, alignment: { horizontal: 'center', vertical: 'middle' } });
        setCell(tableHeaderRow, 2, 'DESCRIPTION', { font: { bold: true, size: 11 }, alignment: { horizontal: 'center', vertical: 'middle' } });
        merge(tableHeaderRow, 3, tableHeaderRow, 6).value = 'PICTURE';
        ws.getCell(tableHeaderRow, 3).font = { bold: true, size: 11 };
        ws.getCell(tableHeaderRow, 3).alignment = { horizontal: 'center', vertical: 'middle' };
        setCell(tableHeaderRow, 7, 'TT QTY', { font: { bold: true, size: 11 }, alignment: { horizontal: 'center', vertical: 'middle' } });
        setCell(tableHeaderRow, 8, 'U/PRICE', { font: { bold: true, size: 11 }, alignment: { horizontal: 'center', vertical: 'middle' } });
        setCell(tableHeaderRow, 9, 'AMOUNT', { font: { bold: true, size: 11 }, alignment: { horizontal: 'center', vertical: 'middle' } });
        setCell(tableHeaderRow, 10, exchangeRate ? `USD Price\n1USD=${exchangeRate}RMB` : 'USD Price', {
          font: { bold: true, size: 11, color: { argb: 'FFD40000' } },
          alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        });
        ws.getRow(tableHeaderRow).height = 34;
        applyRangeBorder(tableHeaderRow, 1, tableHeaderRow, 10);

        const imgCache = new Map<string, { id: number; ext: 'png' | 'jpeg' }>();
        const fetchImage = async (url: string) => {
          const u = url ? String(url).trim() : '';
          if (!u) return null;
          if (imgCache.has(u)) return imgCache.get(u)!;
          try {
            const controller = new AbortController();
            const t = setTimeout(() => controller.abort(), 10000);
            const resp = await fetch(u, { signal: controller.signal } as any);
            clearTimeout(t);
            if (!resp.ok) return null;
            const ct = resp.headers.get('content-type') || '';
            const ab = await resp.arrayBuffer();
            const buf = Buffer.from(ab as any) as any;
            const ext: 'png' | 'jpeg' = /png/i.test(ct) || /\.png(\?|$)/i.test(u) ? 'png' : 'jpeg';
            const imageId = wb.addImage({ buffer: buf, extension: ext });
            const rec = { id: imageId, ext };
            imgCache.set(u, rec);
            return rec;
          } catch (e) {
            return null;
          }
        };

        let cursor = tableHeaderRow + 1;
        const moneyToNumber = (v: any) => {
          const s = v == null ? '' : String(v);
          const n = Number(s.replace(/,/g, '').replace(/[^\d.\-]/g, ''));
          return Number.isFinite(n) ? n : 0;
        };

        for (let i = 0; i < rows.length; i++) {
          const r = rows[i] || {};
          const pics = Array.isArray(r.pics) ? r.pics : [];
          const picLines = Math.max(1, Math.ceil(pics.length / 4));
          const blockRows = picLines * 2;
          const start = cursor;
          const end = cursor + blockRows - 1;

          ws.mergeCells(start, 1, end, 1);
          ws.mergeCells(start, 2, end, 2);
          ws.mergeCells(start, 7, end, 7);
          ws.mergeCells(start, 8, end, 8);
          ws.mergeCells(start, 9, end, 9);
          ws.mergeCells(start, 10, end, 10);

          const noVal = r.no != null ? r.no : i + 1;
          setCell(start, 1, noVal, { alignment: { horizontal: 'center', vertical: 'middle', wrapText: true } });
          setCell(start, 2, r.desc != null ? String(r.desc) : '', {
            alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
            font: { bold: true, size: 12 },
          });
          setCell(start, 7, Number(r.ttQty) || 0, { alignment: { horizontal: 'center', vertical: 'middle' } });
          const uPriceText = groupBy === 'combo' ? (r.uPriceText != null ? String(r.uPriceText) : '') : (r.uPrice != null ? String(r.uPrice) : '');
          setCell(start, 8, uPriceText, { alignment: { horizontal: 'center', vertical: 'middle', wrapText: true } });
          setCell(start, 9, moneyToNumber(r.amount), { alignment: { horizontal: 'center', vertical: 'middle' }, numFmt: '#,##0.00' as any });
          setCell(start, 10, moneyToNumber(r.usd), { alignment: { horizontal: 'center', vertical: 'middle' }, numFmt: '#,##0.00' as any });

          for (let line = 0; line < picLines; line++) {
            const imgRow = start + line * 2;
            const qtyRow = imgRow + 1;
            ws.getRow(imgRow).height = 62;
            ws.getRow(qtyRow).height = 18;

            for (let j = 0; j < 4; j++) {
              const col = 3 + j;
              const idx = line * 4 + j;
              const p = pics[idx] || null;
              ws.getCell(imgRow, col).alignment = { horizontal: 'center', vertical: 'middle' };
              ws.getCell(qtyRow, col).alignment = { horizontal: 'center', vertical: 'middle' };
              if (!p) continue;
              const url = p.url != null ? String(p.url) : '';
              const qty = p.qty != null ? String(p.qty) : '';
              const img = await fetchImage(url);
              if (img) {
                ws.addImage(img.id, {
                  tl: { col: col - 1 + 0.15, row: imgRow - 1 + 0.15 },
                  ext: { width: 74, height: 74 },
                } as any);
              } else if (url) {
                ws.getCell(imgRow, col).value = url;
                ws.getCell(imgRow, col).font = { size: 9, color: { argb: 'FF409EFF' }, underline: true };
              }
              ws.getCell(qtyRow, col).value = qty;
              ws.getCell(qtyRow, col).font = { bold: true, color: { argb: 'FFD40000' } };
            }
          }

          applyRangeBorder(start, 1, end, 10);
          cursor = end + 1;
        }

        const freightRow = cursor;
        ws.getRow(freightRow).height = 22;
        setCell(freightRow, 2, 'Freight', { alignment: { horizontal: 'center', vertical: 'middle' }, font: { bold: true } });
        ws.mergeCells(freightRow, 3, freightRow, 6);
        setCell(freightRow, 7, totalQty, { alignment: { horizontal: 'center', vertical: 'middle' } });
        setCell(freightRow, 8, freight, { alignment: { horizontal: 'center', vertical: 'middle' }, numFmt: '#,##0.00' as any });
        setCell(freightRow, 9, totalRmb, { alignment: { horizontal: 'center', vertical: 'middle' }, numFmt: '#,##0.00' as any });
        setCell(freightRow, 10, totalUsd, { alignment: { horizontal: 'center', vertical: 'middle' }, numFmt: '#,##0.00' as any });
        applyRangeBorder(freightRow, 1, freightRow, 10);
        cursor++;

        const sumStart = cursor + 1;
        merge(sumStart, 7, sumStart, 8).value = 'TOTAL';
        setCell(sumStart, 9, totalWithFreight, { numFmt: '#,##0.00' as any });
        merge(sumStart + 1, 7, sumStart + 1, 8).value = 'DEPOSIT';
        setCell(sumStart + 1, 9, deposit, { numFmt: '#,##0.00' as any, font: { color: { argb: 'FFD40000' }, bold: true } });
        merge(sumStart + 2, 7, sumStart + 2, 8).value = 'BALANCE';
        setCell(sumStart + 2, 9, balance, { numFmt: '#,##0.00' as any });

        for (let r = sumStart; r <= sumStart + 2; r++) {
          ws.getRow(r).height = 22;
          for (let c = 7; c <= 9; c++) {
            ws.getCell(r, c).alignment = { horizontal: 'center', vertical: 'middle' };
            ws.getCell(r, c).font = Object.assign({}, ws.getCell(r, c).font || {}, { bold: true });
            ws.getCell(r, c).border = borderThin as any;
          }
          ws.getCell(r, 10).border = borderThin as any;
        }
        ws.mergeCells(sumStart, 10, sumStart + 2, 10);
        ws.getCell(sumStart, 10).value = exchangeRate ? `1USD=${exchangeRate}RMB` : '';
        ws.getCell(sumStart, 10).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        ws.getCell(sumStart, 10).font = { size: 10, color: { argb: 'FF909399' } };

        const buf = await wb.xlsx.writeBuffer();
        const buffer = Buffer.from(buf as any);
        return { state: 'success', buffer, fileName };
      }

      const metaRows = Array.isArray(body && body.metaRows) ? body.metaRows : [];
      const header = Array.isArray(body && body.header) ? body.header : [];
      const rows = Array.isArray(body && body.rows) ? body.rows : [];

      const aoa: any[][] = [];
      metaRows.forEach((r: any) => {
        const label = r && r[0] != null ? String(r[0]) : '';
        const value = r && r[1] != null ? String(r[1]) : '';
        (label || value) && aoa.push([label, value]);
      });
      aoa.length > 0 && aoa.push([]);
      header.length > 0 && aoa.push(header.map((h: any) => (h == null ? '' : String(h))));
      rows.forEach((r: any) => {
        if (!Array.isArray(r)) return;
        aoa.push(r.map((c: any) => (c == null ? '' : c)));
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(aoa.length > 0 ? aoa : [['']]);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as any;

      return { state: 'success', buffer, fileName };
    } catch (e: any) {
      return { state: 'error', info: e?.message || '内部错误' };
    }
  }
}
