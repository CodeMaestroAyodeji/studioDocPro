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
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    onCreate?: (value: string) => void;
}

export function Combobox({ options, value, onChange, placeholder, searchPlaceholder, emptyMessage, onCreate }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
            <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between font-normal", !value && "text-muted-foreground")}
            >
            {value
                ? options.find((option) => option.value === value)?.label
                : placeholder || "Select option..."}
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
                onSelect={(currentValue) => {
                  onChange(currentValue === value ? "" : currentValue)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
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