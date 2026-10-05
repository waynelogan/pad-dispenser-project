'use client';

import React from 'react';
import { PadItem } from '@/types/dispenser';
import { Sun, Shield, Moon, Sparkles, AlertCircle, ShoppingCart, Play, CheckCircle2 } from 'lucide-react';

interface PadStockCardProps {
  pad: PadItem;
  onSelectForPurchase: (pad: PadItem) => void;
  onQuickDispense: (pad: PadItem) => void;
  isDispensingThisSlot?: boolean;
}

const IconMap: Record<string, React.ReactNode> = {
  Sun: <Sun size={20} />,
  Shield: <Shield size={20} />,
  Moon: <Moon size={20} />,
  Sparkles: <Sparkles size={20} />
};

export default function PadStockCard({
  pad,
  onSelectForPurchase,
  onQuickDispense,
  isDispensingThisSlot
}: PadStockCardProps) {
  const stockPercentage = Math.round((pad.currentStock / pad.maxCapacity) * 100);
  const isLowStock = pad.currentStock <= pad.lowStockThreshold;

  // Determine progress fill color based on stock level
  let progressColor = pad.color;
  if (pad.currentStock === 0) {
    progressColor = '#ef4444';
  } else if (isLowStock) {
    progressColor = '#f59e0b';
  }

  return (
    <div
      className="glass-card pad-card"
      style={{
        '--pad-gradient': pad.gradient,
        borderColor: isLowStock ? 'rgba(245, 158, 11, 0.4)' : undefined
      } as React.CSSProperties}
    >
      <div>
        <div className="pad-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: pad.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
              }}
            >
              {IconMap[pad.iconName] || <Sun size={20} />}
            </div>
            <div>
              <h3 className="pad-title">{pad.name}</h3>
              <p className="pad-subtitle">{pad.subtitle}</p>
            </div>
          </div>
          <span className="slot-badge">Slot {pad.slotNumber}</span>
        </div>

        {/* Description & Specs */}
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.75rem 0', lineHeight: 1.4 }}>
          {pad.description}
        </p>

        {/* Stock Meter */}
        <div className="stock-meter-container">
          <div className="stock-meter-labels">
            <div>
              <span className="stock-number" style={{ color: pad.currentStock === 0 ? '#ef4444' : '#f8fafc' }}>
                {pad.currentStock}
              </span>
              <span className="stock-capacity"> / {pad.maxCapacity} pads</span>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: progressColor }}>
              {stockPercentage}%
            </span>
          </div>

          <div className="stock-progress-track">
            <div
              className="stock-progress-fill"
              style={{
                width: `${stockPercentage}%`,
                background: progressColor
              }}
            />
          </div>

          {isLowStock && (
            <div className="low-stock-alert-badge">
              <AlertCircle size={14} />
              {pad.currentStock === 0 ? 'OUT OF STOCK - Refill Required' : `LOW STOCK: Only ${pad.currentStock} left`}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer with Price and Actions */}
      <div className="pad-card-footer">
        <div className="price-tag">
          KES {pad.priceKes} <span>/ unit</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => onQuickDispense(pad)}
            disabled={pad.currentStock === 0 || isDispensingThisSlot}
            className="btn-secondary"
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}
            title="Test ESP32 Motor Actuation"
          >
            {isDispensingThisSlot ? (
              <CheckCircle2 size={14} className="animate-spin text-pink-400" />
            ) : (
              <Play size={14} />
            )}
            Test
          </button>

          <button
            onClick={() => onSelectForPurchase(pad)}
            disabled={pad.currentStock === 0}
            className="btn-primary"
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
          >
            <ShoppingCart size={15} />
            Buy M-Pesa
          </button>
        </div>
      </div>
    </div>
  );
}
