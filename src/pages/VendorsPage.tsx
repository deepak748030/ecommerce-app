import { useState, useEffect, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight, Eye, Ban, Check, X, Loader as Loader2, RefreshCw, Star, ShieldCheck, ShieldX, Clock, FileText, CreditCard, User, Image, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react'
import { getVendors, getVendorById, toggleVendorBlock, updateVendorKYC, Vendor, Pagination } from '../lib/api'
import { cn } from '../lib/utils'

function VendorSkeleton() {
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
            <td className="p-3"><div className="h-3 w-28 skeleton rounded" /></td>
            <td className="p-3"><div className="h-3 w-20 skeleton rounded" /></td>
            <td className="p-3"><div className="h-5 w-14 skeleton rounded-full" /></td>
            <td className="p-3"><div className="h-5 w-16 skeleton rounded-full" /></td>
            <td className="p-3"><div className="h-3 w-16 skeleton rounded" /></td>
            <td className="p-3">
                <div className="flex gap-1">
                    <div className="h-7 w-7 skeleton rounded" />
                    <div className="h-7 w-7 skeleton rounded" />
                </div>
            </td>
        </tr>
    )
}

interface ImageModalProps {
    imageUrl: string | null
    title: string
    onClose: () => void
}

function ImageModal({ imageUrl, title, onClose }: ImageModalProps) {
    if (!imageUrl) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80" onClick={onClose}>
            <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute -top-10 right-0 p-2 text-white hover:bg-white/20 rounded transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
                <p className="text-white text-center mb-2 font-medium">{title}</p>
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                />
            </div>
        </div>
    )
}

interface VendorDetailModalProps {
    vendorId: string | null
    onClose: () => void
    onKYCUpdate: () => void
}

function VendorDetailModal({ vendorId, onClose, onKYCUpdate }: VendorDetailModalProps) {
    const [vendor, setVendor] = useState<Vendor | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'details' | 'kyc'>('details')
    const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null)
    const [isUpdatingKYC, setIsUpdatingKYC] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')
    const [showRejectModal, setShowRejectModal] = useState(false)

    useEffect(() => {
        if (vendorId) {
            fetchVendorDetails()
        }
    }, [vendorId])

    const fetchVendorDetails = async () => {
        if (!vendorId) return
        setIsLoading(true)
        try {
            const response = await getVendorById(vendorId)
            if (response.success) {
                setVendor(response.response.vendor)
            }
        } catch (error) {
            console.error('Failed to fetch vendor details:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleApproveKYC = async () => {
        if (!vendor) return
        setIsUpdatingKYC(true)
        try {
            const response = await updateVendorKYC(vendor._id, 'verified')
            if (response.success) {
                setVendor(prev => prev ? {
                    ...prev,
                    kycStatus: 'verified',
                    isVerified: true,
                    kyc: prev.kyc ? { ...prev.kyc, verificationStatus: 'verified' } : undefined
                } : null)
                onKYCUpdate()
            }
        } catch (error) {
            console.error('Failed to approve KYC:', error)
        } finally {
            setIsUpdatingKYC(false)
        }
    }

    const handleRejectKYC = async () => {
        if (!vendor) return
        setIsUpdatingKYC(true)
        try {
            const response = await updateVendorKYC(vendor._id, 'rejected', rejectionReason)
            if (response.success) {
                setVendor(prev => prev ? {
                    ...prev,
                    kycStatus: 'rejected',
                    isVerified: false,
                    kyc: prev.kyc ? { ...prev.kyc, verificationStatus: 'rejected', rejectionReason } : undefined
                } : null)
                setShowRejectModal(false)
                setRejectionReason('')
                onKYCUpdate()
            }
        } catch (error) {
            console.error('Failed to reject KYC:', error)
        } finally {
            setIsUpdatingKYC(false)
        }
    }

    if (!vendorId) return null

    const getKYCBadge = () => {
        if (!vendor) return null
        switch (vendor.kycStatus) {
            case 'verified':
                return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-success/10 text-success">Verified</span>
            case 'pending':
                return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-warning/10 text-warning">Pending</span>
            case 'rejected':
                return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-destructive/10 text-destructive">Rejected</span>
            default:
                return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">Not Submitted</span>
        }
    }

    const renderKYCImage = (imageUrl: string | undefined, title: string, icon: React.ReactNode) => {
        if (!imageUrl) {
            return (
                <div className="bg-muted/50 border border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center min-h-[120px]">
                    {icon}
                    <p className="text-xs text-muted-foreground mt-2">{title}</p>
                    <p className="text-xs text-muted-foreground">Not uploaded</p>
                </div>
            )
        }

        return (
            <div
                className="relative group cursor-pointer bg-muted/50 border border-border rounded-lg overflow-hidden"
                onClick={() => setSelectedImage({ url: imageUrl, title })}
            >
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white" />
                </div>
                <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 px-2 text-center">
                    {title}
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
                <div
                    className="bg-card border border-border rounded-lg w-full max-w-2xl animate-fade-in max-h-[90vh] overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <h2 className="text-lg font-bold text-foreground">Vendor Details</h2>
                        <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : vendor ? (
                        <>
                            {/* Vendor Header */}
                            <div className="flex flex-col items-center p-4 border-b border-border">
                                <div className="w-20 h-20 rounded-full bg-muted overflow-hidden mb-3">
                                    {vendor.avatar ? (
                                        <img src={vendor.avatar} alt={vendor.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                                            {vendor.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">{vendor.name}</h3>
                                <p className="text-sm text-muted-foreground">{vendor.businessName}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={cn(
                                        'px-2 py-0.5 text-xs font-medium rounded-full',
                                        vendor.isBlocked ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                                    )}>
                                        {vendor.isBlocked ? 'Blocked' : 'Active'}
                                    </span>
                                    {getKYCBadge()}
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-border">
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={cn(
                                        'flex-1 py-2.5 text-sm font-medium transition-colors',
                                        activeTab === 'details'
                                            ? 'text-primary border-b-2 border-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    Details
                                </button>
                                <button
                                    onClick={() => setActiveTab('kyc')}
                                    className={cn(
                                        'flex-1 py-2.5 text-sm font-medium transition-colors relative',
                                        activeTab === 'kyc'
                                            ? 'text-primary border-b-2 border-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    KYC Documents
                                    {vendor.kycStatus === 'pending' && (
                                        <span className="absolute top-1 right-1/4 w-2 h-2 bg-warning rounded-full" />
                                    )}
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {activeTab === 'details' ? (
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between py-2 border-b border-border">
                                            <span className="text-muted-foreground">Email</span>
                                            <span className="text-foreground font-medium">{vendor.email}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-border">
                                            <span className="text-muted-foreground">Phone</span>
                                            <span className="text-foreground font-medium">{vendor.phone}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-border">
                                            <span className="text-muted-foreground">Category</span>
                                            <span className="text-foreground font-medium capitalize">{vendor.category || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-border">
                                            <span className="text-muted-foreground">Experience</span>
                                            <span className="text-foreground font-medium">{vendor.experienceYears || 0} years</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-border">
                                            <span className="text-muted-foreground">Rating</span>
                                            <span className="text-foreground font-medium flex items-center gap-1">
                                                <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                                                {vendor.rating?.toFixed(1) || '0.0'} ({vendor.reviewCount || 0} reviews)
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-border">
                                            <span className="text-muted-foreground">Joined</span>
                                            <span className="text-foreground font-medium">
                                                {new Date(vendor.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {vendor.address && (
                                            <div className="flex justify-between py-2 border-b border-border">
                                                <span className="text-muted-foreground">Address</span>
                                                <span className="text-foreground font-medium text-right max-w-[60%]">
                                                    {[vendor.address.street, vendor.address.city, vendor.address.state, vendor.address.pincode]
                                                        .filter(Boolean).join(', ') || 'N/A'}
                                                </span>
                                            </div>
                                        )}
                                        {vendor.description && (
                                            <div className="py-2">
                                                <span className="text-muted-foreground block mb-1">Description</span>
                                                <p className="text-foreground text-sm">{vendor.description}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {vendor.kycStatus === 'not_submitted' ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p>Vendor has not submitted KYC documents yet</p>
                                            </div>
                                        ) : (
                                            <>
                                                {/* KYC Personal Info */}
                                                {vendor.kyc && (
                                                    <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
                                                        <h4 className="font-medium text-foreground flex items-center gap-2">
                                                            <User className="w-4 h-4" />
                                                            Personal Information
                                                        </h4>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <span className="text-muted-foreground text-xs">Name</span>
                                                                <p className="text-foreground">{vendor.kyc.name || vendor.name}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground text-xs">Phone</span>
                                                                <p className="text-foreground">{vendor.kyc.phone || vendor.phone}</p>
                                                            </div>
                                                            <div className="col-span-2">
                                                                <span className="text-muted-foreground text-xs">Email</span>
                                                                <p className="text-foreground">{vendor.kyc.email || vendor.email}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* KYC Documents */}
                                                <div>
                                                    <h4 className="font-medium text-foreground flex items-center gap-2 mb-3">
                                                        <FileText className="w-4 h-4" />
                                                        Identity Documents
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {renderKYCImage(
                                                            vendor.kyc?.aadhaarFrontImage,
                                                            'Aadhaar Front',
                                                            <CreditCard className="w-8 h-8 text-muted-foreground" />
                                                        )}
                                                        {renderKYCImage(
                                                            vendor.kyc?.aadhaarBackImage,
                                                            'Aadhaar Back',
                                                            <CreditCard className="w-8 h-8 text-muted-foreground" />
                                                        )}
                                                        {renderKYCImage(
                                                            vendor.kyc?.panCardImage,
                                                            'PAN Card',
                                                            <CreditCard className="w-8 h-8 text-muted-foreground" />
                                                        )}
                                                        {renderKYCImage(
                                                            vendor.kyc?.ownerLivePhoto,
                                                            'Owner Photo',
                                                            <Image className="w-8 h-8 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Bank Details */}
                                                {vendor.kyc && (vendor.kyc.bankAccountNumber || vendor.bankDetails?.accountNumber) && (
                                                    <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
                                                        <h4 className="font-medium text-foreground flex items-center gap-2">
                                                            <CreditCard className="w-4 h-4" />
                                                            Bank Details
                                                        </h4>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <span className="text-muted-foreground text-xs">Account Holder</span>
                                                                <p className="text-foreground">
                                                                    {vendor.kyc?.bankAccountHolderName || vendor.bankDetails?.accountHolderName || 'N/A'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground text-xs">Account Number</span>
                                                                <p className="text-foreground">
                                                                    {vendor.kyc?.bankAccountNumber || vendor.bankDetails?.accountNumber || 'N/A'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground text-xs">Bank Name</span>
                                                                <p className="text-foreground">
                                                                    {vendor.kyc?.bankName || vendor.bankDetails?.bankName || 'N/A'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground text-xs">IFSC Code</span>
                                                                <p className="text-foreground">
                                                                    {vendor.kyc?.ifscCode || vendor.bankDetails?.ifscCode || 'N/A'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* KYC Submission Info */}
                                                {vendor.kyc?.submittedAt && (
                                                    <p className="text-xs text-muted-foreground text-center">
                                                        Submitted on {new Date(vendor.kyc.submittedAt).toLocaleDateString()} at{' '}
                                                        {new Date(vendor.kyc.submittedAt).toLocaleTimeString()}
                                                    </p>
                                                )}

                                                {/* Rejection Reason */}
                                                {vendor.kycStatus === 'rejected' && vendor.kyc?.rejectionReason && (
                                                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                                                        <p className="text-sm text-destructive font-medium">Rejection Reason:</p>
                                                        <p className="text-sm text-destructive/80">{vendor.kyc.rejectionReason}</p>
                                                    </div>
                                                )}

                                                {/* KYC Actions */}
                                                {vendor.kycStatus === 'pending' && (
                                                    <div className="flex gap-3 pt-2">
                                                        <button
                                                            onClick={handleApproveKYC}
                                                            disabled={isUpdatingKYC}
                                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-success text-white rounded-lg font-medium hover:bg-success/90 transition-colors disabled:opacity-50"
                                                        >
                                                            {isUpdatingKYC ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <CheckCircle className="w-4 h-4" />
                                                            )}
                                                            Approve KYC
                                                        </button>
                                                        <button
                                                            onClick={() => setShowRejectModal(true)}
                                                            disabled={isUpdatingKYC}
                                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-destructive text-white rounded-lg font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                            Reject KYC
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-border">
                                <button
                                    onClick={onClose}
                                    className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            Failed to load vendor details
                        </div>
                    )}
                </div>
            </div>

            {/* Image Preview Modal */}
            <ImageModal
                imageUrl={selectedImage?.url || null}
                title={selectedImage?.title || ''}
                onClose={() => setSelectedImage(null)}
            />

            {/* Reject KYC Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60" onClick={() => setShowRejectModal(false)}>
                    <div
                        className="bg-card border border-border rounded-lg p-4 w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-foreground mb-3">Reject KYC</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            Please provide a reason for rejecting this vendor's KYC documents.
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            className="w-full p-3 bg-background border border-input rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                            rows={4}
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false)
                                    setRejectionReason('')
                                }}
                                className="flex-1 py-2 border border-input rounded-lg font-medium hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectKYC}
                                disabled={!rejectionReason.trim() || isUpdatingKYC}
                                className="flex-1 py-2 bg-destructive text-white rounded-lg font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isUpdatingKYC && <Loader2 className="w-4 h-4 animate-spin" />}
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export function VendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [pagination, setPagination] = useState<Pagination | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [kycFilter, setKycFilter] = useState('all')
    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
    const [blockingVendorId, setBlockingVendorId] = useState<string | null>(null)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500)
        return () => clearTimeout(timer)
    }, [search])

    const fetchVendors = useCallback(async (page = 1) => {
        setIsLoading(true)
        try {
            const response = await getVendors({
                page,
                limit: 10,
                search: debouncedSearch,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                kycStatus: kycFilter !== 'all' ? kycFilter : undefined,
            })
            if (response.success) {
                setVendors(response.response.vendors)
                setPagination(response.response.pagination)
            }
        } catch (err) {
            console.error('Failed to fetch vendors:', err)
        } finally {
            setIsLoading(false)
        }
    }, [debouncedSearch, statusFilter, kycFilter])

    useEffect(() => {
        fetchVendors(1)
    }, [fetchVendors])

    const handleToggleBlock = async (vendor: Vendor) => {
        setBlockingVendorId(vendor._id)
        try {
            const response = await toggleVendorBlock(vendor._id)
            if (response.success) {
                setVendors((prev) =>
                    prev.map((v) =>
                        v._id === vendor._id ? { ...v, isBlocked: response.response.isBlocked } : v
                    )
                )
            }
        } catch (err) {
            console.error('Failed to toggle block:', err)
        } finally {
            setBlockingVendorId(null)
        }
    }

    const handleKYCUpdate = () => {
        fetchVendors(pagination?.page || 1)
    }

    const getKYCIcon = (status: string) => {
        switch (status) {
            case 'verified':
                return <ShieldCheck className="w-3 h-3" />
            case 'pending':
                return <Clock className="w-3 h-3" />
            case 'rejected':
                return <ShieldX className="w-3 h-3" />
            default:
                return null
        }
    }

    const getKYCStyle = (status: string) => {
        switch (status) {
            case 'verified':
                return 'bg-success/10 text-success'
            case 'pending':
                return 'bg-warning/10 text-warning'
            case 'rejected':
                return 'bg-destructive/10 text-destructive'
            default:
                return 'bg-muted text-muted-foreground'
        }
    }

    return (
        <div className="animate-fade-in">
            <div className="mb-4">
                <h1 className="text-xl font-bold text-foreground">Vendors</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Manage all registered vendors</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by name, email, business..."
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

                <select
                    value={kycFilter}
                    onChange={(e) => setKycFilter(e.target.value)}
                    className="px-3 py-2 bg-card border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                >
                    <option value="all">All KYC</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                    <option value="not_submitted">Not Submitted</option>
                </select>

                <button
                    onClick={() => fetchVendors(pagination?.page || 1)}
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
                                <th className="text-left p-3 font-medium text-muted-foreground">Vendor</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Business</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Phone</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">KYC</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Rating</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => <VendorSkeleton key={i} />)
                            ) : vendors.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                                        No vendors found
                                    </td>
                                </tr>
                            ) : (
                                vendors.map((vendor) => (
                                    <tr key={vendor._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                                                    {vendor.avatar ? (
                                                        <img src={vendor.avatar} alt={vendor.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-medium text-muted-foreground">
                                                            {vendor.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground text-sm">{vendor.name}</p>
                                                    <p className="text-xs text-muted-foreground">{vendor.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3 text-muted-foreground">{vendor.businessName}</td>
                                        <td className="p-3 text-muted-foreground">{vendor.phone}</td>
                                        <td className="p-3">
                                            <span className={cn(
                                                'px-2 py-0.5 text-xs font-medium rounded-full',
                                                vendor.isBlocked ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                                            )}>
                                                {vendor.isBlocked ? 'Blocked' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span className={cn(
                                                'px-2 py-0.5 text-xs font-medium rounded-full inline-flex items-center gap-1',
                                                getKYCStyle(vendor.kycStatus)
                                            )}>
                                                {getKYCIcon(vendor.kycStatus)}
                                                <span className="capitalize">{vendor.kycStatus?.replace('_', ' ') || 'N/A'}</span>
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                <Star className="w-3 h-3 text-warning fill-warning" />
                                                {vendor.rating?.toFixed(1) || '0.0'}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setSelectedVendorId(vendor._id)}
                                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleBlock(vendor)}
                                                    disabled={blockingVendorId === vendor._id}
                                                    className={cn(
                                                        'p-1.5 rounded transition-colors',
                                                        vendor.isBlocked
                                                            ? 'text-success hover:bg-success/10'
                                                            : 'text-destructive hover:bg-destructive/10'
                                                    )}
                                                    title={vendor.isBlocked ? 'Unblock Vendor' : 'Block Vendor'}
                                                >
                                                    {blockingVendorId === vendor._id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : vendor.isBlocked ? (
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
                                onClick={() => fetchVendors(pagination.page - 1)}
                                disabled={pagination.page === 1 || isLoading}
                                className="p-1.5 hover:bg-muted rounded transition-colors disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-2 text-muted-foreground">
                                {pagination.page} / {pagination.pages}
                            </span>
                            <button
                                onClick={() => fetchVendors(pagination.page + 1)}
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
            <VendorDetailModal
                vendorId={selectedVendorId}
                onClose={() => setSelectedVendorId(null)}
                onKYCUpdate={handleKYCUpdate}
            />
        </div>
    )
}
