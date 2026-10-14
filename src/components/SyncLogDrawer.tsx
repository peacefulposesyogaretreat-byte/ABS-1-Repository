import React, { useState } from 'react';
import { SyncLogEvent, ChannelId } from '../types/hotel';
import { CHANNEL_CONFIGS } from '../data/initialData';
import { X, ShieldCheck, AlertTriangle, Info, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';

interface SyncLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: SyncLogEvent[];
  onClearLogs: () => void;
}

export const SyncLogDrawer: React.FC<SyncLogDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  if (!isOpen) return null;

  const filteredLogs = logs.filter((l) => {
    if (filterSeverity === 'all') return true;
    return l.severity === filterSeverity;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Channel Synchronization Audit Log
              </h3>
              <span className="text-[11px] font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                {logs.length} events
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time audit trail of every booking, atomic lock, and OTA broadcast.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-3 border-b border-slate-200 flex items-center justify-between text-xs bg-white">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Filter:</span>
            <button
              onClick={() => setFilterSeverity('all')}
              className={`px-2 py-1 rounded font-medium ${
                filterSeverity === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterSeverity('success')}
              className={`px-2 py-1 rounded font-medium ${
                filterSeverity === 'success' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Pushes
            </button>
            <button
              onClick={() => setFilterSeverity('alert')}
              className={`px-2 py-1 rounded font-medium ${
                filterSeverity === 'alert' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Conflicts
            </button>
          </div>

          <button
            onClick={onClearLogs}
            className="flex items-center gap-1 text-slate-500 hover:text-red-700 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>

        {/* Log Entries */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs">No synchronization events recorded for this filter.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const cfg = CHANNEL_CONFIGS[log.channel];

              return (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border text-xs space-y-1 ${
                    log.severity === 'alert'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                      : log.severity === 'success'
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: cfg?.brandColor || '#334155' }}
                      />
                      <span className="font-bold text-slate-900">
                        {cfg?.badgeText || 'ABS-1 Core'}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-medium text-slate-600">{log.unitName}</span>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="font-medium text-slate-900">{log.message}</p>
                  <p className="text-[11px] text-slate-600 font-mono leading-relaxed">
                    {log.details}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
