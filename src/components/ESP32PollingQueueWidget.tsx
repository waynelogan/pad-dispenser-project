'use client';

import React, { useState, useEffect } from 'react';
import { DispenseOrder } from '@/types/dispenser';
import { Database, Radio, RefreshCw, CheckCircle2, Clock, Trash2, Code, Zap } from 'lucide-react';

interface ESP32PollingQueueWidgetProps {
  onOrderDispensed?: (slotNumber: number) => void;
}

export default function ESP32PollingQueueWidget({ onOrderDispensed }: ESP32PollingQueueWidgetProps) {
  const [orders, setOrders] = useState<DispenseOrder[]>([]);
  const [dbMode, setDbMode] = useState<'MongoDB' | 'InMemoryFallback'>('InMemoryFallback');
  const [mongoConnected, setMongoConnected] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [autoPollActive, setAutoPollActive] = useState<boolean>(false);
  const [lastPollResponse, setLastPollResponse] = useState<any>(null);
  const [selectedSlotForAdd, setSelectedSlotForAdd] = useState<number>(1);
  const [isCreatingOrder, setIsCreatingOrder] = useState<boolean>(false);
  const [showCodeSnippet, setShowCodeSnippet] = useState<boolean>(false);

  // Fetch orders queue from MongoDB via GET /api/orders
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
        setDbMode(data.dbMode || 'InMemoryFallback');
        setMongoConnected(Boolean(data.mongoConnected));
      }
    } catch (e) {
      console.warn('Failed to fetch orders:', e);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Simulate ESP32 GET request to GET /api/esp32/poll
  const handleSimulateESP32Poll = async () => {
    setIsPolling(true);
    try {
      const res = await fetch('/api/esp32/poll?deviceId=ESP32-CELL-DISPENSER-01');
      const data = await res.json();
      setLastPollResponse(data);

      if (data.success && data.hasOrder && data.order) {
        if (onOrderDispensed) {
          onOrderDispensed(data.order.slotNumber);
        }
      }
      // Refresh list
      await fetchOrders();
    } catch (e) {
      console.warn('ESP32 poll error:', e);
    } finally {
      setTimeout(() => setIsPolling(false), 300);
    }
  };

  // Auto poll interval toggle
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (autoPollActive) {
      interval = setInterval(() => {
        handleSimulateESP32Poll();
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoPollActive]);

  // Queue a new order into MongoDB via POST /api/orders
  const handleQueueOrder = async () => {
    setIsCreatingOrder(true);
    try {
      const padNames: Record<number, string> = {
        1: 'Regular Ultra-Thin (240mm)',
        2: 'Super Maxi Wings (280mm)',
        3: 'Night-Guard Extra Long (320mm)',
        4: 'Daily Fresh Organic (155mm)'
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotNumber: selectedSlotForAdd,
          padId: `pad_slot_${selectedSlotForAdd}`,
          padName: padNames[selectedSlotForAdd] || `Slot ${selectedSlotForAdd} Pad`,
          quantity: 1,
          totalAmountKes: selectedSlotForAdd === 1 ? 20 : selectedSlotForAdd === 2 ? 25 : selectedSlotForAdd === 3 ? 30 : 15,
          phoneNumber: '0712345678',
          mpesaReceipt: `QKS${Math.floor(100000 + Math.random() * 900000)}`,
          source: 'DASHBOARD_QUEUE'
        })
      });

      const data = await res.json();
      if (data.success) {
        await fetchOrders();
      }
    } catch (e) {
      console.warn('Failed to queue order:', e);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Clear queue
  const handleClearQueue = async () => {
    if (!confirm('Are you sure you want to reset and clear the MongoDB orders history?')) return;
    try {
      await fetch('/api/orders', { method: 'DELETE' });
      setLastPollResponse(null);
      await fetchOrders();
    } catch (e) {
      console.warn('Failed to clear queue:', e);
    }
  };

  const pendingOrders = orders.filter((o) => o.status === 'PENDING');

  const esp32CppCodeSnippet = `// ESP32 Arduino HTTP GET Polling Example
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* pollEndpoint = "http://192.168.1.100:3000/api/esp32/poll?deviceId=ESP32-01";

const int MOTOR_SLOT_PINS[4] = {18, 19, 21, 22}; // Slot 1-4 Motor Actuators

void setup() {
  Serial.begin(115200);
  for(int i=0; i<4; i++) pinMode(MOTOR_SLOT_PINS[i], OUTPUT);
  WiFi.begin(ssid, password);
}

void loop() {
  if(WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(pollEndpoint);
    int httpCode = http.GET(); // Send GET request every 3 seconds to check for order
    
    if (httpCode == 200) {
      String payload = http.getString();
      StaticJsonDocument<512> doc;
      deserializeJson(doc, payload);
      
      bool hasOrder = doc["hasOrder"];
      if (hasOrder) {
        int slot = doc["order"]["slotNumber"];
        Serial.printf("ORDER RECEIVED! Dispensing Slot #%d\\n", slot);
        
        // Pulse Motor Actuator
        digitalWrite(MOTOR_SLOT_PINS[slot - 1], HIGH);
        delay(850); // Pulse duration 850ms
        digitalWrite(MOTOR_SLOT_PINS[slot - 1], LOW);
      } else {
        Serial.println("No pending order.");
      }
    }
    http.end();
  }
  delay(3000); // Poll GET endpoint every 3 seconds
}`;

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              padding: '0.5rem',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.3)'
            }}
          >
            <Database size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ESP32 HTTP GET Polling & MongoDB Database Queue
            </h3>
            <p style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
              ESP32 sends GET requests every few seconds to <code>GET /api/esp32/poll</code> to check for pending orders in MongoDB.
            </p>
          </div>
        </div>

        {/* MongoDB Connection Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            className="status-badge"
            style={{
              background: mongoConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: mongoConnected ? '#10b981' : '#f59e0b',
              border: `1px solid ${mongoConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              fontSize: '0.75rem',
              padding: '0.35rem 0.75rem'
            }}
          >
            <Database size={13} />
            {mongoConnected ? 'MongoDB Connected' : `Store Mode: ${dbMode}`}
          </span>

          <span
            className="status-badge"
            style={{
              background: pendingOrders.length > 0 ? 'rgba(244, 114, 182, 0.2)' : 'rgba(100, 116, 139, 0.2)',
              color: pendingOrders.length > 0 ? '#f472b6' : '#cbd5e1',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.75rem',
              padding: '0.35rem 0.75rem'
            }}
          >
            <Clock size={13} />
            {pendingOrders.length} Pending in Queue
          </span>
        </div>
      </div>

      {/* Control Action Bar */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '12px',
          padding: '1rem',
          border: '1px solid var(--border-color)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          alignItems: 'center'
        }}
      >
        {/* ESP32 GET Poll Simulator Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.05em' }}>
            📡 ESP32 GET REQUEST SIMULATOR
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleSimulateESP32Poll}
              disabled={isPolling}
              className="btn-primary"
              style={{
                fontSize: '0.8rem',
                padding: '0.5rem 0.85rem',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
              }}
            >
              <Radio size={14} className={isPolling ? 'animate-pulse' : ''} />
              Simulate ESP32 GET /api/esp32/poll
            </button>

            <button
              onClick={() => setAutoPollActive(!autoPollActive)}
              className="btn-secondary"
              style={{
                fontSize: '0.8rem',
                padding: '0.5rem 0.85rem',
                borderColor: autoPollActive ? '#10b981' : undefined,
                color: autoPollActive ? '#10b981' : undefined
              }}
            >
              <Zap size={14} className={autoPollActive ? 'animate-spin text-emerald-400' : ''} />
              {autoPollActive ? 'Auto-Polling Active (3s)' : 'Enable Auto-Poll'}
            </button>
          </div>
        </div>

        {/* Queue New Order into MongoDB Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f472b6', letterSpacing: '0.05em' }}>
            ➕ QUEUE ORDER INTO MONGODB
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              value={selectedSlotForAdd}
              onChange={(e) => setSelectedSlotForAdd(Number(e.target.value))}
              className="form-input"
              style={{ padding: '0.45rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}
            >
              <option value={1}>Slot #1 - Regular Ultra-Thin (KES 20)</option>
              <option value={2}>Slot #2 - Super Maxi Wings (KES 25)</option>
              <option value={3}>Slot #3 - Night-Guard Long (KES 30)</option>
              <option value={4}>Slot #4 - Daily Fresh Organic (KES 15)</option>
            </select>
            <button
              onClick={handleQueueOrder}
              disabled={isCreatingOrder}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem', whiteSpace: 'nowrap' }}
            >
              + Add Order
            </button>
          </div>
        </div>
      </div>

      {/* Live ESP32 HTTP GET Response Display */}
      {lastPollResponse && (
        <div
          style={{
            background: '#040914',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            border: `1px solid ${lastPollResponse.hasOrder ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.3)'}`,
            fontSize: '0.8rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ color: lastPollResponse.hasOrder ? '#10b981' : '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {lastPollResponse.hasOrder ? <CheckCircle2 size={15} /> : <Radio size={15} />}
              HTTP 200 OK &bull; GET /api/esp32/poll Response
            </span>
            <span style={{ color: '#64748b', fontSize: '0.725rem' }}>
              Timestamp: {new Date(lastPollResponse.pollTimestamp).toLocaleTimeString()}
            </span>
          </div>

          <pre style={{ margin: 0, color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.775rem', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(lastPollResponse, null, 2)}
          </pre>
        </div>
      )}

      {/* Orders Queue Table */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={16} className="text-pink-400" />
            MongoDB Orders Queue ({orders.length} Total Records)
          </h4>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setShowCodeSnippet(!showCodeSnippet)}
              className="btn-secondary"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
            >
              <Code size={13} />
              {showCodeSnippet ? 'Hide ESP32 C++ Code' : 'View ESP32 C++ Arduino Code'}
            </button>

            <button
              onClick={handleClearQueue}
              className="btn-secondary"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: '#f87171' }}
            >
              <Trash2 size={13} />
              Reset History
            </button>
          </div>
        </div>

        {/* Code Snippet Box */}
        {showCodeSnippet && (
          <div style={{ marginBottom: '1rem', background: '#020617', borderRadius: '10px', padding: '1rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>
                ESP32 C++ (Arduino IDE) HTTPClient GET Polling Code:
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(esp32CppCodeSnippet)}
                className="btn-secondary"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
              >
                Copy Code
              </button>
            </div>
            <pre style={{ margin: 0, fontSize: '0.75rem', color: '#cbd5e1', fontFamily: 'monospace', maxHeight: '200px', overflowY: 'auto' }}>
              {esp32CppCodeSnippet}
            </pre>
          </div>
        )}

        {/* Table of Orders */}
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Slot #</th>
                <th>Pad Item</th>
                <th>Amount</th>
                <th>M-Pesa Receipt</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Dispensed At</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem' }}>
                    No orders stored in MongoDB database yet. Click "+ Add Order" above or purchase via M-Pesa.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id || ord.orderId}>
                    <td style={{ fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace' }}>
                      {ord.orderId}
                    </td>
                    <td>
                      <span className="slot-badge">Slot #{ord.slotNumber}</span>
                    </td>
                    <td style={{ color: '#cbd5e1' }}>{ord.padName}</td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>KES {ord.totalAmountKes || 20}</td>
                    <td style={{ fontFamily: 'monospace', color: '#94a3b8' }}>
                      {ord.mpesaReceipt || 'N/A'}
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          background: ord.status === 'PENDING' ? 'rgba(244, 114, 182, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: ord.status === 'PENDING' ? '#f472b6' : '#10b981',
                          border: `1px solid ${ord.status === 'PENDING' ? 'rgba(244, 114, 182, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
                        }}
                      >
                        {ord.status === 'PENDING' ? '⏳ PENDING (Awaiting ESP32 GET)' : '✅ DISPENSED BY ESP32'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {new Date(ord.createdAt).toLocaleTimeString()}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {ord.dispensedAt ? new Date(ord.dispensedAt).toLocaleTimeString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
