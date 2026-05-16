import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { TrendingUp, ShoppingBag, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { fetchAdminStats } from "../../lib/api";

const WEEKLY_REVENUE_FALLBACK = [];
const CATEGORY_REVENUE_FALLBACK = [];
const TOP_PRODUCTS_FALLBACK = [];
const STATUS_DATA_FALLBACK = [];

const CT = ({ active, payload, label }) =>
  active && payload?.length ? (
    <div className="bg-[#111] border border-[#d4a59a]/20 px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-4 text-[10px] sm:text-xs md:text-sm font-['Montserrat'] shadow-lg rounded-sm">
      <p className="text-[#9a8f8c] mb-1 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "#d4a59a" }} className="font-semibold">
          {p.name}: {p.name === "revenue" ? `Rs. ${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  ) : null;

export function AdminAnalytics() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchAdminStats(token).then((data) => {
        setStats(data);
      }).catch(err => {
        console.error("Failed to fetch analytics:", err);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [token]);

  const weeklyRevenueData = stats?.weeklyRevenue?.length
    ? stats.weeklyRevenue.map(w => ({ week: new Date(w.week_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), revenue: w.revenue }))
    : WEEKLY_REVENUE_FALLBACK;

  const totalRevenue = stats?.totalRevenue || 0;
  const totalOrders = stats?.totalOrders || 0;
  const totalCustomers = stats?.totalCustomers || 0;

  const categoryRevenue = stats?.categoryRevenue || CATEGORY_REVENUE_FALLBACK;
  const statusData = stats?.statusData || STATUS_DATA_FALLBACK;
  const topProducts = stats?.topProducts || TOP_PRODUCTS_FALLBACK;

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-[1400px] mx-auto w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 md:mb-10">
        <h1 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl md:text-5xl font-medium text-[#f5f0ee]">
          Analytics
        </h1>
        <p className="text-[#9a8f8c] text-xs sm:text-sm font-['Montserrat'] mt-1 sm:mt-2">
          Performance overview · Last 15 weeks
        </p>
      </div>

      {/* KPI Cards (2 columns on mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-5 mb-6 md:mb-10 w-full">
        {[
          { label: "Total Revenue", value: `Rs. ${totalRevenue.toLocaleString("en-GB")}`, change: `${stats?.revenueChange > 0 ? '+' : ''}${stats?.revenueChange ?? 0}%`, icon: TrendingUp, color: "text-[#d4a59a]" },
          { label: "Total Orders", value: totalOrders, change: `${stats?.ordersChange > 0 ? '+' : ''}${stats?.ordersChange ?? 0}%`, icon: ShoppingBag, color: "text-blue-400" },
          { label: "New Customers", value: totalCustomers, change: `${stats?.customersChange > 0 ? '+' : ''}${stats?.customersChange ?? 0}%`, icon: Users, color: "text-purple-400" },
        ].map((k, idx) => (
          <div key={k.label} className={`border border-[#d4a59a]/15 md:border-[#d4a59a]/20 bg-[#0d0d0d] p-4 sm:p-5 md:p-6 rounded-sm shadow-sm md:shadow-md flex flex-col justify-between ${idx === 2 ? 'col-span-2 sm:col-span-1' : ''}`}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <k.icon size={18} className={`sm:w-5 sm:h-5 ${k.color}`} strokeWidth={1.5} />
              <span className={`flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs font-['Montserrat'] font-semibold ${k.change.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                {k.change.startsWith('-') ? <ArrowDownRight size={12} className="sm:w-3.5 sm:h-3.5 shrink-0" /> : <ArrowUpRight size={12} className="sm:w-3.5 sm:h-3.5 shrink-0" />}
                <span className="truncate">{k.change.replace('-', '')}</span>
              </span>
            </div>
            <p className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl md:text-4xl font-medium text-[#f5f0ee] mb-1 truncate w-full">
              {k.value}
            </p>
            <p className="text-[9px] sm:text-[10px] md:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase font-['Montserrat'] text-[#9a8f8c] font-semibold mt-1 truncate w-full">
              {k.label}
            </p>
          </div>
        ))}
      </div>

      {/* Revenue + Orders line chart */}
      <div className="border border-[#d4a59a]/15 md:border-[#d4a59a]/20 bg-[#0d0d0d] p-4 sm:p-5 md:p-8 mb-6 md:mb-8 rounded-sm shadow-sm md:shadow-md w-full min-w-0">
        <p className="text-xs sm:text-sm tracking-[0.2em] uppercase font-['Montserrat'] font-semibold text-[#f5f0ee] mb-1">
          Revenue & Orders Over Time
        </p>
        <p className="text-[10px] sm:text-xs font-['Montserrat'] text-[#9a8f8c] mb-4 sm:mb-6 md:mb-8">Weekly breakdown</p>
        <div className="w-full -ml-4 sm:-ml-2 md:ml-0">
          <ResponsiveContainer width="100%" height={240} className="sm:h-[300px] md:h-[350px]">
            <LineChart data={weeklyRevenueData} margin={{ top: 0, right: window.innerWidth < 640 ? 5 : 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4a59a10" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: "#9a8f8c", fontSize: window.innerWidth < 640 ? 10 : 12, fontFamily: "Montserrat" }} axisLine={false} tickLine={false} interval={window.innerWidth < 768 ? 3 : 2} />
              <YAxis yAxisId="rev" tick={{ fill: "#9a8f8c", fontSize: window.innerWidth < 640 ? 10 : 12, fontFamily: "Montserrat" }} axisLine={false} tickLine={false} tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`} width={window.innerWidth < 640 ? 40 : 50} />
              <YAxis yAxisId="ord" orientation="right" tick={{ fill: "#9a8f8c", fontSize: window.innerWidth < 640 ? 10 : 12, fontFamily: "Montserrat" }} axisLine={false} tickLine={false} width={window.innerWidth < 640 ? 20 : 30} />
              <Tooltip content={<CT />} />
              <Line yAxisId="rev" type="monotone" dataKey="revenue" name="revenue" stroke="#d4a59a" strokeWidth={2.5} dot={false} />
              <Line yAxisId="ord" type="monotone" dataKey="orders" name="orders" stroke="#60a5fa" strokeWidth={2} dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category breakdown + Status pie */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5 md:gap-8 mb-6 md:mb-8 w-full">
        {/* Category bar chart */}
        <div className="md:col-span-3 border border-[#d4a59a]/15 md:border-[#d4a59a]/20 bg-[#0d0d0d] p-4 sm:p-5 md:p-8 rounded-sm shadow-sm md:shadow-md w-full min-w-0">
          <p className="text-xs sm:text-sm tracking-[0.2em] uppercase font-['Montserrat'] font-semibold text-[#f5f0ee] mb-1">
            Revenue by Category
          </p>
          <p className="text-[10px] sm:text-xs font-['Montserrat'] text-[#9a8f8c] mb-4 sm:mb-6 md:mb-8">All time</p>
          <div className="w-full -ml-4 sm:-ml-2 md:ml-0">
            <ResponsiveContainer width="100%" height={200} className="sm:h-[220px] md:h-[250px]">
              <BarChart data={categoryRevenue} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d4a59a10" vertical={false} />
                <XAxis dataKey="category" tick={{ fill: "#9a8f8c", fontSize: window.innerWidth < 640 ? 9 : 12, fontFamily: "Montserrat" }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fill: "#9a8f8c", fontSize: window.innerWidth < 640 ? 10 : 12, fontFamily: "Montserrat" }} axisLine={false} tickLine={false} tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`} width={window.innerWidth < 640 ? 40 : 50} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid rgba(212,165,154,0.2)", fontFamily: "Montserrat", fontSize: window.innerWidth < 640 ? 11 : 13, color: "#f5f0ee", borderRadius: "4px" }}
                  formatter={(v) => [`Rs. ${v.toLocaleString()}`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill="#d4a59a" opacity={0.85} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order status pie */}
        <div className="md:col-span-2 border border-[#d4a59a]/15 md:border-[#d4a59a]/20 bg-[#0d0d0d] p-4 sm:p-5 md:p-8 rounded-sm shadow-sm md:shadow-md w-full min-w-0">
          <p className="text-xs sm:text-sm tracking-[0.2em] uppercase font-['Montserrat'] font-semibold text-[#f5f0ee] mb-1">
            Order Status
          </p>
          <p className="text-[10px] sm:text-xs font-['Montserrat'] text-[#9a8f8c] mb-4 sm:mb-5 md:mb-8">Distribution</p>
          <ResponsiveContainer width="100%" height={180} className="sm:h-[200px]">
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={window.innerWidth < 640 ? 50 : 60} outerRadius={window.innerWidth < 640 ? 75 : 85} paddingAngle={2} dataKey="value">
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.85} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(212,165,154,0.2)", fontFamily: "Montserrat", fontSize: window.innerWidth < 640 ? 11 : 13, color: "#f5f0ee", borderRadius: "4px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 sm:space-y-3 mt-4 md:mt-6 w-full">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-[10px] sm:text-xs md:text-sm font-['Montserrat'] text-[#9a8f8c] font-medium truncate max-w-[100px] sm:max-w-none">{s.name}</span>
                </div>
                <span className="text-[10px] sm:text-xs md:text-sm font-['Montserrat'] font-semibold text-[#f5f0ee]">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="border border-[#d4a59a]/15 md:border-[#d4a59a]/20 bg-[#0d0d0d] rounded-sm overflow-hidden shadow-sm md:shadow-md w-full">
        <div className="px-4 py-4 sm:px-5 sm:py-5 md:px-8 md:py-6 border-b border-[#d4a59a]/15 md:border-[#d4a59a]/20">
          <p className="text-xs sm:text-sm tracking-[0.2em] uppercase font-['Montserrat'] font-semibold text-[#f5f0ee]">
            Top Products
          </p>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-[#d4a59a]/15 w-full">
          {topProducts.map((p, i) => (
            <div key={i} className="px-4 py-4 sm:px-5 sm:py-5 w-full">
              <div className="flex justify-between items-start mb-2 gap-2">
                <p className="text-xs sm:text-sm font-['Montserrat'] font-semibold text-[#f5f0ee] flex-1 line-clamp-2 pr-2">{p.name}</p>
                <p className="text-xs sm:text-sm font-['Montserrat'] font-semibold text-[#d4a59a] shrink-0">Rs. {p.revenue.toLocaleString("en-GB")}</p>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-['Montserrat'] text-[#9a8f8c] bg-[#1a1a1a] px-2 py-1 rounded-sm border border-[#d4a59a]/10">
                  {p.category}
                </span>
                <span className="text-[10px] sm:text-xs font-['Montserrat'] text-[#9a8f8c]">{p.sales} Units Sold</span>
              </div>
              {/* Bar indicator */}
              <div className="w-full h-1.5 bg-[#1a1a1a] overflow-hidden rounded-full mt-2">
                <div
                  className="h-full bg-[#d4a59a]/70 rounded-full"
                  style={{ width: topProducts.length > 0 && topProducts[0].revenue > 0 ? `${(p.revenue / topProducts[0].revenue) * 100}%` : "0%" }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[#d4a59a]/20 bg-[#0a0a0a]">
                {["Product", "Category", "Units Sold", "Revenue", ""].map((h) => (
                  <th key={h} className="px-5 lg:px-8 py-5 text-left text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d4a59a]/10">
              {topProducts.map((p, i) => (
                <tr key={i} className="hover:bg-[#d4a59a]/5 transition-colors">
                  <td className="px-5 lg:px-8 py-4 text-sm font-['Montserrat'] font-medium text-[#f5f0ee] max-w-[200px] truncate">{p.name}</td>
                  <td className="px-5 lg:px-8 py-4">
                    <span className="text-xs tracking-[0.15em] uppercase font-['Montserrat'] font-semibold text-[#9a8f8c]">{p.category}</span>
                  </td>
                  <td className="px-5 lg:px-8 py-4 text-sm font-['Montserrat'] font-medium text-[#f5f0ee]">{p.sales}</td>
                  <td className="px-5 lg:px-8 py-4 text-sm font-['Montserrat'] font-semibold text-[#d4a59a]">
                    Rs. {p.revenue.toLocaleString("en-GB")}
                  </td>
                  <td className="px-5 lg:px-8 py-4 w-40 lg:w-56">
                    {/* Bar indicator */}
                    <div className="w-full h-1.5 bg-[#1a1a1a] overflow-hidden rounded-full">
                      <div
                        className="h-full bg-[#d4a59a]/60 rounded-full"
                        style={{ width: topProducts.length > 0 && topProducts[0].revenue > 0 ? `${(p.revenue / topProducts[0].revenue) * 100}%` : "0%" }}
                      />
                    </div>
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