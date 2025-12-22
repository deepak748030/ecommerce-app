import { useState, useEffect, useCallback } from 'react'
import {
    Calendar, Search, Edit, Trash2, Eye,
    Star, MapPin, Clock, Users, DollarSign, ChevronLeft, ChevronRight,
    X, AlertCircle, RefreshCw
} from 'lucide-react'
import {
    getEventsAdmin, getEventByIdAdmin, updateEventAdmin,
    toggleEventStatusAdmin, toggleEventFeaturedAdmin, deleteEventAdmin,
    getCategoriesAdmin, Event, Category
} from '../lib/api'
import { cn } from '../lib/utils'

function TableSkeleton() {
    return (
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 skeleton rounded" />
            ))}
        </div>
    )
}

function Modal({ isOpen, onClose, title, children }: {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
}) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto m-4">
                <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4">{children}</div>
            </div>
        </div>
    )
}

export function EventsPage() {
    const [events, setEvents] = useState<Event[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [categoryFilter, setCategoryFilter] = useState<string>('')
    const [featuredFilter, setFeaturedFilter] = useState<string>('')
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({ total: 0, pages: 1 })
    const limit = 15

    // Modal states
    const [viewModalOpen, setViewModalOpen] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
    const [actionLoading, setActionLoading] = useState(false)

    // Edit form state
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        category: '',
        location: '',
        fullLocation: '',
        date: '',
        time: '',
        price: 0,
        mrp: 0,
        capacity: 100,
        badge: '',
        isFeatured: false,
        isActive: true
    })

    const fetchEvents = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await getEventsAdmin({
                page,
                limit,
                search: search || undefined,
                status: statusFilter || undefined,
                category: categoryFilter || undefined,
                featured: featuredFilter || undefined
            })
            if (response.success) {
                setEvents(response.response.events)
                setPagination(response.response.pagination)
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch events')
        } finally {
            setIsLoading(false)
        }
    }, [page, search, statusFilter, categoryFilter, featuredFilter])

    const fetchCategories = async () => {
        try {
            const response = await getCategoriesAdmin({ limit: 100 })
            if (response.success) {
                setCategories(response.response.categories)
            }
        } catch (err) {
            console.error('Failed to fetch categories')
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        fetchEvents()
    }, [fetchEvents])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(1)
        fetchEvents()
    }

    const handleView = async (event: Event) => {
        try {
            const response = await getEventByIdAdmin(event._id)
            if (response.success) {
                setSelectedEvent(response.response.event)
                setViewModalOpen(true)
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch event details')
        }
    }

    const handleEdit = async (event: Event) => {
        try {
            const response = await getEventByIdAdmin(event._id)
            if (response.success) {
                const e = response.response.event
                setSelectedEvent(e)
                setEditForm({
                    title: e.title || '',
                    description: e.description || '',
                    category: e.category || '',
                    location: e.location || '',
                    fullLocation: e.fullLocation || '',
                    date: e.date || '',
                    time: e.time || '',
                    price: e.price || 0,
                    mrp: e.mrp || 0,
                    capacity: e.capacity || 100,
                    badge: e.badge || '',
                    isFeatured: e.isFeatured || false,
                    isActive: e.isActive
                })
                setEditModalOpen(true)
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch event details')
        }
    }

    const handleSaveEdit = async () => {
        if (!selectedEvent) return
        setActionLoading(true)
        try {
            const response = await updateEventAdmin(selectedEvent._id, editForm)
            if (response.success) {
                setEditModalOpen(false)
                fetchEvents()
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update event')
        } finally {
            setActionLoading(false)
        }
    }

    const handleToggleStatus = async (event: Event) => {
        setActionLoading(true)
        try {
            const response = await toggleEventStatusAdmin(event._id)
            if (response.success) {
                fetchEvents()
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to toggle status')
        } finally {
            setActionLoading(false)
        }
    }

    const handleToggleFeatured = async (event: Event) => {
        setActionLoading(true)
        try {
            const response = await toggleEventFeaturedAdmin(event._id)
            if (response.success) {
                fetchEvents()
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to toggle featured')
        } finally {
            setActionLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedEvent) return
        setActionLoading(true)
        try {
            const response = await deleteEventAdmin(selectedEvent._id)
            if (response.success) {
                setDeleteModalOpen(false)
                setSelectedEvent(null)
                fetchEvents()
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete event')
        } finally {
            setActionLoading(false)
        }
    }

    const confirmDelete = (event: Event) => {
        setSelectedEvent(event)
        setDeleteModalOpen(true)
    }

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Events</h1>
                    <p className="text-muted-foreground text-sm">Manage all vendor events</p>
                </div>
                <button
                    onClick={fetchEvents}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Filters */}
            <div className="bg-card border border-border rounded-lg p-3 mb-4">
                <div className="flex flex-wrap items-center gap-3">
                    <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search events..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    </form>

                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                        className="px-3 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <select
                        value={categoryFilter}
                        onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
                        className="px-3 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat._id} value={cat.slug}>{cat.name}</option>
                        ))}
                    </select>

                    <select
                        value={featuredFilter}
                        onChange={(e) => { setFeaturedFilter(e.target.value); setPage(1) }}
                        className="px-3 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                        <option value="">All Events</option>
                        <option value="true">Featured Only</option>
                        <option value="false">Non-Featured</option>
                    </select>
                </div>
            </div>

            {/* Events Table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-4"><TableSkeleton /></div>
                ) : events.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No events found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="text-left p-3 font-medium">Event</th>
                                    <th className="text-left p-3 font-medium">Vendor</th>
                                    <th className="text-left p-3 font-medium">Location</th>
                                    <th className="text-left p-3 font-medium">Price</th>
                                    <th className="text-left p-3 font-medium">Date</th>
                                    <th className="text-left p-3 font-medium">Status</th>
                                    <th className="text-left p-3 font-medium">Featured</th>
                                    <th className="text-right p-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((event) => (
                                    <tr key={event._id} className="border-b border-border hover:bg-muted/20 transition-colors">
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                                                    {event.image ? (
                                                        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Calendar className="w-5 h-5 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate max-w-[200px]">{event.title}</p>
                                                    <p className="text-xs text-muted-foreground">{event.category}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                                    {event.vendor?.avatar ? (
                                                        <img src={event.vendor.avatar} alt={event.vendor.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs">
                                                            {event.vendor?.name?.charAt(0) || 'V'}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-sm truncate max-w-[120px]">
                                                    {event.vendor?.businessName || event.vendor?.name || 'Unknown'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <MapPin className="w-3 h-3" />
                                                <span className="truncate max-w-[120px]">{event.location}</span>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <span className="font-medium">₹{event.price}</span>
                                            {event.mrp && event.mrp > event.price && (
                                                <span className="text-xs text-muted-foreground line-through ml-1">₹{event.mrp}</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                                <Clock className="w-3 h-3" />
                                                {event.date} {event.time}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => handleToggleStatus(event)}
                                                className={cn(
                                                    'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                                                    event.isActive
                                                        ? 'bg-success/10 text-success hover:bg-success/20'
                                                        : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                                                )}
                                            >
                                                {event.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => handleToggleFeatured(event)}
                                                className={cn(
                                                    'p-1 rounded transition-colors',
                                                    event.isFeatured
                                                        ? 'text-warning bg-warning/10 hover:bg-warning/20'
                                                        : 'text-muted-foreground hover:bg-muted'
                                                )}
                                            >
                                                <Star className={cn('w-4 h-4', event.isFeatured && 'fill-current')} />
                                            </button>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleView(event)}
                                                    className="p-1.5 hover:bg-muted rounded transition-colors"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(event)}
                                                    className="p-1.5 hover:bg-muted rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => confirmDelete(event)}
                                                    className="p-1.5 hover:bg-destructive/10 text-destructive rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between p-3 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                            Page {page} of {pagination.pages} ({pagination.total} events)
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1.5 hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                disabled={page === pagination.pages}
                                className="p-1.5 hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* View Modal */}
            <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Event Details">
                {selectedEvent && (
                    <div className="space-y-4">
                        {selectedEvent.image && (
                            <img src={selectedEvent.image} alt={selectedEvent.title} className="w-full h-48 object-cover rounded" />
                        )}
                        <div>
                            <h4 className="text-lg font-semibold">{selectedEvent.title}</h4>
                            <p className="text-sm text-muted-foreground">{selectedEvent.category}</p>
                        </div>
                        <p className="text-sm">{selectedEvent.description}</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <span>{selectedEvent.fullLocation || selectedEvent.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>{selectedEvent.date} at {selectedEvent.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-muted-foreground" />
                                <span>₹{selectedEvent.price} {selectedEvent.mrp && selectedEvent.mrp > selectedEvent.price && <span className="line-through text-muted-foreground">₹{selectedEvent.mrp}</span>}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span>{selectedEvent.bookedCount || 0}/{selectedEvent.capacity} booked</span>
                            </div>
                        </div>
                        {selectedEvent.vendor && (
                            <div className="border-t border-border pt-3">
                                <p className="text-xs text-muted-foreground mb-2">Vendor</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
                                        {selectedEvent.vendor.avatar ? (
                                            <img src={selectedEvent.vendor.avatar} alt={selectedEvent.vendor.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-medium">
                                                {selectedEvent.vendor.name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium">{selectedEvent.vendor.businessName || selectedEvent.vendor.name}</p>
                                        <p className="text-xs text-muted-foreground">{selectedEvent.vendor.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Event">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <select
                                value={editForm.category}
                                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                                <option value="">Select category</option>
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat.slug}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Badge</label>
                            <input
                                type="text"
                                value={editForm.badge}
                                onChange={(e) => setEditForm({ ...editForm, badge: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Location</label>
                        <input
                            type="text"
                            value={editForm.location}
                            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Full Location</label>
                        <input
                            type="text"
                            value={editForm.fullLocation}
                            onChange={(e) => setEditForm({ ...editForm, fullLocation: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Date</label>
                            <input
                                type="date"
                                value={editForm.date}
                                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Time</label>
                            <input
                                type="time"
                                value={editForm.time}
                                onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Price</label>
                            <input
                                type="number"
                                value={editForm.price}
                                onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                                className="w-full px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">MRP</label>
                            <input
                                type="number"
                                value={editForm.mrp}
                                onChange={(e) => setEditForm({ ...editForm, mrp: Number(e.target.value) })}
                                className="w-full px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Capacity</label>
                            <input
                                type="number"
                                value={editForm.capacity}
                                onChange={(e) => setEditForm({ ...editForm, capacity: Number(e.target.value) })}
                                className="w-full px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={editForm.isActive}
                                onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                                className="w-4 h-4 rounded border-border"
                            />
                            <span className="text-sm">Active</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={editForm.isFeatured}
                                onChange={(e) => setEditForm({ ...editForm, isFeatured: e.target.checked })}
                                className="w-4 h-4 rounded border-border"
                            />
                            <span className="text-sm">Featured</span>
                        </label>
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t border-border">
                        <button
                            onClick={() => setEditModalOpen(false)}
                            className="px-4 py-2 text-sm border border-border rounded hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveEdit}
                            disabled={actionLoading}
                            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {actionLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Event">
                <div className="space-y-4">
                    <p className="text-sm">
                        Are you sure you want to delete <strong>{selectedEvent?.title}</strong>? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setDeleteModalOpen(false)}
                            className="px-4 py-2 text-sm border border-border rounded hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={actionLoading}
                            className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors disabled:opacity-50"
                        >
                            {actionLoading ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}