import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

// ===== Supabase helpers =====
function getAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function getUserFromToken(token: string) {
  const supabase = getAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  return parts.length === 2 ? parts[1] : null;
}

// ===== Seed Data =====
const SEED_PRODUCTS = [
  {
    id: "prod_001",
    name: "Noir Lace Balconette Bra",
    slug: "noir-lace-balconette-bra",
    category: "bras",
    price: 89,
    originalPrice: null,
    description: "A timeless balconette silhouette crafted from intricate French lace with satin trim.",
    longDescription: "Expertly crafted from the finest French lace, this balconette bra offers both beauty and support. The structured underwire cups lift and shape, while the adjustable straps ensure a perfect fit. Finished with delicate satin trim and a rose gold clasp.",
    image: "https://images.unsplash.com/photo-1610101597201-37823dc0bf59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1610101597201-37823dc0bf59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
      "https://images.unsplash.com/photo-1549439602-43ebca2327af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80"
    ],
    sizes: ["32A", "32B", "32C", "34A", "34B", "34C", "34D", "36B", "36C", "36D"],
    colors: ["Noir", "Ivory", "Dusty Rose"],
    inStock: true,
    stockCount: 24,
    badge: "NEW",
    rating: 4.8,
    reviewCount: 42,
    featured: true,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "prod_002",
    name: "Rose Petal Bralette",
    slug: "rose-petal-bralette",
    category: "bras",
    price: 65,
    originalPrice: null,
    description: "A delicate bralette in blush-toned stretch lace, offering ethereal comfort.",
    longDescription: "This featherlight bralette is made from a stretch lace blend that moves with your body. The soft cups and strappy back make it as beautiful as a piece of outerwear. Wear it alone or layered beneath a blazer for effortless elegance.",
    image: "https://images.unsplash.com/photo-1677443844002-24abd69483b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1677443844002-24abd69483b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
      "https://images.unsplash.com/photo-1610101597201-37823dc0bf59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80"
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Blush", "Noir", "Champagne"],
    inStock: true,
    stockCount: 18,
    badge: null,
    rating: 4.6,
    reviewCount: 31,
    featured: true,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: "prod_003",
    name: "Velvet Noir Lingerie Set",
    slug: "velvet-noir-lingerie-set",
    category: "sets",
    price: 145,
    originalPrice: 180,
    description: "A sultry full-coverage set in midnight velvet with intricate lace detailing.",
    longDescription: "The ultimate in dark luxury. This full set includes a plunge bra and matching high-waist brief, both crafted from soft velvet with contrasting lace overlay. The adjustable boning in the cups provides structure, while the velvet fabric drapes beautifully against the skin.",
    image: "https://images.unsplash.com/photo-1598719830738-32b91fa649be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1598719830738-32b91fa649be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
      "https://images.unsplash.com/photo-1665615839092-d6a183660860?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80"
    ],
    sizes: ["XS/32A", "S/34B", "M/36C", "L/38D"],
    colors: ["Midnight Noir", "Deep Burgundy"],
    inStock: true,
    stockCount: 12,
    badge: "SALE",
    rating: 4.9,
    reviewCount: 67,
    featured: true,
    createdAt: new Date(Date.now() - 21 * 86400000).toISOString(),
  },
  {
    id: "prod_004",
    name: "Crimson Lace Set",
    slug: "crimson-lace-set",
    category: "sets",
    price: 160,
    originalPrice: null,
    description: "Handcrafted Chantilly lace in a deep crimson that commands attention.",
    longDescription: "Made from authentic Chantilly lace imported from France, this set exudes confidence. The demi-cup bra is cut to flatter and reveal, paired with a matching thong that sits high on the hip. The crimson dye is rich and does not fade, maintaining its vibrancy wash after wash.",
    image: "https://images.unsplash.com/photo-1665615839092-d6a183660860?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1665615839092-d6a183660860?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
      "https://images.unsplash.com/photo-1598719830738-32b91fa649be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80"
    ],
    sizes: ["XS/32A", "S/34B", "M/36C", "L/38D", "XL/40DD"],
    colors: ["Crimson", "Noir"],
    inStock: true,
    stockCount: 9,
    badge: "NEW",
    rating: 4.7,
    reviewCount: 28,
    featured: true,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "prod_005",
    name: "Silk Dreams Chemise",
    slug: "silk-dreams-chemise",
    category: "sleepwear",
    price: 120,
    originalPrice: null,
    description: "Pure mulberry silk chemise with hand-stitched embroidery at the décolleté.",
    longDescription: "Woven from grade 6A mulberry silk, this chemise falls to mid-thigh with a gentle bias cut that skims the body. The hand-stitched floral embroidery at the neckline is each piece unique. Arrives in a signature Velour dust bag.",
    image: "https://images.unsplash.com/photo-1750064139819-da3bf362e7b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1750064139819-da3bf362e7b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
      "https://images.unsplash.com/photo-1763673715053-94822c530809?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80"
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Ivory", "Blush", "Champagne", "Noir"],
    inStock: true,
    stockCount: 15,
    badge: null,
    rating: 4.9,
    reviewCount: 53,
    featured: true,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "prod_006",
    name: "Ivory Satin Robe",
    slug: "ivory-satin-robe",
    category: "sleepwear",
    price: 185,
    originalPrice: null,
    description: "A floor-length satin robe with wide lapels and a self-tie belt — effortlessly opulent.",
    longDescription: "This statement robe is crafted from heavyweight satin that flows with unparalleled grace. The wide lapels are trimmed with delicate lace, and deep side pockets make it as practical as it is beautiful. Available in three lengths to suit every frame.",
    image: "https://images.unsplash.com/photo-1763673715053-94822c530809?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1763673715053-94822c530809?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
      "https://images.unsplash.com/photo-1750064139819-da3bf362e7b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80"
    ],
    sizes: ["XS/S", "M/L", "XL/XXL"],
    colors: ["Ivory", "Blush Mist", "Midnight"],
    inStock: true,
    stockCount: 8,
    badge: null,
    rating: 4.8,
    reviewCount: 39,
    featured: false,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "prod_007",
    name: "Midnight Lace Thong",
    slug: "midnight-lace-thong",
    category: "briefs",
    price: 35,
    originalPrice: null,
    description: "Barely-there stretch lace in deep noir — beautifully minimal.",
    longDescription: "Cut from our signature stretch lace, this thong disappears beneath clothing while remaining utterly seductive. The scalloped waistband sits at the natural hip, and the lace panel provides a whisper of coverage.",
    image: "https://images.unsplash.com/photo-1547714062-4daa321e1d6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1547714062-4daa321e1d6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80"
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Noir", "Blush", "Burgundy"],
    inStock: true,
    stockCount: 45,
    badge: null,
    rating: 4.5,
    reviewCount: 84,
    featured: false,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: "prod_008",
    name: "Sheer Illusion Brief",
    slug: "sheer-illusion-brief",
    category: "briefs",
    price: 42,
    originalPrice: null,
    description: "Full-coverage brief in sheer mesh with floral lace appliqué — artistry in intimacy.",
    longDescription: "Our most ethereal brief style. The mesh body creates an illusion of bare skin, while strategically placed lace appliqués add a botanical beauty. The wide waistband prevents rolling and provides all-day comfort.",
    image: "https://images.unsplash.com/photo-1602062994995-f4c33750378a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1602062994995-f4c33750378a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
      "https://images.unsplash.com/photo-1547714062-4daa321e1d6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80"
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["Nude", "Noir", "Blush"],
    inStock: true,
    stockCount: 32,
    badge: null,
    rating: 4.7,
    reviewCount: 56,
    featured: false,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: "prod_009",
    name: "Obsidian Satin Corset",
    slug: "obsidian-satin-corset",
    category: "sets",
    price: 220,
    originalPrice: null,
    description: "A structured satin corset with boning and hand-finished lace-up back — a masterwork.",
    longDescription: "This corset is a statement piece in every sense. Featuring 12 steel bones for structure and shape, a lace-up back for customisable fit, and a satin brocade exterior. Sold with matching high-cut brief. Arrives in a signature presentation box.",
    image: "https://images.unsplash.com/photo-1730668104860-38cdd6f86519?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1730668104860-38cdd6f86519?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
      "https://images.unsplash.com/photo-1591901814339-c73e5a1e196a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80"
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Obsidian", "Ivory"],
    inStock: true,
    stockCount: 6,
    badge: "EXCLUSIVE",
    rating: 5.0,
    reviewCount: 19,
    featured: true,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "prod_010",
    name: "Antique Lace Collection Set",
    slug: "antique-lace-collection-set",
    category: "sets",
    price: 175,
    originalPrice: 210,
    description: "Heritage-inspired antique lace in a three-piece set — bra, brief, and garter belt.",
    longDescription: "Inspired by Victorian intimacy and crafted for the modern woman. The three-piece set includes an underwired bra, matching brief, and a six-strap garter belt, all in antique-ivory stretch lace. The pieces may be worn individually or together.",
    image: "https://images.unsplash.com/photo-1549439602-43ebca2327af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1549439602-43ebca2327af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
      "https://images.unsplash.com/photo-1598719830738-32b91fa649be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80"
    ],
    sizes: ["XS/32A", "S/34B", "M/36C", "L/38D"],
    colors: ["Antique Ivory", "Champagne"],
    inStock: true,
    stockCount: 11,
    badge: "SALE",
    rating: 4.8,
    reviewCount: 44,
    featured: true,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

async function ensureProducts() {
  const existing = await kv.get("velour:products");
  if (!existing) {
    await kv.set("velour:products", JSON.stringify(SEED_PRODUCTS));
    console.log("Seeded products");
  }
}

// Run on startup
ensureProducts().catch(console.error);

// ===== HEALTH =====
app.get("/make-server-9b49dbfb/health", (c) => c.json({ status: "ok" }));

// ===== PRODUCTS =====
app.get("/make-server-9b49dbfb/products", async (c) => {
  try {
    await ensureProducts();
    const raw = await kv.get("velour:products");
    let products = JSON.parse(raw || "[]");

    const { category, featured, search } = c.req.query();

    if (category && category !== "all") {
      products = products.filter((p: any) => p.category === category);
    }
    if (featured === "true") {
      products = products.filter((p: any) => p.featured === true);
    }
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(
        (p: any) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    return c.json({ data: products });
  } catch (err) {
    console.log("Error fetching products:", err);
    return c.json({ error: "Failed to fetch products" }, 500);
  }
});

app.get("/make-server-9b49dbfb/products/:idOrSlug", async (c) => {
  try {
    const { idOrSlug } = c.req.param();
    const raw = await kv.get("velour:products");
    const products = JSON.parse(raw || "[]");
    const product = products.find(
      (p: any) => p.id === idOrSlug || p.slug === idOrSlug
    );
    if (!product) return c.json({ error: "Product not found" }, 404);
    return c.json({ data: product });
  } catch (err) {
    console.log("Error fetching product:", err);
    return c.json({ error: "Failed to fetch product" }, 500);
  }
});

app.post("/make-server-9b49dbfb/products", async (c) => {
  try {
    const token = extractToken(c.req.header("Authorization"));
    if (!token) return c.json({ error: "Unauthorized" }, 401);

    const user = await getUserFromToken(token);
    if (!user || !user.user_metadata?.isAdmin) {
      return c.json({ error: "Admin access required" }, 403);
    }

    const body = await c.req.json();
    const raw = await kv.get("velour:products");
    const products = JSON.parse(raw || "[]");

    const newProduct = {
      ...body,
      id: `prod_${Date.now()}`,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      createdAt: new Date().toISOString(),
      rating: body.rating || 0,
      reviewCount: body.reviewCount || 0,
    };

    products.push(newProduct);
    await kv.set("velour:products", JSON.stringify(products));
    return c.json({ data: newProduct }, 201);
  } catch (err) {
    console.log("Error creating product:", err);
    return c.json({ error: "Failed to create product" }, 500);
  }
});

app.put("/make-server-9b49dbfb/products/:id", async (c) => {
  try {
    const token = extractToken(c.req.header("Authorization"));
    if (!token) return c.json({ error: "Unauthorized" }, 401);

    const user = await getUserFromToken(token);
    if (!user || !user.user_metadata?.isAdmin) {
      return c.json({ error: "Admin access required" }, 403);
    }

    const { id } = c.req.param();
    const body = await c.req.json();
    const raw = await kv.get("velour:products");
    const products = JSON.parse(raw || "[]");
    const idx = products.findIndex((p: any) => p.id === id);
    if (idx === -1) return c.json({ error: "Product not found" }, 404);

    products[idx] = { ...products[idx], ...body };
    await kv.set("velour:products", JSON.stringify(products));
    return c.json({ data: products[idx] });
  } catch (err) {
    console.log("Error updating product:", err);
    return c.json({ error: "Failed to update product" }, 500);
  }
});

app.delete("/make-server-9b49dbfb/products/:id", async (c) => {
  try {
    const token = extractToken(c.req.header("Authorization"));
    if (!token) return c.json({ error: "Unauthorized" }, 401);

    const user = await getUserFromToken(token);
    if (!user || !user.user_metadata?.isAdmin) {
      return c.json({ error: "Admin access required" }, 403);
    }

    const { id } = c.req.param();
    const raw = await kv.get("velour:products");
    const products = JSON.parse(raw || "[]");
    const updated = products.filter((p: any) => p.id !== id);
    await kv.set("velour:products", JSON.stringify(updated));
    return c.json({ data: null });
  } catch (err) {
    console.log("Error deleting product:", err);
    return c.json({ error: "Failed to delete product" }, 500);
  }
});

// ===== AUTH =====
app.post("/make-server-9b49dbfb/auth/register", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    if (!email || !password || !name) {
      return c.json({ error: "Email, password and name are required" }, 400);
    }

    const supabase = getAdmin();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, isAdmin: false },
      email_confirm: true,
    });

    if (error) {
      console.log("Registration error:", error);
      return c.json({ error: error.message }, 400);
    }

    // Sign in to get token
    const anonSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const { data: signInData, error: signInError } =
      await anonSupabase.auth.signInWithPassword({ email, password });

    if (signInError || !signInData.session) {
      return c.json({ error: "Account created, please sign in" }, 201);
    }

    const user = {
      id: data.user!.id,
      email: data.user!.email!,
      name,
      isAdmin: false,
      createdAt: data.user!.created_at,
    };

    return c.json({ data: { user, token: signInData.session.access_token } }, 201);
  } catch (err) {
    console.log("Register error:", err);
    return c.json({ error: `Registration failed: ${err}` }, 500);
  }
});

app.post("/make-server-9b49dbfb/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const anonSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const { data, error } = await anonSupabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    const meta = data.user.user_metadata;
    const user = {
      id: data.user.id,
      email: data.user.email!,
      name: meta?.name || email.split("@")[0],
      isAdmin: meta?.isAdmin === true,
      createdAt: data.user.created_at,
    };

    return c.json({ data: { user, token: data.session.access_token } });
  } catch (err) {
    console.log("Login error:", err);
    return c.json({ error: `Login failed: ${err}` }, 500);
  }
});

app.get("/make-server-9b49dbfb/auth/me", async (c) => {
  try {
    const token = extractToken(c.req.header("Authorization"));
    if (!token) return c.json({ error: "Unauthorized" }, 401);

    const user = await getUserFromToken(token);
    if (!user) return c.json({ error: "Invalid token" }, 401);

    const meta = user.user_metadata;
    return c.json({
      data: {
        id: user.id,
        email: user.email!,
        name: meta?.name || user.email!.split("@")[0],
        isAdmin: meta?.isAdmin === true,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.log("Get me error:", err);
    return c.json({ error: `Failed to get user: ${err}` }, 500);
  }
});

// ===== ORDERS =====
app.get("/make-server-9b49dbfb/orders", async (c) => {
  try {
    const token = extractToken(c.req.header("Authorization"));
    if (!token) return c.json({ error: "Unauthorized" }, 401);

    const user = await getUserFromToken(token);
    if (!user) return c.json({ error: "Invalid token" }, 401);

    const isAdmin = user.user_metadata?.isAdmin === true;

    if (isAdmin) {
      // Return all orders
      const raw = await kv.get("velour:orders:all");
      const orderIds: string[] = JSON.parse(raw || "[]");
      const orders = await Promise.all(
        orderIds.map(async (id) => {
          const orderRaw = await kv.get(`velour:order:${id}`);
          return orderRaw ? JSON.parse(orderRaw) : null;
        })
      );
      return c.json({ data: orders.filter(Boolean).reverse() });
    }

    // Return user's orders
    const raw = await kv.get(`velour:user:${user.id}:orders`);
    const orderIds: string[] = JSON.parse(raw || "[]");
    const orders = await Promise.all(
      orderIds.map(async (id) => {
        const orderRaw = await kv.get(`velour:order:${id}`);
        return orderRaw ? JSON.parse(orderRaw) : null;
      })
    );
    return c.json({ data: orders.filter(Boolean).reverse() });
  } catch (err) {
    console.log("Get orders error:", err);
    return c.json({ error: `Failed to fetch orders: ${err}` }, 500);
  }
});

app.post("/make-server-9b49dbfb/orders", async (c) => {
  try {
    const token = extractToken(c.req.header("Authorization"));
    if (!token) return c.json({ error: "Unauthorized" }, 401);

    const user = await getUserFromToken(token);
    if (!user) return c.json({ error: "Invalid token" }, 401);

    const body = await c.req.json();
    const orderId = `ord_${Date.now()}`;
    const now = new Date().toISOString();

    const order = {
      id: orderId,
      userId: user.id,
      userEmail: user.email!,
      items: body.items,
      subtotal: body.subtotal,
      shipping: body.shipping,
      total: body.total,
      status: "pending",
      shippingAddress: body.shippingAddress,
      paymentMethod: body.paymentMethod || "card",
      createdAt: now,
      updatedAt: now,
    };

    // Save order
    await kv.set(`velour:order:${orderId}`, JSON.stringify(order));

    // Add to user's order list
    const userOrdersRaw = await kv.get(`velour:user:${user.id}:orders`);
    const userOrders: string[] = JSON.parse(userOrdersRaw || "[]");
    userOrders.push(orderId);
    await kv.set(`velour:user:${user.id}:orders`, JSON.stringify(userOrders));

    // Add to all orders
    const allOrdersRaw = await kv.get("velour:orders:all");
    const allOrders: string[] = JSON.parse(allOrdersRaw || "[]");
    allOrders.push(orderId);
    await kv.set("velour:orders:all", JSON.stringify(allOrders));

    return c.json({ data: order }, 201);
  } catch (err) {
    console.log("Create order error:", err);
    return c.json({ error: `Failed to create order: ${err}` }, 500);
  }
});

app.put("/make-server-9b49dbfb/orders/:id", async (c) => {
  try {
    const token = extractToken(c.req.header("Authorization"));
    if (!token) return c.json({ error: "Unauthorized" }, 401);

    const user = await getUserFromToken(token);
    if (!user || !user.user_metadata?.isAdmin) {
      return c.json({ error: "Admin access required" }, 403);
    }

    const { id } = c.req.param();
    const { status } = await c.req.json();
    const raw = await kv.get(`velour:order:${id}`);
    if (!raw) return c.json({ error: "Order not found" }, 404);

    const order = JSON.parse(raw);
    order.status = status;
    order.updatedAt = new Date().toISOString();
    await kv.set(`velour:order:${id}`, JSON.stringify(order));
    return c.json({ data: order });
  } catch (err) {
    console.log("Update order error:", err);
    return c.json({ error: `Failed to update order: ${err}` }, 500);
  }
});

// ===== WISHLIST =====
app.get("/make-server-9b49dbfb/wishlist", async (c) => {
  try {
    const token = extractToken(c.req.header("Authorization"));
    if (!token) return c.json({ error: "Unauthorized" }, 401);

    const user = await getUserFromToken(token);
    if (!user) return c.json({ error: "Invalid token" }, 401);

    const raw = await kv.get(`velour:user:${user.id}:wishlist`);
    return c.json({ data: JSON.parse(raw || "[]") });
  } catch (err) {
    console.log("Get wishlist error:", err);
    return c.json({ error: `Failed to get wishlist: ${err}` }, 500);
  }
});

app.post("/make-server-9b49dbfb/wishlist/:productId", async (c) => {
  try {
    const token = extractToken(c.req.header("Authorization"));
    if (!token) return c.json({ error: "Unauthorized" }, 401);

    const user = await getUserFromToken(token);
    if (!user) return c.json({ error: "Invalid token" }, 401);

    const { productId } = c.req.param();
    const raw = await kv.get(`velour:user:${user.id}:wishlist`);
    const wishlist: string[] = JSON.parse(raw || "[]");
    if (!wishlist.includes(productId)) {
      wishlist.push(productId);
      await kv.set(`velour:user:${user.id}:wishlist`, JSON.stringify(wishlist));
    }
    return c.json({ data: wishlist });
  } catch (err) {
    console.log("Add wishlist error:", err);
    return c.json({ error: `Failed to add to wishlist: ${err}` }, 500);
  }
});

app.delete("/make-server-9b49dbfb/wishlist/:productId", async (c) => {
  try {
    const token = extractToken(c.req.header("Authorization"));
    if (!token) return c.json({ error: "Unauthorized" }, 401);

    const user = await getUserFromToken(token);
    if (!user) return c.json({ error: "Invalid token" }, 401);

    const { productId } = c.req.param();
    const raw = await kv.get(`velour:user:${user.id}:wishlist`);
    const wishlist: string[] = JSON.parse(raw || "[]");
    const updated = wishlist.filter((id) => id !== productId);
    await kv.set(`velour:user:${user.id}:wishlist`, JSON.stringify(updated));
    return c.json({ data: updated });
  } catch (err) {
    console.log("Remove wishlist error:", err);
    return c.json({ error: `Failed to remove from wishlist: ${err}` }, 500);
  }
});

// ===== ADMIN STATS =====
app.get("/make-server-9b49dbfb/admin/stats", async (c) => {
  try {
    const token = extractToken(c.req.header("Authorization"));
    if (!token) return c.json({ error: "Unauthorized" }, 401);

    const user = await getUserFromToken(token);
    if (!user || !user.user_metadata?.isAdmin) {
      return c.json({ error: "Admin access required" }, 403);
    }

    const productsRaw = await kv.get("velour:products");
    const products = JSON.parse(productsRaw || "[]");

    const allOrdersRaw = await kv.get("velour:orders:all");
    const allOrderIds: string[] = JSON.parse(allOrdersRaw || "[]");
    const orders = await Promise.all(
      allOrderIds.map(async (id) => {
        const raw = await kv.get(`velour:order:${id}`);
        return raw ? JSON.parse(raw) : null;
      })
    );
    const validOrders = orders.filter(Boolean);
    const revenue = validOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    const pending = validOrders.filter((o: any) => o.status === "pending").length;

    return c.json({
      data: {
        totalProducts: products.length,
        totalOrders: validOrders.length,
        revenue,
        pendingOrders: pending,
        recentOrders: validOrders.slice(-5).reverse(),
      },
    });
  } catch (err) {
    console.log("Admin stats error:", err);
    return c.json({ error: `Failed to get stats: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);
