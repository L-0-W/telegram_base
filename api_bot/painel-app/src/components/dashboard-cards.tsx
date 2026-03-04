import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Minus } from "lucide-react"
import { Input } from "@/components/ui/input"

export function RevenueCard() {
    return (
        <Card className="col-span-12 md:col-span-4 bg-[#09090b] border-border/40">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">$15,231.89</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                <div className="mt-4 h-[80px]">
                    <svg viewBox="0 0 200 80" className="w-full h-full preserve-aspect-ratio text-primary fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="0,60 20,50 40,65 60,70 80,68 100,55 120,60 140,55 160,52 180,40 200,10" />
                        <circle cx="200" cy="10" r="3" className="fill-current" />
                        <circle cx="180" cy="40" r="2" className="fill-current" />
                        <circle cx="120" cy="60" r="2" className="fill-current" />
                    </svg>
                </div>
            </CardContent>
        </Card>
    )
}

export function SubscriptionsCard() {
    return (
        <Card className="col-span-12 md:col-span-4 bg-[#09090b] border-border/40">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">+2350</div>
                <p className="text-xs text-muted-foreground">+54.8% from last month</p>
                <div className="mt-4 h-[80px] flex items-end gap-1.5 pt-4">
                    {[40, 60, 45, 80, 50, 65, 55, 75, 50, 40].map((h, i) => (
                        <div key={i} className="bg-primary flex-1 opacity-90 rounded-sm" style={{ height: `${h}%` }}></div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export function CalendarCard() {
    return (
        <Card className="col-span-12 md:col-span-4 lg:col-span-3 bg-[#09090b] border-border/40 p-1 flex justify-center items-center">
            <Calendar
                mode="single"
                selected={new Date(2025, 9, 16)}
                className="rounded-md border-0 pointer-events-none"
            />
        </Card>
    )
}

export function GoalCard() {
    return (
        <Card className="col-span-12 md:col-span-4 lg:col-span-5 bg-[#09090b] border-border/40">
            <CardHeader>
                <CardTitle className="text-sm font-medium">Move Goal</CardTitle>
                <CardDescription>Set your daily activity goal.</CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
                <div className="flex items-center justify-center space-x-4 mb-4">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                        <Minus className="h-4 w-4" />
                    </Button>
                    <div className="text-center">
                        <div className="text-5xl font-bold tracking-tighter">350</div>
                        <div className="text-xs font-semibold uppercase text-muted-foreground">Calories/day</div>
                    </div>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <div className="h-[60px] flex items-end gap-1 px-4 mt-6">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="bg-muted-foreground/30 flex-1 rounded-sm" style={{ height: `${Math.random() * 40 + 20}%` }}></div>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="pt-6">
                <Button className="w-full">Set Goal</Button>
            </CardFooter>
        </Card>
    )
}

export function TeamMembersCard() {
    return (
        <Card className="col-span-12 md:col-span-5 bg-[#09090b] border-border/40">
            <CardHeader>
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <CardDescription>Invite your team members to collaborate.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>SD</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-medium leading-none">Sofia Davis</p>
                            <p className="text-sm text-muted-foreground">m@example.com</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto flex items-center gap-2 text-muted-foreground border-border/40 bg-transparent hover:bg-muted/50">
                        Owner
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"><path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                    </Button>
                </div>
                <div className="flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>JL</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-medium leading-none">Jackson Lee</p>
                            <p className="text-sm text-muted-foreground">p@example.com</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto flex items-center gap-2 text-muted-foreground border-border/40 bg-transparent hover:bg-muted/50">
                        Member
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"><path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                    </Button>
                </div>
                <div className="flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>IN</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-medium leading-none">Isabella Nguyen</p>
                            <p className="text-sm text-muted-foreground">i@example.com</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto flex items-center gap-2 text-muted-foreground border-border/40 bg-transparent hover:bg-muted/50">
                        Member
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"><path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export function ChatCard() {
    return (
        <Card className="col-span-12 md:col-span-7 bg-[#09090b] border-border/40 flex flex-col justify-between h-full">
            <CardHeader className="flex flex-row items-center border-b border-border/40 pb-4">
                <div className="flex items-center space-x-4">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>SD</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-medium leading-none">Sofia Davis</p>
                        <p className="text-sm text-muted-foreground">m@example.com</p>
                    </div>
                </div>
                <Button size="icon" variant="outline" className="ml-auto rounded-full w-8 h-8 bg-transparent text-muted-foreground border-border/40 hover:bg-muted/50">
                    <Plus className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="pt-4 flex-1">
                <div className="space-y-4">
                    <div className="flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm bg-muted text-foreground">
                        Hi, how can I help you today?
                    </div>
                    <div className="flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm ml-auto bg-primary text-primary-foreground">
                        Hey, I'm having trouble with my account.
                    </div>
                    <div className="flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm bg-muted text-foreground">
                        What seems to be the problem?
                    </div>
                    <div className="flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm ml-auto bg-primary text-primary-foreground">
                        I can't log in.
                    </div>
                </div>
            </CardContent>
            <CardFooter className="pt-2">
                <form className="flex w-full items-center space-x-2">
                    <Input id="message" placeholder="Type a message..." className="flex-1 bg-transparent border-border/40" autoComplete="off" />
                    <Button type="submit" size="icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
            </CardFooter>
        </Card>
    )
}
