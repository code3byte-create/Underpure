import { MOCK_PRODUCTS } from "./mockData";
const API_URL = "http://localhost/backend/api";

// Real Backend API calls - connects to PHP backend
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API_BASE = isLocal 
  ? "http://127.0.0.1/backend/index.php" 
  : "https://www.underpure.com/backend/index.php";

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  };

  const res = await fetch(url, config);
  let data;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    if (!res.ok) {
      data = {};
    } else {
      console.error("Backend returned invalid JSON. Raw response:", text);
      throw new Error(`Invalid response from server (Parse Error). Check console for raw backend output.`);
    }
  }

  if (!res.ok || (data && data.error)) {
    // Auto-logout if token is invalid or expired
    if (res.status === 401) {
      import("../store/authStore").then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
        if (
          window.location.pathname !== "/auth" &&
          window.location.pathname !== "/"
        ) {
          window.location.href = "/auth";
        }
      });
    }
    const errMsg = data?.details ? `${data.error}: ${data.details}` : (data?.error || `Request failed with status ${res.status}`);
    throw new Error(errMsg);
  }
  return data;
}

// Auth header helper
function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchMe(token) {
  const data = await apiCall("/auth/me", {
    headers: authHeaders(token),
  });
  return data.user;
}

// ===== PRODUCTS =====
export async function fetchProducts(params) {
  const queryParts = [];
  if (params?.category && params.category !== "all")
    queryParts.push(`category=${params.category}`);
  if (params?.featured) queryParts.push("featured=true");
  if (params?.search)
    queryParts.push(`search=${encodeURIComponent(params.search)}`);
  const query = queryParts.length ? `?${queryParts.join("&")}` : "";

  const data = await apiCall(`/products${query}`);
  if (data && data.products) return Array.isArray(data.products) ? data.products : [];
  return Array.isArray(data) ? data : [];
}

export async function fetchProduct(idOrSlug) {
  const data = await apiCall(`/products/${idOrSlug}`);
  return data.product;
}

export async function createProduct(token, productData) {
  const data = await apiCall("/products", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(productData),
  });
  return data.product;
}

export async function updateProduct(token, id, productData) {
  const data = await apiCall(`/products/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(productData),
  });
  return data;
}

export async function deleteProduct(token, id) {
  await apiCall(`/products/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  return true;
}

// ===== AUTH =====
export async function register(email, password, name) {
  const data = await apiCall("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  return { user: data.user, token: data.token };
}

export async function login(email, password) {
  const data = await apiCall("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return { user: data.user, token: data.token };
}

export async function googleLogin(credential) {
  const data = await apiCall("/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
  return { user: data.user, token: data.token };
}

export async function getMe(token) {
  const data = await apiCall("/profile", {
    headers: authHeaders(token),
  });
  return data.user;
}

// ===== ORDERS =====
export async function fetchOrders(token) {
  const data = await apiCall("/orders", {
    headers: authHeaders(token),
  });
  return data.orders || [];
}

export async function createOrder(token, orderData) {
  // Frontend sends: { items, subtotal, shipping, total, shippingAddress, paymentMethod }
  // Backend expects: { cart_items, shipping_name, shipping_phone, shipping_address, shipping_city, shipping_zip }
  const addr = orderData.shippingAddress;
  const cartItems = orderData.items.map((i) => ({
    product_id: i.productId,
    product_name: i.productName,
    color: i.color,
    size: i.size,
    quantity: i.quantity,
    price: i.price,
  }));

  const data = await apiCall("/checkout", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      cart_items: cartItems,
      shipping_name: `${addr.firstName} ${addr.lastName}`.trim(),
      shipping_email: addr.email || "",
      shipping_phone: addr.phone || "",
      shipping_address: addr.street,
      shipping_city: addr.city,
      shipping_zip: addr.zip,
    }),
  });

  // Return in frontend format
  return {
    id: String(data.order?.order_id || Date.now()),
    ...orderData,
    status: data.order?.status || "pending",
    createdAt: new Date().toISOString(),
  };
}

export async function updateOrderStatus(token, id, status) {
  const data = await apiCall(`/orders/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
  return data.order;
}

export async function acceptOrder(token, id) {
  const data = await apiCall(`/orders/${id}/accept`, {
    method: "POST",
    headers: authHeaders(token),
  });
  return data;
}

export async function cancelOrder(token, orderId) {
  return apiCall(`/orders/${orderId}/cancel`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function syncPostExOrders(token) {
  return apiCall("/orders/sync-postex", {
    method: "POST",
    headers: authHeaders(token),
  });
}

// ===== ADMIN STATS & CUSTOMERS =====
export async function fetchAdminStats(token) {
  const data = await apiCall("/admin/stats", {
    headers: authHeaders(token),
  });
  return data;
}

export async function fetchCustomers(token) {
  return await apiCall("/admin/customers", {
    headers: authHeaders(token),
  });
}

// ===== PROMOTIONS =====
export async function fetchPromotions(token) {
  return await apiCall("/admin/promotions", {
    headers: authHeaders(token),
  });
}

export async function createPromotion(token, promoData) {
  return await apiCall("/admin/promotions", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(promoData),
  });
}

export async function updatePromotion(token, id, promoData) {
  return await apiCall(`/admin/promotions/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(promoData),
  });
}

export async function deletePromotion(token, id) {
  return await apiCall(`/admin/promotions/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

// ===== WISHLIST =====
export async function fetchWishlist(token) {
  // Currently using localStorage mock as backend endpoint is not available
  return JSON.parse(localStorage.getItem('mock_wishlist') || '[]');
}

export async function addToWishlist(token, productId) {
  let list = JSON.parse(localStorage.getItem('mock_wishlist') || '[]');
  if (!list.includes(productId)) list.push(productId);
  localStorage.setItem('mock_wishlist', JSON.stringify(list));
  return list;
}

export async function removeFromWishlist(token, productId) {
  let list = JSON.parse(localStorage.getItem('mock_wishlist') || '[]');
  list = list.filter(id => id !== productId);
  localStorage.setItem('mock_wishlist', JSON.stringify(list));
  return list;
}

// ===== CATEGORIES API =====

export async function fetchCategories() {
  try {
    const data = await apiCall('/categories');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("Failed to fetch categories:", error);
    return [];
  }
}

export const createCategory = async (token, categoryData) => {
  const data = await apiCall("/categories", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(categoryData),
  });
  return data;
};

export const updateCategory = async (token, id, categoryData) => {
  const data = await apiCall(`/categories/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(categoryData),
  });
  return data;
};

export const deleteCategory = async (token, id) => {
  await apiCall(`/categories/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  return true;
};

// ===== SIZE CLASSES API =====
export async function fetchSizeClasses() {
  try {
    const data = await apiCall('/size-classes');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("Failed to fetch size classes:", error);
    return [];
  }
}

export const createSizeClass = async (token, sizeClassData) => {
  return await apiCall("/size-classes", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(sizeClassData),
  });
};

export const updateSizeClass = async (token, id, sizeClassData) => {
  return await apiCall(`/size-classes/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(sizeClassData),
  });
};

export const deleteSizeClass = async (token, id) => {
  return await apiCall(`/size-classes/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
};

// ===== REVIEWS =====
export async function fetchTopReviews() {
  // Currently returning mock reviews as backend endpoint is not available
  return [
    { id: 1, authorName: "Sarah M.", text: "The quality is absolutely amazing. Highly recommended!", rating: 5, date: "2023-11-15" },
    { id: 2, authorName: "Emily R.", text: "Perfect fit and so comfortable. Will buy again.", rating: 5, date: "2023-12-02" },
    { id: 3, authorName: "Jessica T.", text: "Beautiful design and great customer service.", rating: 4, date: "2024-01-10" }
  ];
}

