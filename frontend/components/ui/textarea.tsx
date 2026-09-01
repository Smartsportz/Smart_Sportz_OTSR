import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-xl border border-[#dbe5f5] bg-white px-3 py-2 text-sm text-[#0b1c30] transition-all outline-none placeholder:text-[#5c6878]/60 focus-visible:border-[#006c40] focus-visible:ring-2 focus-visible:ring-[#006c40]/20 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-60",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
