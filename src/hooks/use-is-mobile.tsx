
"use client"

import { useState, useEffect } from "react"

export function useIsMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`)
    
    const handleResize = () => {
      setIsMobile(mediaQuery.matches)
    }

    handleResize()
    mediaQuery.addEventListener("change", handleResize)
    
    return () => mediaQuery.removeEventListener("change", handleResize)
  }, [breakpoint])

  return isMobile
}
