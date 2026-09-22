import { connectDB } from "../../../lib/mongodb";
import Item from "../../../lib/models/Item";
import Store from "../../../lib/models/Store";
import User from "../../../lib/models/User";
import { requireSuperAdmin } from "../../../lib/permissions";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;
  await connectDB();

  const [stores, users, items] = await Promise.all([
    Store.find().lean(),
    User.find().select("active role storeIds").lean(),
    Item.find().populate("stockByStore.storeId", "name code").lean()
  ]);

  const activeStores = stores.filter(s => s.active).length;
  const activeUsers = users.filter(u => u.active).length;
  const totalStockUnits = items.reduce((sum, item) =>
    sum + (item.stockByStore || []).reduce((n, row) => n + (Number(row.quantity) || 0), 0), 0);
  const inventoryCostValue = items.reduce((sum, item) =>
    sum + (item.stockByStore || []).reduce((n, row) => n + ((Number(row.quantity) || 0) * (Number(item.costPrice) || 0)), 0), 0);
  const inventoryRetailValue = items.reduce((sum, item) =>
    sum + (item.stockByStore || []).reduce((n, row) => n + ((Number(row.quantity) || 0) * (Number(item.sellingPrice) || 0)), 0), 0);
  const lowStockItems = items.filter(item =>
    (item.stockByStore || []).some(row => Number(row.quantity) <= Number(item.reorderLevel || 0))
  ).length;

  const byRole = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const storeStats = stores.map(store => {
    const quantity = items.reduce((sum, item) => {
      const row = (item.stockByStore || []).find(x => String(x.storeId?._id || x.storeId) === String(store._id));
      return sum + (Number(row?.quantity) || 0);
    }, 0);
    return { id: String(store._id), name: store.name, code: store.code, active: store.active, stockUnits: quantity };
  });

  return Response.json({
    generatedAt: new Date().toISOString(),
    summary: {
      stores: stores.length,
      activeStores,
      users: users.length,
      activeUsers,
      items: items.length,
      activeItems: items.filter(i => i.active).length,
      totalStockUnits,
      lowStockItems,
      inventoryCostValue,
      inventoryRetailValue,
      potentialGrossMargin: inventoryRetailValue - inventoryCostValue
    },
    usersByRole: byRole,
    storeStats
  });
}
