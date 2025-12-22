import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { setupAdmin } from '../lib/api'

export function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [setupMessage, setSetupMessage] = useState('')
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            await login(email, password)
            navigate('/')
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Login failed')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSetup = async () => {
        setIsLoading(true)
        setError('')
        setSetupMessage('')
        try {
            const response = await setupAdmin()
            if (response.success) {
                setSetupMessage(
                    `Default admin created! Email: ${response.response.email}, Password: Admin@123`
                )
            }
        } catch (err: any) {
            if (err.response?.data?.message) {
                setError(err.response.data.message)
            } else {
                setError('Failed to create default admin')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-xl mb-3">
                        <LogIn className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h1 className="text-xl font-bold text-foreground">Plenify Admin</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Sign in to continue</p>
                </div>

                {/* Login Card */}
                <div className="bg-card border border-border rounded-lg p-5">
                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded text-destructive text-xs">
                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Setup Message */}
                        {setupMessage && (
                            <div className="p-2.5 bg-success/10 border border-success/20 rounded text-success text-xs">
                                {setupMessage}
                            </div>
                        )}

                        {/* Email Input */}
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="text-xs font-medium text-foreground">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@plenify.com"
                                className="w-full px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                                required
                            />
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <label htmlFor="password" className="text-xs font-medium text-foreground">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full px-3 py-2 pr-9 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Setup Button */}
                    <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground text-center mb-2">
                            First time? Create default admin
                        </p>
                        <button
                            onClick={handleSetup}
                            disabled={isLoading}
                            className="w-full py-2 bg-secondary text-secondary-foreground rounded text-xs font-medium hover:bg-secondary/80 disabled:opacity-50 transition-all"
                        >
                            Setup Default Admin
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}