import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-[#dbe5f5] bg-white px-3 py-2 text-sm text-[#0b1c30] transition-all outline-none placeholder:text-[#5c6878]/60 focus-visible:border-[#006c40] focus-visible:ring-2 focus-visible:ring-[#006c40]/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-60",
        className
      )}
      {...props}
    />
  )
}

export { Input }
