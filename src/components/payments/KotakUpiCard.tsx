import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { PaymentOrder, BankDetails } from '../../types.js';
import { 
  Check, 
  Copy, 
  Sparkles, 
  Smartphone, 
  ArrowUpRight, 
  QrCode, 
  CheckCircle2, 
  Info,
  ShieldCheck,
  Zap,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatCredits, formatInr, formatNumber } from '../../utils/formatters.js';

interface KotakUpiCardProps {
  order: PaymentOrder;
  bankDetails: BankDetails | null;
  onSuccess: (message: string) => void;
  onBack: () => void;
  onVerifyUtr: (utrNumber: string, payerUpiId?: string, payerName?: string) => Promise<void>;
  isSubmitting: boolean;
}

export function KotakUpiCard({
  order,
  bankDetails,
  onSuccess,
  onBack,
  onVerifyUtr,
  isSubmitting
}: KotakUpiCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [payerUpiId, setPayerUpiId] = useState<string>('');
  const [payerName, setPayerName] = useState<string>('');
  const [showManualNotes, setShowManualNotes] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const upiId = bankDetails?.upiId || '';
  const upiName = bankDetails?.upiName || '';
  const upiBank = bankDetails?.upiBankName || '';
  const amountInr = order.currency === 'INR' ? order.fiat_amount : Number((order.fiat_amount * 84).toFixed(2));
  const formattedAmount = formatInr(amountInr);

  // Standard NPCI UPI URI with prefilled amount and note
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${amountInr.toFixed(2)}&cu=INR&tn=${encodeURIComponent(order.payment_reference)}`;

  // App specific deep links
  const gpayUri = `gpay://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${amountInr.toFixed(2)}&cu=INR&tn=${encodeURIComponent(order.payment_reference)}`;
  const phonepeUri = `phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${amountInr.toFixed(2)}&cu=INR&tn=${encodeURIComponent(order.payment_reference)}`;
  const paytmUri = `paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${amountInr.toFixed(2)}&cu=INR&tn=${encodeURIComponent(order.payment_reference)}`;

  useEffect(() => {
    generateQrCode();
  }, [upiUri]);

  const generateQrCode = async () => {
    try {
      const url = await QRCode.toDataURL(upiUri, {
        width: 260,
        margin: 1,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Failed to render UPI QR code:', err);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleQuickVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanUtr = utrNumber.trim().replace(/[^a-zA-Z0-9]/g, '');
    if (!cleanUtr || cleanUtr.length < 6) {
      setValidationError('Please enter a valid 12-digit UPI Reference Number / UTR from your payment confirmation screen.');
      return;
    }

    try {
      setIsVerifying(true);
      await onVerifyUtr(cleanUtr, payerUpiId, payerName);
      
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      setValidationError(err.message || 'Failed to verify UPI transaction.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Status Notice */}
      <div className="flex items-center justify-between bg-gradient-to-r from-red-950/40 via-slate-900 to-cyan-950/40 border border-red-800/40 p-3 rounded-xl">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 font-bold text-white shadow-md">
            811
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Kotak 811 UPI Quick Checkout</span>
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-400 border border-emerald-500/30">
                ZERO FEE • INSTANT
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Pay via Google Pay, PhonePe, Paytm, BHIM, or any UPI banking app
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Payable Total</span>
          <div className="text-sm font-black text-amber-400">{formattedAmount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* LEFT / CENTER: Kotak 811 Styled UPI Card (Replicating the official banner) */}
        <div className="md:col-span-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-sm rounded-2xl bg-[#111A24] p-4 text-white border border-slate-700/60 shadow-xl relative overflow-hidden">
            {/* Background Geometric circles */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="150" cy="100" r="120" stroke="white" strokeWidth="1.5" />
                <circle cx="50" cy="300" r="80" stroke="white" strokeWidth="1.5" />
                <circle cx="250" cy="320" r="90" stroke="white" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Kotak Header */}
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <span className="text-sm font-black tracking-tight text-white">kotak</span>
              <span className="flex items-center justify-center rounded-full bg-red-600 text-white text-[11px] font-black px-1.5 py-0.5 leading-none">
                8II
              </span>
            </div>

            {/* White QR Plate (matching official Kotak 811 UI) */}
            <div className="relative rounded-xl bg-white p-4 text-slate-900 shadow-lg">
              {/* Avatar Bubble */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-[#111A24] border-2 border-white text-white font-bold shadow-md">
                S
              </div>

              {/* Payee Name & UPI ID */}
              <div className="mt-4 text-center">
                <h4 className="text-sm font-extrabold text-slate-900">{upiName}</h4>
                <div className="mt-0.5 flex items-center justify-center gap-1 text-[11px] font-mono text-slate-600 font-semibold">
                  <span>UPI ID - {upiId}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(upiId, 'upi-card')}
                    className="p-1 text-slate-400 hover:text-slate-900 transition-colors"
                    title="Copy UPI ID"
                  >
                    {copiedField === 'upi-card' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* QR Code with Kotak Center Badge */}
              <div className="relative my-3 flex items-center justify-center">
                {qrDataUrl ? (
                  <div className="relative p-1 bg-white rounded-lg">
                    <img
                      src={qrDataUrl}
                      alt={`UPI QR for ${upiId}`}
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto rounded"
                    />
                    {/* Kotak 811 Center Badge */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 border-2 border-white text-white text-[9px] font-black shadow-sm">
                      8II
                    </div>
                  </div>
                ) : (
                  <div className="h-48 w-48 flex items-center justify-center bg-slate-100 rounded text-xs text-slate-400">
                    Generating dynamic QR...
                  </div>
                )}
              </div>

              {/* Amount & Order Reference banner */}
              <div className="rounded-lg bg-slate-100 p-2 text-center text-xs">
                <div className="text-[10px] uppercase font-bold text-slate-500">Order Reference</div>
                <div className="font-mono font-black text-slate-800 tracking-wide text-xs">
                  {order.payment_reference}
                </div>
              </div>
            </div>

            {/* Footer UPI logos line */}
            <div className="mt-3 text-center">
              <div className="text-[10px] text-slate-400">Receive money from any UPI app</div>
              <div className="mt-1.5 flex items-center justify-center gap-3 text-[11px] font-bold text-slate-400">
                <span className="hover:text-white transition-colors">PhonePe</span>
                <span>•</span>
                <span className="hover:text-white transition-colors">BHIM</span>
                <span>•</span>
                <span className="hover:text-white transition-colors">G Pay</span>
                <span>•</span>
                <span className="hover:text-white transition-colors">Paytm</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Quick Payment Actions & Instant 1-Step UTR Verification */}
        <div className="md:col-span-6 space-y-3 flex flex-col justify-between">
          {/* Quick Copy & Launch Actions */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>1-Tap UPI App Launch (Mobile)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Amount: {formattedAmount}</span>
            </div>

            {/* Direct App Launch Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={upiUri}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition-all shadow-sm"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Open UPI App</span>
                <ArrowUpRight className="w-3 h-3 opacity-80" />
              </a>

              <button
                type="button"
                onClick={() => handleCopy(upiId, 'upi_btn')}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition-all"
              >
                {copiedField === 'upi_btn' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied UPI ID!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Copy UPI ID</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Details Box */}
            <div className="rounded-lg bg-slate-900/90 border border-slate-800/80 p-2.5 text-xs space-y-1.5 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans text-[11px]">Payee UPI ID:</span>
                <div className="flex items-center gap-1">
                  <strong className="text-cyan-300 text-xs">{upiId}</strong>
                  <button
                    type="button"
                    onClick={() => handleCopy(upiId, 'details_upi')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedField === 'details_upi' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans text-[11px]">Payee Name:</span>
                <strong className="text-white text-xs">{upiName}</strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans text-[11px]">Payment Note/Ref:</span>
                <div className="flex items-center gap-1">
                  <strong className="text-amber-400 text-xs">{order.payment_reference}</strong>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.payment_reference, 'ref_code')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedField === 'ref_code' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick 1-Step UTR Verification for Instant Output */}
          <form onSubmit={handleQuickVerify} className="rounded-xl border border-emerald-800/50 bg-slate-950 p-3.5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Quick Output Instant Verification</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
                Auto-Credit
              </span>
            </div>

            <p className="text-[11px] text-slate-300">
              After completing the payment in your UPI app, paste the <strong>12-digit UPI Ref / UTR No.</strong> below for instant output:
            </p>

            {validationError && (
              <div className="text-[11px] text-rose-300 bg-rose-950/80 p-2 rounded-lg border border-rose-800/60">
                {validationError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                12-Digit UPI Reference No. / UTR / Transaction ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={24}
                placeholder="e.g. 423819028491 or Kotak / GPay Ref ID"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono font-bold text-cyan-300 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {showManualNotes ? (
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Your UPI ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. yourname@okhdfcbank"
                    value={payerUpiId}
                    onChange={(e) => setPayerUpiId(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Your Name on Bank Account (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowManualNotes(true)}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 underline"
              >
                + Add Payer UPI / Name (Optional)
              </button>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={onBack}
                className="text-xs text-slate-400 hover:text-white"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={isVerifying || isSubmitting || !utrNumber.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-md shadow-emerald-950"
              >
                {isVerifying || isSubmitting ? (
                  <span>Verifying & Crediting...</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Verify & Credit Instantly (+{order.credits_amount.toLocaleString()} CR)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
