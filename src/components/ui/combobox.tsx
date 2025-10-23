"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { FormControl } from "@/components/ui/form"


type ComboboxProps = {
    options: { label: string; value: string }[];
    value: string | string[] | number[];
    onChange: (value: string | string[] | number[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    onCreate?: (value: string) => void;
    multiple?: boolean;
    disabled?: boolean;
}

export function Combobox({ options, value, onChange, placeholder, searchPlaceholder, emptyMessage, onCreate, multiple, disabled }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const handleSelect = (currentValue: string) => {
    if (multiple && Array.isArray(value)) {
      const newValues = value.includes(parseInt(currentValue, 10) as never)
        ? (value as number[]).filter((v) => v !== parseInt(currentValue, 10))
        : [...value, parseInt(currentValue, 10)];
      onChange(newValues);
    } else {
      onChange(currentValue === value ? "" : currentValue);
      setOpen(false);
    }
  };

  const displayValue = () => {
    if (multiple && Array.isArray(value) && value.length > 0) {
      return value.map((v) => options.find((o) => o.value === v.toString())?.label).join(", ");
    }
    if (!multiple && typeof value === 'string' && value) {
      return options.find((option) => option.value === value)?.label;
    }
    return placeholder || "Select option...";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
            <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between font-normal", !value && "text-muted-foreground")}
            disabled={disabled}
            >
            {displayValue()}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command
            filter={(itemValue, search) => {
                if (itemValue.toLowerCase().includes(search.toLowerCase())) return 1
                return 0
            }}
        >
          <CommandInput placeholder={searchPlaceholder || "Search..."} onValueChange={setSearch} />
          <CommandEmpty>
            {onCreate && search && (
              <CommandItem onSelect={() => {
                onChange(search)
                onCreate(search)
                setOpen(false)
              }}>
                Create "{search}"
              </CommandItem>
            ) || (emptyMessage || "No options found.")}
          </CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={handleSelect}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    multiple && Array.isArray(value) && value.includes(parseInt(option.value, 10) as never) ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}