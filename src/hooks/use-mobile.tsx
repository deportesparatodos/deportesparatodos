
"use client"

import { useState, useEffect } from "react"

const MOBILE_BREAKPOINT = 768 // md breakpoint

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    
    const handleResize = () => {
      setIsMobile(mediaQuery.matches)
    }

    handleResize()
    mediaQuery.addEventListener("change", handleResize)
    
    return () => mediaQuery.removeEventListener("change", handleResize)
  }, [])

  return isMobile
}
