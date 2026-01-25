
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
  
  const isValidDate = (d: any) => d instanceof Date && !isNaN(d.getTime());

  const getSafeISO = (d: any) => {
     try {
       if (!d) return '';
       const date = new Date(d);
       return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
     } catch { return ''; }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal border-white/20 text-white hover:bg-white/10 hover:text-white",
              !dateRange?.from && "opacity-70",
              className
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from && isValidDate(dateRange.from) ? (
              dateRange.to && isValidDate(dateRange.to) ? (
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
          <div className="p-4 space-y-4 text-slate-900 bg-white border shadow-xl rounded-xl">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">De:</label>
              <input 
                type="date" 
                value={getSafeISO(dateRange?.from)} 
                onChange={(e) => setDateRange({ ...dateRange, from: new Date(e.target.valueAsNumber) })}
                className="w-full rounded border p-1"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Até:</label>
              <input 
                type="date" 
                value={getSafeISO(dateRange?.to)} 
                onChange={(e) => setDateRange({ ...dateRange, to: new Date(e.target.valueAsNumber) })}
                className="w-full rounded border p-1"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
