
import * as React from "react"
import { format } from "date-fns"
// Fixed: Changed locale import path to use specific locale file to avoid export resolution issues
import { ptBR } from "date-fns/locale/pt-BR"
import { Calendar as CalendarIcon } from "lucide-react"
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { cn } from "../../utils"

export default function DateRange({
  dateRange,
  setDateRange,
  className,
  disabled,
  ...props
}: any) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal border-current/20",
              !dateRange?.from && "opacity-70",
              className // Passa as classes de cor (como text-white) para o botão
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>Selecione um período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4 text-slate-900">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">De:</label>
              <input 
                type="date" 
                value={dateRange?.from ? new Date(dateRange.from).toISOString().split('T')[0] : ''} 
                onChange={(e) => setDateRange({ ...dateRange, from: new Date(e.target.value) })}
                className="w-full rounded border p-1"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Até:</label>
              <input 
                type="date" 
                value={dateRange?.to ? new Date(dateRange.to).toISOString().split('T')[0] : ''} 
                onChange={(e) => setDateRange({ ...dateRange, to: new Date(e.target.value) })}
                className="w-full rounded border p-1"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
