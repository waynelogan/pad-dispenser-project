'use client';

import React from 'react';
import { ShieldCheck, Wifi, Signal, Battery, Layers, ShoppingBag, Radio, RefreshCw, AlertTriangle, Database } from 'lucide-react';
import { ESP32Telemetry } from '@/types/dispenser';

interface HeaderNavbarProps {
  telemetry: ESP32Telemetry;
  activeTab: 'dashboard' | 'purchase' | 'cellular' | 'polling' | 'refill' | 'transactions';
  setActiveTab: (tab: 'dashboard' | 'purchase' | 'cellular' | 'polling' | 'refill' | 'transactions') => void;
  isSyncing: boolean;
  onRefresh: () => void;
  lowStockCount: number;
}

export default function HeaderNavbar({
  telemetry,
  activeTab,
  setActiveTab,
  isSyncing,
  onRefresh,
  lowStockCount
}: HeaderNavbarProps) {
  return (
    <header className="navbar">
      <div className="brand-container">
        <div className="brand-icon-wrapper">
          <ShieldCheck size={26} />
        </div>
        <div>
          <h1 className="brand-title">SafePad Care</h1>
          <p className="brand-subtitle">
            <Radio size={12} className="text-pink-400" />
            ESP32 Cellular Dispenser Platform
          </p>
        </div>
      </div>

      {/* Tabs */}
      <nav className="nav-tabs">
        <button
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <Layers size={16} />
          Pad Quantities
          {lowStockCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {lowStockCount} alert
            </span>
          )}
        </button>

        <button
          className={`tab-button ${activeTab === 'polling' ? 'active' : ''}`}
          onClick={() => setActiveTab('polling')}
        >
          <Database size={16} className="text-emerald-400" />
          ESP32 GET Queue
        </button>

        <button
          className={`tab-button ${activeTab === 'purchase' ? 'active' : ''}`}
          onClick={() => setActiveTab('purchase')}
        >
          <ShoppingBag size={16} />
          M-Pesa Purchase
        </button>

        <button
          className={`tab-button ${activeTab === 'cellular' ? 'active' : ''}`}
          onClick={() => setActiveTab('cellular')}
        >
          <Signal size={16} />
          ESP32 Cellular
        </button>

        <button
          className={`tab-button ${activeTab === 'refill' ? 'active' : ''}`}
          onClick={() => setActiveTab('refill')}
        >
          <RefreshCw size={16} />
          Refill & Test
        </button>

        <button
          className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <ShieldCheck size={16} />
          Transactions
        </button>
      </nav>

      {/* Connectivity & Battery Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={onRefresh}
          className="btn-secondary"
          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
          title="Refresh Data & Firebase Sync"
        >
          <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
          Sync
        </button>

        <div className="nav-status-pill">
          <span className="pulse-dot"></span>
          <span>{telemetry.cellularProvider}</span>
          <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>| {telemetry.rssiDbm} dBm</span>
          <Battery size={14} style={{ marginLeft: '0.2rem', color: telemetry.batteryPercentage > 20 ? '#10b981' : '#ef4444' }} />
          <span>{telemetry.batteryPercentage}%</span>
        </div>
      </div>
    </header>
  );
}
