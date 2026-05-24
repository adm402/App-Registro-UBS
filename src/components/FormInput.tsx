/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface FormInputProps {
  id: string;
  label: string;
  sublabel?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  icon?: React.ReactNode;
}

export default function FormInput({
  id,
  label,
  sublabel,
  value,
  min = 0,
  max = 999,
  onChange,
  icon,
}: FormInputProps) {
  
  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsedValue = parseInt(e.target.value, 10);
    if (!isNaN(parsedValue)) {
      if (parsedValue >= min && parsedValue <= max) {
        onChange(parsedValue);
      }
    } else if (e.target.value === '') {
      onChange(0);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 hover:border-slate-700 hover:shadow-md transition duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {icon && (
            <span className="p-2 bg-slate-800 border border-slate-700/60 rounded-xl text-teal-400 shrink-0">
              {icon}
            </span>
          )}
          <div>
            <label htmlFor={id} className="block font-bold text-white text-sm tracking-tight leading-snug">
              {label}
            </label>
            {sublabel && (
              <span className="block text-[11px] text-slate-400 mt-0.5 leading-snug">
                {sublabel}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Decrement Button */}
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="flex items-center justify-center w-11 h-11 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 disabled:cursor-not-allowed text-white rounded-xl border border-slate-700/60 font-semibold cursor-pointer transition select-none"
          title="Diminuir"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Input Text Box */}
        <div className="relative flex-1">
          <input
            id={id}
            type="number"
            min={min}
            max={max}
            value={value === 0 ? '' : value}
            placeholder="0"
            onChange={handleInputChange}
            className="w-full h-11 bg-slate-950 text-white font-mono font-bold text-lg text-center rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        {/* Increment Button */}
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="flex items-center justify-center w-11 h-11 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 disabled:cursor-not-allowed text-white rounded-xl border border-slate-700/60 font-semibold cursor-pointer transition select-none"
          title="Aumentar"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Access Counters buttons */}
      <div className="grid grid-cols-4 gap-1 mt-2.5">
        {[2, 5, 10, 20].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => {
              const target = value + num;
              onChange(target <= max ? target : max);
            }}
            className="text-[10px] font-mono py-1 rounded bg-slate-950/70 text-slate-400 hover:text-teal-300 hover:bg-slate-800 border border-slate-800/80 hover:border-teal-500/20 transition cursor-pointer"
          >
            +{num}
          </button>
        ))}
      </div>
    </div>
  );
}
