export class TreeUtil {
  static hTree(data: any[], pid = 0) {
    const tree: any[] = [];
    data.forEach((item) => {
      if (item.pid === pid) {
        const children = this.hTree(data, item.id);
        item.sub = children; // Always attach 'sub', even if empty, to satisfy frontend 'menu.sub.length' check
        tree.push(item);
      }
    });
    return tree;
  }

  static getTreeIds(data: any[], pid: number): number[] {
    let ids = [pid];
    data.forEach((item) => {
      if (item.pid === pid) {
        ids = ids.concat(this.getTreeIds(data, item.id));
      }
    });
    return ids;
  }
}
