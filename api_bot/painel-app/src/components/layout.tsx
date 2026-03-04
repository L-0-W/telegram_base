import { Search, Moon, Sun, Github, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function SiteHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center px-8">
                <div className="mr-8 flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6">
                        <rect width="256" height="256" fill="none"></rect>
                        <line x1="208" y1="128" x2="128" y2="208" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
                        <line x1="192" y1="40" x2="40" y2="192" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
                    </svg>
                    <span className="font-bold sm:inline-block">shadcn/vue</span>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <nav className="flex items-center space-x-6 text-sm font-medium mr-auto">
                        <a className="transition-colors hover:text-foreground/80 text-foreground" href="#">Home</a>
                        <a className="transition-colors hover:text-foreground/80 text-foreground/60" href="#">Docs</a>
                        <a className="transition-colors hover:text-foreground/80 text-foreground/60" href="#">Components</a>
                        <a className="transition-colors hover:text-foreground/80 text-foreground/60" href="#">Blocks</a>
                        <a className="transition-colors hover:text-foreground/80 text-foreground/60" href="#">Themes</a>
                    </nav>
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search documentation..."
                                className="h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-4 text-sm shadow-sm md:w-64 lg:w-[300px]"
                            />
                            <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                        </div>
                    </div>
                    <nav className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <Github className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                    </nav>
                </div>
            </div>
        </header>
    )
}

export function Hero() {
    return (
        <div className="container px-8 py-10 md:py-16 max-w-screen-2xl">
            <div className="flex flex-col items-start gap-4 mx-auto">
                <a href="#" className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium">
                    🎉 <span className="sm:hidden ml-2">Get Started with Tailwind v4</span>
                    <span className="hidden sm:inline ml-2">Get Started with Tailwind v4</span>
                    <ArrowRight className="ml-1 h-4 w-4" />
                </a>
                <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:leading-[1.1]">
                    Build your component library
                </h1>
                <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
                    Beautifully designed components that you can copy and paste into your apps.
                    <br className="hidden sm:inline" /> Made with Tailwind CSS. Open source.
                </p>
                <div className="flex w-full items-center justify-start gap-4 py-4 md:pb-10">
                    <Button className="h-10 px-6 font-semibold">Get Started</Button>
                    <Button variant="outline" className="h-10 px-6 font-semibold">
                        <Github className="mr-2 h-4 w-4" /> GitHub
                    </Button>
                </div>
            </div>
        </div>
    )
}
