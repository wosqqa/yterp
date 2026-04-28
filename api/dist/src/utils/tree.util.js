"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeUtil = void 0;
class TreeUtil {
    static hTree(data, pid = 0) {
        const tree = [];
        data.forEach((item) => {
            if (item.pid === pid) {
                const children = this.hTree(data, item.id);
                item.sub = children;
                tree.push(item);
            }
        });
        return tree;
    }
    static getTreeIds(data, pid) {
        let ids = [pid];
        data.forEach((item) => {
            if (item.pid === pid) {
                ids = ids.concat(this.getTreeIds(data, item.id));
            }
        });
        return ids;
    }
}
exports.TreeUtil = TreeUtil;
//# sourceMappingURL=tree.util.js.map