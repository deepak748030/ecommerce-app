import { useState, useEffect } from 'react'
import {
    Users, UserCheck, UserX, Store, TrendingUp, ShieldCheck, Clock,
    ShoppingCart, DollarSign, Calendar, CalendarCheck, Filter
} from 'lucide-react'
import { getDashboardAnalytics, DashboardAnalytics } from '../lib/api'
import { cn } from '../lib/utils'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts'

type FilterType = 'today' | 'weekly' | 'monthly' | 'yearly'

interface StatCardProps {
    title: string
    value: number
    icon: React.ElementType
    color: string
    isLoading: boolean
    prefix?: string
}

function StatCardSkeleton() {
    return (
        <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-start justify-between">
                <div>
                    <div className="h-3 w-20 skeleton rounded mb-2" />
                    <div className="h-6 w-16 skeleton rounded" />
                </div>
                <div className="h-8 w-8 skeleton rounded-lg" />
            </div>
        </div>
    )
}

function StatCard({ title, value, icon: Icon, color, isLoading, prefix }: StatCardProps) {
    if (isLoading) return <StatCardSkeleton />

    return (
        <div className="bg-card border border-border rounded-lg p-3 transition-all hover:shadow-md hover:border-primary/30">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-muted-foreground font-medium">{title}</p>
                    <p className="text-xl font-bold text-foreground mt-0.5">
                        {prefix}{value.toLocaleString()}
                    </p>
                </div>
                <div className={cn('p-2 rounded-lg', color)}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>
        </div>
    )
}

function ChartSkeleton({ height = 300 }: { height?: number }) {
    return (
        <div className="bg-card border border-border rounded-lg p-4">
            <div className="h-4 w-32 skeleton rounded mb-4" />
            <div className="skeleton rounded" style={{ height: `${height}px` }} />
        </div>
    )
}

const CHART_COLORS = {
    primary: 'hsl(262, 83%, 66%)',
    success: 'hsl(142, 76%, 36%)',
    warning: 'hsl(45, 93%, 47%)',
    destructive: 'hsl(0, 84%, 60%)',
    accent: 'hsl(262, 83%, 66%)',
    muted: 'hsl(220, 9%, 46%)'
}

export function DashboardPage() {
    const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [filter, setFilter] = useState<FilterType>('monthly')

    useEffect(() => {
        fetchAnalytics()
    }, [filter])

    const fetchAnalytics = async () => {
        setIsLoading(true)
        try {
            const response = await getDashboardAnalytics(filter)
            if (response.success) {
                setAnalytics(response.response)
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch analytics')
        } finally {
            setIsLoading(false)
        }
    }

    const filterOptions: { value: FilterType; label: string }[] = [
        { value: 'today', label: 'Today' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' }
    ]

    const overviewStats = [
        {
            title: 'Total Users',
            value: analytics?.overview.totalUsers || 0,
            icon: Users,
            color: 'bg-primary/10 text-primary',
        },
        {
            title: 'Active Users',
            value: analytics?.overview.activeUsers || 0,
            icon: UserCheck,
            color: 'bg-success/10 text-success',
        },
        {
            title: 'Blocked Users',
            value: analytics?.overview.blockedUsers || 0,
            icon: UserX,
            color: 'bg-destructive/10 text-destructive',
        },
        {
            title: 'Total Vendors',
            value: analytics?.overview.totalVendors || 0,
            icon: Store,
            color: 'bg-primary/10 text-primary',
        },
        {
            title: 'Verified Vendors',
            value: analytics?.overview.verifiedVendors || 0,
            icon: ShieldCheck,
            color: 'bg-success/10 text-success',
        },
        {
            title: 'Pending KYC',
            value: analytics?.overview.pendingKYC || 0,
            icon: Clock,
            color: 'bg-warning/10 text-warning',
        },
        {
            title: 'Total Bookings',
            value: analytics?.overview.totalBookings || 0,
            icon: ShoppingCart,
            color: 'bg-primary/10 text-primary',
        },
        {
            title: 'Total Revenue',
            value: analytics?.overview.totalRevenue || 0,
            icon: DollarSign,
            color: 'bg-success/10 text-success',
            prefix: '₹'
        },
        {
            title: 'Total Events',
            value: analytics?.overview.totalEvents || 0,
            icon: Calendar,
            color: 'bg-accent/10 text-accent',
        },
        {
            title: 'Active Events',
            value: analytics?.overview.activeEvents || 0,
            icon: CalendarCheck,
            color: 'bg-success/10 text-success',
        },
    ]

    const periodStats = [
        {
            title: `New Users (${filter})`,
            value: analytics?.periodStats.users || 0,
            icon: TrendingUp,
            color: 'bg-accent/10 text-accent',
        },
        {
            title: `New Vendors (${filter})`,
            value: analytics?.periodStats.vendors || 0,
            icon: TrendingUp,
            color: 'bg-accent/10 text-accent',
        },
        {
            title: `New Bookings (${filter})`,
            value: analytics?.periodStats.bookings || 0,
            icon: ShoppingCart,
            color: 'bg-primary/10 text-primary',
        },
        {
            title: `Revenue (${filter})`,
            value: analytics?.periodStats.revenue || 0,
            icon: DollarSign,
            color: 'bg-success/10 text-success',
            prefix: '₹'
        },
    ]

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
                            {entry.name}: {entry.value.toLocaleString()}
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    const PieTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
                    <p className="text-sm font-medium" style={{ color: payload[0].payload.color }}>
                        {payload[0].name}: {payload[0].value}
                    </p>
                </div>
            )
        }
        return null
    }

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Welcome to Plenify Admin
                    </p>
                </div>

                {/* Filter Buttons */}
                <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
                    <Filter className="w-4 h-4 text-muted-foreground ml-2" />
                    {filterOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setFilter(option.value)}
                            className={cn(
                                'px-3 py-1.5 text-xs font-medium rounded transition-all',
                                filter === option.value
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
                    {error}
                </div>
            )}

            {/* Period Stats */}
            <div className="mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                    Period Statistics
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {periodStats.map((stat) => (
                        <StatCard
                            key={stat.title}
                            title={stat.title}
                            value={stat.value}
                            icon={stat.icon}
                            color={stat.color}
                            isLoading={isLoading}
                            prefix={(stat as any).prefix}
                        />
                    ))}
                </div>
            </div>

            {/* Overview Stats */}
            <div className="mb-6">
                <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                    Overview
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {overviewStats.map((stat) => (
                        <StatCard
                            key={stat.title}
                            title={stat.title}
                            value={stat.value}
                            icon={stat.icon}
                            color={stat.color}
                            isLoading={isLoading}
                            prefix={(stat as any).prefix}
                        />
                    ))}
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {/* User & Vendor Growth Chart */}
                {isLoading ? (
                    <ChartSkeleton height={280} />
                ) : (
                    <div className="bg-card border border-border rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-foreground mb-4">User & Vendor Growth</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={analytics?.charts.userGrowth || []}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorVendors" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Area
                                    type="monotone"
                                    dataKey="users"
                                    name="Users"
                                    stroke={CHART_COLORS.primary}
                                    fillOpacity={1}
                                    fill="url(#colorUsers)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="vendors"
                                    name="Vendors"
                                    stroke={CHART_COLORS.success}
                                    fillOpacity={1}
                                    fill="url(#colorVendors)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Revenue Trend Chart */}
                {isLoading ? (
                    <ChartSkeleton height={280} />
                ) : (
                    <div className="bg-card border border-border rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-foreground mb-4">Revenue Trend</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={analytics?.charts.revenueTrend || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="revenue" name="Revenue (₹)" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Bookings Trend & Pie Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Bookings Trend */}
                {isLoading ? (
                    <ChartSkeleton height={250} />
                ) : (
                    <div className="bg-card border border-border rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-foreground mb-4">Bookings Trend</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={analytics?.charts.bookingsTrend || []}>
                                <defs>
                                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="bookings"
                                    name="Bookings"
                                    stroke={CHART_COLORS.primary}
                                    fillOpacity={1}
                                    fill="url(#colorBookings)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Booking Status Pie Chart */}
                {isLoading ? (
                    <ChartSkeleton height={250} />
                ) : (
                    <div className="bg-card border border-border rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-foreground mb-4">Booking Status</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={(analytics?.charts.bookingStatusDistribution || []) as any}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {(analytics?.charts.bookingStatusDistribution || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<PieTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Vendor KYC Pie Chart */}
                {isLoading ? (
                    <ChartSkeleton height={250} />
                ) : (
                    <div className="bg-card border border-border rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-foreground mb-4">Vendor KYC Status</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={(analytics?.charts.vendorKycDistribution || []) as any}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {(analytics?.charts.vendorKycDistribution || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<PieTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    )
}