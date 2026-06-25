import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { api, assetUrl } from "./api/client";
import logo from "./assets/logo.jpeg";
import menuReference from "./assets/menu-reference.jpeg";
import {
  AlertTriangle,
  BarChart3,
  Beer,
  Boxes,
  Camera,
  ChefHat,
  ClipboardList,
  Download,
  Edit3,
  Home,
  LogIn,
  LogOut,
  MapPin,
  Menu as MenuIcon,
  MessageCircle,
  PackageCheck,
  Phone,
  Plus,
  Printer,
  Search,
  Save,
  Settings,
  ShoppingCart,
  Trash2,
  Users,
  X
} from "lucide-react";
import "./styles.css";

const nav = {
  public: [
    ["Home", Home],
    ["Food Menu", ChefHat],
    ["Drinks Menu", Beer],
    ["Gallery", Camera],
    ["Online Orders", ShoppingCart],
    ["Contact Us", Phone],
    ["User Accounts", LogIn]
  ],
  employee: [
    ["Food Menu", ChefHat],
    ["Drinks Menu", Beer],
    ["Online Orders", ShoppingCart],
    ["Customer Orders", ClipboardList],
    ["Contact Us", Phone],
    ["User Accounts", LogIn]
  ],
  admin: [
    ["Home", Home],
    ["Food Menu", ChefHat],
    ["Drinks Menu", Beer],
    ["Gallery", Camera],
    ["Online Orders", ShoppingCart],
    ["Employee Management", Users],
    ["Customer Orders", ClipboardList],
    ["Stock Management", Boxes],
    ["User Accounts", LogIn],
    ["Reports", BarChart3],
    ["Contact Us", Phone],
    ["Settings", Settings]
  ]
};

function navForUser(user) {
  if (user?.role === "admin") return nav.admin;
  if (user) return nav.employee;
  return nav.public;
}

function whatsappNumber(value) {
  return String(value || "250788306365").replace(/\D/g, "");
}

function themeStyle(info = {}) {
  return {
    "--primary": info.primaryColor || "#0d3d2d",
    "--primary-dark": info.backgroundColor || "#071812",
    "--accent": info.accentColor || "#d7aa48"
  };
}

function WhatsAppButton({ text = "Order on WhatsApp", order, info = {} }) {
  const body = encodeURIComponent(order || "Hello Freezone, I would like to place an order.");
  return (
    <a className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800" href={`https://wa.me/${whatsappNumber(info.whatsapp || info.phone)}?text=${body}`} target="_blank" rel="noreferrer">
      <MessageCircle size={18} /> {text}
    </a>
  );
}

function receiptText(order, info = {}) {
  const receipt = order.receipt || {};
  const items = receipt.items || order.items || [];
  const issuedAt = receipt.issuedAt || order.paidAt || order.createdAt || new Date().toISOString();
  return [
    `${info.name || "Freezone Bar & Restaurant"}`,
    `${info.location || ""}`,
    `Phone: ${info.phone || ""}`,
    "",
    `RECEIPT: ${receipt.number || `Order ${order.id}`}`,
    `Date: ${new Date(issuedAt).toLocaleString()}`,
    `Customer: ${receipt.customerName || order.customerName || "Customer"}`,
    `Client phone: ${receipt.phone || order.phone || ""}`,
    `Payment: ${receipt.paymentMethod || order.paymentMethod || "Paid"}`,
    `Cashier: ${receipt.cashier || order.orderedByName || ""}`,
    "",
    "Items:",
    ...items.map((item) => `${item.quantity} x ${item.name} @ ${Number(item.price || 0).toLocaleString()} RWF = ${(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()} RWF`),
    "",
    `TOTAL: ${Number(receipt.total || order.total || 0).toLocaleString()} RWF`,
    "",
    "Thank you for buying from us."
  ].join("\n");
}

function printReceipt(order, info = {}) {
  const printWindow = window.open("", "_blank", "width=420,height=720");
  if (!printWindow) return;
  const text = receiptText(order, info);
  printWindow.document.write(`
    <html>
      <head>
        <title>Receipt ${order.receipt?.number || order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          pre { white-space: pre-wrap; font-size: 14px; line-height: 1.55; }
        </style>
      </head>
      <body><pre></pre></body>
    </html>
  `);
  printWindow.document.querySelector("pre").textContent = text;
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function downloadReceipt(order, info = {}) {
  const blob = new Blob([receiptText(order, info)], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${order.receipt?.number || `receipt-${order.id}`}.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function MenuCards({ items, addItem, admin, reload, searchQuery }) {
  const [draft, setDraft] = useState({ name: "", category: "Local Dishes", type: "food", description: "", price: "", image: "" });
  const [message, setMessage] = useState("");
  const visibleItems = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      [item.name, item.category, item.description, item.type]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [items, searchQuery]);
  const save = async (event) => {
    event.preventDefault();
    await api.post("/menu", draft);
    setDraft({ name: "", category: "Local Dishes", type: draft.type, description: "", price: "", image: "" });
    reload();
  };
  return (
    <div className="space-y-5">
      {message && <p className="rounded-md border border-emerald-300 bg-emerald-100 p-3 text-sm font-bold text-emerald-950">{message}</p>}
      {admin && (
        <form onSubmit={save} className="grid gap-3 rounded-md border border-zinc-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-6">
          <input className="field" placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
          <select className="field" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}><option value="food">Food</option><option value="drink">Drink</option></select>
          <input className="field" placeholder="Category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
          <input className="field" placeholder="Price RWF" type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} required />
          <input className="field sm:col-span-2 xl:col-span-2" placeholder="Image URL" value={draft.image} onChange={(e) => setDraft({ ...draft, image: e.target.value })} />
          <input className="field sm:col-span-2 xl:col-span-5" placeholder="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <button className="btn-primary"><Plus size={16} /> Add</button>
        </form>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
            <img className="h-40 w-full object-cover" src={assetUrl(item.image)} alt={item.name} />
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-clay">{item.category}</p>
                  <h3 className="text-lg font-bold text-ink">{item.name}</h3>
                </div>
                <span className="rounded-md bg-amber-100 px-2 py-1 text-sm font-bold text-zinc-900">{Number(item.price).toLocaleString()} RWF</span>
              </div>
              <p className="min-h-10 text-sm text-zinc-600">{item.description}</p>
              <div className="flex gap-2">
                <button
                  className="btn-soft add-button flex-1"
                  disabled={item.available === false}
                  onClick={() => {
                    addItem(item);
                    setMessage(`${item.name} added to the order.`);
                  }}
                >
                  <ShoppingCart size={16} /> {item.available === false ? "Finished" : "Add"}
                </button>
                {admin && <button className="icon-danger" onClick={async () => { await api.delete(`/menu/${item.id}`); reload(); }} title="Delete"><Trash2 size={17} /></button>}
              </div>
            </div>
          </article>
        ))}
      </div>
      {visibleItems.length === 0 && (
        <div className="rounded-md border border-emerald-700 bg-moss p-5 text-sm font-semibold text-emerald-50">
          No menu items found for "{searchQuery}".
        </div>
      )}
    </div>
  );
}

function HomePage({ info, setPage }) {
  const currentLogo = assetUrl(info.logo) || logo;
  return (
    <div className="space-y-6">
      <section className="relative min-h-[420px] overflow-hidden rounded-md bg-ink text-white">
        <img src={menuReference} className="absolute inset-0 h-full w-full object-cover opacity-45" alt="Freezone restaurant menu preview" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/20" />
        <div className="relative flex min-h-[420px] max-w-2xl flex-col justify-end gap-5 p-6 md:p-10">
          <img src={currentLogo} className="h-24 w-24 rounded-full border-2 border-gold object-cover" alt={info.name || "Website logo"} />
          <div>
            <h1 className="text-3xl font-black leading-tight sm:text-4xl md:text-6xl">{info.name || "Freezone Bar & Restaurant"}</h1>
            <p className="mt-3 text-lg text-zinc-100">Great food, refreshing drinks, friendly service and good vibes in Gikondo, Kigali.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setPage("Food Menu")} className="btn-gold">View Menu</button>
            <WhatsAppButton info={info} />
          </div>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        {["Friendly Service", "Affordable Prices", "Meet & Dance Events"].map((text) => <div className="rounded-md border border-zinc-200 bg-white p-5 font-semibold text-zinc-800" key={text}>{text}</div>)}
      </div>
      <section className="rounded-md border border-zinc-200 bg-white p-5">
        <h2 className="section-title">About Freezone</h2>
        <p className="mt-2 text-zinc-600">{info.about}</p>
      </section>
    </div>
  );
}

function OrderPage({ cart, setCart, info }) {
  const [customer, setCustomer] = useState({ customerName: "", phone: "", address: "", delivery: true, notes: "" });
  const [created, setCreated] = useState(null);
  const [message, setMessage] = useState("");
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      const items = cart.map((item) => ({
        itemId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        type: item.type
      }));
      const { data } = await api.post("/orders", { ...customer, items });
      setCreated(data);
      setMessage("Order made successfully. The client order has been received.");
      setCart([]);
    } catch (error) {
      setCreated(null);
      setMessage(error.response?.data?.message || "This order cannot be placed right now.");
    }
  };
  const orderText = `Hello Freezone, my order total is ${total.toLocaleString()} RWF: ${cart.map((item) => `${item.quantity}x ${item.name}`).join(", ")}`;
  const orderGroupText = `Hello team, I would like to send this cart to the group: ${cart.map((item) => `${item.quantity}x ${item.name}`).join(", ")}. Total: ${total.toLocaleString()} RWF.`;
  const whatsappGroupLink = "https://chat.whatsapp.com/FVCBp8o97Q10gNDT2vSp7i";
  const shareToGroup = () => {
    if (!cart.length) return;
    // Copy cart message to clipboard
    if (window.navigator && window.navigator.clipboard) {
      window.navigator.clipboard.writeText(orderGroupText).catch(() => {});
    }
    // Open WhatsApp group directly
    window.open(whatsappGroupLink, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <form onSubmit={submit} className="rounded-md border border-zinc-200 bg-white p-5">
        <h2 className="section-title">Online Orders</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input className="field" placeholder="Customer name" value={customer.customerName} onChange={(e) => setCustomer({ ...customer, customerName: e.target.value })} required />
          <input className="field" placeholder="Phone number" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} required />
          <input className="field md:col-span-2" placeholder="Delivery address" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />
          <textarea className="field md:col-span-2" placeholder="Notes" value={customer.notes} onChange={(e) => setCustomer({ ...customer, notes: e.target.value })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={customer.delivery} onChange={(e) => setCustomer({ ...customer, delivery: e.target.checked })} /> Request delivery</label>
        </div>
        <button className="btn-primary mt-4" disabled={!cart.length}>Place Order</button>
        {created && <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Order #{created.id} received. Status: {created.status}</p>}
        {message && <p className="mt-4 rounded-md border border-amber-300 bg-amber-100 p-3 text-sm font-bold text-zinc-950">{message}</p>}
      </form>
      <aside className="rounded-md border border-zinc-200 bg-white p-5">
        <h3 className="text-lg font-bold">Your Cart</h3>
        <div className="mt-3 space-y-2">
          {cart.length === 0 && <p className="text-sm text-zinc-500">Add food or drinks from the menu.</p>}
          {cart.map((item) => <div key={item.id} className="flex justify-between rounded-md bg-zinc-50 p-3 text-sm"><span>{item.quantity}x {item.name}</span><b>{(item.price * item.quantity).toLocaleString()} RWF</b></div>)}
        </div>
        <div className="mt-4 flex items-center justify-between border-t pt-4 font-bold"><span>Total</span><span>{total.toLocaleString()} RWF</span></div>
        <div className="mt-4 flex flex-col gap-3">
          {/* <WhatsAppButton text="Send Cart on WhatsApp" order={orderText} info={info} /> */}
          <button type="button" className="btn-secondary w-full" onClick={shareToGroup} disabled={!cart.length}>
            Send Cart to WhatsApp Group
          </button>
        </div>
        <p className="mt-3 text-sm text-zinc-500">Support: {info.phone}</p>
      </aside>
    </div>
  );
}

function Employees({ user }) {
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState({ name: "", role: "", phone: "", email: "", salary: "", permissions: "orders,menu", username: "", password: "" });
  const [message, setMessage] = useState("");
  const load = () => api.get("/employees").then((res) => setRows(res.data)).catch(() => setRows([]));
  useEffect(load, []);
  const save = async (event) => {
    event.preventDefault();
    try {
      await api.post("/employees", { ...draft, permissions: draft.permissions.split(",").map((p) => p.trim()) });
      setDraft({ name: "", role: "", phone: "", email: "", salary: "", permissions: "orders,menu", username: "", password: "" });
      setMessage("Employee created. They can now login with the username and password.");
      load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not create employee.");
    }
  };
  if (!user) return <LoginNotice />;
  return (
    <div className="space-y-4">
      {user.role === "admin" && <form onSubmit={save} className="grid gap-3 rounded-md border border-zinc-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-6">
        {["name", "role", "phone", "email", "salary", "permissions", "username", "password"].map((field) => <input key={field} className="field" type={field === "password" ? "password" : "text"} placeholder={field} value={draft[field]} onChange={(e) => setDraft({ ...draft, [field]: e.target.value })} required={!["salary", "email"].includes(field)} />)}
        <button className="btn-primary md:col-span-6"><Plus size={16} /> Add Employee</button>
      </form>}
      {message && <p className="rounded-md bg-emerald-900 p-3 text-sm font-semibold text-emerald-50">{message}</p>}
      <DataTable rows={rows} columns={["name", "role", "phone", "email", "status", "salary"]} onDelete={user.role === "admin" ? async (id) => { await api.delete(`/employees/${id}`); load(); } : null} />
    </div>
  );
}

function OrdersAdmin({ user, info }) {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const load = () => api.get("/orders").then((res) => setRows(res.data)).catch(() => setRows([]));
  useEffect(() => {
    if (!user) return undefined;
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [user]);
  if (!user) return <LoginNotice />;

  const startEdit = (order) => setEditing({
    id: order.id,
    customerName: order.customerName || "",
    phone: order.phone || "",
    address: order.address || "",
    notes: order.notes || "",
    delivery: order.delivery !== false,
    status: order.status || "Received"
  });
  const saveEdit = async (event) => {
    event.preventDefault();
    try {
      await api.put(`/orders/${editing.id}`, editing);
      setEditing(null);
      setMessage("Order updated.");
      load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update order.");
    }
  };
  const cancelOrder = async (id) => {
    try {
      await api.put(`/orders/${id}`, { status: "Cancelled" });
      setMessage("Order cancelled and stock returned.");
      load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not cancel order.");
    }
  };
  const deleteOrder = async (id) => {
    if (!confirm("Delete this order? Stock will be returned.")) return;
    try {
      await api.delete(`/orders/${id}`);
      setMessage("Order deleted.");
      load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not delete order.");
    }
  };
  const markPaid = async (order) => {
    const paymentMethod = prompt("Payment method", order.paymentMethod || "Cash");
    if (paymentMethod === null) return null;
    try {
      const { data } = await api.post(`/orders/${order.id}/receipt`, { paymentMethod: paymentMethod || "Cash" });
      setRows((current) => current.map((row) => row.id === data.id ? data : row));
      setMessage(`Receipt ${data.receipt?.number || ""} stored for ${data.customerName}.`);
      return data;
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not create receipt.");
      return null;
    }
  };
  const requireReceipt = (order) => {
    if (order.receipt?.number) return true;
    setMessage("Mark this order as paid first to store its receipt.");
    return false;
  };
  const shareReceipt = (order) => {
    if (!requireReceipt(order)) return;
    const phone = whatsappNumber(order.receipt?.phone || order.phone);
    const text = encodeURIComponent(receiptText(order, info));
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 rounded-md border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="section-title">Customer Orders</h2>
          <p className="text-sm text-emerald-100">{user.role === "admin" ? "Admin sees all customer and employee orders." : "Employees see orders they created for clients."}</p>
        </div>
        <button className="btn-primary" type="button" onClick={load}><Download size={16} /> Refresh Orders</button>
      </div>
      {message && <p className="rounded-md bg-emerald-900 p-3 text-sm font-semibold text-emerald-50">{message}</p>}
      {editing && (
        <form onSubmit={saveEdit} className="grid gap-3 rounded-md border border-zinc-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-6">
          <input className="field" placeholder="Customer name" value={editing.customerName} onChange={(e) => setEditing({ ...editing, customerName: e.target.value })} required />
          <input className="field" placeholder="Phone" value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} required />
          <input className="field xl:col-span-2" placeholder="Address" value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
          <select className="field" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
            {["Received", "Confirmed", "Preparing", "Out for delivery", "Completed", "Paid", "Cancelled"].map((status) => <option key={status}>{status}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.delivery} onChange={(e) => setEditing({ ...editing, delivery: e.target.checked })} /> Delivery</label>
          <textarea className="field md:col-span-2 xl:col-span-5" placeholder="Notes" value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
          <button className="btn-primary"><Save size={16} /> Save</button>
        </form>
      )}
      <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-100 text-xs uppercase text-zinc-500"><tr><th className="px-4 py-3">Client</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Receipt</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Actions</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td className="px-4 py-4 text-emerald-100" colSpan="8">No orders found.</td></tr>}
              {rows.map((order) => (
                <tr className="border-t" key={order.id}>
                  <td className="px-4 py-3">{order.customerName}</td>
                  <td className="px-4 py-3">{order.phone}</td>
                  <td className="px-4 py-3">{(order.items || []).map((item) => `${item.quantity}x ${item.name}`).join(", ")}</td>
                  <td className="px-4 py-3">{order.orderedByName || "Online customer"}</td>
                  <td className="px-4 py-3">{order.status}</td>
                  <td className="px-4 py-3">{order.receipt?.number || "Not paid"}</td>
                  <td className="px-4 py-3">{Number(order.total || 0).toLocaleString()} RWF</td>
                  <td className="flex flex-wrap gap-2 px-4 py-3">
                    <button className="btn-soft" type="button" onClick={() => startEdit(order)}><Edit3 size={16} /> Edit</button>
                    <button className="btn-soft" type="button" onClick={() => markPaid(order)}><Save size={16} /> Paid</button>
                    <button className="btn-soft" type="button" onClick={() => requireReceipt(order) && printReceipt(order, info)}><Printer size={16} /> Print</button>
                    <button className="btn-soft" type="button" onClick={() => requireReceipt(order) && downloadReceipt(order, info)}><Download size={16} /> Receipt</button>
                    <button className="btn-soft" type="button" onClick={() => shareReceipt(order)}><MessageCircle size={16} /> WhatsApp</button>
                    <button className="btn-soft" type="button" onClick={() => cancelOrder(order.id)}><X size={16} /> Cancel</button>
                    <button className="icon-danger" type="button" onClick={() => deleteOrder(order.id)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Reports({ user }) {
  const [report, setReport] = useState(null);
  useEffect(() => { if (user) api.get("/reports").then((res) => setReport(res.data)); }, [user]);
  if (!user) return <LoginNotice />;
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Object.entries(report || {}).map(([key, value]) => <div className="rounded-md border border-zinc-200 bg-white p-5" key={key}><p className="text-sm capitalize text-zinc-500">{key.replace(/([A-Z])/g, " $1")}</p><p className="mt-2 text-3xl font-black text-ink">{Number(value).toLocaleString()}</p></div>)}</div>;
}

function StockManagement({ user }) {
  const emptyProduct = { productName: "", category: "", qtyIn: 0, qtyOut: 0, unitPrice: "", image: "" };
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [draft, setDraft] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [movement, setMovement] = useState({ productId: "", transactionType: "IN", quantity: "", notes: "", transactionDate: new Date().toISOString().slice(0, 10) });
  const [query, setQuery] = useState({ search: "", category: "", report: "daily" });
  const [sort, setSort] = useState({ key: "productName", dir: "asc" });
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");

  const load = () => {
    if (!user) return;
    Promise.all([
      api.get("/stock/products", { params: { search: query.search, category: query.category } }),
      api.get("/stock/summary"),
      api.get("/stock/transactions")
    ]).then(([productRes, summaryRes, transactionRes]) => {
      setProducts(productRes.data);
      setSummary(summaryRes.data);
      setTransactions(transactionRes.data);
    }).catch(() => {
      setProducts([]);
      setSummary(null);
      setTransactions([]);
    });
  };

  useEffect(load, [user, query.search, query.category]);

  const admin = user?.role === "admin";
  const categories = useMemo(() => [...new Set(products.map((item) => item.category).filter(Boolean))].sort(), [products]);
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const left = a[sort.key];
      const right = b[sort.key];
      const result = typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left || "").localeCompare(String(right || ""));
      return sort.dir === "asc" ? result : -result;
    });
  }, [products, sort]);
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(sortedProducts.length / pageSize));
  const pageRows = sortedProducts.slice((page - 1) * pageSize, page * pageSize);

  const reportRows = useMemo(() => {
    const now = new Date();
    const days = query.report === "monthly" ? 30 : query.report === "weekly" ? 7 : 1;
    const start = new Date(now);
    start.setDate(now.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);
    return transactions.filter((item) => new Date(item.transactionDate) >= start);
  }, [transactions, query.report]);

  const saveProduct = async (event) => {
    event.preventDefault();
    const payload = { ...draft, qtyIn: Number(draft.qtyIn || 0), qtyOut: Number(draft.qtyOut || 0), unitPrice: Number(draft.unitPrice || 0) };
    if (editingId) await api.put(`/stock/products/${editingId}`, payload);
    else await api.post("/stock/products", payload);
    setDraft(emptyProduct);
    setEditingId(null);
    setMessage(editingId ? "Product updated." : "Product added.");
    load();
  };

  const editProduct = (product) => {
    setEditingId(product.id);
    setDraft({
      productName: product.productName,
      category: product.category,
      qtyIn: product.qtyIn,
      qtyOut: product.qtyOut,
      unitPrice: product.unitPrice,
      image: product.image || ""
    });
  };

  const deleteProduct = async (id) => {
    if (!confirm("Delete this stock product and its transactions?")) return;
    await api.delete(`/stock/products/${id}`);
    setMessage("Product deleted.");
    load();
  };

  const saveMovement = async (event) => {
    event.preventDefault();
    try {
      await api.post("/stock/transactions", movement);
      setMovement({ productId: "", transactionType: movement.transactionType, quantity: "", notes: "", transactionDate: new Date().toISOString().slice(0, 10) });
      setMessage(movement.transactionType === "IN" ? "Stock added." : "Stock removed.");
      load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to save transaction.");
    }
  };

  const setSortKey = (key) => {
    setSort((current) => ({ key, dir: current.key === key && current.dir === "asc" ? "desc" : "asc" }));
  };

  const exportCsv = () => {
    const header = ["ID", "Product Name", "Category", "Qty In", "Qty Out", "Remaining Stock", "Unit Price", "Total Value", "Status"];
    const lines = [header, ...products.map((item) => [item.id, item.productName, item.category, item.qtyIn, item.qtyOut, item.remainingStock, item.unitPrice, item.totalValue, item.status])];
    const blob = new Blob([lines.map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "stock-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!user) return <LoginNotice />;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          ["Total Products", summary?.totalProducts || 0],
          ["Total Stock Qty", summary?.totalStockQuantity || 0],
          ["Stock Value", `${Number(summary?.totalStockValue || 0).toLocaleString()} RWF`],
          ["In Stock", summary?.inStock || 0],
          ["Low Stock", summary?.lowStock || 0],
          ["Out of Stock", summary?.outOfStock || 0]
        ].map(([label, value]) => (
          <div className="rounded-md border border-zinc-200 bg-white p-4" key={label}>
            <p className="text-xs font-semibold uppercase text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      {!!summary?.alerts?.length && (
        <div className="flex flex-wrap gap-2 rounded-md border border-amber-300 bg-amber-100 p-3 text-sm font-bold text-zinc-950">
          <AlertTriangle size={18} />
          {summary.alerts.map((item) => <span key={item.id}>{item.productName}: {item.status} ({item.remainingStock})</span>)}
        </div>
      )}

      {message && <p className="rounded-md bg-emerald-900 p-3 text-sm font-semibold text-emerald-50">{message}</p>}

      {admin ? (
        <div className="grid gap-4 xl:grid-cols-[1.3fr_.7fr]">
          <form onSubmit={saveProduct} className="grid gap-3 rounded-md border border-zinc-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-6">
            <input className="field xl:col-span-2" placeholder="Product name" value={draft.productName} onChange={(e) => setDraft({ ...draft, productName: e.target.value })} required />
            <input className="field" placeholder="Category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} required />
            <input className="field" type="number" min="0" placeholder="Qty In" value={draft.qtyIn} onChange={(e) => setDraft({ ...draft, qtyIn: e.target.value })} required />
            <input className="field" type="number" min="0" placeholder="Qty Out" value={draft.qtyOut} onChange={(e) => setDraft({ ...draft, qtyOut: e.target.value })} required />
            <input className="field" type="number" min="0" placeholder="Unit Price" value={draft.unitPrice} onChange={(e) => setDraft({ ...draft, unitPrice: e.target.value })} required />
            <input className="field md:col-span-2 xl:col-span-4" placeholder="Image URL optional" value={draft.image} onChange={(e) => setDraft({ ...draft, image: e.target.value })} />
            <button className="btn-primary"><Save size={16} /> {editingId ? "Update Product" : "Add Product"}</button>
            {editingId && <button className="btn-soft" type="button" onClick={() => { setEditingId(null); setDraft(emptyProduct); }}><X size={16} /> Cancel</button>}
          </form>

          <form onSubmit={saveMovement} className="grid gap-3 rounded-md border border-zinc-200 bg-white p-4">
            <h2 className="section-title">Stock In / Out</h2>
            <select className="field" value={movement.productId} onChange={(e) => setMovement({ ...movement, productId: e.target.value })} required>
              <option value="">Select product</option>
              {products.map((item) => <option key={item.id} value={item.id}>{item.productName} · {item.remainingStock} left</option>)}
            </select>
            <select className="field" value={movement.transactionType} onChange={(e) => setMovement({ ...movement, transactionType: e.target.value })}>
              <option value="IN">Stock In</option>
              <option value="OUT">Stock Out</option>
            </select>
            <input className="field" type="number" min="1" placeholder="Quantity" value={movement.quantity} onChange={(e) => setMovement({ ...movement, quantity: e.target.value })} required />
            <input className="field" type="date" value={movement.transactionDate} onChange={(e) => setMovement({ ...movement, transactionDate: e.target.value })} required />
            <textarea className="field" placeholder="Notes" value={movement.notes} onChange={(e) => setMovement({ ...movement, notes: e.target.value })} />
            <button className="btn-primary"><Plus size={16} /> Save Transaction</button>
          </form>
        </div>
      ) : (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 font-semibold text-amber-900">Admin access is required to create, edit, delete, or move stock.</div>
      )}

      <section className="rounded-md border border-zinc-200 bg-white p-4">
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px_auto_auto]">
          <input className="field" placeholder="Search stock products" value={query.search} onChange={(e) => { setQuery({ ...query, search: e.target.value }); setPage(1); }} />
          <select className="field" value={query.category} onChange={(e) => { setQuery({ ...query, category: e.target.value }); setPage(1); }}>
            <option value="">All categories</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <button className="btn-soft" type="button" onClick={exportCsv}><Download size={16} /> CSV</button>
          <button className="btn-soft" type="button" onClick={() => window.print()}><Printer size={16} /> Print</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-100 text-xs uppercase text-zinc-500">
              <tr>{[
                ["id", "ID"], ["productName", "Product Name"], ["category", "Category"], ["qtyIn", "Qty In"], ["qtyOut", "Qty Out"], ["remainingStock", "Remaining"], ["unitPrice", "Unit Price"], ["totalValue", "Total Value"], ["status", "Status"]
              ].map(([key, label]) => <th className="px-4 py-3" key={key}><button type="button" onClick={() => setSortKey(key)}>{label}</button></th>)}{admin && <th className="px-4 py-3">Actions</th>}</tr>
            </thead>
            <tbody>
              {pageRows.map((item) => (
                <tr className="border-t" key={item.id}>
                  <td className="px-4 py-3">{item.id.slice(-6)}</td>
                  <td className="px-4 py-3 font-bold">{item.productName}</td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3">{item.qtyIn}</td>
                  <td className="px-4 py-3">{item.qtyOut}</td>
                  <td className="px-4 py-3">{item.remainingStock}</td>
                  <td className="px-4 py-3">{Number(item.unitPrice).toLocaleString()}</td>
                  <td className="px-4 py-3">{Number(item.totalValue).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`stock-status ${item.status.toLowerCase().replaceAll(" ", "-")}`}>{item.status}</span></td>
                  {admin && <td className="flex gap-2 px-4 py-3"><button className="btn-soft" type="button" onClick={() => editProduct(item)}><Edit3 size={16} /> Edit</button><button className="icon-danger" type="button" onClick={() => deleteProduct(item.id)}><Trash2 size={16} /></button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-zinc-500">Page {page} of {pageCount}</p>
          <div className="flex gap-2"><button className="btn-soft" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><button className="btn-soft" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Next</button></div>
        </div>
      </section>

      <section className="rounded-md border border-zinc-200 bg-white p-4">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="section-title">Stock Reports</h2>
          <select className="field max-w-xs" value={query.report} onChange={(e) => setQuery({ ...query, report: e.target.value })}>
            <option value="daily">Daily Stock Report</option>
            <option value="weekly">Weekly Stock Report</option>
            <option value="monthly">Monthly Stock Report</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-100 text-xs uppercase text-zinc-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Quantity</th><th className="px-4 py-3">Notes</th></tr></thead>
            <tbody>{reportRows.map((item) => <tr className="border-t" key={item.id}><td className="px-4 py-3">{new Date(item.transactionDate).toLocaleDateString()}</td><td className="px-4 py-3">{item.productName}</td><td className="px-4 py-3">{item.transactionType}</td><td className="px-4 py-3">{item.quantity}</td><td className="px-4 py-3">{item.notes || "-"}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AccountPage({ user, setUser, setPage }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const login = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      const { data } = await api.post("/auth/login", form);
      const authUser = data.user || data;
      localStorage.setItem("freezone_user", JSON.stringify(authUser));
      localStorage.setItem("freezone_token", data.token);
      setUser(authUser);
      setForm({ username: "", password: "" });
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed. Check username and password.");
    }
  };
  const logout = async () => {
    await api.post("/auth/logout");
    localStorage.removeItem("freezone_user");
    localStorage.removeItem("freezone_token");
    setUser(null);
  };
  if (user) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 rounded-md border border-zinc-200 bg-white p-5">
        <div>
          <h2 className="section-title">User Accounts</h2>
          <p className="mt-2 text-sm text-emerald-100">Logged in as <b>{user.name}</b> ({user.role === "admin" ? "admin" : "employee"}).</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button className="btn-primary" type="button" onClick={() => setPage("Food Menu")}><ShoppingCart size={16} /> Order for Client</button>
          <button className="btn-soft" type="button" onClick={() => setPage("Customer Orders")}><ClipboardList size={16} /> Manage Orders</button>
          {user.role === "admin" && <button className="btn-soft" type="button" onClick={() => setPage("Employee Management")}><Users size={16} /> Register Employee</button>}
          <button className="btn-soft" type="button" onClick={logout}><LogOut size={16} /> Logout</button>
        </div>
      </section>
    );
  }
  return (
    <section className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1fr_.9fr]">
      <form onSubmit={login} className="rounded-md border border-zinc-200 bg-white p-5">
        <h2 className="section-title">User Accounts</h2>
        <p className="mt-2 text-sm text-emerald-100">Employee and admin login for phone ordering.</p>
        <label className="mt-5 block text-sm font-bold text-emerald-50">Username</label>
        <input className="field mt-2" placeholder="Enter username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="username" required />
        <label className="mt-4 block text-sm font-bold text-emerald-50">Password</label>
        <input className="field mt-2" placeholder="Enter password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" required />
        <button className="btn-primary mt-5 w-full"><LogIn size={16} /> Login</button>
        {message && <p className="mt-4 rounded-md border border-amber-300 bg-amber-100 p-3 text-sm font-bold text-zinc-950">{message}</p>}
      </form>
      <aside className="rounded-md border border-zinc-200 bg-white p-5">
        <h3 className="text-xl font-black">Employee Access</h3>
        <div className="mt-4 space-y-3 text-sm text-emerald-100">
          <p>Admin creates employee usernames and passwords from Employee Management.</p>
          <p>After login, employees can add food or drinks to the cart, place orders for clients, and edit or cancel their own client orders.</p>
          <p>Admin can see all employees and all customer orders.</p>
        </div>
      </aside>
    </section>
  );
}

function Gallery({ user }) {
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState({ title: "", type: "image", image: "", file: null });
  const [editingId, setEditingId] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [message, setMessage] = useState("");
  const load = () => api.get("/gallery").then((res) => setItems(res.data)).catch(() => setItems([]));

  useEffect(load, []);

  const save = async (event) => {
    event.preventDefault();
    setMessage("");
    const data = new FormData();
    data.append("title", draft.title);
    data.append("type", draft.type);
    if (draft.file) data.append("image", draft.file);
    else if (draft.image) data.append("image", draft.image);
    if (editingId) await api.put(`/gallery/${editingId}`, data);
    else await api.post("/gallery", data);
    setDraft({ title: "", type: "image", image: "", file: null });
    setEditingId(null);
    event.target.reset();
    setMessage(editingId ? "Gallery media updated." : "Gallery media added.");
    load();
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setDraft({ title: item.title || "", type: item.type || "image", image: item.image || "", file: null });
    setMessage("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ title: "", type: "image", image: "", file: null });
    setMessage("");
  };

  const remove = async (item) => {
    if (!confirm(`Delete "${item.title}" from the gallery?`)) return;
    await api.delete(`/gallery/${item.id}`);
    if (viewer?.id === item.id) setViewer(null);
    if (editingId === item.id) cancelEdit();
    setMessage("Gallery media deleted.");
    load();
  };

  return (
    <div className="space-y-5">
      {user?.role === "admin" && (
        <form key={editingId || "new-gallery-media"} onSubmit={save} className="grid gap-3 rounded-md border border-emerald-700 bg-moss p-4 sm:grid-cols-2 xl:grid-cols-6">
          <div className="sm:col-span-2 xl:col-span-6">
            <h2 className="section-title">{editingId ? "Edit Gallery Media" : "Add Gallery Media"}</h2>
          </div>
          <input className="field sm:col-span-2 xl:col-span-2" placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required />
          <select className="field" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
          <input className="field sm:col-span-2 xl:col-span-2" placeholder="Image or video URL" value={draft.image} onChange={(e) => setDraft({ ...draft, image: e.target.value })} />
          <input className="field" type="file" accept="image/*,video/*" onChange={(e) => setDraft({ ...draft, file: e.target.files?.[0] || null })} />
          <button className="btn-primary md:col-span-3 xl:col-span-3"><Save size={16} /> {editingId ? "Save Changes" : "Add Gallery Media"}</button>
          {editingId && <button className="btn-soft md:col-span-3 xl:col-span-3" type="button" onClick={cancelEdit}><X size={16} /> Cancel Edit</button>}
        </form>
      )}
      {message && <p className="rounded-md bg-emerald-900 p-3 text-sm font-semibold text-emerald-50">{message}</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
            <button className="gallery-media-button" type="button" onClick={() => setViewer(item)} title={`Open ${item.title}`}>
              {item.type === "video" ? (
                <video className="h-64 w-full object-cover" src={assetUrl(item.image)} muted playsInline />
              ) : (
                <img className="h-64 w-full object-cover" src={assetUrl(item.image)} alt={item.title} />
              )}
            </button>
            <div className="flex items-center justify-between gap-3 p-4">
              <h3 className="font-bold">{item.title}</h3>
              {user?.role === "admin" && (
                <div className="flex shrink-0 gap-2">
                  <button className="btn-soft !h-11 !w-11 !px-0" type="button" onClick={() => startEdit(item)} title="Edit media"><Edit3 size={16} /></button>
                  <button className="icon-danger" type="button" onClick={() => remove(item)} title="Delete media">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
      {items.length === 0 && <div className="rounded-md border border-emerald-700 bg-moss p-5 text-sm font-semibold text-emerald-50">No gallery media yet.</div>}
      {viewer && (
        <div className="media-viewer" role="dialog" aria-modal="true" aria-label={viewer.title} onClick={() => setViewer(null)}>
          <div className="media-viewer-panel" onClick={(event) => event.stopPropagation()}>
            <button className="media-viewer-close" type="button" onClick={() => setViewer(null)} title="Close"><X size={22} /></button>
            {viewer.type === "video" ? (
              <video className="media-viewer-content" src={assetUrl(viewer.image)} controls autoPlay />
            ) : (
              <img className="media-viewer-content" src={assetUrl(viewer.image)} alt={viewer.title} />
            )}
            <div className="media-viewer-title">{viewer.title}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Contact({ info }) {
  const mapQuery = encodeURIComponent(info.location || "Gikondo Magerwa Kigali Rwanda");
  return <div className="grid gap-5 lg:grid-cols-2"><div className="rounded-md border border-zinc-200 bg-white p-5"><h2 className="section-title">Contact Us</h2><p className="mt-4 flex gap-2"><MapPin className="shrink-0" /> {info.location}</p><p className="mt-3 flex gap-2"><Phone className="shrink-0" /> {info.phone}</p><p className="mt-3">{info.hours}</p><div className="mt-5"><WhatsAppButton text="Customer Support" info={info} /></div></div><iframe title="Freezone map" className="min-h-80 w-full rounded-md border border-zinc-200" src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=14&ie=UTF8&iwloc=&output=embed`} /></div>;
}

function AdminCrudPanel({ title, endpoint, fields, columns, defaults = {}, transform = (data) => data }) {
  const empty = Object.fromEntries(fields.map((field) => [field.name, defaults[field.name] ?? ""]));
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get(endpoint)
      .then((res) => {
        setRows(res.data);
        setMessage("");
      })
      .catch((error) => {
        setRows([]);
        setMessage(error.response?.data?.message || `Could not load ${title.toLowerCase()}.`);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, [endpoint]);

  const save = async (event) => {
    event.preventDefault();
    try {
      const payload = transform(draft, editingId);
      if (editingId) await api.put(`${endpoint}/${editingId}`, payload);
      else await api.post(endpoint, payload);
      setDraft(empty);
      setEditingId(null);
      setMessage(editingId ? `${title} updated.` : `${title} created.`);
      load();
    } catch (error) {
      setMessage(error.response?.data?.message || `Could not save ${title.toLowerCase()}.`);
    }
  };

  const edit = (row) => {
    setEditingId(row.id);
    setDraft(Object.fromEntries(fields.map((field) => {
      const value = row[field.name] ?? defaults[field.name] ?? "";
      return [field.name, field.type === "select" && typeof value === "boolean" ? String(value) : value];
    })));
  };

  const removeRow = async (id) => {
    if (!confirm(`Delete this ${title.toLowerCase()} record?`)) return;
    try {
      await api.delete(`${endpoint}/${id}`);
      setMessage(`${title} deleted.`);
      load();
    } catch (error) {
      setMessage(error.response?.data?.message || `Could not delete ${title.toLowerCase()}.`);
    }
  };

  return (
    <section className="space-y-4 rounded-md border border-zinc-200 bg-white p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="text-sm text-emerald-100">Admin can create, edit, delete, and manage these records.</p>
        </div>
        {editingId && <button className="btn-soft" type="button" onClick={() => { setEditingId(null); setDraft(empty); }}><X size={16} /> Cancel Edit</button>}
      </div>
      {message && <p className="rounded-md bg-emerald-900 p-3 text-sm font-semibold text-emerald-50">{message}</p>}
      <form onSubmit={save} className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {fields.map((field) => field.type === "select" ? (
          <select key={field.name} className="field" value={draft[field.name] || ""} onChange={(e) => setDraft({ ...draft, [field.name]: e.target.value })} required={field.required}>
            <option value="">{field.label}</option>
            {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        ) : field.type === "textarea" ? (
          <textarea
            key={field.name}
            className="field md:col-span-2 xl:col-span-3"
            placeholder={field.label}
            value={draft[field.name] || ""}
            onChange={(e) => setDraft({ ...draft, [field.name]: e.target.value })}
            required={field.required}
          />
        ) : (
          <input
            key={field.name}
            className="field"
            type={field.type || "text"}
            min={field.min}
            placeholder={field.label}
            value={draft[field.name] || ""}
            onChange={(e) => setDraft({ ...draft, [field.name]: e.target.value })}
            required={field.required && !(editingId && field.name === "password")}
          />
        ))}
        <button className="btn-primary md:col-span-2 xl:col-span-6"><Save size={16} /> {editingId ? "Update" : "Create"}</button>
      </form>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-100 text-xs uppercase text-zinc-500"><tr>{columns.map((column) => <th className="px-4 py-3" key={column}>{column}</th>)}<th className="px-4 py-3">Actions</th></tr></thead>
          <tbody>
            {loading && <tr><td className="px-4 py-4 text-emerald-100" colSpan={columns.length + 1}>Loading...</td></tr>}
            {!loading && rows.length === 0 && <tr><td className="px-4 py-4 text-emerald-100" colSpan={columns.length + 1}>No records found.</td></tr>}
            {rows.map((row) => (
              <tr className="border-t" key={row.id}>
                {columns.map((column) => <td className="px-4 py-3" key={column}>{Array.isArray(row[column]) ? row[column].join(", ") : typeof row[column] === "boolean" ? (row[column] ? "Yes" : "No") : String(row[column] ?? "")}</td>)}
                <td className="flex gap-2 px-4 py-3"><button className="btn-soft" type="button" onClick={() => edit(row)}><Edit3 size={16} /> Edit</button><button className="icon-danger" type="button" onClick={() => removeRow(row.id)}><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdminSystemCenter() {
  const panels = {
    Users: {
      endpoint: "/users",
      columns: ["username", "name", "role", "phone"],
      defaults: { role: "user" },
      fields: [
        { name: "username", label: "Username", required: true },
        { name: "name", label: "Full name", required: true },
        { name: "password", label: "Password", type: "password", required: true },
        { name: "role", label: "Role", type: "select", options: ["admin", "user"], required: true },
        { name: "phone", label: "Phone" }
      ],
      transform: (data, editingId) => {
        const payload = { ...data };
        if (editingId && !payload.password) delete payload.password;
        return payload;
      }
    },
    Menu: {
      endpoint: "/menu",
      columns: ["name", "type", "category", "price", "available"],
      defaults: { type: "food", available: "true" },
      fields: [
        { name: "name", label: "Name", required: true },
        { name: "type", label: "Type", type: "select", options: ["food", "drink"], required: true },
        { name: "category", label: "Category" },
        { name: "price", label: "Price", type: "number", min: 0, required: true },
        { name: "image", label: "Image URL" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "available", label: "Available", type: "select", options: ["true", "false"] }
      ],
      transform: (data) => ({ ...data, price: Number(data.price || 0), available: data.available !== "false" })
    },
    Employees: {
      endpoint: "/employees",
      columns: ["name", "role", "phone", "email", "status", "salary"],
      defaults: { status: "Active" },
      fields: [
        { name: "name", label: "Name", required: true },
        { name: "role", label: "Role", required: true },
        { name: "phone", label: "Phone" },
        { name: "email", label: "Email" },
        { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
        { name: "salary", label: "Salary", type: "number", min: 0 }
      ],
      transform: (data) => ({ ...data, salary: Number(data.salary || 0) })
    },
    Stock: {
      endpoint: "/stock/products",
      columns: ["productName", "category", "qtyIn", "qtyOut", "remainingStock", "unitPrice", "totalValue", "status"],
      fields: [
        { name: "productName", label: "Product name", required: true },
        { name: "category", label: "Category", required: true },
        { name: "qtyIn", label: "Qty In", type: "number", min: 0, required: true },
        { name: "qtyOut", label: "Qty Out", type: "number", min: 0, required: true },
        { name: "unitPrice", label: "Unit Price", type: "number", min: 0, required: true },
        { name: "image", label: "Image URL" }
      ],
      transform: (data) => ({ ...data, qtyIn: Number(data.qtyIn || 0), qtyOut: Number(data.qtyOut || 0), unitPrice: Number(data.unitPrice || 0) })
    },
    Orders: {
      endpoint: "/orders",
      columns: ["customerName", "phone", "address", "delivery", "status", "total"],
      defaults: { status: "Received", delivery: "true", total: 0 },
      fields: [
        { name: "customerName", label: "Customer name", required: true },
        { name: "phone", label: "Phone", required: true },
        { name: "address", label: "Address" },
        { name: "delivery", label: "Delivery", type: "select", options: ["true", "false"] },
        { name: "status", label: "Status", type: "select", options: ["Received", "Confirmed", "Preparing", "Out for delivery", "Completed"] },
        { name: "total", label: "Total", type: "number", min: 0 },
        { name: "notes", label: "Notes", type: "textarea" }
      ],
      transform: (data) => ({ ...data, delivery: data.delivery !== "false", total: Number(data.total || 0), items: [] })
    },
    Gallery: {
      endpoint: "/gallery",
      columns: ["title", "type", "image"],
      defaults: { type: "image" },
      fields: [
        { name: "title", label: "Title", required: true },
        { name: "type", label: "Type", type: "select", options: ["image", "video"], required: true },
        { name: "image", label: "Media URL", required: true }
      ]
    }
  };
  const [active, setActive] = useState("Users");
  const config = panels[active];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {Object.keys(panels).map((panel) => <button key={panel} className={active === panel ? "btn-primary" : "btn-soft"} type="button" onClick={() => setActive(panel)}>{panel}</button>)}
      </div>
      <AdminCrudPanel key={active} title={active} {...config} />
    </div>
  );
}

function SettingsPage({ user, info, setInfo }) {
  const [draft, setDraft] = useState(info);
  const [logoFile, setLogoFile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => setDraft(info), [info]);

  const save = async (event) => {
    event.preventDefault();
    const payload = new FormData();
    Object.entries(draft || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) payload.append(key, value);
    });
    if (logoFile) payload.append("logo", logoFile);
    const { data } = await api.put("/info", payload);
    setInfo(data);
    setLogoFile(null);
    setMessage("Settings saved.");
  };

  const reset = async () => {
    const { data } = await api.delete("/info");
    setInfo(data);
    setDraft(data);
    setMessage("Settings reset to default.");
  };

  if (!user) return <LoginNotice />;
  if (user.role !== "admin") {
    return <div className="rounded-md border border-amber-200 bg-amber-50 p-5 font-semibold text-amber-900">Admin access is required to change website settings.</div>;
  }

  return (
    <div className="space-y-5">
      <form onSubmit={save} className="grid gap-4 rounded-md border border-emerald-700 bg-moss p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h2 className="section-title">Website Settings</h2>
          <p className="mt-1 text-sm text-emerald-100">Admin has full access to manage website information and every system module from this Settings section.</p>
        </div>
        <div className="flex items-center gap-4 rounded-md border border-emerald-700 bg-emerald-950/60 p-3 sm:col-span-2">
          <img className="h-16 w-16 rounded-md border border-gold object-cover" src={logoFile ? URL.createObjectURL(logoFile) : assetUrl(draft.logo) || logo} alt="Current logo" />
          <div className="min-w-0 flex-1">
            <label className="block text-sm font-bold text-emerald-50">Website logo</label>
            <input className="field mt-2" type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
          </div>
        </div>
        <input className="field" placeholder="Website title" value={draft.name || ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <input className="field" placeholder="Phone number" value={draft.phone || ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
        <input className="field" placeholder="WhatsApp number" value={draft.whatsapp || ""} onChange={(e) => setDraft({ ...draft, whatsapp: e.target.value })} />
        <input className="field" placeholder="Email" value={draft.email || ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
        <label className="grid gap-2 text-sm font-bold text-emerald-50">Main color<input className="h-12 w-full rounded-md border border-emerald-700 bg-emerald-950 p-1" type="color" value={draft.primaryColor || "#0d3d2d"} onChange={(e) => setDraft({ ...draft, primaryColor: e.target.value })} /></label>
        <label className="grid gap-2 text-sm font-bold text-emerald-50">Button color<input className="h-12 w-full rounded-md border border-emerald-700 bg-emerald-950 p-1" type="color" value={draft.accentColor || "#d7aa48"} onChange={(e) => setDraft({ ...draft, accentColor: e.target.value })} /></label>
        <label className="grid gap-2 text-sm font-bold text-emerald-50 sm:col-span-2">Background color<input className="h-12 w-full rounded-md border border-emerald-700 bg-emerald-950 p-1" type="color" value={draft.backgroundColor || "#071812"} onChange={(e) => setDraft({ ...draft, backgroundColor: e.target.value })} /></label>
        <input className="field sm:col-span-2" placeholder="Location" value={draft.location || ""} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
        <input className="field sm:col-span-2" placeholder="Business hours" value={draft.hours || ""} onChange={(e) => setDraft({ ...draft, hours: e.target.value })} />
        <textarea className="field min-h-28 sm:col-span-2" placeholder="About us" value={draft.about || ""} onChange={(e) => setDraft({ ...draft, about: e.target.value })} />
        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
          <button className="btn-primary flex-1" type="submit"><Settings size={16} /> Save Settings</button>
          <button className="btn-soft flex-1" type="button" onClick={reset}>Reset Defaults</button>
        </div>
        {message && <p className="rounded-md bg-emerald-900 p-3 text-sm font-semibold text-emerald-50 sm:col-span-2">{message}</p>}
      </form>
      <AdminSystemCenter />
    </div>
  );
}

function DataTable({ rows, columns, onDelete, onStatus }) {
  return <div className="overflow-hidden rounded-md border border-zinc-200 bg-white"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-zinc-100 text-xs uppercase text-zinc-500"><tr>{columns.map((col) => <th className="px-4 py-3" key={col}>{col}</th>)}<th className="px-4 py-3">Actions</th></tr></thead><tbody>{rows.map((row) => <tr className="border-t" key={row.id}>{columns.map((col) => <td className="px-4 py-3" key={col}>{Array.isArray(row[col]) ? row[col].join(", ") : row[col]}</td>)}<td className="px-4 py-3">{onStatus && <select className="field" value={row.status} onChange={(e) => onStatus(row.id, e.target.value)}><option>Received</option><option>Confirmed</option><option>Preparing</option><option>Out for delivery</option><option>Completed</option></select>}{onDelete && <button className="icon-danger" onClick={() => onDelete(row.id)}><Trash2 size={16} /></button>}</td></tr>)}</tbody></table></div></div>;
}

function LoginNotice() {
  return <div className="rounded-md border border-amber-200 bg-amber-50 p-5 font-semibold text-amber-900">Please login to access this management page.</div>;
}

function App() {
  const [page, setPage] = useState("Home");
  const [items, setItems] = useState([]);
  const [info, setInfo] = useState({});
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [sidebar, setSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const availableNav = useMemo(() => navForUser(user), [user]);
  const availablePages = useMemo(() => availableNav.map(([label]) => label), [availableNav]);
  const loadMenu = () => api.get("/menu").then((res) => setItems(res.data));
  useEffect(() => {
    loadMenu();
    api.get("/info").then((res) => setInfo(res.data));
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("freezone_user") : null;
    const storedToken = typeof window !== "undefined" ? localStorage.getItem("freezone_token") : null;
    if (storedToken) {
      if (storedUser) setUser(JSON.parse(storedUser));
      api.get("/auth/me").then((res) => setUser(res.data)).catch(() => {
        localStorage.removeItem("freezone_user");
        localStorage.removeItem("freezone_token");
        setUser(null);
      });
    } else {
      if (storedUser) {
        localStorage.removeItem("freezone_user");
      }
    }
  }, []);
  useEffect(() => {
    if (!availablePages.includes(page)) setPage(user ? "Food Menu" : "Home");
  }, [availablePages, page, user]);
  const addItem = (item) => setCart((current) => current.some((row) => row.id === item.id) ? current.map((row) => row.id === item.id ? { ...row, quantity: row.quantity + 1 } : row) : [...current, { ...item, quantity: 1 }]);
  const currentItems = useMemo(() => items.filter((item) => page === "Food Menu" ? item.type === "food" : item.type === "drink"), [items, page]);
  const currentLogo = assetUrl(info.logo) || logo;
  const title = info.name || "Freezone";
  const selectPage = (label) => {
    setPage(label);
    if (typeof window !== "undefined" && window.innerWidth < 768) setSidebar(false);
  };
  const content = page === "Home" ? <HomePage info={info} setPage={setPage} /> : page === "Food Menu" || page === "Drinks Menu" ? <MenuCards items={currentItems} addItem={addItem} admin={user?.role === "admin"} reload={loadMenu} searchQuery={searchQuery} /> : page === "Gallery" ? <Gallery user={user} /> : page === "Online Orders" ? <OrderPage cart={cart} setCart={setCart} info={info} /> : page === "Employee Management" ? <Employees user={user} /> : page === "Customer Orders" ? <OrdersAdmin user={user} info={info} /> : page === "Stock Management" ? <StockManagement user={user} /> : page === "Reports" ? <Reports user={user} /> : page === "Contact Us" ? <Contact info={info} /> : page === "Settings" ? <SettingsPage user={user} info={info} setInfo={setInfo} /> : <AccountPage user={user} setUser={setUser} setPage={setPage} />;
  return (
    <div className="app-shell flex h-screen flex-col overflow-hidden text-white" style={themeStyle(info)}>
      <header className="relative z-40 flex min-h-16 flex-wrap items-center gap-2 border-b border-emerald-800/80 bg-moss/95 px-3 py-2 text-white shadow-lg backdrop-blur sm:gap-3 sm:px-4">
        <button className="icon topbar-icon" onClick={() => setSidebar(!sidebar)} title={sidebar ? "Close menu" : "Open menu"}><MenuIcon /></button>
        <img src={currentLogo} className="topbar-logo h-10 w-10 rounded-full object-cover" alt={title} />
        <div>
          <div className="font-black leading-tight">{title}</div>
          <div className="text-xs font-semibold text-emerald-100">{user ? `${user.role === "admin" ? "Admin" : "Employee"}: ${user.name}` : "Client Menu"}</div>
        </div>
        <form
          className="order-last flex w-full items-center gap-2 rounded-md bg-emerald-900 px-3 py-2 sm:order-none sm:ml-auto sm:max-w-md sm:flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            if (!["Food Menu", "Drinks Menu"].includes(page)) setPage("Food Menu");
          }}
        >
          <button className="inline-flex text-emerald-100" type="submit" title="Search menu">
            <Search size={18} />
          </button>
          <input
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-emerald-100"
            placeholder="Search menu, food, drinks"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </form>
        <button className="btn-soft shrink-0" onClick={() => setPage("Online Orders")}><PackageCheck size={16} /> {cart.length}</button>
      </header>
      <div className="app-body flex min-h-0 flex-1">
        {sidebar && <button className="sidebar-scrim" type="button" aria-label="Close menu" onClick={() => setSidebar(false)} />}
        <aside className={`app-sidebar ${sidebar ? "sidebar-expanded" : "sidebar-mini"}`}>
          <div className="sidebar-card mb-3 rounded-md border border-emerald-700 bg-emerald-950/70 p-3">
            <p className="text-xs font-bold uppercase text-gold">{user?.role === "admin" ? "Full Access" : user ? "Employee Access" : "Client View"}</p>
            <p className="mt-1 text-sm text-emerald-100">{user ? "Order for clients and manage your records." : "Browse menu and place orders easily."}</p>
          </div>
          {availableNav.map(([label, Icon]) => <button key={label} className={`nav-item ${page === label ? "active" : ""}`} onClick={() => selectPage(label)} title={label}><Icon size={19} /> <span className="nav-label">{label}</span></button>)}
        </aside>
        <main className="app-main w-full min-w-0 pb-24 p-3 sm:p-4 md:p-6">
          <div className="mb-5 flex flex-col items-stretch justify-between gap-3 rounded-md border border-emerald-800/70 bg-emerald-950/50 p-4 shadow-sm sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-black">{page}</h1>
              <p className="text-sm text-emerald-100">{info.location}</p>
            </div>
            <WhatsAppButton text="WhatsApp" info={info} />
          </div>
          <div className="content-fade">{content}</div>
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 gap-1 border-t border-emerald-800 bg-moss/95 p-2 shadow-2xl backdrop-blur md:hidden">
        {availableNav.slice(0, 4).map(([label, Icon]) => (
          <button key={label} className={`mobile-tab ${page === label ? "active" : ""}`} onClick={() => setPage(label)}>
            <Icon size={18} />
            <span>{label.replace(" Menu", "")}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
