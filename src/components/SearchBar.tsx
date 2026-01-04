/**
 * @module components/SearchBar
 * Reusable search input with clear button and debounced onChange.
 */
import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  /** Current search query value */
  value: string;
  /** Callback when search value changes (debounced) */
  onChange: (value: string) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Debounce delay in milliseconds (default: 300ms) */
  debounceMs?: number;
  /** Additional CSS classes for the container */
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  className = '',
}: SearchBarProps) {
  // Local state for immediate input updates (before debounce)
  const [localValue, setLocalValue] = useState(value);

  // Sync local value with prop value when it changes externally
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced callback to parent onChange
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange, debounceMs]);

  // Handle clear button click
  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
  }, [onChange]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Search Icon (always visible on left) */}
      <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none' />

      {/* Search Input */}
      <Input
        type='text'
        placeholder={placeholder}
        value={localValue}
        onChange={handleInputChange}
        className='pl-9 pr-9'
        aria-label='Search'
        autoFocus
      />

      {/* Clear Button (only visible when there's text) */}
      {localValue && (
        <Button
          type='button'
          variant='ghost'
          size='icon'
          onClick={handleClear}
          className='absolute right-1 top-1/2 -translate-y-1/2 size-7 hover:bg-accent'
          aria-label='Clear search'>
          <X className='size-4' />
        </Button>
      )}
    </div>
  );
}
