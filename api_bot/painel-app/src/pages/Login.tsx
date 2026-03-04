import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, ArrowRight, ShieldCheck, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

export function Login() {
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [hasAdmin, setHasAdmin] = useState<boolean | null>(null)

    useEffect(() => {
        // Fetch setup status on mount
        const checkStatus = async () => {
            try {
                const response = await fetch("http://localhost:3000/api/setup/status")
                if (response.ok) {
                    const data = await response.json()
                    setHasAdmin(data.hasAdmin)
                } else {
                    setError("Erro ao se conectar com o servidor.")
                }
            } catch (err) {
                setError("Erro de rede. O servidor backend está rodando?")
            } finally {
                setLoading(false)
            }
        }
        checkStatus()
    }, [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsSubmitting(true)

        try {
            const response = await fetch("http://localhost:3000/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            })

            const data = await response.json()

            if (response.ok && data.success) {
                localStorage.setItem("admin_auth_token", data.token)
                navigate("/dashboard")
            } else {
                setError(data.error || "Erro ao fazer login.")
            }
        } catch (err) {
            setError("Erro ao conectar com servidor.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (password !== confirmPassword) {
            setError("As senhas não coincidem.")
            return
        }

        setIsSubmitting(true)

        try {
            const response = await fetch("http://localhost:3000/api/setup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            })

            const data = await response.json()

            if (response.ok && data.success) {
                localStorage.setItem("admin_auth_token", data.token)
                navigate("/dashboard")
            } else {
                setError(data.error || "Erro ao configurar admin.")
            }
        } catch (err) {
            setError("Erro ao conectar com servidor.")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-[#000000] text-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#000000] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.2),rgba(255,255,255,0))] selection:bg-primary/30 text-foreground font-sans">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-primary/10 p-3 rounded-2xl mb-4 border border-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.1)]">
                        <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Bem-vindo ao Painel</h1>
                    <p className="text-muted-foreground mt-2">Acesse sua conta para continuar</p>
                </div>

                {hasAdmin ? (
                    <Card className="bg-[#09090b]/80 border-border/40 backdrop-blur-xl shadow-2xl">
                        <CardHeader>
                            <CardTitle>Acessar conta</CardTitle>
                            <CardDescription>
                                Insira seu e-mail e senha de administrador.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleLogin}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@exemplo.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-transparent/50 border-input/50"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Senha</Label>
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-transparent/50 border-input/50"
                                        disabled={isSubmitting}
                                    />
                                    {error && <p className="text-sm text-destructive font-medium mt-1">{error}</p>}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all">
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Entrar <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                ) : (
                    <Card className="bg-[#09090b]/80 border-border/40 backdrop-blur-xl shadow-2xl">
                        <CardHeader>
                            <CardTitle>Configuração Inicial</CardTitle>
                            <CardDescription>
                                Crie a conta de administrador do sistema.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSetup}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email-setup">Email do Administrador</Label>
                                    <Input
                                        id="email-setup"
                                        type="email"
                                        placeholder="admin@exemplo.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-transparent/50 border-input/50"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password-setup">Senha</Label>
                                    <Input
                                        id="password-setup"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-transparent/50 border-input/50"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password-confirm">Confirmar Senha</Label>
                                    <Input
                                        id="password-confirm"
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="bg-transparent/50 border-input/50"
                                        disabled={isSubmitting}
                                    />
                                    {error && <p className="text-sm text-destructive font-medium mt-1">{error}</p>}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button disabled={isSubmitting} className="w-full border-border/50 bg-primary hover:bg-primary/90 text-primary-foreground" type="submit">
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    <ShieldCheck className="mr-2 w-4 h-4" /> Criar Conta de Administrador
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                )}
            </motion.div>
        </div>
    )
}
