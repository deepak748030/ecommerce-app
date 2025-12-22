import { useState, useEffect, useCallback } from 'react'
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Eye,
    Ban,
    Check,
    X,
    Loader2,
    RefreshCw,
} from 'lucide-react'
import { getUsers, toggleUserBlock, User, Pagination } from '../lib/api'
import { cn } from '../lib/utils'

function UserSkeleton() {
    return (
        <tr className="border-b border-border">
            <td className="p-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full skeleton" />
                    <div className="space-y-1.5">
                        <div className="h-3 w-24 skeleton rounded" />
                        <div className="h-2.5 w-20 skeleton rounded" />
                    </div>
                </div>
            </td>
            <td className="p-3"><div className="h-3 w-32 skeleton rounded" /></td>
            <td className="p-3"><div className="h-3 w-24 skeleton rounded" /></td>
            <td className="p-3"><div className="h-5 w-14 skeleton rounded-full" /></td>
            <td className="p-3"><div className="h-3 w-20 skeleton rounded" /></td>
            <td className="p-3">
                <div className="flex gap-1">
                    <div className="h-7 w-7 skeleton rounded" />
                    <div className="h-7 w-7 skeleton rounded" />
                </div>
            </td>
        </tr>
    )
}

interface UserDetailModalProps {
    user: User | null
    onClose: () => void
}

function UserDetailModal({ user, onClose }: UserDetailModalProps) {
    if (!user) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
            <div
                className="bg-card border border-border rounded-lg p-4 w-full max-w-sm animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between mb-3">
                    <h2 className="text-lg font-bold text-foreground">User Details</h2>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex flex-col items-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-muted overflow-hidden mb-2">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-muted-foreground">
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <h3 className="text-base font-semibold text-foreground">{user.name}</h3>
                    <span className={cn(
                        'px-2 py-0.5 text-xs font-medium rounded-full mt-1',
                        user.isBlocked ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                    )}>
                        {user.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                </div>

                <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1.5 border-b border-border">
                        <span className="text-muted-foreground">ID</span>
                        <span className="text-foreground font-medium text-xs truncate max-w-[180px]">{user._id}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border">
                        <span className="text-muted-foreground">Email</span>
                        <span className="text-foreground font-medium">{user.email}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border">
                        <span className="text-muted-foreground">Phone</span>
                        <span className="text-foreground font-medium">{user.phone}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border">
                        <span className="text-muted-foreground">Joined</span>
                        <span className="text-foreground font-medium">
                            {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-4 py-2 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 transition-colors text-sm"
                >
                    Close
                </button>
            </div>
        </div>
    )
}

export function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [pagination, setPagination] = useState<Pagination | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [blockingUserId, setBlockingUserId] = useState<string | null>(null)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500)
        return () => clearTimeout(timer)
    }, [search])

    const fetchUsers = useCallback(async (page = 1) => {
        setIsLoading(true)
        try {
            const response = await getUsers({
                page,
                limit: 10,
                search: debouncedSearch,
                status: statusFilter,
            })
            if (response.success) {
                setUsers(response.response.users)
                setPagination(response.response.pagination)
            }
        } catch (err) {
            console.error('Failed to fetch users:', err)
        } finally {
            setIsLoading(false)
        }
    }, [debouncedSearch, statusFilter])

    useEffect(() => {
        fetchUsers(1)
    }, [fetchUsers])

    const handleToggleBlock = async (user: User) => {
        setBlockingUserId(user._id)
        try {
            const response = await toggleUserBlock(user._id)
            if (response.success) {
                setUsers((prev) =>
                    prev.map((u) =>
                        u._id === user._id ? { ...u, isBlocked: response.response.isBlocked } : u
                    )
                )
            }
        } catch (err) {
            console.error('Failed to toggle block:', err)
        } finally {
            setBlockingUserId(null)
        }
    }

    return (
        <div className="animate-fade-in">
            <div className="mb-4">
                <h1 className="text-xl font-bold text-foreground">Users</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Manage all registered users</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-card border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-card border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                </select>

                <button
                    onClick={() => fetchUsers(pagination?.page || 1)}
                    className="p-2 bg-card border border-input rounded hover:bg-muted transition-colors"
                >
                    <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                </button>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Phone</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Joined</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => <UserSkeleton key={i} />)
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                                                    {user.avatar ? (
                                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-medium text-muted-foreground">
                                                            {user.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="font-medium text-foreground">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-muted-foreground">{user.email}</td>
                                        <td className="p-3 text-muted-foreground">{user.phone}</td>
                                        <td className="p-3">
                                            <span className={cn(
                                                'px-2 py-0.5 text-xs font-medium rounded-full',
                                                user.isBlocked ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                                            )}>
                                                {user.isBlocked ? 'Blocked' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-muted-foreground">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setSelectedUser(user)}
                                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleBlock(user)}
                                                    disabled={blockingUserId === user._id}
                                                    className={cn(
                                                        'p-1.5 rounded transition-colors',
                                                        user.isBlocked
                                                            ? 'text-success hover:bg-success/10'
                                                            : 'text-destructive hover:bg-destructive/10'
                                                    )}
                                                    title={user.isBlocked ? 'Unblock User' : 'Block User'}
                                                >
                                                    {blockingUserId === user._id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : user.isBlocked ? (
                                                        <Check className="w-4 h-4" />
                                                    ) : (
                                                        <Ban className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                    <div className="flex items-center justify-between p-3 border-t border-border text-sm">
                        <p className="text-muted-foreground">
                            {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => fetchUsers(pagination.page - 1)}
                                disabled={pagination.page === 1 || isLoading}
                                className="p-1.5 hover:bg-muted rounded transition-colors disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-2 text-muted-foreground">
                                {pagination.page} / {pagination.pages}
                            </span>
                            <button
                                onClick={() => fetchUsers(pagination.page + 1)}
                                disabled={pagination.page === pagination.pages || isLoading}
                                className="p-1.5 hover:bg-muted rounded transition-colors disabled:opacity-50"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
        </div>
    )
}