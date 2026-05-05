"use client";

import { useTheme } from "next-themes";
import { useEffect , useState } from "react";
import { Moon, Sun } from "lucide-react";


export function ThemeToggle(){
    const {setTheme , resolvedTheme} = useTheme();
    const [mounted , setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    } , []);

    if(!mounted){
        return null;
    }

    const isLight = resolvedTheme === "light";

    return (
        <button
            type="button"
            aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
            onClick={() => {
                setTheme(isLight ? "dark" : "light");
            }}
        >
            {isLight ? (
                <Moon className="h-5 w-5" />
            ) : (
                <Sun className="h-5 w-5" />
            )}
        </button>
    )
}
