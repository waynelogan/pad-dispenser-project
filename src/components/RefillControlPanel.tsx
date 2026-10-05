'use client';

import React, { useState } from 'react';
import { PadItem, TelemetryLogEntry } from '@/types/dispenser';
import { RefreshCw, Play, CheckCircle2, Wrench, Terminal, Database, Server } from 'lucide-react';

interface RefillControlPanelProps {
  pads: PadItem[];
  onRefillAll: () => void;
  onUpdateSlotStock: (slotNumber: number, newStock: number) => void;
  onTestMotor: (slotNumber: number) => void;
  logs: TelemetryLogEntry[];
}

export default function RefillControlPanel({
  pads,
  onRefillAll,
  onUpdateSlotStock,
  onTestMotor,
  logs
}: RefillControlPanelProps) {
  const [testingSlot, setTestingSlot] = useState<number | null>(null);

  const handleTest = async (slotNumber: number) => {
    setTestingSlot(slotNumber);
    await onTestMotor(slotNumber);
    setTimeout(() => {
      setTestingSlot(null);
    }, 1000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Refill Header Actions */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wrench size={20} className="text-pink-400" />
            Dispenser Refill & Hardware Control Panel
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Restock pad channels, test ESP32 stepper/servo motor drivers, and view cellular logs.
          </p>
        </div>

        <button onClick={onRefillAll} className="btn-primary">
          <RefreshCw size={16} />
          Restock All 4 Slots to 50 Units
        </button>
      </div>

      {/* Individual Slot Management */}
      <div className="pad-cards-grid">
        {pads.map((pad) => (
          <div key={pad.id} className="glass-card" style={{ borderTop: `4px solid ${pad.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span className="slot-badge">Slot #{pad.slotNumber}</span>
              <span style={{ fontSize: '0.8rem', color: pad.currentStock <= 10 ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
                {pad.currentStock} / 50 pads
              </span>
            </div>

            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.2rem' }}>
              {pad.name}
            </h4>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1rem' }}>
              Absorbency: {pad.absorbency} ({pad.lengthMm}mm)
            </p>

            {/* Quick Set Stock Input */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="number"
                min={0}
                max={50}
                value={pad.currentStock}
                onChange={(e) => onUpdateSlotStock(pad.slotNumber, parseInt(e.target.value) || 0)}
                className="form-input"
                style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', textAlign: 'center' }}
              />
              <button
                onClick={() => onUpdateSlotStock(pad.slotNumber, 50)}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
              >
                Max 50
              </button>
            </div>

            {/* Motor Test Button */}
            <button
              onClick={() => handleTest(pad.slotNumber)}
              disabled={testingSlot === pad.slotNumber}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}
            >
              {testingSlot === pad.slotNumber ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-pink-400" />
                  Actuating Motor {pad.slotNumber}...
                </>
              ) : (
                <>
                  <Play size={14} />
                  Test Motor Ejection
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Telemetry Log Terminal */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Terminal size={18} className="text-teal-400" />
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
            ESP32 Cellular & Hardware Diagnostic Log
          </h4>
        </div>

        <div
          style={{
            background: '#090d16',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1rem',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            maxHeight: '260px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          {logs.map((log) => (
            <div key={log.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline' }}>
              <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  color:
                    log.type === 'CELLULAR'
                      ? '#38bdf8'
                      : log.type === 'SUCCESS'
                      ? '#10b981'
                      : log.type === 'WARN'
                      ? '#f59e0b'
                      : '#ec4899'
                }}
              >
                {log.type}
              </span>
              <span style={{ color: '#e2e8f0' }}>{log.message}</span>
              {log.details && <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>({log.details})</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
