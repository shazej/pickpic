import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface ScreenShellProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string
    showBackButton?: boolean
    onBack?: () => void
    actionParams?: {
        label: string
        onClick: () => void
        disabled?: boolean
        loading?: boolean
        variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    }
    children: React.ReactNode
}

export function ScreenShell({
    title,
    showBackButton = true,
    onBack,
    actionParams,
    children,
    className,
    ...props
}: ScreenShellProps) {
    const router = useRouter()

    const handleBack = () => {
        if (onBack) {
            onBack()
        } else {
            router.back()
        }
    }

    return (
        <div className={cn("flex flex-col min-h-screen bg-background", className)} {...props}>
            {/* Header */}
            <header className="sticky top-0 z-40 flex h-14 items-center border-b bg-background/80 px-4 backdrop-blur-md">
                {showBackButton && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="mr-2 -ml-2 text-muted-foreground hover:text-foreground"
                        onClick={handleBack}
                        aria-label="Go Back"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                )}
                {title && (
                    <h1 className="text-lg font-semibold tracking-tight text-foreground line-clamp-1 flex-1">
                        {title}
                    </h1>
                )}
            </header>

            {/* Main Content - Scrollable */}
            <main className="flex-1 overflow-auto p-4 md:p-6 pb-24">
                <div className="mx-auto max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </main>

            {/* Sticky Bottom Action Bar */}
            {actionParams && (
                <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="mx-auto max-w-2xl">
                        <Button
                            className="w-full shadow-lg"
                            size="lg"
                            onClick={actionParams.onClick}
                            disabled={actionParams.disabled || actionParams.loading}
                            variant={actionParams.variant || "default"}
                        >
                            {actionParams.loading ? "Please wait..." : actionParams.label}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
