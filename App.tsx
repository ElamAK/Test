import React, { useState, useEffect, useMemo } from 'react';
import { Crosshair, Zap, AlertTriangle, Moon, Sun } from 'lucide-react';
import { TacticalButton, Fader, DiceAdder, DicePoolDisplay, DistributionGraph, CornerBrackets, Barcode, MemoryBank, ConfirmationModal, CircularProgress, RangeBar } from './components/TacticalComponents';
import { GlitchText } from './components/GlitchText';
import { ProbabilityState, LogEntry, CLIP_PATH_TAG, DiceType, Preset } from './types';
import { calculateSimulation, performRoll } from './services/probabilityService';

const App: React.FC = () => {
  const [state, setState] = useState<ProbabilityState>({
    dice: { 20: 1 },
    skill: 5,
    modifier: 0,
    target: 15,
    advantage: false,
    disadvantage: false,
    mode: 'standard',
  });
  
  // Theme State
  const [theme, setTheme] = useState<'dark'|'light'>('dark');

  // --- PRESET STATE ---
  const [presets, setPresets] = useState<Preset[]>([
      { id: '1', name: 'STANDARD_ATK', state: { dice: {20:1}, skill: 5, modifier: 0, target: 15, advantage:false, disadvantage:false, mode:'standard' } },
      { id: '2', name: 'HEAVY_DMG', state: { dice: {6:2, 4:1}, skill: 2, modifier: -2, target: 10, advantage:false, disadvantage:false, mode:'standard' } }
  ]);
  const [currentPresetName, setCurrentPresetName] = useState("UNNAMED_LOADOUT");
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  const simulation = useMemo(() => calculateSimulation(state), [state]);
  
  // Calculate absolute range for the RangeBar context
  const absoluteMin = useMemo(() => state.skill + state.modifier + Object.entries(state.dice).reduce((acc, [s, c]) => acc + c, 0), [state]);
  const maxRoll = useMemo(() => Object.entries(state.dice).reduce((acc, [s, c]) => acc + (Number(s)*c), 0) + state.skill + state.modifier, [state]);
  
  const isSuccess = simulation.chance >= 50;
  const isHighRisk = simulation.chance < 40;
  const isGuaranteed = simulation.chance >= 100;

  // --- ACTIONS ---

  const handleExecute = () => {
      const result = performRoll(state);
      
      const newLog: LogEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          isSuccess: result.isSuccess,
          finalTotal: result.finalTotal,
          target: state.target,
          rollType: result.rollType,
          rolls: result.rolls
      };

      setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const handleRemoveDice = (sides: DiceType) => {
    setState(prev => {
      const currentCount = prev.dice[sides] || 0;
      if (currentCount <= 0) return prev;
      
      const newDice = { ...prev.dice };
      if (currentCount === 1) {
        delete newDice[sides];
      } else {
        newDice[sides] = currentCount - 1;
      }
      return { ...prev, dice: newDice };
    });
  };

  const handleSavePreset = (name: string) => {
      const existingIndex = presets.findIndex(p => p.name === name);
      if (existingIndex >= 0) {
          const updatedPresets = [...presets];
          updatedPresets[existingIndex] = { ...updatedPresets[existingIndex], state: JSON.parse(JSON.stringify(state)) };
          setPresets(updatedPresets);
      } else {
          const newPreset: Preset = { id: Date.now().toString(), name: name || `LOADOUT_${presets.length+1}`, state: JSON.parse(JSON.stringify(state)) };
          setPresets(prev => [...prev, newPreset]);
      }
      setCurrentPresetName(name);
  };

  const handleSaveAsNewPreset = (baseName: string) => {
      let newName = baseName;
      const regex = /^(.*)_(\d+)$/;
      const match = baseName.match(regex);

      if (match) {
          const prefix = match[1];
          const num = parseInt(match[2], 10) + 1;
          newName = `${prefix}_${num.toString().padStart(2, '0')}`;
      } else {
          newName = `${baseName}_01`;
      }
      
      const newPreset: Preset = { id: Date.now().toString(), name: newName, state: JSON.parse(JSON.stringify(state)) };
      setPresets(prev => [...prev, newPreset]);
      setCurrentPresetName(newName);
  }

  const handleLoadPreset = (preset: Preset) => {
      setState(JSON.parse(JSON.stringify(preset.state)));
      setCurrentPresetName(preset.name);
  };

  const handleDeleteRequest = (id: string) => {
      setDeleteCandidateId(id);
  };

  const handleReorderPresets = (newPresets: Preset[]) => {
      setPresets(newPresets);
  };

  const confirmDelete = () => {
      if (deleteCandidateId) {
          setPresets(prev => prev.filter(p => p.id !== deleteCandidateId));
          setDeleteCandidateId(null);
      }
  };

  const handleExport = () => {
      const exportData = { version: "5.5", type: "PRTS_MEMORY_BANK_BACKUP", timestamp: new Date().toISOString(), count: presets.length, data: presets };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `PRTS_BACKUP_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleImport = (content: any) => {
      try {
          let candidates: Preset[] = [];
          if (content.type === "PRTS_MEMORY_BANK_BACKUP" && Array.isArray(content.data)) {
              candidates = content.data;
          } else if (Array.isArray(content)) {
              candidates = content;
          } else if (content.name && content.state) {
              candidates = [content];
          } else {
              throw new Error("INVALID_FORMAT");
          }

          if (candidates.length === 0) return;

          setPresets(current => {
              const next = [...current];
              candidates.forEach(incoming => {
                  if (!incoming.name || !incoming.state) return;
                  const idx = next.findIndex(p => p.name === incoming.name);
                  if (idx !== -1) {
                      next[idx] = { ...next[idx], state: incoming.state };
                  } else {
                      next.push({ id: incoming.id || `ext_${Date.now()}_${Math.random().toString(36).substr(2,9)}`, name: incoming.name, state: incoming.state });
                  }
              });
              return next;
          });
      } catch (e) {
          console.error(e);
      }
  };

  const toggleTheme = () => {
      setTheme(t => t === 'dark' ? 'light' : 'dark');
  };

  // Determine Circular Progress Color based on state logic
  // Returns a CSS variable string so it updates with theme
  const getProgressColor = () => {
      if (!isSuccess) return 'rgb(var(--tactical-red))';
      if (isGuaranteed) return 'rgb(var(--tactical-yellow))';
      return 'rgb(var(--tactical-cyan))';
  };

  return (
    <div className={`min-h-screen bg-tactical-bg text-tactical-text font-sans p-0 md:p-6 overflow-hidden flex flex-col items-center ${theme === 'light' ? 'light-mode' : ''}`}>
      <div className="fixed inset-0 pointer-events-none opacity-5 bg-stripes-dark z-0" />
      
      <ConfirmationModal 
        isOpen={!!deleteCandidateId}
        title="DELETE ENTRY?"
        message="THIS ACTION IS IRREVERSIBLE. PRESET DATA WILL BE PURGED FROM LOCAL MEMORY."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteCandidateId(null)}
      />

      <div className="relative z-10 w-full max-w-6xl h-screen md:h-[90vh] bg-tactical-panel border border-tactical-structure shadow-2xl flex flex-col overflow-hidden transition-colors duration-300">
        
        {/* HEADER */}
        <header className="h-16 bg-tactical-surface border-b border-tactical-structure flex items-center justify-between px-6 shrink-0 relative">
             <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-tactical-yellow to-transparent opacity-50" />
             <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-tactical-yellow flex items-center justify-center text-black font-bold text-xl" style={{clipPath: CLIP_PATH_TAG}}>P</div>
                 <div>
                     <h1 className="text-xl font-bold tracking-[0.2em] leading-none">PRTS_CALC</h1>
                     <div className="text-[10px] text-tactical-dim font-mono mt-1">RHODES ISLAND TACTICAL OS VER 5.5</div>
                 </div>
             </div>
             <div className="flex items-center gap-6">
                 <button onClick={toggleTheme} className="text-tactical-dim hover:text-tactical-cyan transition-colors" title="Toggle Visual Interface">
                     {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                 </button>
                 <div className="hidden md:flex flex-col items-end">
                     <span className="text-[9px] text-tactical-dim tracking-widest">SYSTEM STATUS</span>
                     <span className="text-xs font-mono text-tactical-cyan flex items-center gap-2"><div className="w-2 h-2 bg-current rounded-full animate-pulse"/> ONLINE</span>
                 </div>
                 <Barcode className="h-8 text-tactical-dim" />
             </div>
        </header>

        {/* MAIN BODY */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* SIDEBAR: CONTROLS */}
            <aside className="w-full md:w-96 bg-tactical-panel border-r border-tactical-structure flex flex-col z-20 overflow-hidden">
                <div className="flex-1 min-h-[250px] border-b border-tactical-structure overflow-hidden">
                    <MemoryBank 
                        currentName={currentPresetName}
                        presets={presets}
                        onSave={handleSavePreset}
                        onSaveAsNew={handleSaveAsNewPreset}
                        onLoad={handleLoadPreset}
                        onRename={setCurrentPresetName}
                        onExport={handleExport}
                        onImport={handleImport}
                        onDelete={handleDeleteRequest}
                        onReorder={handleReorderPresets}
                    />
                </div>
                <div className="p-6 border-b border-tactical-structure relative shrink-0">
                    <CornerBrackets />
                    <DicePoolDisplay 
                        config={state.dice} 
                        onClear={() => setState(s => ({...s, dice: {}}))} 
                        onRemove={handleRemoveDice}
                    />
                    <DiceAdder onAdd={(s) => setState(p => ({...p, dice: {...p.dice, [s]: (p.dice[s]||0)+1}}))} />
                </div>
                <div className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar bg-tactical-bg/50 shrink-0 min-h-[200px]">
                    <div className="flex gap-4 h-48">
                         <Fader value={state.skill} max={50} onChange={v=>setState(s=>({...s, skill:v}))} label="SKILL" color="cyan" />
                         <Fader value={state.modifier} min={-20} max={20} onChange={v=>setState(s=>({...s, modifier:v}))} label="MOD" color="gray" />
                         <Fader value={state.target} min={1} max={Math.max(20, maxRoll+5)} onChange={v=>setState(s=>({...s, target:v}))} label="DC" color="red" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                         <TacticalButton label="ADVANTAGE" subLabel="ROLL TWICE (HI)" active={state.advantage} onClick={()=>setState(s=>({...s, advantage:!s.advantage, disadvantage:false}))} icon={<Zap size={14}/>} />
                         <TacticalButton label="DISADVANTAGE" subLabel="ROLL TWICE (LO)" active={state.disadvantage} danger onClick={()=>setState(s=>({...s, disadvantage:!s.disadvantage, advantage:false}))} icon={<AlertTriangle size={14}/>} />
                    </div>
                </div>
            </aside>

            {/* CENTER: ANALYTICS */}
            <main className="flex-1 flex flex-col relative bg-tactical-bg">
                <div className="h-8 bg-tactical-structure/20 border-b border-tactical-structure flex items-center justify-between px-4 text-[10px] font-mono text-tactical-dim">
                     <span>MODULE: PROBABILITY_ENGINE</span>
                     <span>ID: {state.mode.toUpperCase()}</span>
                </div>

                <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden">
                    {/* ENHANCED ESTIMATE BOX */}
                    <div className="flex-1 flex flex-col items-center justify-center relative min-h-[250px] border border-tactical-structure/50 bg-tactical-bg/40 p-4">
                         <CornerBrackets />
                         <div className="absolute top-0 left-0 bg-tactical-yellow text-black text-[9px] font-bold px-2 py-0.5">ESTIMATE</div>
                         
                         {/* Radial Gauge Container */}
                         <div className="relative z-10 my-4">
                            <CircularProgress 
                                percentage={simulation.chance} 
                                size={220} 
                                strokeWidth={6} 
                                color={getProgressColor()}
                            >
                                <div className="flex flex-col items-center">
                                    <div className="flex items-baseline relative">
                                        <GlitchText 
                                            text={simulation.chance.toString()} 
                                            className={`text-7xl font-bold leading-none tracking-tighter ${isSuccess ? 'text-tactical-cyan' : 'text-tactical-red'} ${isHighRisk ? 'animate-pulse' : ''}`}
                                            speed={40}
                                        />
                                        <span className="text-2xl text-tactical-dim font-thin ml-1">%</span>
                                    </div>
                                    <div className={`text-[10px] font-mono tracking-widest mt-2 ${isSuccess ? 'text-tactical-cyan' : 'text-tactical-red'}`}>
                                        {isGuaranteed ? 'OUTCOME_GUARANTEED' : (isSuccess ? 'PROBABILITY_OPTIMAL' : (isHighRisk ? 'FAILURE_IMMINENT' : 'UNCERTAIN'))}
                                    </div>
                                </div>
                            </CircularProgress>
                         </div>

                         {/* Range Bar */}
                         <div className="w-full max-w-md px-4">
                            <RangeBar 
                                min={simulation.min}
                                max={simulation.max}
                                avg={simulation.mean}
                                target={state.target}
                                currentMin={absoluteMin}
                                currentMax={maxRoll}
                            />
                         </div>
                    </div>

                    {/* GRAPH */}
                    <div className="h-1/3 min-h-[160px] flex flex-col relative border border-tactical-structure bg-tactical-bg">
                        <div className="absolute top-0 right-0 p-2 flex gap-2">
                             <div className="w-2 h-2 bg-tactical-yellow rounded-full animate-pulse" />
                        </div>
                        <DistributionGraph data={simulation.distribution} target={state.target} className="flex-1" />
                        <div className="h-8 border-t border-tactical-structure bg-tactical-panel flex divide-x divide-tactical-structure">
                             <StatBlock label="MEAN" value={simulation.mean} />
                             <StatBlock label="SIGMA" value={`±${simulation.stdDev}`} />
                             <StatBlock label="RANGE" value={`${simulation.min}-${simulation.max}`} />
                        </div>
                    </div>
                </div>
            </main>
        </div>

        {/* FOOTER LOG */}
        <footer className="h-20 bg-tactical-surface border-t border-tactical-structure flex shrink-0">
             <button 
                onClick={handleExecute}
                className="w-32 bg-tactical-yellow hover:bg-tactical-text hover:text-tactical-bg text-black font-bold flex flex-col items-center justify-center transition-colors border-r border-tactical-structure group shrink-0"
             >
                <Crosshair size={24} className="mb-1 group-hover:rotate-90 transition-transform" />
                <span className="text-[10px] tracking-widest">EXECUTE</span>
             </button>
             
             <div className="flex-1 flex items-center px-4 overflow-x-auto no-scrollbar gap-4 text-xs font-mono text-tactical-dim">
                 <div className="flex flex-col justify-center h-full text-[9px] opacity-50 shrink-0 border-r border-tactical-structure pr-4">
                     <div>SYS_LOG</div>
                     <div>STREAM</div>
                 </div>
                 
                 {logs.map(log => (
                     <div key={log.id} className="flex flex-col justify-center bg-tactical-bg/30 px-3 py-1 border-l-2 border-tactical-structure min-w-[300px] h-16 shrink-0 group hover:bg-tactical-surface/50 transition-colors">
                         <div className="flex justify-between items-center mb-1 border-b border-tactical-structure/50 pb-1">
                             <span className="text-tactical-dim">{log.timestamp}</span>
                             <span className={`font-bold ${log.isSuccess ? 'text-tactical-cyan' : 'text-tactical-red'}`}>
                                 {log.isSuccess ? 'SUCCESS' : 'FAIL'}
                             </span>
                             <div className="flex items-center gap-2">
                                 {log.rollType !== 'NORMAL' && <span className="text-[9px] text-tactical-yellow">{log.rollType}</span>}
                                 <span className="text-tactical-bg font-bold text-sm bg-tactical-text px-1 rounded-sm">{log.finalTotal}</span>
                             </div>
                         </div>
                         <div className="text-[9px] text-tactical-dim space-y-0.5">
                             <div className="flex justify-between">
                                 <span className="opacity-70">R1:</span>
                                 <span className="font-mono text-tactical-text">
                                     {log.rolls[0].breakdown} + {log.rolls[0].skill + log.rolls[0].mod} = <span className="font-bold">{log.rolls[0].total}</span>
                                 </span>
                             </div>
                             {log.rolls[1] && (
                                 <div className="flex justify-between">
                                     <span className="opacity-70">R2:</span>
                                     <span className="font-mono text-tactical-text">
                                         {log.rolls[1].breakdown} + {log.rolls[1].skill + log.rolls[1].mod} = <span className="font-bold">{log.rolls[1].total}</span>
                                     </span>
                                 </div>
                             )}
                         </div>
                     </div>
                 ))}
                 {logs.length === 0 && <span className="opacity-30 italic">READY_FOR_EXECUTION...</span>}
             </div>
        </footer>

      </div>
    </div>
  );
};

const StatBlock: React.FC<{label: string, value: string|number}> = ({label, value}) => (
    <div className="flex-1 flex items-center justify-between px-4 text-[10px] font-mono">
        <span className="text-tactical-dim">{label}</span>
        <span className="text-tactical-text font-bold">{value}</span>
    </div>
);

export default App;