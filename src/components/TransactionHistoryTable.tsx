'use client';

import React, { useState } from 'react';
import { MPesaPaymentRequest } from '@/types/dispenser';
import { ShieldCheck, Search, Filter, Download, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface TransactionHistoryTableProps {
  transactions: MPesaPaymentRequest[];
}

export default function TransactionHistoryTable({ transactions }: TransactionHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING'>('ALL');

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.phoneNumber.includes(searchTerm) ||
      t.padName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.mpesaReceiptNumber && t.mpesaReceiptNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' ? true : t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = transactions
    .filter((t) => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.totalAmountKes, 0);

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} className="text-emerald-400" />
            M-Pesa Purchase Ledger
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Real-time Lipa Na M-Pesa transaction log and automated pad dispensation receipts.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Total M-Pesa Revenue</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>
            KES {totalRevenue.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search phone, receipt #, pad type..."
            className="form-input"
            style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['ALL', 'COMPLETED', 'PENDING'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className="btn-secondary"
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.8rem',
                borderColor: statusFilter === st ? '#10b981' : undefined,
                color: statusFilter === st ? '#10b981' : undefined
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Txn Ref / ID</th>
              <th>M-Pesa Receipt</th>
              <th>Customer Phone</th>
              <th>Pad Item</th>
              <th>Qty / Slot</th>
              <th>Amount</th>
              <th>Timestamp</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No matching M-Pesa transactions found.
                </td>
              </tr>
            ) : (
              filtered.map((txn) => (
                <tr key={txn.id}>
                  <td style={{ fontWeight: 600, color: '#cbd5e1' }}>{txn.id}</td>
                  <td>
                    <span style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 600 }}>
                      {txn.mpesaReceiptNumber || 'PENDING'}
                    </span>
                  </td>
                  <td>{txn.phoneNumber}</td>
                  <td>
                    <strong style={{ color: '#f8fafc' }}>{txn.padName}</strong>
                  </td>
                  <td>
                    {txn.quantity}x (Slot #{txn.slotNumber})
                  </td>
                  <td style={{ fontWeight: 700, color: '#38bdf8' }}>KES {txn.totalAmountKes}</td>
                  <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {new Date(txn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        txn.status === 'COMPLETED' ? 'status-completed' : 'status-pending'
                      }`}
                    >
                      {txn.status === 'COMPLETED' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                      {txn.status}
                    </span>
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
