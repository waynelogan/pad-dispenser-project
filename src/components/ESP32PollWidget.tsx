'use client';

import React, { useState, useEffect } from 'react';
import { DispenseOrder, ESP32PollResponse } from '@/types/dispenser';
import { Database, Cpu, RefreshCw, Send, CheckCircle2, Clock, AlertCircle, Play, Pause, Code2, PlusCircle, Trash2 } from 'lucide-react';

interface ESP32PollWidgetProps {
  onOrderDispensed?: (order: DispenseOrder) => void;
}

export default function ESP32PollWidget({ onOrderDispensed }: ESP32PollWidgetProps) {
  const [orders, setOrders] = useState<DispenseOrder[]>([]);
  const [mongoConnected, setMongoConnected] = useState<boolean>(false);
  const [dbMode, setDbMode] = useState<string>('Checking...');
  const [isAutoPolling, setIsAutoPolling] = useState<boolean>(true);
  const [lastPollResponse, setLastPollResponse] = useState<ESP32PollResponse | null>(null);
  const [pollCount, setPollCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showCode, setShowCode] = useState<boolean>(false);

  // Fetch queue from API
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        setMongoConnected(data.mongoConnected ?? false);
        setDbMode(data.dbMode || 'InMemoryFallback');
      }
    } catch (e) {
      console.warn('Error fetching orders queue:', e);
    }
  };

  // Perform single ESP32 GET poll
  const triggerESP32Poll = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/esp32/poll?deviceId=ESP32-CELL-DISPENSER-01');
      const data: ESP32PollResponse = await res.json();
      setLastPollResponse(data);
      setPollCount((prev) => prev + 1);

      if (data.hasOrder && data.order) {
        if (onOrderDispensed) {
          onOrderDispensed(data.order);
        }
      }

      await fetchOrders();
    } catch (e) {
      console.error('Poll error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Add test order to queue
  const handleQueueOrder = async (slotNumber: number) => {
    try {
      const padNames: Record<number, string> = {
        1: 'Regular Ultra-Thin (Slot 1)',
        2: 'Super Maxi Wings (Slot 2)',
        3: 'Night-Guard Extra Long (Slot 3)',
        4: 'Daily Fresh Organic (Slot 4)'
      };

      const padPrices: Record<number, number> = { 1: 20, 2: 25, 3: 30, 4: 15 };

      await fetch('/api/esp32/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotNumber,
          padName: padNames[slotNumber],
          totalAmountKes: padPrices[slotNumber],
          source: 'DASHBOARD_QUEUE'
        })
      });

      await fetchOrders();
    } catch (e) {
      console.error('Queue error:', e);
    }
  };

  const handleClearOrders = async () => {
    try {
      await fetch('/api/orders', { method: 'DELETE' });
      await fetchOrders();
    } catch (e) {
      console.error('Clear error:', e);
    }
  };

  // Auto-polling interval simulation (ESP32 GET request every 4s)
  useEffect(() => {
    fetchOrders();

    if (!isAutoPolling) return;

    const interval = setInterval(() => {
      triggerESP32Poll();
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPolling]);

  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const dispensedOrders = orders.filter((o) => o.status === 'DISPENSED');

  return (
    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Database size={22} className="text-emerald-400" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
              ESP32 HTTP GET Polling & MongoDB Queue
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem', marginBottom: 0 }}>
            ESP32 issues periodic HTTP <code style={{ color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '2px 6px', borderRadius: '4px' }}>GET /api/esp32/poll</code> requests to fetch & dispense queued orders from MongoDB.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* MongoDB Connection Status Badge */}
          <div
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: mongoConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              color: mongoConnected ? '#10b981' : '#60a5fa',
              border: `1px solid ${mongoConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
            }}
          >
            <Database size={13} />
            {mongoConnected ? 'MongoDB Server Connected' : 'Smart In-Memory Queue (Dev)'}
          </div>

          <button
            onClick={() => setShowCode(!showCode)}
            className="btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Code2 size={14} />
            {showCode ? 'Hide C++ Code' : 'ESP32 C++ Code'}
          </button>
        </div>
      </div>

      {/* C++ Arduino Code Snippet Toggle */}
      {showCode && (
        <div style={{ backgroundColor: '#0f172a', borderRadius: '0.75rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
            <span>ESP32 C++ / Arduino HTTP Polling Snippet</span>
            <span>GET /api/esp32/poll?deviceId=ESP32-CELL-DISPENSER-01</span>
          </div>
          <pre style={{ margin: 0, color: '#38bdf8', fontSize: '0.75rem', fontFamily: 'monospace', overflowX: 'auto', lineHeight: '1.4' }}>
{`// Arduino / ESP32 C++ Polling Loop
#include <HTTPClient.h>
#include <ArduinoJson.h>

void checkDispenseOrderQueue() {
  HTTPClient http;
  http.begin("http://your-server.com/api/esp32/poll?deviceId=ESP32-CELL-DISPENSER-01");
  int httpCode = http.GET();
  
  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    StaticJsonDocument<512> doc;
    deserializeJson(doc, payload);
    
    bool hasOrder = doc["hasOrder"];
    if (hasOrder) {
      int slot = doc["order"]["slotNumber"];
      int qty  = doc["order"]["quantity"];
      const char* orderId = doc["order"]["orderId"];
      
      Serial.printf("ORDER RECEIVED: Dispensing Slot #%d (Order %s)\\n", slot, orderId);
      actuateMotorForSlot(slot, qty); // Trigger relay / stepper motor
    }
  }
  http.end();
}`}
          </pre>
        </div>
      )}

      {/* Control Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        {/* Poller Controls Card */}
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '0.75rem', padding: '1rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Cpu size={16} className="text-cyan-400" />
              ESP32 HTTP GET Poller Simulation
            </span>

            <button
              onClick={() => setIsAutoPolling(!isAutoPolling)}
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: isAutoPolling ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: isAutoPolling ? '#f87171' : '#34d399'
              }}
            >
              {isAutoPolling ? <Pause size={12} /> : <Play size={12} />}
              {isAutoPolling ? 'Pause Auto-Poll' : 'Start Auto-Poll (4s)'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <button
              onClick={triggerESP32Poll}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: '6px',
                backgroundColor: '#0284c7',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              {isLoading ? 'Polling MongoDB...' : 'Send HTTP GET Poll Now'}
            </button>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
            <span>Total GET Polls: <strong>{pollCount}</strong></span>
            <span>Status: <strong style={{ color: isAutoPolling ? '#34d399' : '#f59e0b' }}>{isAutoPolling ? 'Active (4s interval)' : 'Manual'}</strong></span>
          </div>
        </div>

        {/* Quick Add Order to MongoDB Queue Card */}
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '0.75rem', padding: '1rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: '0.55rem' }}>
            Queue New Order in MongoDB (Test ESP32 Pick-Up)
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', marginBottom: '0.75rem' }}>
            {[1, 2, 3, 4].map((slot) => (
              <button
                key={slot}
                onClick={() => handleQueueOrder(slot)}
                style={{
                  padding: '0.4rem 0.2rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  backgroundColor: 'rgba(236, 72, 153, 0.15)',
                  color: '#f472b6',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                + Slot {slot}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
            <span style={{ color: '#94a3b8' }}>
              Pending: <strong style={{ color: '#f59e0b' }}>{pendingOrders.length}</strong> | Dispensed: <strong style={{ color: '#10b981' }}>{dispensedOrders.length}</strong>
            </span>

            {orders.length > 0 && (
              <button
                onClick={handleClearOrders}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <Trash2 size={12} /> Clear Queue
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Last Poll API Response Banner */}
      {lastPollResponse && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            fontSize: '0.8rem',
            marginBottom: '1.25rem',
            backgroundColor: lastPollResponse.hasOrder ? 'rgba(16, 185, 129, 0.12)' : 'rgba(30, 41, 59, 0.7)',
            border: `1px solid ${lastPollResponse.hasOrder ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: lastPollResponse.hasOrder ? '#34d399' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {lastPollResponse.hasOrder ? <CheckCircle2 size={15} /> : <Clock size={15} />}
              HTTP GET Response: {lastPollResponse.message}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              {new Date(lastPollResponse.pollTimestamp).toLocaleTimeString()} &bull; {lastPollResponse.dbMode}
            </span>
          </div>

          {lastPollResponse.hasOrder && lastPollResponse.order && (
            <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#e2e8f0', background: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
              <strong>Dequeued Order:</strong> {lastPollResponse.order.orderId} &bull; Slot #{lastPollResponse.order.slotNumber} ({lastPollResponse.order.padName}) &bull; Qty: {lastPollResponse.order.quantity}
            </div>
          )}
        </div>
      )}

      {/* Orders List / Queue Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
              <th style={{ padding: '0.5rem' }}>Order ID</th>
              <th style={{ padding: '0.5rem' }}>Slot</th>
              <th style={{ padding: '0.5rem' }}>Item</th>
              <th style={{ padding: '0.5rem' }}>Source</th>
              <th style={{ padding: '0.5rem' }}>Created At</th>
              <th style={{ padding: '0.5rem' }}>Queue Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                  No orders in MongoDB queue. Click "+ Slot X" above or make an M-Pesa purchase to queue orders.
                </td>
              </tr>
            ) : (
              orders.slice(0, 8).map((ord) => (
                <tr key={ord.id || ord.orderId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#cbd5e1' }}>
                  <td style={{ padding: '0.5rem', fontWeight: 600, fontFamily: 'monospace', color: '#38bdf8' }}>{ord.orderId}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <span style={{ backgroundColor: 'rgba(236,72,153,0.15)', color: '#f472b6', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      Slot #{ord.slotNumber}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem' }}>{ord.padName}</td>
                  <td style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>{ord.source}</td>
                  <td style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(ord.createdAt).toLocaleTimeString()}</td>
                  <td style={{ padding: '0.5rem' }}>
                    {ord.status === 'PENDING' ? (
                      <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={11} /> Waiting for ESP32 GET Poll
                      </span>
                    ) : (
                      <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={11} /> Dispensed via ESP32
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
