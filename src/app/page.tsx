'use client';

import React, { useState, useEffect } from 'react';
import HeaderNavbar from '@/components/HeaderNavbar';
import PadStockCard from '@/components/PadStockCard';
import ESP32CellularWidget from '@/components/ESP32CellularWidget';
import ESP32PollWidget from '@/components/ESP32PollWidget';
import MPesaPurchaseModal from '@/components/MPesaPurchaseModal';
import TransactionHistoryTable from '@/components/TransactionHistoryTable';
import RefillControlPanel from '@/components/RefillControlPanel';

import { PadItem, ESP32Telemetry, MPesaPaymentRequest, TelemetryLogEntry, DispenseOrder } from '@/types/dispenser';
import { INITIAL_PADS, INITIAL_TELEMETRY, INITIAL_TRANSACTIONS, INITIAL_LOGS } from '@/lib/dispenserData';
import { db } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { ShieldCheck, Layers, ShoppingBag, Radio, Sparkles, AlertTriangle, CheckCircle2, TrendingUp, Cpu, Database } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'purchase' | 'cellular' | 'polling' | 'refill' | 'transactions'>('dashboard');
  const [pads, setPads] = useState<PadItem[]>(INITIAL_PADS);
  const [telemetry, setTelemetry] = useState<ESP32Telemetry>(INITIAL_TELEMETRY);
  const [transactions, setTransactions] = useState<MPesaPaymentRequest[]>(INITIAL_TRANSACTIONS);
  const [logs, setLogs] = useState<TelemetryLogEntry[]>(INITIAL_LOGS);

  const [selectedPadForPurchase, setSelectedPadForPurchase] = useState<PadItem | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dispensingSlot, setDispensingSlot] = useState<number | null>(null);

  // Firebase Realtime DB Sync (if available)
  useEffect(() => {
    if (!db) return;

    try {
      const inventoryRef = ref(db, 'dispenser/inventory');
      const unsubscribeInventory = onValue(inventoryRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setPads(Object.values(data));
        }
      });

      const telemetryRef = ref(db, 'dispenser/telemetry');
      const unsubscribeTelemetry = onValue(telemetryRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setTelemetry(data);
        }
      });

      return () => {
        unsubscribeInventory();
        unsubscribeTelemetry();
      };
    } catch (e) {
      console.warn('Firebase DB sync listener error:', e);
    }
  }, []);

  // Periodic Telemetry Refresh Simulation (Simulate ESP32 Cellular Ping)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/telemetry');
        const data = await res.json();
        if (data.success && data.telemetry) {
          setTelemetry((prev) => ({
            ...prev,
            ...data.telemetry
          }));
        }
      } catch (e) {
        // silent fallback
      }
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const handleRefreshData = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      if (data.success && data.data) {
        setPads(data.data);
      }
    } catch (e) {
      console.warn('Refresh error:', e);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handleQuickDispense = async (pad: PadItem) => {
    setDispensingSlot(pad.slotNumber);

    try {
      // API call to ESP32 dispense route
      await fetch('/api/dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotNumber: pad.slotNumber, quantity: 1 })
      });

      // Update local state
      const updatedPads = pads.map((item) => {
        if (item.slotNumber === pad.slotNumber) {
          return { ...item, currentStock: Math.max(0, item.currentStock - 1) };
        }
        return item;
      });
      setPads(updatedPads);

      // Sync to Firebase if connected
      if (db) {
        set(ref(db, `dispenser/inventory/slot_${pad.slotNumber}`), {
          ...pad,
          currentStock: Math.max(0, pad.currentStock - 1)
        });
      }

      // Add log
      const newLog: TelemetryLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'SUCCESS',
        message: `Manual Test: Dispensed 1 unit from Slot ${pad.slotNumber} (${pad.name})`,
        details: 'Motor pulse 850ms - Optical IR verified'
      };
      setLogs((prev) => [newLog, ...prev]);
    } catch (e) {
      console.error('Dispense error:', e);
    } finally {
      setTimeout(() => setDispensingSlot(null), 800);
    }
  };

  const handleOrderDispensedFromMongoDB = (order: DispenseOrder) => {
    // Decrement stock for dispensed slot
    const updatedPads = pads.map((item) => {
      if (item.slotNumber === order.slotNumber) {
        return { ...item, currentStock: Math.max(0, item.currentStock - order.quantity) };
      }
      return item;
    });
    setPads(updatedPads);

    const newLog: TelemetryLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'SUCCESS',
      message: `ESP32 HTTP GET Poll: Order ${order.orderId} Dispensed from Slot ${order.slotNumber}`,
      details: `${order.quantity}x ${order.padName} - Source: ${order.source} - Status: DISPENSED`
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const handlePaymentSuccess = (newTxn: MPesaPaymentRequest) => {
    // Add transaction to ledger
    setTransactions((prev) => [newTxn, ...prev]);

    // Decrement stock for purchased slot
    const updatedPads = pads.map((item) => {
      if (item.slotNumber === newTxn.slotNumber) {
        const newStock = Math.max(0, item.currentStock - newTxn.quantity);
        return { ...item, currentStock: newStock };
      }
      return item;
    });
    setPads(updatedPads);

    // Sync to Firebase Realtime DB
    if (db) {
      set(ref(db, 'dispenser/transactions/' + newTxn.id), newTxn);
    }

    // Add log entry
    const newLog: TelemetryLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'SUCCESS',
      message: `M-Pesa Purchase Confirmed: Receipt ${newTxn.mpesaReceiptNumber}`,
      details: `${newTxn.quantity}x Slot #${newTxn.slotNumber} (${newTxn.padName}) - Phone: ${newTxn.phoneNumber}`
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleRefillAll = async () => {
    try {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetAll: true })
      });

      const refilled = pads.map((p) => ({ ...p, currentStock: p.maxCapacity }));
      setPads(refilled);

      const newLog: TelemetryLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'INFO',
        message: 'Admin restocked all 4 pad slots to 50 capacity',
        details: 'Total capacity: 200 pads'
      };
      setLogs((prev) => [newLog, ...prev]);
    } catch (e) {
      console.error('Refill error:', e);
    }
  };

  const handleUpdateSlotStock = (slotNumber: number, newStock: number) => {
    const updated = pads.map((p) => {
      if (p.slotNumber === slotNumber) {
        return { ...p, currentStock: Math.max(0, Math.min(50, newStock)) };
      }
      return p;
    });
    setPads(updated);
  };

  // Metrics summary calculations
  const totalStockCount = pads.reduce((sum, p) => sum + p.currentStock, 0);
  const maxTotalCapacity = pads.reduce((sum, p) => sum + p.maxCapacity, 0);
  const lowStockCount = pads.filter((p) => p.currentStock <= p.lowStockThreshold).length;
  const totalRevenueKes = transactions
    .filter((t) => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.totalAmountKes, 0);

  return (
    <div className="dashboard-layout">
      <div className="app-bg-mesh" />

      {/* Top Header Navbar */}
      <HeaderNavbar
        telemetry={telemetry}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSyncing={isSyncing}
        onRefresh={handleRefreshData}
        lowStockCount={lowStockCount}
      />

      <main className="main-container">
        {/* KPI Metrics Summary Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div className="stat-label">
              <Layers size={15} className="text-pink-400" />
              Total Pad Inventory
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>
              {totalStockCount} <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 400 }}>/ {maxTotalCapacity} pads</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
              4 Active Dispensing Slots
            </span>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div className="stat-label">
              <TrendingUp size={15} className="text-emerald-400" />
              M-Pesa Revenue
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>
              KES {totalRevenueKes.toLocaleString()}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {transactions.filter((t) => t.status === 'COMPLETED').length} Successful Purchases
            </span>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div className="stat-label">
              <AlertTriangle size={15} className="text-amber-400" />
              Stock Alert Status
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: lowStockCount > 0 ? '#f59e0b' : '#10b981', marginTop: '0.2rem' }}>
              {lowStockCount > 0 ? `${lowStockCount} Low Channels` : 'All Stocked'}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Threshold: &le; 10 pads / slot
            </span>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div className="stat-label">
              <Radio size={15} className="text-cyan-400" />
              Cellular Link (ESP32)
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem' }}>
              {telemetry.rssiDbm} dBm
            </div>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
              ● Safaricom 4G LTE Active
            </span>
          </div>
        </div>

        {/* TAB 1: Main Dashboard (Pad Quantities & Telemetry Widget) */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="section-header">
              <div className="section-title-group">
                <h1>
                  <Layers size={24} className="text-pink-500" />
                  Sanitary Pad Channels (4 Types)
                </h1>
                <p>Real-time capacity, stock levels, and instant M-Pesa purchase links</p>
              </div>
            </div>

            {/* Grid of 4 Pad Stock Cards */}
            <div className="pad-cards-grid">
              {pads.map((pad) => (
                <PadStockCard
                  key={pad.id}
                  pad={pad}
                  onSelectForPurchase={(p) => setSelectedPadForPurchase(p)}
                  onQuickDispense={handleQuickDispense}
                  isDispensingThisSlot={dispensingSlot === pad.slotNumber}
                />
              ))}
            </div>

            {/* ESP32 HTTP GET Polling & MongoDB Order Queue */}
            <ESP32PollWidget onOrderDispensed={handleOrderDispensedFromMongoDB} />

            {/* Cellular Diagnostics & Recent Activity */}
            <div className="grid-2col">
              <ESP32CellularWidget
                telemetry={telemetry}
                onRefreshTelemetry={handleRefreshData}
              />

              <TransactionHistoryTable transactions={transactions.slice(0, 4)} />
            </div>
          </div>
        )}

        {/* TAB: ESP32 GET Polling Queue & MongoDB Monitor */}
        {activeTab === 'polling' && (
          <div>
            <div className="section-header">
              <div className="section-title-group">
                <h1>
                  <Database size={24} className="text-emerald-400" />
                  ESP32 GET Polling & MongoDB Dispense Queue
                </h1>
                <p>Live MongoDB order database, ESP32 HTTP GET request poller, and hardware firmware code</p>
              </div>
            </div>

            <ESP32PollWidget onOrderDispensed={handleOrderDispensedFromMongoDB} />
          </div>
        )}

        {/* TAB 2: Purchase & M-Pesa Showcase */}
        {activeTab === 'purchase' && (
          <div>
            <div className="section-header">
              <div className="section-title-group">
                <h1>
                  <ShoppingBag size={24} className="text-emerald-400" />
                  Select Pad & Lipa na M-Pesa
                </h1>
                <p>Choose from the 4 available sanitary pad types to buy directly via M-Pesa STK Push</p>
              </div>
            </div>

            <div className="pad-cards-grid">
              {pads.map((pad) => (
                <PadStockCard
                  key={pad.id}
                  pad={pad}
                  onSelectForPurchase={(p) => setSelectedPadForPurchase(p)}
                  onQuickDispense={handleQuickDispense}
                  isDispensingThisSlot={dispensingSlot === pad.slotNumber}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ESP32 Cellular Technical Diagnostics */}
        {activeTab === 'cellular' && (
          <div>
            <div className="section-header">
              <div className="section-title-group">
                <h1>
                  <Radio size={24} className="text-cyan-400" />
                  ESP32 Cellular Modem Monitor
                </h1>
                <p>SIM7000G / A7670 telemetry signals, battery power, and environment status</p>
              </div>
            </div>

            <ESP32CellularWidget telemetry={telemetry} onRefreshTelemetry={handleRefreshData} />
          </div>
        )}

        {/* TAB 4: Refill & Hardware Maintenance */}
        {activeTab === 'refill' && (
          <div>
            <div className="section-header">
              <div className="section-title-group">
                <h1>
                  <Cpu size={24} className="text-purple-400" />
                  Dispenser Maintenance & Refill Control
                </h1>
                <p>Restock pad stock levels, test hardware motor drivers, and view raw serial logs</p>
              </div>
            </div>

            <RefillControlPanel
              pads={pads}
              onRefillAll={handleRefillAll}
              onUpdateSlotStock={handleUpdateSlotStock}
              onTestMotor={(slotNumber) => {
                const pad = pads.find((p) => p.slotNumber === slotNumber);
                if (pad) return handleQuickDispense(pad);
              }}
              logs={logs}
            />
          </div>
        )}

        {/* TAB 5: Full Transactions Ledger */}
        {activeTab === 'transactions' && (
          <div>
            <div className="section-header">
              <div className="section-title-group">
                <h1>
                  <ShieldCheck size={24} className="text-emerald-400" />
                  All M-Pesa Payment Receipts
                </h1>
                <p>Complete transaction history, phone numbers, and dispensation status</p>
              </div>
            </div>

            <TransactionHistoryTable transactions={transactions} />
          </div>
        )}
      </main>

      {/* M-Pesa Purchase Modal Popup */}
      {selectedPadForPurchase && (
        <MPesaPurchaseModal
          pad={selectedPadForPurchase}
          onClose={() => setSelectedPadForPurchase(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Footer */}
      <footer className="app-footer">
        <p>
          SafePad Care &copy; 2026 &bull; Powered by ESP32 SIM7000G Cellular & Safaricom Lipa Na M-Pesa &bull; Firebase Realtime Cloud
        </p>
      </footer>
    </div>
  );
}
