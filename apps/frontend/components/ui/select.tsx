import { forwardRef, useState } from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
}

export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

export interface SelectContentProps {
  children: React.ReactNode
}

export interface SelectItemProps {
  children: React.ReactNode
  value: string
}

export interface SelectValueProps {
  placeholder?: string
}

const Select = ({ children, value, onValueChange }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value || '')

  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue)
    onValueChange?.(newValue)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>
        {children}
      </div>
    </div>
  )
}

const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
)
SelectTrigger.displayName = 'SelectTrigger'

const SelectContent = ({ children }: SelectContentProps) => (
  <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
    {children}
  </div>
)

const SelectItem = ({ children, value }: SelectItemProps) => (
  <div
    className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100"
    onClick={() => {/* handle selection */}}
  >
    {children}
  </div>
)

const SelectValue = ({ placeholder }: SelectValueProps) => (
  <span className="text-gray-500">{placeholder}</span>
)

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue }