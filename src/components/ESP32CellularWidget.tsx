'use client';

import React from 'react';
import { ESP32Telemetry } from '@/types/dispenser';
import { Signal, Cpu, Zap, Thermometer, Lock, Radio, Activity, RefreshCw } from 'lucide-react';

interface ESP32CellularWidgetProps {
  telemetry: ESP32Telemetry;
  onRefreshTelemetry: () => void;
}

export default function ESP32CellularWidget({ telemetry, onRefreshTelemetry }: ESP32CellularWidgetProps) {
  // CSQ to signal bars calculation (0-31)
  const activeBars = Math.min(4, Math.max(1, Math.ceil((telemetry.csq / 31) * 4)));

  return (
    <div className="glass-card telemetry-card">
      <div className="telemetry-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              padding: '0.4rem',
              borderRadius: '8px',
              background: 'rgba(20, 184, 166, 0.15)',
              color: '#14b8a6'
            }}
          >
            <Radio size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
              ESP32 Cellular Modem
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              ID: {telemetry.deviceId} ({telemetry.firmwareVersion})
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            className="status-badge"
            style={{
              background: telemetry.status === 'ONLINE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: telemetry.status === 'ONLINE' ? '#10b981' : '#ef4444',
              border: `1px solid ${telemetry.status === 'ONLINE' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}
          >
            <Activity size={12} className="animate-pulse" />
            {telemetry.status}
          </span>
          <button
            onClick={onRefreshTelemetry}
            className="btn-secondary"
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
            title="Poll ESP32 Now"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Grid of ESP32 Hardware Stats */}
      <div className="telemetry-grid">
        {/* Signal Stat */}
        <div className="stat-item">
          <div className="stat-label">
            <Signal size={13} style={{ color: '#38bdf8' }} />
            Cellular Signal (CSQ)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
            <span className="stat-value">{telemetry.rssiDbm} dBm</span>
            <div className="signal-bars">
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={`signal-bar ${bar <= activeBars ? 'active' : ''}`}
                  style={{ height: `${bar * 3.5 + 4}px` }}
                />
              ))}
            </div>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
            {telemetry.cellularNetwork} ({telemetry.csq}/31 CSQ)
          </span>
        </div>

        {/* Battery & Power */}
        <div className="stat-item">
          <div className="stat-label">
            <Zap size={13} style={{ color: '#f59e0b' }} />
            Power & Battery
          </div>
          <div className="stat-value" style={{ color: telemetry.batteryPercentage > 30 ? '#10b981' : '#f59e0b' }}>
            {telemetry.batteryPercentage}% ({telemetry.batteryVoltage}V)
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
            {telemetry.acPowerConnected ? '⚡ AC Mains Connected (Charging)' : '🔋 LiPo Battery Power'}
          </span>
        </div>

        {/* Cabinet Temperature & Humidity */}
        <div className="stat-item">
          <div className="stat-label">
            <Thermometer size={13} style={{ color: '#ec4899' }} />
            Cabinet Climate
          </div>
          <div className="stat-value">{telemetry.temperatureC}°C</div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
            Humidity: {telemetry.humidityPercent}% RH (Normal)
          </span>
        </div>

        {/* Door Security */}
        <div className="stat-item">
          <div className="stat-label">
            <Lock size={13} style={{ color: '#a78bfa' }} />
            Security & IR Sensors
          </div>
          <div className="stat-value" style={{ fontSize: '0.95rem', color: '#a78bfa' }}>
            SECURE (Locked)
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
            4x Optical IR Ejection Sensors Active
          </span>
        </div>
      </div>

      {/* Network Metadata */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.4)',
          borderRadius: '8px',
          padding: '0.65rem 0.85rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          fontSize: '0.75rem',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <span style={{ color: '#94a3b8' }}>IP: <strong style={{ color: '#cbd5e1' }}>{telemetry.ipAddress}</strong></span>
        <span style={{ color: '#94a3b8' }}>Total Dispensed: <strong style={{ color: '#ec4899' }}>{telemetry.totalDispensedCount} units</strong></span>
        <span style={{ color: '#94a3b8' }}>Last Heartbeat: <strong style={{ color: '#10b981' }}>Just now</strong></span>
      </div>
    </div>
  );
}
