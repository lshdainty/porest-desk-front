import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/shared/lib/index'
import { Input } from '@/shared/ui/input'

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#14B8A6', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7',
  '#D946EF', '#EC4899', '#F43F5E',
  '#78716C', '#6B7280', '#64748B', '#92400E',
  '#065F46', '#1E3A5F', '#4C1D95', '#831843',
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  className?: string
}

export const ColorPicker = ({ value, onChange, className }: ColorPickerProps) => {
  const [open, setOpen] = useState(false)
  const [hexInput, setHexInput] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHexInput(value)
  }, [value])

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handlePresetClick = useCallback((color: string) => {
    onChange(color)
    setHexInput(color)
    setOpen(false)
  }, [onChange])

  const handleHexChange = useCallback((hex: string) => {
    setHexInput(hex)
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onChange(hex)
    }
  }, [onChange])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background shadow-sm transition-colors hover:bg-accent"
      >
        <div
          className="h-6 w-6 rounded-sm border border-border/50"
          style={{ backgroundColor: value }}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border bg-popover p-3 shadow-md">
          <div className="space-y-3">
            {/* Preset colors */}
            <div className="grid grid-cols-8 gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    'h-5 w-5 rounded-sm border border-border/30 transition-all hover:scale-125 hover:border-foreground/50',
                    value.toUpperCase() === color.toUpperCase() &&
                      'ring-2 ring-primary ring-offset-1 ring-offset-background'
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => handlePresetClick(color)}
                />
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-border" />

            {/* Custom hex input */}
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 shrink-0 rounded-sm border border-border/50"
                style={{ backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(hexInput) ? hexInput : value }}
              />
              <Input
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                placeholder="#000000"
                className="h-8 text-xs font-mono"
                maxLength={7}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
