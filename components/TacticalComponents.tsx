import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CLIP_PATH_CHAMFER, CLIP_PATH_NOTCHED, CLIP_PATH_TAG, DiceType, DiceConfig, DistributionData, Preset } from '../types';
import { Trash2, AlertTriangle, Minus, Save, FilePlus, Download, Upload } from 'lucide-react';

// --- DECORATIVE ELEMENTS ---
export const CornerBrackets: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-tactical-dim/50" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-tactical-dim/50" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-tactical-dim/50" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-tactical-dim/50" />
    </div>
);

export const Barcode: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`flex gap-0.5 h-full opacity-40 ${className}`}>
        {[...Array(12)].map((_, i) => (
            <div key={i} className={`bg-current ${Math.random() > 0.5 ? 'w-px' : 'w-1'}`} />
        ))}
    </div>
);

// --- WRAPPERS ---
export const TechBox: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  active?: boolean;
}> = ({ children, className = '', onClick, active }) => (
  <div
    onClick={onClick}
    className={`relative transition-all duration-200 ${className} ${active ? 'border-tactical-yellow' : 'border-tactical-structure'}`}
    style={{ clipPath: CLIP_PATH_NOTCHED }}
  >
    {children}
  </div>
);

// --- MODALS ---
interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm relative group">
                <div className="absolute inset-0 bg-tactical-red/20 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-tactical-panel border border-tactical-structure shadow-2xl overflow-hidden" style={{ clipPath: CLIP_PATH_NOTCHED }}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-tactical-red" />
                    <div className="p-8 flex flex-col items-center text-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-tactical-red blur-lg opacity-40 animate-pulse" />
                            <div className="relative w-16 h-16 bg-tactical-bg border border-tactical-red flex items-center justify-center" style={{ clipPath: CLIP_PATH_CHAMFER }}>
                                <AlertTriangle className="text-tactical-red" size={32} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-tactical-text tracking-[0.2em] mb-2 font-sans">{title}</h3>
                            <p className="text-xs font-mono text-tactical-dim uppercase leading-relaxed max-w-[200px] mx-auto">{message}</p>
                        </div>
                        <div className="flex gap-3 w-full mt-2">
                             <button onClick={onCancel} className="flex-1 py-3 border border-tactical-dim/50 bg-tactical-bg text-tactical-dim hover:text-tactical-text hover:border-tactical-text transition-all font-mono text-xs font-bold tracking-wider">
                                 ABORT
                             </button>
                             <button onClick={onConfirm} className="flex-1 py-3 bg-tactical-red text-black font-bold hover:bg-tactical-text hover:text-tactical-red transition-all font-mono text-xs tracking-wider relative overflow-hidden group/btn">
                                 <span className="relative z-10">CONFIRM</span>
                                 <div className="absolute inset-0 bg-tactical-text translate-y-full group-hover/btn:translate-y-0 transition-transform duration-200 z-0" />
                             </button>
                        </div>
                    </div>
                    <div className="h-2 w-full bg-tactical-bg border-t border-tactical-structure flex items-center justify-between px-2">
                        <div className="flex gap-1">
                            <div className="w-1 h-1 bg-tactical-red" />
                            <div className="w-1 h-1 bg-tactical-red opacity-50" />
                        </div>
                        <div className="text-[8px] text-tactical-red font-mono">WARNING_LEVEL_1</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- BUTTONS ---
interface TacticalButtonProps {
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  subLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export const TacticalButton: React.FC<TacticalButtonProps> = ({
  label,
  active,
  danger,
  onClick,
  subLabel,
  icon,
  className = '',
  compact = false
}) => {
  return (
    <div 
        onClick={onClick}
        className={`relative group cursor-pointer overflow-hidden transition-all duration-100 ${className}`}
        style={{ clipPath: CLIP_PATH_CHAMFER }}
    >
       <div className={`absolute inset-0 transition-colors duration-200 
            ${danger 
                ? (active ? 'bg-tactical-red' : 'bg-tactical-bg border border-tactical-red/50 hover:bg-tactical-red/20') 
                : (active ? 'bg-tactical-yellow' : 'bg-tactical-panel border border-tactical-structure hover:border-tactical-yellow/50 hover:bg-tactical-yellow/10')}
       `} />
       
       <div className={`relative z-10 flex flex-col items-center justify-center h-full px-4 py-2
            ${active ? 'text-black font-bold' : (danger ? 'text-tactical-red' : 'text-tactical-text')}
       `}>
            <div className="flex items-center gap-2">
                {icon}
                <span className={`font-sans tracking-widest ${compact ? 'text-xs' : 'text-sm'}`}>{label}</span>
            </div>
            {subLabel && !compact && (
                <span className={`text-[9px] font-mono mt-0.5 ${active ? 'opacity-80' : 'opacity-40'}`}>
                    {subLabel}
                </span>
            )}
       </div>

       <div className={`absolute top-0 right-0 p-1 ${active ? 'bg-black/20' : 'bg-tactical-structure'} opacity-50`}>
           <div className="w-1 h-1 bg-current" />
       </div>
    </div>
  );
};

// --- FADERS ---
interface FaderProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  label: string;
  color?: 'yellow' | 'cyan' | 'red' | 'gray';
  height?: string;
}

export const Fader: React.FC<FaderProps> = ({
  value,
  min = 0,
  max = 100,
  onChange,
  label,
  color = 'yellow'
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    if (!isFocused && !isDragging) {
        setInputValue(value.toString());
    }
  }, [value, isFocused, isDragging]);

  const getPercentage = useCallback(() => {
    if (max === min) return 100;
    return ((value - min) / (max - min)) * 100;
  }, [value, min, max]);

  const handleInteraction = useCallback((clientY: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const relativeY = 1 - (clientY - rect.top) / rect.height;
      const clampedPercent = Math.max(0, Math.min(1, relativeY));
      const newValue = Math.round(clampedPercent * (max - min) + min);
      if (newValue !== value) {
          onChange(newValue);
          setInputValue(newValue.toString());
      }
  }, [max, min, onChange, value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setInputValue(raw);
      const num = parseInt(raw);
      if (!isNaN(num)) {
          const clamped = Math.max(min, Math.min(max, num));
          onChange(clamped);
      }
  };

  const handleInputBlur = () => {
      setIsFocused(false);
      let num = parseInt(inputValue);
      if (isNaN(num)) num = min;
      const clamped = Math.max(min, Math.min(max, num));
      setInputValue(clamped.toString());
      onChange(clamped);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          (e.currentTarget as HTMLInputElement).blur();
      }
  };

  const trackColorClass = {
    yellow: 'bg-tactical-yellow text-tactical-yellow',
    cyan: 'bg-tactical-cyan text-tactical-cyan',
    red: 'bg-tactical-red text-tactical-red',
    gray: 'bg-gray-400 text-gray-400'
  }[color];

  const activeInputClass = {
      yellow: 'bg-tactical-yellow text-black border-tactical-yellow',
      cyan: 'bg-tactical-cyan text-black border-tactical-cyan',
      red: 'bg-tactical-red text-black border-tactical-red',
      gray: 'bg-gray-400 text-black border-gray-400'
  }[color];
  
  const inactiveInputClass = 'bg-tactical-bg text-tactical-text border-tactical-structure focus:border-tactical-text';
  const isActive = isDragging || isFocused;

  return (
    <div className="flex flex-col items-center gap-2 w-full h-full group select-none">
       <div className="relative z-20">
            <input
                type="text"
                value={inputValue}
                onFocus={() => setIsFocused(true)}
                onBlur={handleInputBlur}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className={`
                    w-14 text-center font-mono border transition-all duration-200 outline-none
                    ${isActive 
                        ? `text-lg font-bold py-1 ${activeInputClass} shadow-[0_0_15px_rgba(0,0,0,0.5)] scale-110` 
                        : `text-xs py-0.5 ${inactiveInputClass} opacity-80 hover:opacity-100`
                    }
                `}
                style={{ clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)' }}
            />
       </div>

       <div className="flex-1 relative w-10 md:w-12">
            <div className="absolute right-full top-0 bottom-0 pr-3 flex flex-col justify-between py-1 text-[8px] font-mono text-tactical-dim w-8 text-right pointer-events-none select-none">
                <span>{max}</span>
                <span className="opacity-30">-</span>
                <span>{Math.round((max+min)/2)}</span>
                <span className="opacity-30">-</span>
                <span>{min}</span>
            </div>

            <div
                ref={trackRef}
                className={`w-full h-full bg-tactical-panel border-x border-tactical-structure cursor-ns-resize relative overflow-hidden`}
                onMouseDown={(e) => { setIsDragging(true); handleInteraction(e.clientY); }}
                onTouchStart={(e) => { setIsDragging(true); handleInteraction(e.touches[0].clientY); }}
            >
                <div className="absolute inset-y-0 left-1/2 w-px bg-tactical-structure/50 -translate-x-1/2" />
                <div 
                    className={`absolute bottom-0 left-0 right-0 opacity-20 pointer-events-none ${trackColorClass.split(' ')[0]}`}
                    style={{ height: `${getPercentage()}%` }}
                />
                <div
                    className="absolute left-0 right-0 h-4 bg-tactical-surface border border-tactical-structure shadow-lg flex items-center justify-center z-10 transition-transform active:scale-105"
                    style={{ bottom: `${getPercentage()}%`, transform: 'translateY(50%)' }}
                >
                    <div className={`w-full h-1 mx-1 ${trackColorClass.split(' ')[0]} shadow-[0_0_5px_currentColor]`} />
                </div>
            </div>
       </div>

       <div className="text-[10px] font-sans font-bold tracking-widest text-tactical-dim uppercase">{label}</div>

       {isDragging && (
         <div className="fixed inset-0 z-50 cursor-ns-resize"
            onMouseMove={(e) => handleInteraction(e.clientY)}
            onMouseUp={() => setIsDragging(false)}
            onTouchMove={(e) => handleInteraction(e.touches[0].clientY)}
            onTouchEnd={() => setIsDragging(false)}
         />
       )}
    </div>
  );
};

// --- DICE COMPONENTS ---
export const DicePoolDisplay: React.FC<{ 
  config: DiceConfig; 
  onClear: () => void;
  onRemove: (s: DiceType) => void;
}> = ({ config, onClear, onRemove }) => {
  const diceTypes = Object.keys(config).map(Number).sort((a,b) => a-b) as DiceType[];
  const hasDice = diceTypes.length > 0;

  return (
    <div className="mb-4 relative flex flex-col gap-2">
        <div className="flex justify-between items-start border-b border-tactical-structure pb-1">
             <div>
                 <div className="text-xs font-bold text-tactical-cyan tracking-widest">ACTIVE_LOADOUT</div>
                 <div className="text-[9px] text-tactical-dim font-mono mt-0.5">CAPACITY: UNLIMITED</div>
             </div>
             <button 
                onClick={onClear} 
                disabled={!hasDice} 
                className="group flex items-center gap-1.5 px-2 py-1 bg-tactical-panel border border-tactical-structure hover:border-tactical-red hover:text-tactical-red disabled:opacity-30 disabled:hover:border-tactical-structure disabled:hover:text-inherit transition-colors cursor-pointer"
             >
                <Trash2 size={10} /> 
                <span className="text-[10px] font-mono font-bold">PURGE</span>
             </button>
        </div>
        
        <div className="bg-stripes-dark min-h-[48px] p-2 border border-tactical-structure flex flex-wrap gap-2 relative">
             <CornerBrackets />
             {!hasDice && <div className="w-full text-center text-[10px] text-tactical-dim py-2 font-mono">WAITING_FOR_INPUT...</div>}
             {diceTypes.map(sides => (
                 <button 
                    key={sides} 
                    onClick={() => onRemove(sides)}
                    className="flex items-center bg-tactical-panel border border-tactical-dim px-2 py-1 gap-2 relative group hover:border-tactical-red hover:bg-tactical-red/10 transition-colors cursor-pointer"
                    title="Click to remove 1 die"
                 >
                     <span className="text-tactical-yellow font-bold font-mono text-sm group-hover:text-tactical-red transition-colors">{config[sides]}</span>
                     <span className="text-[9px] text-gray-500">x</span>
                     <span className="text-xs font-bold text-tactical-text">D{sides}</span>
                     <div className="absolute inset-0 flex items-center justify-center bg-tactical-bg/80 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                        <Minus size={12} className="text-tactical-red" />
                     </div>
                 </button>
             ))}
        </div>
    </div>
  );
};

export const DiceAdder: React.FC<{ onAdd: (s: DiceType) => void }> = ({ onAdd }) => (
    <div>
        <div className="text-[10px] font-mono text-tactical-dim mb-1 tracking-widest">SUPPLY_CACHE</div>
        <div className="grid grid-cols-4 gap-1">
            {[4, 6, 8, 10, 12, 20, 100].map(d => (
                <button
                    key={d}
                    onClick={() => onAdd(d as DiceType)}
                    className="h-10 bg-tactical-panel border border-tactical-structure hover:bg-tactical-surface hover:border-tactical-cyan text-gray-400 hover:text-tactical-text transition-all font-mono text-xs font-bold flex flex-col items-center justify-center relative overflow-hidden group"
                >
                    <span>D{d}</span>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-current opacity-30 group-hover:opacity-100 transition-opacity" />
                </button>
            ))}
        </div>
    </div>
);

// --- VISUALIZATION COMPONENTS ---

export const CircularProgress: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
  children?: React.ReactNode;
}> = ({ percentage, size = 200, strokeWidth = 8, color = 'var(--tactical-cyan)', className, children }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      
      {/* Outer Scale Ring (Static Ticks) */}
      <svg className="absolute inset-0 w-full h-full animate-spin-slow" style={{ animationDuration: '60s' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius + 20}
          fill="none"
          className="stroke-tactical-structure"
          strokeWidth="2"
          strokeDasharray="2 8" 
          opacity={0.5}
        />
      </svg>

      {/* Decorative Outer Brackets (Static) */}
       <div className="absolute inset-0 pointer-events-none">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-2 bg-tactical-dim" />
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-2 bg-tactical-dim" />
           <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-1 bg-tactical-dim" />
           <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-1 bg-tactical-dim" />
       </div>

      {/* Main Track (Dark Background) */}
      <svg className="absolute inset-0 transform -rotate-90" width={size} height={size}>
        <circle
          className="text-tactical-structure"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeOpacity={0.3}
        />
      </svg>

      {/* Progress Arc */}
      <svg className="absolute inset-0 transform -rotate-90 drop-shadow-[0_0_8px_rgba(var(--tactical-cyan),0.3)]" width={size} height={size}>
         <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
         </defs>
         <circle
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="butt"
          className="transition-all duration-1000 ease-out"
          style={{ filter: 'url(#glow)' }}
        />
      </svg>
      
      {/* Inner Rotating Tech Ring */}
      <div className="absolute inset-0 flex items-center justify-center animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '15s' }}>
          <svg width={size} height={size} className="opacity-40">
             <circle 
                cx={size/2} cy={size/2} r={radius - 15} 
                fill="none" stroke={color} strokeWidth="1" 
                strokeDasharray="20 40 10 40" 
             />
             <circle 
                cx={size/2} cy={size/2} r={radius - 12} 
                fill="none" stroke={color} strokeWidth="1" 
                strokeDasharray="2 10" 
                opacity={0.5}
             />
          </svg>
      </div>

       {/* Floating Data Decor */}
      <div className="absolute top-[15%] right-[15%] text-[8px] font-mono text-tactical-dim animate-pulse">
         R-CALC
      </div>

      {/* Inner Content */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
          {children}
      </div>
    </div>
  );
};

export const RangeBar: React.FC<{
  min: number;
  max: number;
  avg: number;
  target: number;
  currentMin: number;
  currentMax: number;
}> = ({ min, max, avg, target, currentMin, currentMax }) => {
    const range = currentMax - currentMin;
    if (range <= 0) return null;
    
    const getPct = (val: number) => {
        const pct = ((val - currentMin) / range) * 100;
        return Math.max(0, Math.min(100, pct));
    };

    return (
        <div className="w-full h-8 relative bg-tactical-bg border-t border-b border-tactical-structure mt-4 flex items-center">
             {/* Ruler Ticks */}
             <div className="absolute inset-0 flex justify-between px-0.5 opacity-20 pointer-events-none">
                 {[...Array(21)].map((_, i) => (
                     <div key={i} className={`w-px bg-tactical-dim ${i % 5 === 0 ? 'h-full' : 'h-1/2 self-end'}`} />
                 ))}
             </div>

            {/* Confidence Interval (Simulation Min/Max) */}
            <div 
                className="absolute h-2 bg-tactical-dim/30 border-x border-tactical-dim"
                style={{ left: `${getPct(min)}%`, width: `${Math.max(1, getPct(max) - getPct(min))}%` }}
            />
            
            {/* Target Line */}
            <div 
                className="absolute top-0 bottom-0 w-0.5 bg-tactical-red z-10"
                style={{ left: `${getPct(target)}%` }}
            >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 text-[8px] font-mono text-tactical-red mb-0.5 bg-tactical-bg px-1 border border-tactical-red">DC</div>
            </div>

            {/* Average Marker */}
            <div 
                className="absolute top-0 bottom-0 w-0.5 bg-tactical-yellow z-10"
                style={{ left: `${getPct(avg)}%` }}
            >
                 <div className="absolute top-full left-1/2 -translate-x-1/2 text-[8px] font-mono text-tactical-yellow mt-0.5">AVG</div>
            </div>
            
            {/* Min/Max Labels */}
            <div className="absolute top-full left-0 text-[8px] text-tactical-dim font-mono mt-0.5">{currentMin}</div>
            <div className="absolute top-full right-0 text-[8px] text-tactical-dim font-mono mt-0.5">{currentMax}</div>
        </div>
    );
};

export const DistributionGraph: React.FC<{
  data: DistributionData[];
  target: number;
  className?: string;
}> = ({ data, target, className = '' }) => {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // If no data, render empty
    if (!data || data.length === 0) return <div className={`${className} bg-tactical-bg/20`} />;

    const peak = Math.max(...data.map(d => d.probability), 0) || 1;
    const count = data.length;
    
    // Determine bar width logic based on density
    // High density (> 60 items): solid bars (width 1, no gap)
    // Low density: separated bars (width 0.8, gap 0.2)
    const isHighDensity = count > 60;
    const barWidth = isHighDensity ? 1 : 0.8;
    const barOffset = isHighDensity ? 0 : 0.1;

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const index = Math.floor((x / rect.width) * count);
        setHoverIndex(Math.max(0, Math.min(index, count - 1)));
    };

    return (
        <div 
            ref={containerRef} 
            className={`relative w-full ${className} bg-tactical-bg/50`} 
            onMouseMove={handleMouseMove} 
            onMouseLeave={() => setHoverIndex(null)}
        >
             <svg 
                className="w-full h-full block" 
                viewBox={`0 0 ${count} 100`} 
                preserveAspectRatio="none"
             >
                 {/* Optional Grid Lines */}
                 <line x1="0" y1="50" x2={count} y2="50" className="stroke-tactical-structure" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" vectorEffect="non-scaling-stroke" />

                 {data.map((d, i) => {
                     const isSuccess = d.outcome >= target;
                     const barHeight = (d.probability / peak) * 100;
                     // In SVG, y is from top. so y = 100 - height
                     return (
                         <rect 
                            key={i}
                            x={i + barOffset}
                            y={100 - barHeight}
                            width={barWidth}
                            height={barHeight}
                            className={`transition-opacity duration-75 ${isSuccess ? 'fill-tactical-cyan' : 'fill-tactical-red'} ${hoverIndex === i ? 'opacity-100' : 'opacity-60'}`}
                            shapeRendering="crispEdges"
                         />
                     );
                 })}
                 
                 {/* Target Line Indicator */}
                 {(() => {
                     const targetIdx = data.findIndex(d => d.outcome >= target);
                     if (targetIdx !== -1) {
                         return (
                             <g>
                                <line 
                                    x1={targetIdx} y1="0" x2={targetIdx} y2="100" 
                                    className="stroke-tactical-yellow" strokeWidth="1.5"
                                    strokeDasharray="4 2"
                                    vectorEffect="non-scaling-stroke" 
                                />
                             </g>
                         )
                     }
                     return null;
                 })()}

             </svg>
             
             {/* Tooltip */}
             {hoverIndex !== null && data[hoverIndex] && (
                 <div 
                    className="absolute bottom-full mb-2 pointer-events-none z-50 whitespace-nowrap"
                    style={{ 
                        left: `${((hoverIndex + 0.5) / count) * 100}%`,
                        transform: 'translateX(-50%)'
                    }}
                 >
                     <div className="bg-tactical-panel border border-tactical-structure p-2 shadow-2xl flex flex-col items-center">
                         <div className="text-[10px] text-tactical-dim font-mono uppercase">Value</div>
                         <div className="text-sm font-bold text-tactical-text font-mono">{data[hoverIndex].outcome}</div>
                         <div className={`text-xs font-bold mt-1 ${data[hoverIndex].outcome >= target ? 'text-tactical-cyan' : 'text-tactical-red'}`}>
                             {(data[hoverIndex].probability * 100).toFixed(2)}%
                         </div>
                         {/* Tiny indicator triangle */}
                         <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-tactical-structure"></div>
                     </div>
                 </div>
             )}
        </div>
    );
};

// --- MEMORY BANK (PRESETS) ---
interface MemoryBankProps {
    currentName: string;
    presets: Preset[];
    onSave: (name: string) => void;
    onSaveAsNew: (baseName: string) => void;
    onLoad: (preset: Preset) => void;
    onRename: (name: string) => void;
    onExport: () => void;
    onImport: (data: any) => void;
    onDelete: (id: string) => void;
    onReorder: (presets: Preset[]) => void;
}

export const MemoryBank: React.FC<MemoryBankProps> = ({
    currentName,
    presets,
    onSave,
    onSaveAsNew,
    onLoad,
    onRename,
    onExport,
    onImport,
    onDelete
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileRead = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const json = JSON.parse(ev.target?.result as string);
                onImport(json);
            } catch (err) {
                console.error(err);
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="flex flex-col h-full bg-tactical-panel/50">
             <div className="p-3 border-b border-tactical-structure flex items-center justify-between gap-2">
                 <div className="flex-1">
                     <div className="text-[9px] text-tactical-dim font-mono mb-1">CURRENT_CONFIG</div>
                     <input 
                        type="text" 
                        value={currentName}
                        onChange={(e) => onRename(e.target.value)}
                        className="w-full bg-tactical-bg/50 border-b border-tactical-dim text-tactical-yellow font-bold text-sm focus:border-tactical-yellow outline-none font-mono"
                     />
                 </div>
                 <div className="flex gap-1">
                     <button onClick={() => onSave(currentName)} className="p-2 bg-tactical-surface hover:bg-tactical-yellow hover:text-black border border-tactical-structure transition-colors" title="Overwrite Save">
                        <Save size={14} />
                     </button>
                     <button onClick={() => onSaveAsNew(currentName)} className="p-2 bg-tactical-surface hover:bg-tactical-cyan hover:text-black border border-tactical-structure transition-colors" title="Save As New">
                        <FilePlus size={14} />
                     </button>
                 </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar min-h-[100px]">
                 {presets.map(preset => (
                     <div 
                        key={preset.id}
                        className={`group flex items-center justify-between p-2 border border-transparent hover:border-tactical-structure hover:bg-tactical-structure/10 cursor-pointer ${preset.name === currentName ? 'bg-tactical-structure/20 border-tactical-structure/50' : ''}`}
                     >
                        <div className="flex-1" onClick={() => onLoad(preset)}>
                             <div className={`text-xs font-bold font-mono ${preset.name === currentName ? 'text-tactical-cyan' : 'text-tactical-text'}`}>{preset.name}</div>
                             <div className="text-[9px] text-tactical-dim flex gap-2">
                                 <span>{Object.entries(preset.state.dice).map(([s,c])=>`${c}d${s}`).join('+')}</span>
                                 <span>DC:{preset.state.target}</span>
                             </div>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(preset.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-tactical-red transition-opacity"
                        >
                            <Trash2 size={12} />
                        </button>
                     </div>
                 ))}
                 {presets.length === 0 && (
                     <div className="text-center text-[10px] text-tactical-dim py-4 italic">NO_DATA</div>
                 )}
             </div>

             <div className="p-2 border-t border-tactical-structure flex gap-2">
                 <button onClick={onExport} className="flex-1 flex items-center justify-center gap-2 py-2 bg-tactical-bg border border-tactical-structure hover:border-tactical-dim text-[10px] font-mono text-tactical-dim hover:text-tactical-text transition-colors">
                     <Download size={12} /> BACKUP
                 </button>
                 <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 py-2 bg-tactical-bg border border-tactical-structure hover:border-tactical-dim text-[10px] font-mono text-tactical-dim hover:text-tactical-text transition-colors">
                     <Upload size={12} /> RESTORE
                 </button>
                 <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileRead} />
             </div>
        </div>
    );
};