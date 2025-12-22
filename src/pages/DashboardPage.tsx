import { useState, useEffect } from 'react'
import {
    Users, UserCheck, UserX, TrendingUp, Filter, RefreshCw
} from 'lucide-react'
import { getDashboardAnalytics, DashboardAnalytics } from '../lib/api'
import { cn } from '../lib/utils'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend
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
        <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start justify-between">
                <div className="space-y-3">
                    <div className="h-4 w-24 skeleton rounded" />
                    <div className="h-8 w-20 skeleton rounded" />
                </div>
                <div className="h-12 w-12 skeleton rounded-xl" />
            </div>
        </div>
    )
}

function StatCard({ title, value, icon: Icon, color, isLoading, prefix }: StatCardProps) {
    if (isLoading) return <StatCardSkeleton />

    return (
        <div className="bg-card border border-border rounded-xl p-6 transition-all hover:shadow-lg hover:border-primary/30">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-muted-foreground font-medium">{title}</p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                        {prefix}{value.toLocaleString()}
                    </p>
                </div>
                <div className={cn('p-3 rounded-xl', color)}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    )
}

function ChartSkeleton({ height = 350 }: { height?: number }) {
    return (
        <div className="bg-card border border-border rounded-xl p-6">
            <div className="h-5 w-40 skeleton rounded mb-6" />
            <div className="skeleton rounded" style={{ height: `${height}px` }} />
        </div>
    )
}

const CHART_COLORS = {
    primary: 'hsl(262, 83%, 66%)',
    success: 'hsl(142, 76%, 36%)',
    warning: 'hsl(45, 93%, 47%)',
    destructive: 'hsl(0, 84%, 60%)',
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
        setError('')
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
            title: `New Users (${filter})`,
            value: analytics?.periodStats.users || 0,
            icon: TrendingUp,
            color: 'bg-accent/10 text-accent',
        },
    ]

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                    <p className="text-sm text-muted-foreground mb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-base font-medium" style={{ color: entry.color }}>
                            {entry.name}: {entry.value.toLocaleString()}
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome to Plenify Admin Panel
                    </p>
                </div>

                {/* Filter Buttons */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1.5">
                        <Filter className="w-5 h-5 text-muted-foreground ml-2" />
                        {filterOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setFilter(option.value)}
                                className={cn(
                                    'px-4 py-2 text-sm font-medium rounded-lg transition-all',
                                    filter === option.value
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={fetchAnalytics}
                        disabled={isLoading}
                        className="p-3 bg-card border border-border rounded-xl hover:bg-muted transition-colors"
                    >
                        <RefreshCw className={cn('w-5 h-5', isLoading && 'animate-spin')} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
                    {error}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {overviewStats.map((stat) => (
                    <StatCard
                        key={stat.title}
                        title={stat.title}
                        value={stat.value}
                        icon={stat.icon}
                        color={stat.color}
                        isLoading={isLoading}
                    />
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6">
                {/* User Growth Chart */}
                {isLoading ? (
                    <ChartSkeleton height={350} />
                ) : (
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-6">User Growth Trend</h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={analytics?.charts.userGrowth || []}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '16px' }} />
                                <Area
                                    type="monotone"
                                    dataKey="users"
                                    name="Users"
                                    stroke={CHART_COLORS.primary}
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorUsers)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    )
}
