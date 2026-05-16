import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  FileText,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuthStore } from "../../store/authStore";
import { fetchAdminStats } from "../../lib/api";

// ── Fallback data (used when API is completely empty) ───────────────────────────
const MOCK_REVENUE = [];
const MOCK_STATUS = [];

const MOCK_STATS = {
  totalProducts: 0,
  totalOrders: 0,
  revenue: 0,
  pendingOrders: 0,
  totalCustomers: 0,
  revenueChange: 0,
  ordersChange: 0,
  customersChange: 0,
  recentOrders: [],
  statusData: [],
};

const STATUS_COLORS = {
  pending: "text-yellow-400 bg-yellow-400/10",
  processing: "text-blue-400 bg-blue-400/10",
  shipped: "text-[#d4a59a] bg-[#d4a59a]/10",
  delivered: "text-green-400 bg-green-400/10",
  cancelled: "text-red-400 bg-red-400/10",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111] border border-[#d4a59a]/20 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm md:text-sm font-['Montserrat'] shadow-xl rounded-sm">
        <p className="text-[#9a8f8c] mb-1">{label}</p>
        <p className="text-[#d4a59a] font-semibold text-sm sm:text-lg md:text-base">
          Rs. {payload[0]?.value?.toLocaleString()}
        </p>
        <p className="text-[#f5f0ee]">{payload[1]?.value} orders</p>
      </div>
    );
  }
  return null;
};

export function AdminDashboard() {
  const [liveStats, setLiveStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await fetchAdminStats(token);
        setLiveStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadDashboard();
    }
  }, [token]);

  const stats = liveStats || MOCK_STATS;
  const recentOrders = liveStats?.recentOrders || [];

  // Mapped Weekly Revenue from API
  const weeklyRevenueData = liveStats?.weeklyRevenue?.length
    ? liveStats.weeklyRevenue.map(w => ({
      week: new Date(w.week_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      revenue: w.revenue
    }))
    : MOCK_REVENUE;

  const STAT_CARDS = [
    {
      label: "Total Revenue",
      value: `Rs. ${Number(stats.totalRevenue || 0).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
      change: stats.revenueChange ?? 18.4,
      link: "/admin/analytics",
      color: "text-[#d4a59a]",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders || 0,
      icon: ShoppingBag,
      change: stats.ordersChange ?? 12.1,
      link: "/admin/orders",
      color: "text-blue-400",
    },
    {
      label: "Products",
      value: stats.totalProducts || 0,
      icon: Package,
      change: null,
      link: "/admin/products",
      color: "text-emerald-400",
    },
    {
      label: "Customers",
      value: stats.totalCustomers ?? 184,
      icon: Users,
      change: stats.customersChange ?? 9.3,
      link: "/admin/customers",
      color: "text-purple-400",
    },
    {
      label: "Pending Orders",
      value: stats.pendingOrders || 0,
      icon: Clock,
      change: null,
      link: "/admin/orders",
      color: "text-yellow-400",
    },
  ];

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-[1400px] mx-auto w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 md:mb-10">
        <h1 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl md:text-5xl font-medium text-[#f5f0ee]">
          Dashboard
        </h1>
        <p className="text-[#9a8f8c] text-xs sm:text-sm font-['Montserrat'] mt-1 sm:mt-2">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Stat Cards - Responsive Grid (2 columns on mobile) */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5 mb-8 w-full">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 sm:h-32 bg-[#141414] animate-pulse rounded-sm" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5 mb-8 md:mb-10 w-full">
          {STAT_CARDS.map((card, idx) => (
            <Link
              key={card.label}
              to={card.link}
              className={`border border-[#d4a59a]/15 md:border-[#d4a59a]/20 p-4 sm:p-5 md:p-6 hover:border-[#d4a59a]/40 transition-all group bg-[#0d0d0d] rounded-sm shadow-sm flex flex-col justify-between ${idx === 4 ? "col-span-2 sm:col-span-1" : "" // Last card spans full width on very small mobile
                }`}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <card.icon size={18} className={`sm:w-5 sm:h-5 ${card.color}`} strokeWidth={1.5} />
                <ArrowRight
                  size={14} className="sm:w-4 sm:h-4 text-[#9a8f8c]/40 group-hover:text-[#d4a59a] transition-colors"
                />
              </div>
              <p className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl md:text-4xl font-medium text-[#f5f0ee] mb-1 truncate w-full">
                {card.value}
              </p>
              <p className="text-[9px] sm:text-[10px] md:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase font-['Montserrat'] text-[#9a8f8c] mb-2 sm:mb-3 font-semibold truncate w-full">
                {card.label}
              </p>
              {card.change !== null && (
                <div
                  className={`flex items-center gap-1 text-[9px] sm:text-[10px] md:text-[11px] font-['Montserrat'] font-medium mt-auto ${card.change >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                >
                  {card.change >= 0 ? (
                    <ArrowUpRight size={12} className="sm:w-3.5 sm:h-3.5 shrink-0" />
                  ) : (
                    <ArrowDownRight size={12} className="sm:w-3.5 sm:h-3.5 shrink-0" />
                  )}
                  <span className="truncate">{Math.abs(card.change)}% vs last mth</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 mb-8 md:mb-10 w-full">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 border border-[#d4a59a]/15 md:border-[#d4a59a]/20 bg-[#0d0d0d] p-4 sm:p-5 md:p-8 rounded-sm min-w-0 w-full">
          <div className="flex flex-wrap items-center justify-between mb-5 sm:mb-6 md:mb-8 gap-3">
            <div>
              <p className="text-xs sm:text-sm tracking-[0.2em] uppercase font-['Montserrat'] font-semibold text-[#f5f0ee]">
                Revenue Overview
              </p>
              <p className="text-[10px] sm:text-xs font-['Montserrat'] text-[#9a8f8c] mt-1">
                Last 12 weeks
              </p>
            </div>
            <Link
              to="/admin/analytics"
              className="text-[10px] sm:text-xs tracking-[0.15em] uppercase font-['Montserrat'] text-[#9a8f8c] hover:text-[#d4a59a] transition-colors flex items-center gap-1 font-semibold"
            >
              Full Report <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5" />
            </Link>
          </div>
          <div className="w-full -ml-4 sm:-ml-2 md:ml-0">
            <ResponsiveContainer width="100%" height={250} className="sm:h-[280px]">
              <AreaChart
                data={weeklyRevenueData}
                margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="adminDashboardRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4a59a" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#d4a59a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#d4a59a10" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fill: "#9a8f8c", fontSize: window.innerWidth < 640 ? 10 : 12, fontFamily: "Montserrat" }}
                  axisLine={false}
                  tickLine={false}
                  interval={window.innerWidth < 768 ? 3 : 2}
                />
                <YAxis
                  tick={{ fill: "#9a8f8c", fontSize: window.innerWidth < 640 ? 10 : 12, fontFamily: "Montserrat" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`}
                  width={window.innerWidth < 640 ? 40 : 50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#d4a59a"
                  strokeWidth={2.5}
                  fill="url(#adminDashboardRevenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by Status Pie */}
        <div className="border border-[#d4a59a]/15 md:border-[#d4a59a]/20 bg-[#0d0d0d] p-4 sm:p-5 md:p-8 rounded-sm w-full min-w-0">
          <p className="text-xs sm:text-sm tracking-[0.2em] uppercase font-['Montserrat'] font-semibold text-[#f5f0ee] mb-1">
            Orders by Status
          </p>
          <p className="text-[10px] sm:text-xs font-['Montserrat'] text-[#9a8f8c] mb-5 sm:mb-6 md:mb-8">
            All time
          </p>
          <ResponsiveContainer width="100%" height={180} className="sm:h-[220px]">
            <PieChart>
              <Pie
                data={stats.statusData || MOCK_STATUS}
                cx="50%"
                cy="50%"
                innerRadius={window.innerWidth < 640 ? 50 : 65}
                outerRadius={window.innerWidth < 640 ? 75 : 95}
                paddingAngle={2}
                dataKey="value"
              >
                {(stats.statusData || MOCK_STATUS).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} opacity={0.85} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#111",
                  border: "1px solid rgba(212,165,154,0.2)",
                  fontFamily: "Montserrat",
                  fontSize: window.innerWidth < 640 ? 12 : 14,
                  color: "#f5f0ee",
                }}
                formatter={(value) => [`${value}%`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 sm:space-y-2.5 mt-4 sm:mt-6 w-full">
            {(stats.statusData || MOCK_STATUS).map((s) => (
              <div key={s.name} className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                    style={{ background: s.color }}
                  />
                  <span className="text-[10px] sm:text-xs font-['Montserrat'] text-[#9a8f8c] font-medium truncate max-w-[100px] sm:max-w-none">
                    {s.name}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs font-['Montserrat'] text-[#f5f0ee] font-semibold">
                  {s.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders + Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 w-full">

        {/* Recent orders */}
        <div className="lg:col-span-2 border border-[#d4a59a]/15 md:border-[#d4a59a]/20 bg-[#0d0d0d] rounded-sm w-full min-w-0">
          <div className="flex items-center justify-between px-4 py-4 sm:px-5 sm:py-5 md:px-8 md:py-6 border-b border-[#d4a59a]/10 md:border-[#d4a59a]/15">
            <p className="text-xs sm:text-sm tracking-[0.2em] uppercase font-['Montserrat'] font-semibold text-[#f5f0ee]">
              Recent Orders
            </p>
            <Link
              to="/admin/orders"
              className="text-[10px] sm:text-xs tracking-[0.15em] uppercase font-['Montserrat'] text-[#9a8f8c] hover:text-[#d4a59a] font-semibold transition-colors flex items-center gap-1"
            >
              View All <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-[#d4a59a]/10 overflow-x-auto">
            <div className="min-w-[400px]">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-row items-center justify-between px-4 py-3.5 sm:px-5 sm:py-4 md:px-8 md:py-5 hover:bg-[#f5f0ee]/5 transition-colors gap-3 w-full"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-xs sm:text-sm font-['Montserrat'] text-[#f5f0ee] font-semibold truncate">
                      #{String(order.id).padStart(5, '0')}
                    </p>
                    <p className="text-[10px] sm:text-xs text-[#9a8f8c] font-['Montserrat'] mt-1 truncate">
                      {order.userEmail} · {new Date(order.created_at || order.createdAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-3 sm:gap-4 shrink-0">
                    <span
                      className={`text-[9px] sm:text-[10px] md:text-xs tracking-[0.15em] uppercase font-['Montserrat'] font-bold px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-sm ${STATUS_COLORS[order.status] || STATUS_COLORS.pending
                        }`}
                    >
                      {order.status}
                    </span>
                    <span className="text-xs sm:text-sm font-['Montserrat'] text-[#f5f0ee] font-semibold whitespace-nowrap">
                      Rs. {Number(order.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts & Actions */}
        <div className="border border-[#d4a59a]/15 md:border-[#d4a59a]/20 bg-[#0d0d0d] rounded-sm w-full min-w-0">
          <div className="px-4 py-4 sm:px-5 sm:py-5 md:px-8 md:py-6 border-b border-[#d4a59a]/10 md:border-[#d4a59a]/15">
            <p className="text-xs sm:text-sm tracking-[0.2em] uppercase font-['Montserrat'] font-semibold text-[#f5f0ee]">
              Alerts
            </p>
          </div>
          <div className="p-4 sm:p-5 md:p-8 space-y-3 sm:space-y-4 md:space-y-5 w-full">
            {/* Inventory Alerts */}
            {stats.lowStockVariants && stats.lowStockVariants.length > 0 ? (
              stats.lowStockVariants.map((variant, i) => (
                <Link
                  key={`${variant.id}-${variant.color}-${variant.size}`}
                  to="/admin/inventory"
                  className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 hover:bg-[#f5f0ee]/5 transition-colors group rounded-sm border border-[#d4a59a]/5 md:border-[#d4a59a]/10 w-full"
                >
                  <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 mt-1.5 ${variant.stock === 0 ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] sm:text-xs md:text-[13px] font-['Montserrat'] font-medium ${variant.stock === 0 ? 'text-red-400' : 'text-yellow-400'} leading-snug truncate w-full`}>
                      {variant.stock === 0 ? 'Out of Stock' : 'Low Stock'}: {variant.name}
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-[#9a8f8c] font-['Montserrat'] uppercase tracking-wider mt-0.5 truncate w-full">
                      {variant.color} · Size {variant.size} ({variant.stock} left)
                    </p>
                  </div>
                  <ArrowRight
                    size={12} className="sm:w-3.5 sm:h-3.5 text-[#9a8f8c]/40 group-hover:text-[#9a8f8c] shrink-0 mt-1 transition-colors"
                  />
                </Link>
              ))
            ) : (
              <div className="py-6 sm:py-8 text-center border border-dashed border-[#d4a59a]/10 rounded-sm w-full">
                <p className="text-[10px] sm:text-xs text-[#9a8f8c] font-['Montserrat'] uppercase tracking-widest">All Stock Levels Optimal</p>
              </div>
            )}

            {/* General System Alerts */}
            {[
              {
                msg: `${stats.pendingOrders} orders awaiting processing`,
                color: "text-blue-400",
                dot: "bg-blue-400",
                link: "/admin/orders",
                show: stats.pendingOrders > 0
              }
            ].filter(a => a.show).map((alert, i) => (
              <Link
                key={`sys-${i}`}
                to={alert.link}
                className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 hover:bg-[#f5f0ee]/5 transition-colors group rounded-sm border border-[#d4a59a]/5 md:border-[#d4a59a]/10 w-full"
              >
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 mt-1.5 ${alert.dot}`} />
                <p className={`text-[10px] sm:text-xs md:text-sm font-['Montserrat'] font-medium ${alert.color} leading-relaxed truncate flex-1`}>
                  {alert.msg}
                </p>
                <ArrowRight
                  size={12} className="sm:w-3.5 sm:h-3.5 text-[#9a8f8c]/40 group-hover:text-[#9a8f8c] shrink-0 mt-0.5 transition-colors"
                />
              </Link>
            ))}

            <div className="border-t border-[#d4a59a]/15 pt-4 sm:pt-5 mt-4 sm:mt-5 w-full">
              <p className="text-[10px] sm:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-semibold text-[#9a8f8c] mb-3 sm:mb-4">
                Quick Actions
              </p>
              <div className="space-y-2 sm:space-y-3 w-full">
                <Link
                  to="/admin/products"
                  className="flex items-center gap-2.5 sm:gap-3 w-full py-3 sm:py-3.5 px-3 sm:px-4 border border-[#d4a59a]/20 text-[10px] sm:text-xs md:text-sm font-['Montserrat'] font-semibold text-[#f5f0ee] hover:text-[#d4a59a] hover:border-[#d4a59a]/50 transition-colors rounded-sm bg-[#111]"
                >
                  <Package size={14} className="sm:w-4 sm:h-4" strokeWidth={1.5} />
                  Add New Product
                </Link>
                <Link
                  to="/admin/content"
                  className="flex items-center gap-2.5 sm:gap-3 w-full py-3 sm:py-3.5 px-3 sm:px-4 border border-[#d4a59a]/20 text-[10px] sm:text-xs md:text-sm font-['Montserrat'] font-semibold text-[#f5f0ee] hover:text-[#d4a59a] hover:border-[#d4a59a]/50 transition-colors rounded-sm bg-[#111]"
                >
                  <FileText size={14} className="sm:w-4 sm:h-4" strokeWidth={1.5} />
                  Edit Homepage
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}