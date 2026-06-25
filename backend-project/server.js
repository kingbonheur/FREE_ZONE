const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "https://freezonebar.vercel.app";
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://kingbonheurkb_db_user:SAosi48treY4jWst@cluster0.htdv3y2.mongodb.net/?appName=Cluster0";
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
let dbReady = false;

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

const menuSchema = new mongoose.Schema(
  {
    name: String,
    category: String,
    type: { type: String, enum: ["food", "drink"], default: "food" },
    description: String,
    price: Number,
    image: String,
    available: { type: Boolean, default: true },
  },
  { timestamps: true },
);
const employeeSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    email: String,
    role: String,
    permissions: [String],
    status: { type: String, default: "Active" },
    salary: Number,
    username: String,
    userId: String,
  },
  { timestamps: true },
);
const orderItemSchema = new mongoose.Schema(
  {
    itemId: String,
    name: String,
    quantity: Number,
    price: Number,
    type: String,
  },
  { _id: false },
);
const orderSchema = new mongoose.Schema(
  {
    customerName: String,
    phone: String,
    address: String,
    delivery: Boolean,
    notes: String,
    items: [orderItemSchema],
    total: Number,
    status: { type: String, default: "Received" },
    orderedBy: String,
    orderedByName: String,
    stockMovements: [
      { productId: String, productName: String, quantity: Number },
    ],
    paidAt: Date,
    paymentMethod: String,
    receipt: {
      number: String,
      issuedAt: Date,
      customerName: String,
      phone: String,
      items: [orderItemSchema],
      total: Number,
      paymentMethod: String,
      cashier: String,
      templateName: String,
      header: String,
      footer: String,
      currency: String,
      taxLabel: String,
      taxAmount: Number,
      serviceLabel: String,
      serviceAmount: Number,
    },
  },
  { timestamps: true },
);
const userSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true },
    passwordHash: String,
    name: String,
    role: { type: String, enum: ["admin", "user"], default: "user" },
    phone: String,
  },
  { timestamps: true },
);
const gallerySchema = new mongoose.Schema(
  {
    title: String,
    type: String,
    image: String,
  },
  { timestamps: true },
);
const receiptTemplateSchema = new mongoose.Schema(
  {
    title: String,
    active: { type: Boolean, default: false },
    header: String,
    footer: String,
    currency: { type: String, default: "RWF" },
    taxLabel: String,
    taxAmount: { type: Number, default: 0 },
    serviceLabel: String,
    serviceAmount: { type: Number, default: 0 },
    notes: String,
  },
  { timestamps: true },
);
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true },
    name: String,
    location: String,
    phone: String,
    whatsapp: String,
    email: String,
    hours: String,
    about: String,
    logo: String,
    primaryColor: String,
    accentColor: String,
    backgroundColor: String,
  },
  { timestamps: true },
);
const stockProductSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    qtyIn: { type: Number, default: 0, min: 0 },
    qtyOut: { type: Number, default: 0, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
    image: String,
  },
  { timestamps: true },
);
const stockTransactionSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockProduct",
      required: true,
    },
    transactionType: { type: String, enum: ["IN", "OUT"], required: true },
    quantity: { type: Number, required: true, min: 1 },
    notes: String,
    transactionDate: { type: Date, required: true },
  },
  { timestamps: true },
);

const Models = {
  MenuItem: mongoose.model("MenuItem", menuSchema),
  Employee: mongoose.model("Employee", employeeSchema),
  Order: mongoose.model("Order", orderSchema),
  User: mongoose.model("User", userSchema),
  Gallery: mongoose.model("Gallery", gallerySchema),
  ReceiptTemplate: mongoose.model("ReceiptTemplate", receiptTemplateSchema),
  Setting: mongoose.model("Setting", settingSchema),
  StockProduct: mongoose.model("StockProduct", stockProductSchema),
  StockTransaction: mongoose.model("StockTransaction", stockTransactionSchema),
};

const defaultInfo = {
  key: "restaurant",
  name: "Freezone Bar & Restaurant",
  location: "Gikondo, Near Magerwa, Kigali, Rwanda",
  phone: "+250 788 306 365",
  whatsapp: "250788306365",
  email: "smartboxltd@gmail.com",
  hours: "Monday - Sunday, 10:00 AM - 11:30 PM",
  about:
    "A modern and welcoming place for great food, refreshing drinks, music, events and friendly service.",
  logo: "",
  primaryColor: "#0d3d2d",
  accentColor: "#d7aa48",
  backgroundColor: "#071812",
};
const defaultReceiptTemplate = {
  title: "Default Receipt",
  active: true,
  header: "Official customer receipt",
  footer: "Thank you for buying from us.",
  currency: "RWF",
  taxLabel: "",
  taxAmount: 0,
  serviceLabel: "",
  serviceAmount: 0,
  notes: "Keep this receipt for your records.",
};

const memory = {
  MenuItem: [
    {
      _id: "f100",
      name: "Grilled Chicken",
      category: "Local Dishes",
      type: "food",
      description: "Charcoal grilled chicken with house spice.",
      price: 6500,
      image:
        "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=900&q=80",
      available: true,
    },
    {
      _id: "f101",
      name: "Brochettes",
      category: "Local Dishes",
      type: "food",
      description: "Tender skewers served with salad.",
      price: 2500,
      image:
        "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=80",
      available: true,
    },
    {
      _id: "f102",
      name: "Burger & Fries",
      category: "Fast Food",
      type: "food",
      description: "Juicy beef burger with crispy fries.",
      price: 6500,
      image:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
      available: true,
    },
    {
      _id: "d100",
      name: "Primus",
      category: "Beer",
      type: "drink",
      description: "Cold local beer.",
      price: 1000,
      image:
        "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=900&q=80",
      available: true,
    },
    {
      _id: "d101",
      name: "Fresh Juice",
      category: "Soft Drinks",
      type: "drink",
      description: "Seasonal fruit juice.",
      price: 1500,
      image:
        "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=900&q=80",
      available: true,
    },
    {
      _id: "d102",
      name: "Mojito",
      category: "Cocktails",
      type: "drink",
      description: "Mint, lime, soda and a smooth finish.",
      price: 4000,
      image:
        "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=900&q=80",
      available: true,
    },
  {
    "_id": "d1",
    "name": "Leffe",
    "category": "Beer",
    "type": "drink",
    "description": "Leffe from the menu.",
    "price": 4000,
    "image": "https://images.unsplash.com/photo-1608270861620-7c1a5c4d2b8f?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "d2",
    "name": "Guiness",
    "category": "Beer",
    "type": "drink",
    "description": "Guiness from the menu.",
    "price": 2000,
    "image": "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "d3",
    "name": "Heineken",
    "category": "Beer",
    "type": "drink",
    "description": "Heineken from the menu.",
    "price": 1500,
    "image": "https://images.unsplash.com/photo-1608270861620-7c1a5c4d2b8f?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "d4",
    "name": "Amstel",
    "category": "Beer",
    "type": "drink",
    "description": "Amstel from the menu.",
    "price": 1300,
    "image": "https://images.unsplash.com/photo-1608270861620-7c1a5c4d2b8f?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "d5",
    "name": "Primus",
    "category": "Beer",
    "type": "drink",
    "description": "Primus from the menu.",
    "price": 1600,
    "image": "https://images.unsplash.com/photo-1608270861620-7c1a5c4d2b8f?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "d6",
    "name": "Turbo",
    "category": "Beer",
    "type": "drink",
    "description": "Turbo from the menu.",
    "price": 1300,
    "image": "https://images.unsplash.com/photo-1608270861620-7c1a5c4d2b8f?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "d7",
    "name": "Legend",
    "category": "Beer",
    "type": "drink",
    "description": "Legend from the menu.",
    "price": 1500,
    "image": "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "d8",
    "name": "Savana Cider",
    "category": "Cider",
    "type": "drink",
    "description": "Savana Cider from the menu.",
    "price": 3500,
    "image": "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "d9",
    "name": "Red Bull",
    "category": "Energy Drink",
    "type": "drink",
    "description": "Red Bull from the menu.",
    "price": 3500,
    "image": "https://images.unsplash.com/photo-1554866585-e50b8d3f6ff0?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "d10",
    "name": "Guarana",
    "category": "Soft Drink",
    "type": "drink",
    "description": "Guarana from the menu.",
    "price": 3000,
    "image": "https://images.unsplash.com/photo-1600788148184-403c60db1c5d?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "f1",
    "name": "Chips Potato with Salad",
    "category": "Side Dish",
    "type": "food",
    "description": "Chips Potato with Salad from the menu.",
    "price": 2500,
    "image": "https://images.unsplash.com/photo-1599599810694-e45c3aa1c58c?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "f2",
    "name": "Chips Banana with Salad",
    "category": "Side Dish",
    "type": "food",
    "description": "Chips Banana with Salad from the menu.",
    "price": 2500,
    "image": "https://images.unsplash.com/photo-1583618694515-92342f5e5fcd?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "f3",
    "name": "White Rice",
    "category": "Side Dish",
    "type": "food",
    "description": "White Rice from the menu.",
    "price": 2000,
    "image": "https://images.unsplash.com/photo-1586190936750-d06f4e3b96ac?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "f4",
    "name": "Vegetable Rice",
    "category": "Side Dish",
    "type": "food",
    "description": "Vegetable Rice from the menu.",
    "price": 4000,
    "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "f5",
    "name": "Chinese Rice",
    "category": "Side Dish",
    "type": "food",
    "description": "Chinese Rice from the menu.",
    "price": 5000,
    "image": "https://images.unsplash.com/photo-1585238341710-4b4e6ceaea18?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "f6",
    "name": "Chips Masala",
    "category": "Side Dish",
    "type": "food",
    "description": "Chips Masala from the menu.",
    "price": 4000,
    "image": "https://images.unsplash.com/photo-1599599810694-e45c3aa1c58c?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "f7",
    "name": "Capati (2pcs)",
    "category": "Snack",
    "type": "food",
    "description": "Capati (2pcs) from the menu.",
    "price": 1500,
    "image": "https://images.unsplash.com/photo-1571091718115-8f9c68fea1eb?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "f8",
    "name": "Meatball (2pcs)",
    "category": "Snack",
    "type": "food",
    "description": "Meatball (2pcs) from the menu.",
    "price": 1500,
    "image": "https://images.unsplash.com/photo-1626082927389-6cd097cfd330?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "f9",
    "name": "Samosa (2pcs)",
    "category": "Snack",
    "type": "food",
    "description": "Samosa (2pcs) from the menu.",
    "price": 1500,
    "image": "https://images.unsplash.com/photo-1609501676725-7186f17a6f97?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "f10",
    "name": "Chicken Rolex",
    "category": "Snack",
    "type": "food",
    "description": "Chicken Rolex from the menu.",
    "price": 8000,
    "image": "https://images.unsplash.com/photo-1526069893007-cbeebc331d55?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "f11",
    "name": "Grilled Fish with Chips",
    "category": "Grilled",
    "type": "food",
    "description": "Grilled Fish with Chips from the menu.",
    "price": 12000,
    "image": "https://images.unsplash.com/photo-1580959375944-abd7e991f971?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "f12",
    "name": "Full Grilled Chicken (Modern)",
    "category": "Grilled",
    "type": "food",
    "description": "Full Grilled Chicken (Modern) from the menu.",
    "price": 15000,
    "image": "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "f13",
    "name": "Goat Leg Grilled",
    "category": "Grilled",
    "type": "food",
    "description": "Goat Leg Grilled from the menu.",
    "price": 15000,
    "image": "https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "f14",
    "name": "Chicken Rice Plate",
    "category": "Special",
    "type": "food",
    "description": "Chicken Rice Plate from the menu.",
    "price": 8000,
    "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
    "available": true
  },
  {
    "_id": "f15",
    "name": "Free Zone Special Chicken",
    "category": "Special",
    "type": "food",
    "description": "Free Zone Special Chicken from the menu.",
    "price": 25000,
    "image": "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=900&q=80",
    "available": true
  }
  ],
  Employee: [
    {
      _id: "e1",
      name: "Aline Uwase",
      role: "Manager",
      phone: "+250 788 111 222",
      email: "aline@freezone.rw",
      permissions: ["orders", "menu", "reports"],
      status: "Active",
      salary: 450000,
    },
    {
      _id: "e2",
      name: "Jean Mugisha",
      role: "Chef",
      phone: "+250 788 222 333",
      email: "jean@freezone.rw",
      permissions: ["kitchen"],
      status: "Active",
      salary: 320000,
    },
  ],
  Order: [],
  User: [],
  Gallery: [
    {
      _id: "g1",
      title: "Freezone menu design",
      type: "restaurant",
      image: "/assets/menu-reference.jpeg",
    },
  ],
  ReceiptTemplate: [{ ...defaultReceiptTemplate, _id: "rt1" }],
  Setting: [{ ...defaultInfo, _id: "s1" }],
  StockProduct: [
    {
      _id: "sp1",
      productName: "Laptop",
      category: "Electronics",
      qtyIn: 20,
      qtyOut: 5,
      unitPrice: 500000,
      createdAt: new Date().toISOString(),
    },
    {
      _id: "sp2",
      productName: "Mouse",
      category: "Accessories",
      qtyIn: 50,
      qtyOut: 50,
      unitPrice: 10000,
      createdAt: new Date().toISOString(),
    },
    {
      _id: "sp3",
      productName: "Keyboard",
      category: "Accessories",
      qtyIn: 35,
      qtyOut: 31,
      unitPrice: 25000,
      createdAt: new Date().toISOString(),
    },
    {
      _id: "sp4",
      productName: "Office Chair",
      category: "Furniture",
      qtyIn: 15,
      qtyOut: 3,
      unitPrice: 150000,
      createdAt: new Date().toISOString(),
    },
  ],
  StockTransaction: [],
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) =>
    cb(null, path.join(__dirname, "..", "uploads")),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`),
});
const upload = multer({ storage });

function decodeToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
function auth(req, res, next) {
  const user = decodeToken(req);
  if (!user) return res.status(401).json({ message: "Login required" });
  req.user = user;
  next();
}
function admin(req, res, next) {
  if (!req.user || req.user.role !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  next();
}
function clean(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return { ...obj, id: String(obj._id) };
}
function decorateStockProduct(product) {
  const row = clean(product);
  const remainingStock = Number(row.qtyIn || 0) - Number(row.qtyOut || 0);
  const status =
    remainingStock === 0
      ? "Out of Stock"
      : remainingStock <= 5
        ? "Low Stock"
        : "In Stock";
  return {
    ...row,
    remainingStock,
    totalValue: remainingStock * Number(row.unitPrice || 0),
    status,
  };
}
function stockProductFilter(query = {}) {
  const filter = {};
  if (query.category) filter.category = query.category;
  if (query.search) {
    filter.$or = [
      { productName: { $regex: query.search, $options: "i" } },
      { category: { $regex: query.search, $options: "i" } },
    ];
  }
  return filter;
}
async function list(model, filter = {}) {
  if (dbReady)
    return (await Models[model].find(filter).sort({ createdAt: -1 })).map(
      clean,
    );
  return memory[model]
    .filter((item) =>
      Object.entries(filter).every(([key, value]) => item[key] === value),
    )
    .map((item) => ({ ...item, id: item._id }));
}
async function create(model, data) {
  if (dbReady) return clean(await Models[model].create(data));
  const row = {
    ...data,
    _id: `${model[0].toLowerCase()}${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  memory[model].unshift(row);
  return { ...row, id: row._id };
}
async function update(model, id, data) {
  if (dbReady)
    return clean(
      await Models[model].findByIdAndUpdate(id, data, { new: true }),
    );
  const rows = memory[model];
  const index = rows.findIndex((item) => item._id === id || item.id === id);
  if (index === -1) return null;
  rows[index] = { ...rows[index], ...data };
  return { ...rows[index], id: rows[index]._id };
}
async function remove(model, id) {
  if (dbReady) return Models[model].findByIdAndDelete(id);
  memory[model] = memory[model].filter(
    (item) => item._id !== id && item.id !== id,
  );
  return true;
}
function normalizeWhatsapp(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return defaultInfo.whatsapp;
  if (digits.startsWith("0")) return `250${digits.slice(1)}`;
  return digits;
}
async function getInfo() {
  if (dbReady) {
    const current = await Models.Setting.findOne({ key: "restaurant" });
    return clean(current || (await Models.Setting.create(defaultInfo)));
  }
  return { ...memory.Setting[0], id: memory.Setting[0]._id };
}
async function saveInfo(data) {
  const next = {
    ...data,
    key: "restaurant",
    whatsapp: normalizeWhatsapp(data.whatsapp || data.phone),
  };
  if (dbReady) {
    return clean(
      await Models.Setting.findOneAndUpdate({ key: "restaurant" }, next, {
        new: true,
        upsert: true,
      }),
    );
  }
  memory.Setting[0] = { ...memory.Setting[0], ...next };
  return { ...memory.Setting[0], id: memory.Setting[0]._id };
}
async function resetInfo() {
  if (dbReady) {
    return clean(
      await Models.Setting.findOneAndUpdate(
        { key: "restaurant" },
        defaultInfo,
        { new: true, upsert: true },
      ),
    );
  }
  memory.Setting[0] = { ...defaultInfo, _id: "s1" };
  return { ...memory.Setting[0], id: "s1" };
}
async function listStockProducts(query = {}) {
  if (dbReady) {
    const rows = await Models.StockProduct.find(stockProductFilter(query)).sort(
      { createdAt: -1 },
    );
    return rows.map(decorateStockProduct);
  }
  const search = String(query.search || "").toLowerCase();
  return memory.StockProduct.filter(
    (item) => !query.category || item.category === query.category,
  )
    .filter(
      (item) =>
        !search ||
        [item.productName, item.category].some((value) =>
          String(value).toLowerCase().includes(search),
        ),
    )
    .map(decorateStockProduct);
}
async function stockSummary() {
  const products = await listStockProducts();
  const transactions = await listStockTransactions();
  return {
    totalProducts: products.length,
    totalStockQuantity: products.reduce(
      (sum, item) => sum + item.remainingStock,
      0,
    ),
    totalStockValue: products.reduce((sum, item) => sum + item.totalValue, 0),
    inStock: products.filter((item) => item.status === "In Stock").length,
    outOfStock: products.filter((item) => item.status === "Out of Stock")
      .length,
    lowStock: products.filter((item) => item.status === "Low Stock").length,
    alerts: products.filter((item) => item.status !== "In Stock"),
    recentTransactions: transactions.slice(0, 8),
  };
}
async function createStockProduct(data) {
  const payload = {
    productName: data.productName,
    category: data.category,
    qtyIn: Number(data.qtyIn || 0),
    qtyOut: Number(data.qtyOut || 0),
    unitPrice: Number(data.unitPrice || 0),
    image: data.image,
  };
  if (dbReady)
    return decorateStockProduct(await Models.StockProduct.create(payload));
  const row = {
    ...payload,
    _id: `sp${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  memory.StockProduct.unshift(row);
  return decorateStockProduct(row);
}
async function updateStockProduct(id, data) {
  const payload = {
    productName: data.productName,
    category: data.category,
    qtyIn: Number(data.qtyIn || 0),
    qtyOut: Number(data.qtyOut || 0),
    unitPrice: Number(data.unitPrice || 0),
    image: data.image,
  };
  if (dbReady) {
    const row = await Models.StockProduct.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    return row ? decorateStockProduct(row) : null;
  }
  const index = memory.StockProduct.findIndex((item) => item._id === id);
  if (index === -1) return null;
  memory.StockProduct[index] = { ...memory.StockProduct[index], ...payload };
  return decorateStockProduct(memory.StockProduct[index]);
}
async function deleteStockProduct(id) {
  if (dbReady) {
    await Models.StockTransaction.deleteMany({ productId: id });
    return Models.StockProduct.findByIdAndDelete(id);
  }
  memory.StockTransaction = memory.StockTransaction.filter(
    (item) => item.productId !== id,
  );
  const before = memory.StockProduct.length;
  memory.StockProduct = memory.StockProduct.filter((item) => item._id !== id);
  return before !== memory.StockProduct.length;
}
function cleanStockTransaction(transaction) {
  const row = clean(transaction);
  const product = row.productId || {};
  return {
    ...row,
    productId: String(product._id || row.productId),
    productName: product.productName || row.productName,
    category: product.category || row.category,
  };
}
async function listStockTransactions(query = {}) {
  if (dbReady) {
    const filter = {};
    if (query.start || query.end) {
      filter.transactionDate = {};
      if (query.start)
        filter.transactionDate.$gte = new Date(`${query.start}T00:00:00.000Z`);
      if (query.end)
        filter.transactionDate.$lte = new Date(`${query.end}T23:59:59.999Z`);
    }
    const rows = await Models.StockTransaction.find(filter)
      .populate("productId", "productName category")
      .sort({ transactionDate: -1, createdAt: -1 });
    return rows.map(cleanStockTransaction);
  }
  return memory.StockTransaction.map((item) => {
    const product =
      memory.StockProduct.find((row) => row._id === item.productId) || {};
    return cleanStockTransaction({
      ...item,
      productName: product.productName,
      category: product.category,
    });
  }).sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
}
async function createStockTransaction(data) {
  const quantity = Number(data.quantity || 0);
  if (quantity < 1) throw new Error("Quantity must be at least 1.");
  if (dbReady) {
    const product = await Models.StockProduct.findById(data.productId);
    if (!product) throw new Error("Product not found.");
    if (data.transactionType === "OUT") {
      const updated = await Models.StockProduct.findOneAndUpdate(
        {
          _id: data.productId,
          $expr: { $gte: [{ $subtract: ["$qtyIn", "$qtyOut"] }, quantity] },
        },
        { $inc: { qtyOut: quantity } },
        { new: true },
      );
      if (!updated)
        throw new Error(
          `Only ${product.qtyIn - product.qtyOut} units are available.`,
        );
    } else {
      await Models.StockProduct.findByIdAndUpdate(data.productId, {
        $inc: { qtyIn: quantity },
      });
    }
    return cleanStockTransaction(
      await Models.StockTransaction.create({
        productId: data.productId,
        transactionType: data.transactionType,
        quantity,
        notes: data.notes,
        transactionDate: new Date(data.transactionDate || Date.now()),
      }),
    );
  }
  const product = memory.StockProduct.find(
    (item) => item._id === data.productId,
  );
  if (!product) throw new Error("Product not found.");
  const remaining = Number(product.qtyIn) - Number(product.qtyOut);
  if (data.transactionType === "OUT" && quantity > remaining)
    throw new Error(`Only ${remaining} units are available.`);
  if (data.transactionType === "IN") product.qtyIn += quantity;
  else product.qtyOut += quantity;
  const row = {
    _id: `st${Date.now()}`,
    productId: product._id,
    transactionType: data.transactionType,
    quantity,
    notes: data.notes,
    transactionDate: data.transactionDate || new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  memory.StockTransaction.unshift(row);
  return cleanStockTransaction({
    ...row,
    productName: product.productName,
    category: product.category,
  });
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeOrderItems(items = []) {
  const rows = Array.isArray(items)
    ? items
    : (() => {
        try {
          const parsed = JSON.parse(items);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })();
  return rows
    .map((item) => ({
      itemId: item.itemId || item.id || item._id || "",
      name: String(item.name || "").trim(),
      quantity: Math.max(1, Number(item.quantity || 1)),
      price: Number(item.price || 0),
      type: item.type || "food",
    }))
    .filter((item) => item.name);
}

function orderTotal(items = []) {
  return items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0,
  );
}

async function activeReceiptTemplate() {
  const templates = await list("ReceiptTemplate");
  return (
    templates.find((template) => template.active) ||
    templates[0] || { ...defaultReceiptTemplate, id: "default" }
  );
}

async function saveReceiptTemplate(id, data) {
  const payload = {
    ...data,
    active: data.active === true || data.active === "true",
    taxAmount: Number(data.taxAmount || 0),
    serviceAmount: Number(data.serviceAmount || 0),
  };
  if (payload.active) {
    const templates = await list("ReceiptTemplate");
    await Promise.all(
      templates
        .filter((template) => template.id !== id)
        .map((template) =>
          update("ReceiptTemplate", template.id, { active: false }),
        ),
    );
  }
  return id
    ? update("ReceiptTemplate", id, payload)
    : create("ReceiptTemplate", payload);
}

async function buildReceipt(order, paymentMethod = "Cash", cashier = "Admin") {
  const template = await activeReceiptTemplate();
  const issuedAt = new Date();
  const dateCode = issuedAt.toISOString().slice(0, 10).replaceAll("-", "");
  const orderId = String(order.id || order._id || Date.now())
    .slice(-6)
    .toUpperCase();
  const subtotal = Number(order.total || orderTotal(order.items || []));
  const taxAmount = Number(template.taxAmount || 0);
  const serviceAmount = Number(template.serviceAmount || 0);
  return {
    number: order.receipt?.number || `FZ-${dateCode}-${orderId}`,
    issuedAt,
    customerName: order.customerName || "Customer",
    phone: order.phone || "",
    items: order.items || [],
    total: subtotal + taxAmount + serviceAmount,
    paymentMethod,
    cashier,
    templateName: template.title || "Default Receipt",
    header: template.header || "",
    footer: template.footer || "",
    currency: template.currency || "RWF",
    taxLabel: template.taxLabel || "",
    taxAmount,
    serviceLabel: template.serviceLabel || "",
    serviceAmount,
    notes: template.notes || "",
  };
}

async function findStockForItem(item) {
  const name = normalizeName(item.name);
  if (!name) return null;
  if (dbReady) {
    return Models.StockProduct.findOne({
      productName: {
        $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });
  }
  return (
    memory.StockProduct.find(
      (product) => normalizeName(product.productName) === name,
    ) || null
  );
}

async function changeProductQtyOut(productId, quantity) {
  if (!productId || !quantity) return;
  if (dbReady) {
    await Models.StockProduct.findByIdAndUpdate(productId, {
      $inc: { qtyOut: quantity },
    });
    return;
  }
  const product = memory.StockProduct.find(
    (item) => String(item._id) === String(productId),
  );
  if (product)
    product.qtyOut = Math.max(0, Number(product.qtyOut || 0) + quantity);
}

async function reserveOrderStock(items) {
  const grouped = new Map();
  for (const item of items) {
    const key = normalizeName(item.name);
    grouped.set(key, {
      ...item,
      quantity: (grouped.get(key)?.quantity || 0) + Number(item.quantity || 1),
    });
  }

  const movements = [];
  for (const item of grouped.values()) {
    const product = await findStockForItem(item);
    if (!product) continue;
    const row = product.toObject ? product.toObject() : product;
    const remaining = Number(row.qtyIn || 0) - Number(row.qtyOut || 0);
    if (remaining < item.quantity) {
      const ended =
        remaining <= 0 ? "ended or finished" : `only ${remaining} left`;
      const error = new Error(`${item.name} is ${ended} in stock.`);
      error.status = 409;
      throw error;
    }
    movements.push({
      productId: String(row._id),
      productName: row.productName,
      quantity: item.quantity,
    });
  }

  for (const movement of movements) {
    await changeProductQtyOut(movement.productId, movement.quantity);
    await create("StockTransaction", {
      productId: movement.productId,
      transactionType: "OUT",
      quantity: movement.quantity,
      notes: `Client order: ${movement.productName}`,
      transactionDate: new Date(),
    });
  }

  return movements;
}

async function releaseOrderStock(order) {
  const movements = order?.stockMovements || [];
  for (const movement of movements) {
    await changeProductQtyOut(
      movement.productId,
      -Number(movement.quantity || 0),
    );
    await create("StockTransaction", {
      productId: movement.productId,
      transactionType: "IN",
      quantity: Number(movement.quantity || 0),
      notes: `Order cancelled/edited: ${movement.productName}`,
      transactionDate: new Date(),
    });
  }
}

async function findOrderById(id) {
  if (dbReady) {
    const order = await Models.Order.findById(id);
    return order ? clean(order) : null;
  }
  const order = memory.Order.find((item) => item._id === id || item.id === id);
  return order ? { ...order, id: order._id } : null;
}

function canManageOrder(req, order) {
  return (
    req.user?.role === "admin" ||
    String(order?.orderedBy || "") === String(req.user?.id || "")
  );
}

async function seed() {
  const passwordHash = await bcrypt.hash("admin123", 10);
  const withoutMemoryId = (rows) => rows.map(({ _id, ...row }) => row);
  if (dbReady) {
    if (!(await Models.User.findOne({ username: "admin" }))) {
      await Models.User.create({
        username: "admin",
        passwordHash,
        name: "Freezone Admin",
        role: "admin",
        phone: "+250 788 306 365",
      });
    }
    for (const model of ["MenuItem", "Employee", "Gallery"]) {
      if ((await Models[model].countDocuments()) === 0)
        await Models[model].insertMany(withoutMemoryId(memory[model]));
    }
    if ((await Models.StockProduct.countDocuments()) === 0)
      await Models.StockProduct.insertMany(
        withoutMemoryId(memory.StockProduct),
      );
    if (!(await Models.Setting.findOne({ key: "restaurant" })))
      await Models.Setting.create(defaultInfo);
    return;
  }
  memory.User = [
    {
      _id: "u1",
      username: "admin",
      passwordHash,
      name: "Freezone Admin",
      role: "admin",
      phone: "+250 788 306 365",
    },
  ];
}

app.get("/api/health", (_req, res) =>
  res.json({ ok: true, database: dbReady ? "mongodb" : "memory" }),
);
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const users = dbReady
    ? [await Models.User.findOne({ username })]
    : memory.User.filter((user) => user.username === username);
  const user = users[0];
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return res.status(401).json({ message: "Invalid username or password" });
  const payload = {
    id: String(user._id),
    username: user.username,
    name: user.name,
    role: user.role,
    phone: user.phone,
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
  res.json({ user: payload, token });
});
app.post("/api/auth/logout", (_req, res) => res.json({ ok: true }));
app.get("/api/auth/me", auth, (req, res) => res.json(req.user || null));

app.get("/api/users", admin, async (_req, res) => {
  const users = dbReady
    ? await Models.User.find().sort({ createdAt: -1 })
    : memory.User;
  res.json(
    users.map((user) => {
      const row = clean(user);
      const { passwordHash, ...safeUser } = row;
      return safeUser;
    }),
  );
});
app.post("/api/users", admin, async (req, res) => {
  const { username, password, name, role, phone } = req.body;
  if (!username || !password || !name)
    return res
      .status(400)
      .json({ message: "Username, name and password are required" });
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const created = await create("User", {
      username,
      passwordHash,
      name,
      role: role || "user",
      phone,
    });
    const { passwordHash: _passwordHash, ...safeUser } = created;
    res.status(201).json(safeUser);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Username already exists or data is invalid" });
  }
});
app.put("/api/users/:id", admin, async (req, res) => {
  const data = { ...req.body };
  if (data.password) data.passwordHash = await bcrypt.hash(data.password, 10);
  delete data.password;
  const updated = await update("User", req.params.id, data);
  if (!updated) return res.status(404).json({ message: "User not found" });
  const { passwordHash, ...safeUser } = updated;
  return res.json(safeUser);
});
app.delete("/api/users/:id", admin, async (req, res) =>
  res.json({ ok: Boolean(await remove("User", req.params.id)) }),
);

app.get("/api/menu", async (req, res) =>
  res.json(
    await list("MenuItem", req.query.type ? { type: req.query.type } : {}),
  ),
);
app.post("/api/menu", admin, upload.single("image"), async (req, res) =>
  res
    .status(201)
    .json(
      await create("MenuItem", {
        ...req.body,
        price: Number(req.body.price),
        image: req.file ? `/uploads/${req.file.filename}` : req.body.image,
      }),
    ),
);
app.put("/api/menu/:id", admin, upload.single("image"), async (req, res) =>
  res.json(
    await update("MenuItem", req.params.id, {
      ...req.body,
      price: Number(req.body.price),
      image: req.file ? `/uploads/${req.file.filename}` : req.body.image,
    }),
  ),
);
app.delete("/api/menu/:id", admin, async (req, res) =>
  res.json({ ok: Boolean(await remove("MenuItem", req.params.id)) }),
);

app.get("/api/employees", auth, async (_req, res) =>
  res.json(await list("Employee")),
);
app.post("/api/employees", admin, async (req, res) => {
  const payload = {
    ...req.body,
    permissions: req.body.permissions || [],
    salary: Number(req.body.salary || 0),
  };
  try {
    if (payload.username && payload.password) {
      const passwordHash = await bcrypt.hash(payload.password, 10);
      const user = await create("User", {
        username: payload.username,
        passwordHash,
        name: payload.name,
        role: "user",
        phone: payload.phone,
      });
      payload.userId = user.id;
    }
    delete payload.password;
    res.status(201).json(await create("Employee", payload));
  } catch (error) {
    res
      .status(400)
      .json({
        message: "Employee was not created. Username may already exist.",
      });
  }
});
app.put("/api/employees/:id", admin, async (req, res) =>
  res.json(
    await update("Employee", req.params.id, {
      ...req.body,
      salary: Number(req.body.salary || 0),
    }),
  ),
);
app.delete("/api/employees/:id", admin, async (req, res) =>
  res.json({ ok: Boolean(await remove("Employee", req.params.id)) }),
);

app.get("/api/orders", auth, async (req, res) => {
  const orders = await list("Order");
  if (req.user.role === "admin") return res.json(orders);
  return res.json(
    orders.filter(
      (order) => String(order.orderedBy || "") === String(req.user.id || ""),
    ),
  );
});
app.post("/api/orders", async (req, res) => {
  const items = normalizeOrderItems(req.body.items || []);
  if (!items.length)
    return res
      .status(400)
      .json({ message: "Add at least one item before placing the order." });
  try {
    const stockMovements = await reserveOrderStock(items);
    const orderedBy = req.user?.id;
    const orderedByName = req.user?.name || "Online customer";
    res.status(201).json(
      await create("Order", {
        customerName: req.body.customerName,
        phone: req.body.phone,
        address: req.body.address,
        delivery: req.body.delivery !== false,
        notes: req.body.notes,
        items,
        total: orderTotal(items),
        status: "Received",
        orderedBy,
        orderedByName,
        stockMovements,
      }),
    );
  } catch (error) {
    res
      .status(error.status || 400)
      .json({ message: error.message || "Unable to place order." });
  }
});
app.put("/api/orders/:id", auth, async (req, res) => {
  const existing = await findOrderById(req.params.id);
  if (!existing) return res.status(404).json({ message: "Order not found" });
  if (!canManageOrder(req, existing))
    return res
      .status(403)
      .json({ message: "You can only manage orders you created." });

  try {
    const data = { ...req.body };
    let released = false;
    if (data.status === "Cancelled") {
      await releaseOrderStock(existing);
      released = true;
      data.stockMovements = [];
    }
    if (Array.isArray(data.items)) {
      if (!released) await releaseOrderStock(existing);
      data.items = normalizeOrderItems(data.items);
      data.stockMovements =
        data.status === "Cancelled" ? [] : await reserveOrderStock(data.items);
      data.total = orderTotal(data.items);
    }
    res.json(await update("Order", req.params.id, data));
  } catch (error) {
    res
      .status(error.status || 400)
      .json({ message: error.message || "Unable to update order." });
  }
});
app.post("/api/orders/:id/receipt", auth, async (req, res) => {
  const existing = await findOrderById(req.params.id);
  if (!existing) return res.status(404).json({ message: "Order not found" });
  if (!canManageOrder(req, existing))
    return res
      .status(403)
      .json({ message: "You can only manage orders you created." });
  const paymentMethod =
    req.body.paymentMethod || existing.paymentMethod || "Cash";
  const receipt = buildReceipt(
    existing,
    paymentMethod,
    req.user?.name || "Admin",
  );
  res.json(
    await update("Order", req.params.id, {
      status: "Paid",
      paidAt: receipt.issuedAt,
      paymentMethod,
      receipt,
    }),
  );
});
app.delete("/api/orders/:id", auth, async (req, res) => {
  const existing = await findOrderById(req.params.id);
  if (!existing) return res.status(404).json({ message: "Order not found" });
  if (!canManageOrder(req, existing))
    return res
      .status(403)
      .json({ message: "You can only delete orders you created." });
  await releaseOrderStock(existing);
  res.json({ ok: Boolean(await remove("Order", req.params.id)) });
});

app.get("/api/gallery", async (_req, res) => res.json(await list("Gallery")));
app.post("/api/gallery", admin, upload.single("image"), async (req, res) =>
  res
    .status(201)
    .json(
      await create("Gallery", {
        ...req.body,
        image: req.file ? `/uploads/${req.file.filename}` : req.body.image,
      }),
    ),
);
app.put("/api/gallery/:id", admin, upload.single("image"), async (req, res) =>
  res.json(
    await update("Gallery", req.params.id, {
      ...req.body,
      image: req.file ? `/uploads/${req.file.filename}` : req.body.image,
    }),
  ),
);
app.delete("/api/gallery/:id", admin, async (req, res) =>
  res.json({ ok: Boolean(await remove("Gallery", req.params.id)) }),
);

app.get("/api/reports", auth, async (_req, res) => {
  const [employees, orders, menu] = await Promise.all([
    list("Employee"),
    list("Order"),
    list("MenuItem"),
  ]);
  const foodSales = orders
    .flatMap((order) => order.items || [])
    .filter((item) => item.type === "food")
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
  const drinkSales = orders
    .flatMap((order) => order.items || [])
    .filter((item) => item.type === "drink")
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryOrders = orders.filter((order) => order.delivery).length;
  res.json({
    employees: employees.length,
    orders: orders.length,
    menuItems: menu.length,
    foodSales,
    drinkSales,
    deliveryOrders,
    revenue: foodSales + drinkSales,
  });
});

app.get("/api/stock/summary", auth, async (_req, res) =>
  res.json(await stockSummary()),
);
app.get("/api/stock/products", auth, async (req, res) =>
  res.json(await listStockProducts(req.query)),
);
app.post(
  "/api/stock/products",
  admin,
  upload.single("image"),
  async (req, res) => {
    try {
      res
        .status(201)
        .json(
          await createStockProduct({
            ...req.body,
            image: req.file ? `/uploads/${req.file.filename}` : req.body.image,
          }),
        );
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
);
app.put(
  "/api/stock/products/:id",
  admin,
  upload.single("image"),
  async (req, res) => {
    try {
      const updated = await updateStockProduct(req.params.id, {
        ...req.body,
        image: req.file ? `/uploads/${req.file.filename}` : req.body.image,
      });
      if (!updated)
        return res.status(404).json({ message: "Product not found" });
      return res.json(updated);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  },
);
app.delete("/api/stock/products/:id", admin, async (req, res) =>
  res.json({ ok: Boolean(await deleteStockProduct(req.params.id)) }),
);
app.get("/api/stock/transactions", auth, async (req, res) =>
  res.json(await listStockTransactions(req.query)),
);
app.post("/api/stock/transactions", admin, async (req, res) => {
  try {
    res.status(201).json(await createStockTransaction(req.body));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/info", async (_req, res) => res.json(await getInfo()));
app.put("/api/info", admin, upload.single("logo"), async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.logo = `/uploads/${req.file.filename}`;
  res.json(await saveInfo(data));
});
app.delete("/api/info", admin, async (_req, res) =>
  res.json(await resetInfo()),
);

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    dbReady = true;
    await seed();
    app.listen(PORT, () =>
      console.log(`Freezone API running on http://localhost:${PORT}`),
    );
  })
  .catch(async () => {
    await seed();
    app.listen(PORT, () =>
      console.log(
        `Freezone API running on http://localhost:${PORT} with memory storage`,
      ),
    );
  });
