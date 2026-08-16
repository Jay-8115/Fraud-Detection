import { toast as sonnerToast } from "sonner"
import * as React from "react"

export type ToastProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "destructive"
}

export function useToast() {
  const toast = ({ title, description, variant }: ToastProps) => {
    if (variant === "destructive") {
      sonnerToast.error(title, { description })
    } else {
      sonnerToast(title, { description })
    }
  }

  return { toast }
}

export { useToast as toast }
