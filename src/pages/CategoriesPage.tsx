import { useState, useEffect, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight, Eye, CreditCard as Edit, Trash2, Plus, X, Loader as Loader2, RefreshCw, Check, CircleAlert as AlertCircle } from 'lucide-react'
import { getCategoriesAdmin, createCategory, updateCategory, deleteCategory, Category, Pagination } from '../lib/api'
import { cn } from '../lib/utils'

function CategorySkeleton() {
    return (
        <tr className="border-b border-border">
            <td className="p-3"><div className="h-3 w-24 skeleton rounded" /></td>
            <td className="p-3"><div className="h-3 w-32 skeleton rounded" /></td>
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

interface CategoryModalProps {
    category: Category | null
    mode: 'view' | 'create' | 'edit'
    onClose: () => void
    onSave: (data: any) => void
    isLoading: boolean
}

function CategoryModal({ category, mode, onClose, onSave, isLoading }: CategoryModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        isActive: true,
        order: 0,
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        if (category && mode !== 'create') {
            setFormData({
                name: category.name || '',
                slug: category.slug || '',
                description: category.description || '',
                isActive: category.isActive ?? true,
                order: category.order || 0,
            })
        } else if (mode === 'create') {
            setFormData({
                name: '',
                slug: '',
                description: '',
                isActive: true,
                order: 0,
            })
        }
        setErrors({})
    }, [category, mode])

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
    }

    const handleNameChange = (name: string) => {
        setFormData(prev => ({
            ...prev,
            name,
            slug: generateSlug(name)
        }))
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required'
        }

        if (!formData.slug.trim()) {
            newErrors.slug = 'Slug is required'
        }

        if (formData.order < 0) {
            newErrors.order = 'Order must be 0 or greater'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (validateForm()) {
            onSave(formData)
        }
    }

    const isReadOnly = mode === 'view'
    const title = mode === 'create' ? 'Create Category' : mode === 'edit' ? 'Edit Category' : 'Category Details'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
            <div
                className="bg-card border border-border rounded-lg w-full max-w-md animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-foreground">{title}</h2>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            disabled={isReadOnly}
                            className={cn(
                                "w-full px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all",
                                errors.name && "border-destructive",
                                isReadOnly && "opacity-60"
                            )}
                            placeholder="Enter category name"
                        />
                        {errors.name && (
                            <p className="text-xs text-destructive mt-1">{errors.name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Slug *
                        </label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                            disabled={isReadOnly}
                            className={cn(
                                "w-full px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all",
                                errors.slug && "border-destructive",
                                isReadOnly && "opacity-60"
                            )}
                            placeholder="category-slug"
                        />
                        {errors.slug && (
                            <p className="text-xs text-destructive mt-1">{errors.slug}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            disabled={isReadOnly}
                            rows={3}
                            className={cn(
                                "w-full px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all resize-none",
                                isReadOnly && "opacity-60"
                            )}
                            placeholder="Enter category description"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Order
                        </label>
                        <input
                            type="number"
                            value={formData.order}
                            onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                            disabled={isReadOnly}
                            min="0"
                            className={cn(
                                "w-full px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all",
                                errors.order && "border-destructive",
                                isReadOnly && "opacity-60"
                            )}
                            placeholder="0"
                        />
                        {errors.order && (
                            <p className="text-xs text-destructive mt-1">{errors.order}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                            disabled={isReadOnly}
                            className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-ring focus:ring-2"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-foreground">
                            Active
                        </label>
                    </div>

                    {!isReadOnly && (
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2 border border-input rounded font-medium hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 py-2 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {mode === 'create' ? 'Create' : 'Update'}
                            </button>
                        </div>
                    )}

                    {isReadOnly && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-2 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 transition-colors"
                        >
                            Close
                        </button>
                    )}
                </form>
            </div>
        </div>
    )
}

interface DeleteConfirmModalProps {
    category: Category | null
    onClose: () => void
    onConfirm: () => void
    isLoading: boolean
}

function DeleteConfirmModal({ category, onClose, onConfirm, isLoading }: DeleteConfirmModalProps) {
    if (!category) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
            <div
                className="bg-card border border-border rounded-lg w-full max-w-sm animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-destructive" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Delete Category</h3>
                            <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                        </div>
                    </div>

                    <p className="text-sm text-foreground mb-4">
                        Are you sure you want to delete the category <strong>"{category.name}"</strong>?
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 py-2 border border-input rounded font-medium hover:bg-muted transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex-1 py-2 bg-destructive text-destructive-foreground rounded font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [pagination, setPagination] = useState<Pagination | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
    const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit' | null>(null)
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500)
        return () => clearTimeout(timer)
    }, [search])

    const fetchCategories = useCallback(async (page = 1) => {
        setIsLoading(true)
        setError('')
        try {
            const response = await getCategoriesAdmin({
                page,
                limit: 10,
                search: debouncedSearch,
                status: statusFilter,
            })
            if (response.success) {
                setCategories(response.response.categories)
                setPagination(response.response.pagination)
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch categories')
        } finally {
            setIsLoading(false)
        }
    }, [debouncedSearch, statusFilter])

    useEffect(() => {
        fetchCategories(1)
    }, [fetchCategories])

    const handleCreateCategory = async (data: any) => {
        setActionLoading(true)
        setError('')
        try {
            const response = await createCategory(data)
            if (response.success) {
                setSuccess('Category created successfully')
                setModalMode(null)
                setSelectedCategory(null)
                fetchCategories(pagination?.page || 1)
                setTimeout(() => setSuccess(''), 3000)
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create category')
        } finally {
            setActionLoading(false)
        }
    }

    const handleUpdateCategory = async (data: any) => {
        if (!selectedCategory) return
        setActionLoading(true)
        setError('')
        try {
            const response = await updateCategory(selectedCategory._id, data)
            if (response.success) {
                setSuccess('Category updated successfully')
                setModalMode(null)
                setSelectedCategory(null)
                fetchCategories(pagination?.page || 1)
                setTimeout(() => setSuccess(''), 3000)
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update category')
        } finally {
            setActionLoading(false)
        }
    }

    const handleDeleteCategory = async () => {
        if (!categoryToDelete) return
        setActionLoading(true)
        setError('')
        try {
            const response = await deleteCategory(categoryToDelete._id)
            if (response.success) {
                setSuccess('Category deleted successfully')
                setCategoryToDelete(null)
                fetchCategories(pagination?.page || 1)
                setTimeout(() => setSuccess(''), 3000)
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete category')
        } finally {
            setActionLoading(false)
        }
    }

    const handleViewCategory = async (category: Category) => {
        setSelectedCategory(category)
        setModalMode('view')
    }

    const handleEditCategory = async (category: Category) => {
        setSelectedCategory(category)
        setModalMode('edit')
    }

    const handleSave = (data: any) => {
        if (modalMode === 'create') {
            handleCreateCategory(data)
        } else if (modalMode === 'edit') {
            handleUpdateCategory(data)
        }
    }

    return (
        <div className="animate-fade-in">
            <div className="mb-4">
                <h1 className="text-xl font-bold text-foreground">Categories</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Manage event categories</p>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded text-success text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {success}
                </div>
            )}

            {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Filters and Create Button */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by name or slug..."
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
                    <option value="inactive">Inactive</option>
                </select>

                <button
                    onClick={() => fetchCategories(pagination?.page || 1)}
                    className="p-2 bg-card border border-input rounded hover:bg-muted transition-colors"
                >
                    <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                </button>

                <button
                    onClick={() => {
                        setSelectedCategory(null)
                        setModalMode('create')
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create Category
                </button>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Slug</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Order</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Created</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => <CategorySkeleton key={i} />)
                            ) : categories.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                                        No categories found
                                    </td>
                                </tr>
                            ) : (
                                categories.map((category) => (
                                    <tr key={category._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                                        <td className="p-3">
                                            <div>
                                                <p className="font-medium text-foreground">{category.name}</p>
                                                {category.description && (
                                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {category.description}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-muted-foreground font-mono text-xs">{category.slug}</td>
                                        <td className="p-3">
                                            <span className={cn(
                                                'px-2 py-0.5 text-xs font-medium rounded-full',
                                                category.isActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                                            )}>
                                                {category.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-muted-foreground">{category.order}</td>
                                        <td className="p-3 text-muted-foreground">
                                            {new Date(category.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleViewCategory(category)}
                                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditCategory(category)}
                                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                                                    title="Edit Category"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setCategoryToDelete(category)}
                                                    className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                                    title="Delete Category"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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
                                onClick={() => fetchCategories(pagination.page - 1)}
                                disabled={pagination.page === 1 || isLoading}
                                className="p-1.5 hover:bg-muted rounded transition-colors disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-2 text-muted-foreground">
                                {pagination.page} / {pagination.pages}
                            </span>
                            <button
                                onClick={() => fetchCategories(pagination.page + 1)}
                                disabled={pagination.page === pagination.pages || isLoading}
                                className="p-1.5 hover:bg-muted rounded transition-colors disabled:opacity-50"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Category Modal */}
            {modalMode && (
                <CategoryModal
                    category={selectedCategory}
                    mode={modalMode}
                    onClose={() => {
                        setModalMode(null)
                        setSelectedCategory(null)
                        setError('')
                    }}
                    onSave={handleSave}
                    isLoading={actionLoading}
                />
            )}

            {/* Delete Confirmation Modal */}
            {categoryToDelete && (
                <DeleteConfirmModal
                    category={categoryToDelete}
                    onClose={() => setCategoryToDelete(null)}
                    onConfirm={handleDeleteCategory}
                    isLoading={actionLoading}
                />
            )}
        </div>
    )
}