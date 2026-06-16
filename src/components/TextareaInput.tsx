import { memo } from "react";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export const TextareaInput = memo(function TextareaInput({
  label,
  value,
  onChange,
  disabled,
}: Props) {
  return (
    <div 
      // 1. THE MAGIC FIX: Stop the click from reaching the Lovable visual editor!
      onClick={(e) => e.stopPropagation()} 
      onMouseDown={(e) => e.stopPropagation()}
    >
      <label className="mb-2 block text-sm font-medium cursor-default">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        
        // 2. Stop focus events from triggering IDE overlays
        onFocus={(e) => e.stopPropagation()}
        
        /* 3. Block Password Managers & Spellcheckers */
        spellCheck={false}
        autoComplete="off"
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
        data-1p-ignore="true"       // Blocks 1Password
        data-lpignore="true"        // Blocks LastPass
        data-form-type="other"      // Generic block for form-fillers

        rows={10}
        className="w-full h-64 rounded-md border border-slate-300 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </div>
  );
});