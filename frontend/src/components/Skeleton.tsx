interface SkeletonProps {
    className?: string
    count?: number
}

function SkeletonBlock({ className }: { className?: string }) {
    return <div className={`skeleton-pulse ${className ?? ''}`} />
}

export default function Skeleton({ className, count = 1 }: SkeletonProps) {
    if (count === 1) return <SkeletonBlock className={className} />
    return (
        <>
            {Array.from({ length: count }, (_, i) => (
                <SkeletonBlock key={i} className={className} />
            ))}
        </>
    )
}

/** Pre-built skeleton that mimics a glass-card with content rows */
export function CardSkeleton() {
    return (
        <div className="glass-card p-6 flex flex-col gap-4">
            <SkeletonBlock className="h-5 w-1/3 rounded-lg" />
            <SkeletonBlock className="h-3 w-2/3 rounded-lg" />
            <div className="flex gap-3 mt-2">
                <SkeletonBlock className="h-20 flex-1 rounded-xl" />
                <SkeletonBlock className="h-20 flex-1 rounded-xl" />
            </div>
            <SkeletonBlock className="h-3 w-1/2 rounded-lg mt-2" />
            <SkeletonBlock className="h-3 w-3/4 rounded-lg" />
        </div>
    )
}

/** Wide skeleton matching StrategyGauntlet shape */
export function TableSkeleton() {
    return (
        <div className="glass-card p-6 flex flex-col gap-4">
            <SkeletonBlock className="h-5 w-1/4 rounded-lg" />
            <SkeletonBlock className="h-3 w-1/2 rounded-lg" />
            {Array.from({ length: 4 }, (_, i) => (
                <SkeletonBlock key={i} className="h-14 w-full rounded-xl" />
            ))}
        </div>
    )
}
