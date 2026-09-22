import { connectDB } from "../../../../lib/mongodb";
import Item from "../../../../lib/models/Item";
import Store from "../../../../lib/models/Store";
import { requireSuperAdmin } from "../../../../lib/permissions";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;
  await connectDB();
  const items = await Item.find().populate("stockByStore.storeId", "name code").sort({ createdAt: -1 }).lean();
  return Response.json({ items });
}

export async function POST(request) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const { name, sku, barcode = "", category = "General", costPrice, sellingPrice, reorderLevel = 5, stockByStore = [] } = body;
    if (!name?.trim() || !sku?.trim()) return Response.json({ error: "Item name and SKU are required" }, { status: 400 });
    if (!Number.isFinite(Number(costPrice)) || !Number.isFinite(Number(sellingPrice))) {
      return Response.json({ error: "Cost price and selling price are required" }, { status: 400 });
    }
    if (Number(costPrice) < 0 || Number(sellingPrice) < 0) return Response.json({ error: "Prices cannot be negative" }, { status: 400 });
    await connectDB();

    const storeIds = stockByStore.map(x => x.storeId).filter(Boolean);
    const validStores = await Store.find({ _id: { $in: storeIds } }).select("_id").lean();
    if (validStores.length !== new Set(storeIds.map(String)).size) {
      return Response.json({ error: "One or more selected stores are invalid" }, { status: 400 });
    }

    const normalizedStock = stockByStore.map(x => ({
      storeId: x.storeId,
      quantity: Math.max(0, Number(x.quantity) || 0)
    }));

    const item = await Item.create({
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      barcode: String(barcode).trim(),
      category: category.trim() || "General",
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      reorderLevel: Math.max(0, Number(reorderLevel) || 0),
      stockByStore: normalizedStock,
      active: true
    });
    return Response.json({ item }, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.code === 11000 ? "SKU already exists" : "Could not create item" }, { status: 400 });
  }
}
