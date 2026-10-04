import { Moon, Sun } from 'lucide-react'
import { setTheme, useTheme } from './theme'

export default function ThemeToggle({ variant }: { variant: 'inline' | 'row' }) {
    const theme = useTheme()
    const next = theme === 'dark' ? 'light' : 'dark'
    const Icon = theme === 'dark' ? Sun : Moon
    const label = `Switch to ${next} mode`

    if (variant === 'inline') {
        return (
            <button
                type="button"
                onClick={() => setTheme(next)}
                aria-label={label}
                title={label}
                className="snd min-[900px]:!hidden"
            >
                <Icon size={18} strokeWidth={2.2} />
            </button>
        )
    }

    return (
        <button
            type="button"
            onClick={() => setTheme(next)}
            aria-label={label}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 bg-transparent px-3.5 py-2.5 text-left text-[15px] font-semibold text-[var(--mute)] transition-colors hover:text-[var(--text)]"
        >
            <Icon size={19} strokeWidth={2.2} /> {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
    )
}