'use client';

import React, { useState, useEffect } from 'react';
import { PadItem, MPesaPaymentRequest } from '@/types/dispenser';
import { X, Smartphone, ShieldCheck, CheckCircle2, Loader2, ArrowRight, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MPesaPurchaseModalProps {
  pad: PadItem;
  onClose: () => void;
  onPaymentSuccess: (transaction: MPesaPaymentRequest) => void;
}

export default function MPesaPurchaseModal({ pad, onClose, onPaymentSuccess }: MPesaPurchaseModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('0722123456');
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState<'INPUT' | 'STK_WAIT' | 'DISPENSING' | 'SUCCESS' | 'ERROR'>('INPUT');
  const [countdown, setCountdown] = useState(25);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const totalAmount = pad.priceKes * quantity;

  // Countdown effect during STK Push waiting
  useEffect(() => {
    let timer: any;
    if (step === 'STK_WAIT' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (step === 'STK_WAIT' && countdown === 0) {
      // Auto complete simulated PIN entry if user waits out countdown
      handleSimulateMpesaPinSuccess();
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleInitiateSTK = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    // Validate phone number format
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    if (cleaned.length < 10) {
      setErrorMessage('Please enter a valid 10-digit Kenyan phone number (e.g. 0712345678 or 0112345678).');
      return;
    }

    setStep('STK_WAIT');
    setCountdown(20);

    try {
      const response = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          padId: pad.id,
          padName: pad.name,
          slotNumber: pad.slotNumber,
          quantity,
          amount: totalAmount
        })
      });

      const res = await response.json();
      if (res.success) {
        setCheckoutData(res.data);
      } else {
        setErrorMessage(res.error || 'Failed to send STK Push prompt');
        setStep('ERROR');
      }
    } catch (err) {
      setErrorMessage('Network error initiating M-Pesa transaction');
      setStep('ERROR');
    }
  };

  const handleSimulateMpesaPinSuccess = async () => {
    setStep('DISPENSING');

    const receiptNo = 'QKS' + Math.floor(1000000 + Math.random() * 9000000);
    const newTxn: MPesaPaymentRequest = {
      id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      checkoutRequestId: checkoutData?.checkoutRequestId || `ws_CO_${Date.now()}`,
      merchantRequestId: checkoutData?.merchantRequestId || `MR-${Date.now()}`,
      phoneNumber,
      padId: pad.id,
      padName: pad.name,
      slotNumber: pad.slotNumber,
      quantity,
      totalAmountKes: totalAmount,
      timestamp: new Date().toISOString(),
      status: 'COMPLETED',
      mpesaReceiptNumber: receiptNo,
      resultCode: 0,
      resultDesc: 'The service request is processed successfully.'
    };

    try {
      // Call ESP32 hardware dispense API
      await fetch('/api/dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotNumber: pad.slotNumber,
          quantity,
          transactionId: newTxn.id
        })
      });
    } catch (e) {
      console.warn('Dispense API call error:', e);
    }

    // Short timeout to simulate ESP32 motor turning and IR sensor verification
    setTimeout(() => {
      setStep('SUCCESS');
      onPaymentSuccess(newTxn);

      // Trigger Confetti Celebration!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }, 1800);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            color: '#94a3b8',
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* STEP 1: Phone Number Input */}
        {step === 'INPUT' && (
          <form onSubmit={handleInitiateSTK}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #10b981, #047857)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
              >
                <Smartphone size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                  Lipa na M-Pesa
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Slot {pad.slotNumber}: {pad.name}
                </p>
              </div>
            </div>

            {/* Selected Item Summary */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.25rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Price per unit:</span>
                <span style={{ fontWeight: 600, color: '#f8fafc' }}>KES {pad.priceKes}</span>
              </div>

              {/* Quantity Selector */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.75rem 0' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Quantity:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {[1, 2, 3].map((q) => (
                    <button
                      type="button"
                      key={q}
                      onClick={() => setQuantity(q)}
                      disabled={q > pad.currentStock}
                      style={{
                        padding: '0.3rem 0.75rem',
                        borderRadius: '6px',
                        border: quantity === q ? '1px solid #10b981' : '1px solid var(--border-color)',
                        background: quantity === q ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                        color: quantity === q ? '#10b981' : '#cbd5e1',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline'
                }}
              >
                <span style={{ fontWeight: 600, color: '#f8fafc' }}>Total Payable:</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>
                  KES {totalAmount}
                </span>
              </div>
            </div>

            {/* M-Pesa Phone Input */}
            <div className="form-group">
              <label className="form-label">M-Pesa Phone Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="0712345678 or 0112345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.35rem' }}>
                An STK Push prompt will be sent directly to your handset.
              </span>
            </div>

            {errorMessage && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <AlertCircle size={15} />
                {errorMessage}
              </div>
            )}

            <button type="submit" className="btn-mpesa">
              <ShieldCheck size={18} />
              Pay KES {totalAmount} via M-Pesa STK
            </button>
          </form>
        )}

        {/* STEP 2: Waiting for M-Pesa STK PIN input */}
        {step === 'STK_WAIT' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 1.25rem',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981'
              }}
            >
              <Loader2 size={32} className="animate-spin" />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
              STK Push Prompt Sent!
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '0.5rem 0 1.25rem' }}>
              Please check your phone (<strong style={{ color: '#10b981' }}>{phoneNumber}</strong>) and enter your M-Pesa PIN to complete payment of <strong>KES {totalAmount}</strong>.
            </p>

            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                borderRadius: '10px',
                padding: '0.85rem',
                fontSize: '0.8rem',
                color: '#cbd5e1',
                border: '1px solid var(--border-color)',
                marginBottom: '1.5rem'
              }}
            >
              ⏱️ Waiting for M-Pesa network confirmation... ({countdown}s)
            </div>

            {/* Simulated Action Button for instant demo testing */}
            <button
              onClick={handleSimulateMpesaPinSuccess}
              className="btn-mpesa"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
            >
              <CheckCircle2 size={18} />
              [Demo] Simulate User Entered PIN & Authorized
            </button>
          </div>
        )}

        {/* STEP 3: Dispensing Pad via ESP32 Motor */}
        {step === 'DISPENSING' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ec4899', marginBottom: '0.5rem' }}>
              Payment Confirmed! Dispensing...
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              ESP32 SIM7000G cellular command sent to Slot {pad.slotNumber} motor actuator.
            </p>

            <div className="dispense-animation-box">
              <div className="dispenser-slot-visual">
                <Sparkles size={28} />
              </div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f472b6' }}>
                Releasing {quantity}x {pad.name}...
              </p>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                IR Optical Ejection Sensor: Verifying drop
              </span>
            </div>
          </div>
        )}

        {/* STEP 4: Dispensation Complete & Receipt */}
        {step === 'SUCCESS' && (
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>
              Pad Dispensed Successfully!
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.25rem 0 1.25rem' }}>
              Thank you for using SafePad Care.
            </p>

            {/* Receipt Box */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px dashed var(--border-color)',
                borderRadius: '12px',
                padding: '1rem',
                textAlign: 'left',
                fontSize: '0.825rem',
                marginBottom: '1.5rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: '#94a3b8' }}>M-Pesa Receipt:</span>
                <strong style={{ color: '#10b981', fontFamily: 'monospace' }}>
                  {checkoutData?.mpesaReceiptNumber || 'QKS849102A'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: '#94a3b8' }}>Item:</span>
                <span style={{ color: '#f8fafc' }}>{quantity}x {pad.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: '#94a3b8' }}>Amount Paid:</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>KES {totalAmount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Channel Motor:</span>
                <span style={{ color: '#cbd5e1' }}>Slot #{pad.slotNumber} (OK)</span>
              </div>
            </div>

            <button onClick={onClose} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
