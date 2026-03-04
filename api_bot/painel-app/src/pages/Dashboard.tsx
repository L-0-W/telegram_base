import type { ReactNode } from "react"
import { Link, useLocation } from "react-router-dom"
import { Users, Settings, LogOut, Search, Bell, Menu, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface DashboardLayoutProps {
    children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const location = useLocation()

    return (
        <div className="min-h-screen bg-[#000000] text-foreground font-sans flex flex-col md:flex-row selection:bg-primary/30">

            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex flex-col w-64 border-r border-border/40 bg-[#09090b] shadow-xl z-20">
                <div className="h-16 flex items-center px-6 border-b border-border/40">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6 text-primary">
                            <rect width="256" height="256" fill="none"></rect>
                            <line x1="208" y1="128" x2="128" y2="208" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
                            <line x1="192" y1="40" x2="40" y2="192" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
                        </svg>
                        <span className="font-bold tracking-tight text-lg">painel/vue</span>
                    </div>
                </div>

                <div className="flex-1 py-6 px-4 space-y-1">
                    <div className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Menu Principal
                    </div>

                    <Link to="/dashboard">
                        <Button
                            variant={location.pathname === "/dashboard" ? "secondary" : "ghost"}
                            className="w-full justify-start font-normal h-10 px-3"
                        >
                            <Users className="mr-3 h-4 w-4" />
                            Usuários
                        </Button>
                    </Link>

                    <Link to="/dashboard/settings">
                        <Button
                            variant={location.pathname === "/dashboard/settings" ? "secondary" : "ghost"}
                            className="w-full justify-start font-normal h-10 px-3 mt-1"
                        >
                            <Settings className="mr-3 h-4 w-4" />
                            Configurações
                        </Button>
                    </Link>
                </div>

                <div className="p-4 border-t border-border/40">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer">
                        <Avatar className="h-9 w-9 border border-border/40">
                            <AvatarFallback className="bg-primary/20 text-primary">AD</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium leading-none mb-1 truncate">Admin User</span>
                            <span className="text-xs text-muted-foreground truncate">admin@exemplo.com</span>
                        </div>
                    </div>
                    <Link to="/">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-muted-foreground hover:text-destructive mt-2"
                            onClick={() => localStorage.removeItem("admin_auth_token")}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sair
                        </Button>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen relative max-w-full">
                {/* Mobile Header */}
                <header className="h-16 border-b border-border/40 bg-[#09090b]/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-10 md:px-8">
                    <div className="flex items-center md:hidden gap-2">
                        <Button variant="ghost" size="icon" className="mr-2">
                            <Menu className="h-5 w-5" />
                        </Button>
                        <span className="font-bold tracking-tight">painel/vue</span>
                    </div>

                    {/* Topbar Right - Search & Actions */}
                    <div className="flex items-center gap-4 ml-auto w-full md:w-auto mt-0">
                        <div className="relative hidden sm:block flex-1 md:w-64 lg:w-80">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="search" placeholder="Pesquisar..." className="h-9 w-full rounded-md bg-muted/40 border-0 pl-9 focus-visible:ring-1 focus-visible:ring-primary/50" />
                        </div>
                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 relative">
                            <Bell className="h-4 w-4" />
                            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-primary rounded-full"></span>
                        </Button>
                    </div>
                </header>

                {/* Dynamic Route Content */}
                <main className="flex-1 p-6 lg:p-10 overflow-auto bg-[#000000] relative">
                    {children}
                </main>
            </div>
        </div>
    )
}

// "Em Construção" Placeholder Component
export function UnderConstruction({ title }: { title: string }) {
    return (
        <div className="h-full min-h-[60vh] flex flex-col items-center justify-center text-center p-8 border border-dashed border-border/50 rounded-2xl bg-[#09090b]/30 backdrop-blur-sm">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 shadow-inner border border-border/40">
                <Wrench className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-3">{title}</h2>
            <p className="text-muted-foreground max-w-md text-lg">
                Esta central está em construção.<br />Voltaremos em breve com novidades.
            </p>
        </div>
    )
}
