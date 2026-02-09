import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
    icon?: LucideIcon
    title: string
    description: string
    actionLabel?: string
    onAction?: () => void
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className,
    ...props
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex min-h-[400px] flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500",
                className
            )}
            {...props}
        >
            {Icon && (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
                    <Icon className="h-10 w-10 text-muted-foreground" />
                </div>
            )}
            <h3 className="text-2xl font-bold tracking-tight text-foreground mb-3">
                {title}
            </h3>
            <p className="text-base text-muted-foreground max-w-md mb-8 leading-relaxed">
                {description}
            </p>
            {actionLabel && onAction && (
                <Button onClick={onAction} size="lg" className="w-full sm:w-auto">
                    {actionLabel}
                </Button>
            )}
        </div>
    )
}
