// File: src/pages/BannersPage.tsx
import { useState, useEffect, useCallback, ChangeEvent } from 'react'
import { Search, ChevronLeft, ChevronRight, Eye, Edit, Trash2, Plus, X, Loader2, RefreshCw, CircleAlert as AlertCircle, Check } from 'lucide-react'
import { getBannersAdmin, createBanner, updateBanner, deleteBanner, getCategoriesAdmin, getEventsAdmin, Banner, Pagination, Category, Event } from '../lib/api'
import { cn } from '../lib/utils'

function BannerSkeleton() {
    return (
        <tr className="border-b border-border">
            <td className="p-3">
                <div className="h-10 w-20 skeleton rounded object-cover" />
            </td>
            <td className="p-3"><div className="h-3 w-24 skeleton rounded" /></td>
            <td className="p-3"><div className="h-3 w-16 skeleton rounded" /></td>
            <td className="p-3"><div className="h-5 w-14 skeleton rounded-full" /></td>
            <td className="p-3"><div className="h-3 w-8 skeleton rounded" /></td>
            <td className="p-3"><div className="h-3 w-20 skeleton rounded" /></td>
            <td className="p-3">
                <div className="flex gap-1">
                    <div className="h-7 w-7 skeleton rounded" />
                    <div className="h-7 w-7 skeleton rounded" />
                    <div className="h-7 w-7 skeleton rounded" />
                </div>
            </td>
        </tr>
    )
}

interface BannerModalProps {
    banner: Banner | null
    mode: 'view' | 'create' | 'edit'
    onClose: () => void
    onSave: (data: FormData) => void
    isLoading: boolean
}

function BannerModal({ banner, mode, onClose, onSave, isLoading }: BannerModalProps) {
    const [title, setTitle] = useState('')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imageUrlPreview, setImageUrlPreview] = useState<string>('')
    const [badge, setBadge] = useState('')
    const [type, setType] = useState<'event' | 'category'>('event')
    const [eventId, setEventId] = useState('')
    const [categorySlug, setCategorySlug] = useState('')
    const [isActive, setIsActive] = useState(true)
    const [order, setOrder] = useState(0)
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Lists for selection
    const [categories, setCategories] = useState<Category[]>([])
    const [events, setEvents] = useState<Event[]>([])
    const [loadingCategories, setLoadingCategories] = useState(false)
    const [loadingEvents, setLoadingEvents] = useState(false)

    // Fetch categories and events on mount
    useEffect(() => {
        const fetchData = async () => {
            setLoadingCategories(true)
            setLoadingEvents(true)
            try {
                const [catRes, evtRes] = await Promise.all([
                    getCategoriesAdmin({ limit: 100 }),
                    getEventsAdmin({ limit: 100 })
                ])
                if (catRes.success) setCategories(catRes.response.categories || [])
                if (evtRes.success) setEvents(evtRes.response.events || [])
            } catch (err) {
                console.error('Failed to fetch categories/events', err)
            } finally {
                setLoadingCategories(false)
                setLoadingEvents(false)
            }
        }
        fetchData()
    }, [])

    useEffect(() => {
        if (banner && mode !== 'create') {
            setTitle(banner.title || '')
            setImageUrlPreview(banner.image || '')
            setImageFile(null)
            setBadge(banner.badge || '')
            setType(banner.type || 'event')
            setEventId(banner.eventId || '')
            setCategorySlug(banner.categorySlug || '')
            setIsActive(banner.isActive ?? true)
            setOrder(banner.order || 0)
        } else if (mode === 'create') {
            setTitle('')
            setImageFile(null)
            setImageUrlPreview('')
            setBadge('')
            setType('event')
            setEventId('')
            setCategorySlug('')
            setIsActive(true)
            setOrder(0)
        }
        setErrors({})
    }, [banner, mode])

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setImageFile(file)
            setImageUrlPreview(URL.createObjectURL(file))
        } else {
            setImageFile(null)
            setImageUrlPreview(banner?.image || '')
        }
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}
        if (!title.trim()) newErrors.title = 'Title is required'
        if (!imageFile && !imageUrlPreview) newErrors.image = 'Image is required'
        if (!type) newErrors.type = 'Type is required'
        if (type === 'event' && !eventId) newErrors.eventId = 'Please select an event'
        if (type === 'category' && !categorySlug) newErrors.categorySlug = 'Please select a category'
        if (order < 0) newErrors.order = 'Order must be 0 or greater'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (validateForm()) {
            const formData = new FormData()
            formData.append('title', title)
            if (imageFile) formData.append('image', imageFile)
            else if (imageUrlPreview) formData.append('image', imageUrlPreview)
            formData.append('badge', badge)
            formData.append('type', type)
            if (type === 'event') formData.append('eventId', eventId)
            else formData.append('categorySlug', categorySlug)
            formData.append('isActive', String(isActive))
            formData.append('order', String(order))
            onSave(formData)
        }
    }

    const isReadOnly = mode === 'view'
    const modalTitle = mode === 'create' ? 'Create Banner' : mode === 'edit' ? 'Edit Banner' : 'Banner Details'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
            <div className="bg-card border border-border rounded-lg w-full max-w-md animate-fade-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-foreground">{modalTitle}</h2>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors"><X className="w-4 h-4" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isReadOnly}
                            className={cn("w-full px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all", errors.title && "border-destructive", isReadOnly && "opacity-60")}
                            placeholder="Enter banner title" />
                        {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Image *</label>
                        {!isReadOnly && (
                            <input type="file" accept="image/*" onChange={handleImageChange}
                                className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                        )}
                        {errors.image && <p className="text-xs text-destructive mt-1">{errors.image}</p>}
                        {imageUrlPreview && (
                            <div className="mt-2 w-full h-32 bg-muted rounded overflow-hidden flex items-center justify-center">
                                <img src={imageUrlPreview} alt="Banner Preview" className="object-contain max-h-full max-w-full" />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Badge</label>
                        <input type="text" value={badge} onChange={(e) => setBadge(e.target.value)} disabled={isReadOnly}
                            className={cn("w-full px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all", isReadOnly && "opacity-60")}
                            placeholder="e.g., New, Hot, Sale" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Type *</label>
                        <select value={type} onChange={(e) => { setType(e.target.value as 'event' | 'category'); setEventId(''); setCategorySlug('') }} disabled={isReadOnly}
                            className={cn("w-full px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all", errors.type && "border-destructive", isReadOnly && "opacity-60")}>
                            <option value="event">Event</option>
                            <option value="category">Category</option>
                        </select>
                    </div>

                    {type === 'event' && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Select Event *</label>
                            {loadingEvents ? (
                                <div className="flex items-center gap-2 text-muted-foreground text-sm py-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading events...</div>
                            ) : (
                                <select value={eventId} onChange={(e) => setEventId(e.target.value)} disabled={isReadOnly}
                                    className={cn("w-full px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all", errors.eventId && "border-destructive", isReadOnly && "opacity-60")}>
                                    <option value="">-- Select an Event --</option>
                                    {events.map((event) => (
                                        <option key={event._id} value={event._id}>{event.title} - {event.location}</option>
                                    ))}
                                </select>
                            )}
                            {errors.eventId && <p className="text-xs text-destructive mt-1">{errors.eventId}</p>}
                        </div>
                    )}

                    {type === 'category' && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Select Category *</label>
                            {loadingCategories ? (
                                <div className="flex items-center gap-2 text-muted-foreground text-sm py-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading categories...</div>
                            ) : (
                                <select value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} disabled={isReadOnly}
                                    className={cn("w-full px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all", errors.categorySlug && "border-destructive", isReadOnly && "opacity-60")}>
                                    <option value="">-- Select a Category --</option>
                                    {categories.map((cat) => (
                                        <option key={cat._id} value={cat.slug}>{cat.name}</option>
                                    ))}
                                </select>
                            )}
                            {errors.categorySlug && <p className="text-xs text-destructive mt-1">{errors.categorySlug}</p>}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Order</label>
                        <input type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 0)} disabled={isReadOnly} min="0"
                            className={cn("w-full px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all", errors.order && "border-destructive", isReadOnly && "opacity-60")} />
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} disabled={isReadOnly}
                            className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-ring focus:ring-2" />
                        <label htmlFor="isActive" className="text-sm font-medium text-foreground">Active</label>
                    </div>

                    {!isReadOnly && (
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 py-2 border border-input rounded font-medium hover:bg-muted transition-colors">Cancel</button>
                            <button type="submit" disabled={isLoading} className="flex-1 py-2 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {mode === 'create' ? 'Create' : 'Update'}
                            </button>
                        </div>
                    )}
                    {isReadOnly && <button type="button" onClick={onClose} className="w-full py-2 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 transition-colors">Close</button>}
                </form>
            </div>
        </div>
    )
}

interface DeleteConfirmModalProps {
    banner: Banner | null
    onClose: () => void
    onConfirm: () => void
    isLoading: boolean
}

function DeleteConfirmModal({ banner, onClose, onConfirm, isLoading }: DeleteConfirmModalProps) {
    if (!banner) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
            <div className="bg-card border border-border rounded-lg w-full max-w-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
                <div className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-destructive" /></div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Delete Banner</h3>
                            <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">Are you sure you want to delete "<span className="text-foreground font-medium">{banner.title}</span>"?</p>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 py-2 border border-input rounded font-medium hover:bg-muted transition-colors">Cancel</button>
                        <button onClick={onConfirm} disabled={isLoading} className="flex-1 py-2 bg-destructive text-destructive-foreground rounded font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function BannersPage() {
    const [banners, setBanners] = useState<Banner[]>([])
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 })
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null)
    const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit' | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deleteModal, setDeleteModal] = useState<Banner | null>(null)
    const [successMessage, setSuccessMessage] = useState('')

    const fetchBanners = useCallback(async () => {
        setIsLoading(true)
        setError('')
        try {
            const response = await getBannersAdmin({ page: pagination.page, limit: pagination.limit, search, status: statusFilter !== 'all' ? statusFilter : undefined })
            if (response.success) {
                setBanners(response.response.banners || [])
                setPagination(response.response.pagination)
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch banners')
        } finally {
            setIsLoading(false)
        }
    }, [pagination.page, pagination.limit, search, statusFilter])

    useEffect(() => { fetchBanners() }, [fetchBanners])

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value)
        setPagination(prev => ({ ...prev, page: 1 }))
    }

    const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setStatusFilter(e.target.value)
        setPagination(prev => ({ ...prev, page: 1 }))
    }

    const showSuccess = (message: string) => {
        setSuccessMessage(message)
        setTimeout(() => setSuccessMessage(''), 3000)
    }

    const handleSaveBanner = async (data: FormData) => {
        setIsSubmitting(true)
        try {
            if (modalMode === 'create') {
                const response = await createBanner(data)
                if (response.success) { showSuccess('Banner created successfully'); fetchBanners() }
            } else if (modalMode === 'edit' && selectedBanner) {
                const response = await updateBanner(selectedBanner._id, data)
                if (response.success) { showSuccess('Banner updated successfully'); fetchBanners() }
            }
            setModalMode(null)
            setSelectedBanner(null)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save banner')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteBanner = async () => {
        if (!deleteModal) return
        setIsSubmitting(true)
        try {
            const response = await deleteBanner(deleteModal._id)
            if (response.success) { showSuccess('Banner deleted successfully'); fetchBanners() }
            setDeleteModal(null)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete banner')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div><h1 className="text-xl font-bold text-foreground">Banners</h1><p className="text-muted-foreground text-sm mt-0.5">Manage promotional banners</p></div>
                <button onClick={() => { setSelectedBanner(null); setModalMode('create') }} className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 transition-colors">
                    <Plus className="w-4 h-4" />Add Banner
                </button>
            </div>

            {successMessage && <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded text-success text-sm flex items-center gap-2"><Check className="w-4 h-4" />{successMessage}</div>}
            {error && <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">{error}</div>}

            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-3 border-b border-border">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input type="text" placeholder="Search banners..." value={search} onChange={handleSearchChange} className="w-full pl-9 pr-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all" />
                        </div>
                        <select value={statusFilter} onChange={handleStatusChange} className="px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all">
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <button onClick={fetchBanners} className="flex items-center justify-center gap-2 px-3 py-2 border border-input rounded hover:bg-muted transition-colors"><RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} /></button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead><tr className="border-b border-border bg-muted/50"><th className="text-left p-3 text-xs font-medium text-muted-foreground">Image</th><th className="text-left p-3 text-xs font-medium text-muted-foreground">Title</th><th className="text-left p-3 text-xs font-medium text-muted-foreground">Type</th><th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th><th className="text-left p-3 text-xs font-medium text-muted-foreground">Order</th><th className="text-left p-3 text-xs font-medium text-muted-foreground">Created</th><th className="text-left p-3 text-xs font-medium text-muted-foreground">Actions</th></tr></thead>
                        <tbody>
                            {isLoading ? Array.from({ length: 5 }).map((_, i) => <BannerSkeleton key={i} />) : banners.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No banners found</td></tr>
                            ) : banners.map((banner) => (
                                <tr key={banner._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                                    <td className="p-3"><img src={banner.image} alt={banner.title} className="h-10 w-20 object-cover rounded" /></td>
                                    <td className="p-3"><p className="text-sm font-medium text-foreground">{banner.title}</p>{banner.badge && <span className="text-xs text-muted-foreground">{banner.badge}</span>}</td>
                                    <td className="p-3"><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", banner.type === 'event' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent')}>{banner.type}</span></td>
                                    <td className="p-3"><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", banner.isActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground')}>{banner.isActive ? 'Active' : 'Inactive'}</span></td>
                                    <td className="p-3 text-sm text-muted-foreground">{banner.order}</td>
                                    <td className="p-3 text-sm text-muted-foreground">{new Date(banner.createdAt).toLocaleDateString()}</td>
                                    <td className="p-3">
                                        <div className="flex gap-1">
                                            <button onClick={() => { setSelectedBanner(banner); setModalMode('view') }} className="p-1.5 hover:bg-muted rounded transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                                            <button onClick={() => { setSelectedBanner(banner); setModalMode('edit') }} className="p-1.5 hover:bg-muted rounded transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => setDeleteModal(banner)} className="p-1.5 hover:bg-destructive/10 rounded transition-colors text-destructive" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {pagination.pages > 1 && (
                    <div className="p-3 border-t border-border flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</p>
                        <div className="flex gap-1">
                            <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1} className="p-1.5 border border-input rounded hover:bg-muted transition-colors disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                            <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page === pagination.pages} className="p-1.5 border border-input rounded hover:bg-muted transition-colors disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </div>

            {modalMode && <BannerModal banner={selectedBanner} mode={modalMode} onClose={() => { setModalMode(null); setSelectedBanner(null) }} onSave={handleSaveBanner} isLoading={isSubmitting} />}
            {deleteModal && <DeleteConfirmModal banner={deleteModal} onClose={() => setDeleteModal(null)} onConfirm={handleDeleteBanner} isLoading={isSubmitting} />}
        </div>
    )
}