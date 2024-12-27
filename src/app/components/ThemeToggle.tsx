"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon, Monitor } from 'lucide-react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow">
      <button
        onClick={() => setTheme("light")}
        className={`p-2 rounded-lg ${theme === "light" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 dark:hover:bg-gray-700"}`}
        title="Light Mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-2 rounded-lg ${theme === "dark" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 dark:hover:bg-gray-700"}`}
        title="Dark Mode"
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-2 rounded-lg ${theme === "system" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 dark:hover:bg-gray-700"}`}
        title="System Mode"
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  )
}