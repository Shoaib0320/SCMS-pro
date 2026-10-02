"use client";

import React, { useState, useEffect, useRef } from "react";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatTo12Hour, parseTo24Hour } from "@/lib/utils";

export { formatTo12Hour, parseTo24Hour };

const TimePicker = ({ value, onChange, label, className = "", placeholder = "hh:mm AM/PM" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Parse 24h time string (HH:mm) into hour, minute, ampm
  const parseTime = (timeStr) => {
    if (!timeStr) return { hours: 9, minutes: 0, ampm: "AM" };
    // Check if it already has AM/PM
    const ampmMatch = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (ampmMatch) {
      let h = parseInt(ampmMatch[1], 10);
      const m = parseInt(ampmMatch[2], 10);
      const ap = ampmMatch[3].toUpperCase();
      return { hours: h % 12 || 12, minutes: m, ampm: ap };
    }
    const parts = String(timeStr).split(":");
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const ampm = h >= 12 ? "PM" : "AM";
    const hours = h % 12 || 12;
    return { hours, minutes: m, ampm };
  };

  const { hours, minutes, ampm } = parseTime(value);

  // Keep a local text representation for typing/pasting
  const [prevValue, setPrevValue] = useState(value);
  const [inputValue, setInputValue] = useState(() => (value ? formatTo12Hour(value) : ""));

  // Sync internal display text when external value changes
  if (value !== prevValue) {
    setPrevValue(value);
    setInputValue(value ? formatTo12Hour(value) : "");
  }

  const updateTime = (newH, newM, newAmpm) => {
    let h24 = newAmpm === "PM" ? (newH % 12) + 12 : newH % 12;
    const time24Str = `${String(h24).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
    const display12Str = `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")} ${newAmpm}`;
    setInputValue(display12Str);
    onChange(time24Str);
  };

  const handleHourChange = (delta) => {
    let newH = hours + delta;
    if (newH > 12) newH = 1;
    if (newH < 1) newH = 12;
    updateTime(newH, minutes, ampm);
  };

  const handleMinuteChange = (delta) => {
    let newM = minutes + delta;
    if (newM >= 60) newM = 0;
    if (newM < 0) newM = 55;
    updateTime(hours, newM, ampm);
  };

  const toggleAmpm = () => {
    updateTime(hours, minutes, ampm === "AM" ? "PM" : "AM");
  };

  // Handle manual typing or pasting
  const handleInputChange = (e) => {
    const raw = e.target.value;
    setInputValue(raw);

    const parsed24 = parseTo24Hour(raw);
    if (parsed24) {
      onChange(parsed24);
    }
  };

  const handleInputBlur = () => {
    if (!inputValue || !inputValue.trim()) {
      onChange("");
      setInputValue("");
      return;
    }

    const parsed24 = parseTo24Hour(inputValue);
    if (parsed24) {
      onChange(parsed24);
      setInputValue(formatTo12Hour(parsed24));
    } else if (value) {
      // Revert to valid previous value
      setInputValue(formatTo12Hour(value));
    } else {
      setInputValue("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">{label}</label>}
      
      <div 
        className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-indigo-400 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-sm group min-h-[42px]"
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 -ml-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          title="Toggle time dropdown"
        >
          <Clock className="h-4 w-4" />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent border-none text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
        />

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-[100] mt-2 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl flex gap-4 origin-top left-0 sm:left-auto"
          >
            {/* Hours */}
            <div className="flex flex-col items-center gap-1">
              <button 
                type="button" 
                onClick={() => handleHourChange(1)} 
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <span className="text-lg font-bold w-8 text-center">{String(hours).padStart(2, "0")}</span>
              <button 
                type="button" 
                onClick={() => handleHourChange(-1)} 
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <span className="text-lg font-bold self-center">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center gap-1">
              <button 
                type="button" 
                onClick={() => handleMinuteChange(5)} 
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <span className="text-lg font-bold w-8 text-center">{String(minutes).padStart(2, "0")}</span>
              <button 
                type="button" 
                onClick={() => handleMinuteChange(-5)} 
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* AM/PM */}
            <div className="flex flex-col justify-center">
              <button 
                type="button"
                onClick={toggleAmpm}
                className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-sm"
              >
                {ampm}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TimePicker;

