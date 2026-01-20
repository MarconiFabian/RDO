
import * as React from "react"
import { format } from "date-fns"
// Fixed: Changed locale import path to use specific locale file to avoid export resolution issues
import { ptBR } from "date-fns/locale/pt-BR"
import { Calendar as CalendarIcon } from "lucide-react"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { cn } from "../../utils"

export default function DatePicker({
  selected,
  onSelect,
  className,
  disabled,
  ...props
}: any) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-slate-500",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : <span>Selecionar data</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={onSelect}
          locale={ptBR}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
