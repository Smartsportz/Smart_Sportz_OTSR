import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent text-sm font-bold whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-primary/40 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[#006c40] text-white hover:bg-[#0b8852] hover:-translate-y-0.5 shadow-[0_10px_22px_rgba(0,108,64,0.22)] hover:shadow-[0_14px_28px_rgba(0,108,64,0.32)]",
        primary:
          "bg-gradient-to-r from-[#006c40] to-[#0b8852] text-white hover:-translate-y-0.5 shadow-[0_10px_22px_rgba(0,108,64,0.25)] hover:shadow-[0_14px_28px_rgba(0,108,64,0.35)]",
        outline:
          "border-[#dbe5f5] bg-white text-[#0b1c30] hover:bg-[#eff4ff] hover:text-[#006c40] hover:border-[#0b8852]/30 hover:-translate-y-0.5 shadow-xs",
        secondary:
          "bg-[#eaf4e4] text-[#006c40] hover:bg-[#d9ecd1] hover:-translate-y-0.5 font-bold",
        ghost:
          "hover:bg-[#eaf4e4]/60 hover:text-[#006c40] text-[#5c6878]",
        destructive:
          "bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 hover:-translate-y-0.5 border border-rose-200 shadow-xs",
        link: "text-[#006c40] underline-offset-4 hover:underline font-bold",
      },
      size: {
        default: "h-10 gap-2 px-4 py-2",
        xs: "h-7 gap-1 rounded-lg px-2.5 text-xs",
        sm: "h-8 gap-1.5 rounded-lg px-3 text-xs",
        lg: "h-11 gap-2 rounded-xl px-6 text-base font-bold",
        icon: "size-10 rounded-xl",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
