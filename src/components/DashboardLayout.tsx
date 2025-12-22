// File: src/components/DashboardLayout.tsx
import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    Users,
    Store,
    Tag,
    Menu,
    X,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Image,
    Calendar,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../context/AuthContext'

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/users', icon: Users, label: 'Users' },
    { to: '/vendors', icon: Store, label: 'Vendors' },
    { to: '/events', icon: Calendar, label: 'Events' },
    { to: '/categories', icon: Tag, label: 'Categories' },
    { to: '/banners', icon: Image, label: 'Banners' },
]

export function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const { admin, logout } = useAuth()
    const location = useLocation()

    return (
        <div className="min-h-screen flex bg-background">
            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 bg-sidebar text-sidebar-foreground transition-all duration-200 ease-out lg:relative',
                    sidebarOpen ? 'w-52' : 'w-14',
                    mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                {/* Logo Area */}
                <div className={cn(
                    'h-12 flex items-center border-b border-border/30 px-3',
                    sidebarOpen ? 'justify-between' : 'justify-center'
                )}>
                    {sidebarOpen && (
                        <h1 className="text-base font-bold text-foreground">Plenify</h1>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1 rounded hover:bg-sidebar-hover transition-colors hidden lg:flex"
                    >
                        {sidebarOpen ? (
                            <ChevronLeft className="w-4 h-4" />
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )}
                    </button>
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-1 rounded hover:bg-sidebar-hover transition-colors lg:hidden"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-2 space-y-0.5">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.to
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    'flex items-center gap-2.5 px-2.5 py-2 rounded transition-all duration-150',
                                    isActive
                                        ? 'bg-sidebar-active text-foreground'
                                        : 'text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-foreground'
                                )}
                            >
                                <item.icon className="w-4 h-4 flex-shrink-0" />
                                {sidebarOpen && (
                                    <span className="text-sm font-medium">{item.label}</span>
                                )}
                            </NavLink>
                        )
                    })}
                </nav>

                {/* User Section */}
                <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-border/30">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-2 px-2 py-1.5">
                            <div className="w-7 h-7 rounded-full bg-sidebar-hover flex items-center justify-center overflow-hidden">
                                {admin?.avatar ? (
                                    <img
                                        src={admin.avatar}
                                        alt={admin.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-xs font-medium">
                                        {admin?.name?.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">
                                    {admin?.name}
                                </p>
                                <p className="text-[10px] text-sidebar-foreground/60 truncate">
                                    {admin?.role}
                                </p>
                            </div>
                            <button
                                onClick={logout}
                                className="p-1.5 rounded hover:bg-sidebar-hover transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={logout}
                            className="w-full flex justify-center p-1.5 rounded hover:bg-sidebar-hover transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top Bar */}
                <header className="h-12 bg-card border-b border-border flex items-center px-3 lg:px-4 sticky top-0 z-30">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-1.5 rounded hover:bg-muted transition-colors lg:hidden"
                    >
                        <Menu className="w-4 h-4" />
                    </button>
                    <div className="flex-1" />
                </header>

                {/* Page Content */}
                <main className="flex-1 p-3 lg:p-4 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
