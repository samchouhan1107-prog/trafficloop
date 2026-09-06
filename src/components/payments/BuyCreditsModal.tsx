import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { api } from '../../services/api.js';
import { CreditPackage, BankDetails, PaymentOrder } from '../../types.js';
import { KotakUpiCard } from './KotakUpiCard.js';
import { useToast } from '../../context/ToastContext.js';
import { 
  Building2, 
  CreditCard, 
  Smartphone, 
  Coins, 
  Check, 
  Copy, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  History,
  Lock,
  QrCode,
  Zap
} from 'lucide-react';

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BuyCreditsModal({ isOpen, onClose, onSuccess }: BuyCreditsModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'packages' | 'history'>('packages');
  const [currency, setCurrency] = useState<'INR' | 'BWP' | 'USD'>('INR');
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('growth');
  const [customCredits, setCustomCredits] = useState<number>(2000);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'bank_transfer' | 'card_instant' | 'mobile_money' | 'crypto_usdt'>('upi');
  
  // Checkout flow state
  const [step, setStep] = useState<'select' | 'pay' | 'success'>('select');
  const [createdOrder, setCreatedOrder] = useState<PaymentOrder | null>(null);
  const [proofReference, setProofReference] = useState('');
  const [proofNotes, setProofNotes] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardHolder, setCardHolder] = useState('');

  // History state
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getPaymentPackages();
      setPackages(res.packages || []);
      setBankDetails(res.bankDetails || null);

      const historyRes = await api.getMyPaymentOrders();
      setOrders(historyRes.orders || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load pricing packages and bank details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleProceedToPayment = async () => {
    setError(null);
    try {
      setIsSubmitting(true);
      const res = await api.createPaymentOrder({
        packageId: selectedPackageId,
        customCredits: selectedPackageId === 'custom' ? customCredits : undefined,
        paymentMethod,
        currency: paymentMethod === 'upi' ? 'INR' : currency
      });
      setCreatedOrder(res.order);
      if (res.bankDetails) {
        setBankDetails(res.bankDetails);
      }
      setStep('pay');
    } catch (err: any) {
      setError(err.message || 'Failed to initiate order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickUpiVerify = async (utrNumber: string, payerUpiId?: string, payerName?: string) => {
    if (!createdOrder) return;
    setError(null);
    try {
      setIsSubmitting(true);
      const res = await api.quickUpiVerify(createdOrder.id, utrNumber, payerUpiId, payerName);
      setSuccessMessage(res.message);
      setStep('success');
      loadData();

      // Trigger Global Toast
      toast.upiSuccess({
        credits: createdOrder.credits_amount,
        inrAmount: createdOrder.currency === 'INR' ? createdOrder.fiat_amount : createdOrder.fiat_amount * 84,
        utr: utrNumber,
        reference: createdOrder.payment_reference,
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdOrder) return;
    setError(null);

    try {
      setIsSubmitting(true);
      const res = await api.submitPaymentProof(createdOrder.id, proofReference, proofNotes);
      setSuccessMessage(res.message);
      setStep('success');
      loadData();
      toast.info('Payment Proof Submitted', {
        description: `Order ${createdOrder.payment_reference} is under verification. Credits will be provisioned shortly.`,
        badge: 'Pending Review'
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit proof.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInstantCardCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdOrder) return;
    setError(null);

    try {
      setIsSubmitting(true);
      const res = await api.instantCardCheckout(createdOrder.id);
      setSuccessMessage(res.message);
      setStep('success');
      loadData();
      toast.success(`Payment Successful! +${createdOrder.credits_amount.toLocaleString()} Credits`, {
        description: `Instant gateway confirmed. Your balance has been updated.`,
        badge: 'Card Processed'
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Payment processing failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPackagePrice = (pkg: CreditPackage) => {
    if (currency === 'INR') return pkg.fiatInr || pkg.fiatAmount;
    if (currency === 'BWP') return pkg.fiatBwp || 130.00;
    return pkg.fiatUsd || 9.99;
  };

  const getCustomPrice = () => {
    if (currency === 'INR') return Number((customCredits * 1.50).toFixed(2));
    if (currency === 'BWP') return Number((customCredits * 0.27).toFixed(2));
    return Number((customCredits * 0.02).toFixed(2));
  };

  const selectedPkg = packages.find(p => p.id === selectedPackageId);
  const currentFiatAmount = selectedPackageId === 'custom' 
    ? getCustomPrice()
    : (selectedPkg ? getPackagePrice(selectedPkg) : 0);

  const currentCreditsAmount = selectedPackageId === 'custom' 
    ? customCredits 
    : ((selectedPkg?.credits || 0) + (selectedPkg?.bonusCredits || 0));

  const currencySymbol = currency === 'INR' ? '₹' : currency === 'BWP' ? 'P' : '$';

  const resetModal = () => {
    setStep('select');
    setCreatedOrder(null);
    setProofReference('');
    setProofNotes('');
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetModal();
        onClose();
      }}
      title="Add Traffic Reserve Credits"
      subtitle="Purchase credits to scale visits to your websites. Secure payments linked directly to bank account & instant gateways."
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('packages');
                resetModal();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'packages' 
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Credit Packages & Checkout</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'history' 
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Deposit History ({orders.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bank Verified & Encrypted</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-950/80 p-3 text-xs text-rose-300 border border-rose-800/60">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: PACKAGES & CHECKOUT */}
        {activeTab === 'packages' && (
          <>
            {step === 'select' && (
              <div className="space-y-4">
                {/* Currency Selector */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                  <div className="text-xs">
                    <span className="font-bold text-white">Preferred Currency:</span>
                    <span className="ml-1 text-slate-400">Competitive global market exchange pricing</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setCurrency('INR')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                        currency === 'INR'
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      INR (₹)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('BWP')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                        currency === 'BWP'
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      BWP (P)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                        currency === 'USD'
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      USD ($)
                    </button>
                  </div>
                </div>

                {/* Packages Grid */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Select Credit Volume Package</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {packages.map((pkg) => {
                      const price = getPackagePrice(pkg);
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setSelectedPackageId(pkg.id)}
                          className={`relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                            selectedPackageId === pkg.id
                              ? 'border-cyan-400 bg-cyan-950/50 shadow-md shadow-cyan-950'
                              : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                          }`}
                        >
                          {pkg.popular && (
                            <span className="absolute -top-2 right-3 rounded-full bg-cyan-500 px-2 py-0.5 text-[9px] font-extrabold uppercase text-slate-950">
                              Most Popular
                            </span>
                          )}
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">{pkg.name}</span>
                              <span className="text-xs font-extrabold text-cyan-300">
                                {currencySymbol}{price.toLocaleString()} {currency}
                              </span>
                            </div>
                            <div className="mt-1 flex items-baseline gap-1.5">
                              <span className="text-base font-black text-amber-400">
                                {(pkg.credits + (pkg.bonusCredits || 0)).toLocaleString()} Credits
                              </span>
                              {pkg.bonusCredits && (
                                <span className="text-[10px] font-bold text-emerald-400">
                                  (+{pkg.bonusCredits} Bonus)
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">{pkg.description}</p>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                            <span>~{pkg.credits.toLocaleString()} High-Engagement Visits</span>
                            <span>≈ ${(pkg.fiatUsd || 9.99).toFixed(2)} USD</span>
                          </div>
                        </button>
                      );
                    })}

                    {/* Custom Calculator Option */}
                    <button
                      type="button"
                      onClick={() => setSelectedPackageId('custom')}
                      className={`relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                        selectedPackageId === 'custom'
                          ? 'border-cyan-400 bg-cyan-950/50 shadow-md shadow-cyan-950'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Custom Credit Amount</span>
                          <span className="text-xs font-extrabold text-cyan-300">
                            {currencySymbol}{getCustomPrice().toFixed(2)} {currency}
                          </span>
                        </div>
                        <div className="mt-1">
                          <input
                            type="number"
                            min="100"
                            max="100000"
                            step="100"
                            value={customCredits}
                            onChange={(e) => setCustomCredits(Math.max(100, Number(e.target.value)))}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-bold text-amber-400 focus:border-cyan-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                        Custom volume calculated in {currency}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Payment Option Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-300">Select Payment Option</label>
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      <span>Instant UPI Auto-Credit Available</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* OPTION 1: UPI (Kotak 811 / GPay / PhonePe / Paytm / BHIM) */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`relative flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                        paymentMethod === 'upi'
                          ? 'border-red-500 bg-gradient-to-br from-red-950/50 via-slate-900 to-slate-950 text-white shadow-lg shadow-red-950/40 ring-1 ring-red-500'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 font-bold text-white shrink-0 shadow-md">
                        811
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">Kotak 811 UPI (Instant)</span>
                          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-400 border border-emerald-500/30">
                            FASTEST
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Google Pay, PhonePe, Paytm, BHIM QR & UTR Instant Output
                        </div>
                      </div>
                    </button>

                    {/* OPTION 2: Official Bank Wire */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-cyan-400 bg-cyan-950/60 text-white shadow-md'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 shrink-0 text-cyan-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Official Bank Wire / EFT</div>
                        <div className="text-[11px] text-slate-400">Linked Business Account Transfer / NEFT / IMPS</div>
                      </div>
                    </button>

                    {/* OPTION 3: Instant Card Checkout */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card_instant')}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                        paymentMethod === 'card_instant'
                          ? 'border-cyan-400 bg-cyan-950/60 text-white shadow-md'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 shrink-0 text-cyan-400">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Instant Card Checkout</div>
                        <div className="text-[11px] text-slate-400">Visa / Mastercard 256-bit Secure Gateway</div>
                      </div>
                    </button>

                    {/* OPTION 4: Mobile Money */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mobile_money')}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                        paymentMethod === 'mobile_money'
                          ? 'border-cyan-400 bg-cyan-950/60 text-white shadow-md'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 shrink-0 text-cyan-400">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Mobile Money / Orange Money</div>
                        <div className="text-[11px] text-slate-400">Orange Money / Smega / eWallet</div>
                      </div>
                    </button>

                    {/* OPTION 5: Crypto USDT */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('crypto_usdt')}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                        paymentMethod === 'crypto_usdt'
                          ? 'border-cyan-400 bg-cyan-950/60 text-white shadow-md'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 shrink-0 text-cyan-400">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">USDT Crypto Treasury</div>
                        <div className="text-[11px] text-slate-400">USDT (TRC-20) Instant Auto-Check</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Summary Box & Proceed Button */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">Total Purchase:</div>
                      <div className="text-lg font-black text-white">
                        {currencySymbol}{currentFiatAmount.toFixed(2)} {currency}
                        <span className="ml-2 text-xs font-semibold text-amber-400">
                          (+{currentCreditsAmount.toLocaleString()} Credits)
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleProceedToPayment}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-950/60 hover:bg-cyan-500 disabled:opacity-50 transition-all"
                    >
                      {isSubmitting ? (
                        <span>Initializing...</span>
                      ) : (
                        <>
                          <span>Proceed to Payment</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PAYMENT EXECUTION & BANK DETAILS */}
            {step === 'pay' && createdOrder && (
              <div className="space-y-4">
                {/* UPI Instant Kotak 811 Option */}
                {paymentMethod === 'upi' && (
                  <KotakUpiCard
                    order={createdOrder}
                    bankDetails={bankDetails}
                    onSuccess={(msg) => {
                      setSuccessMessage(msg);
                      setStep('success');
                      loadData();
                      if (onSuccess) onSuccess();
                    }}
                    onBack={() => setStep('select')}
                    onVerifyUtr={handleQuickUpiVerify}
                    isSubmitting={isSubmitting}
                  />
                )}

                {/* Header for non-UPI payment methods */}
                {paymentMethod !== 'upi' && (
                  <div className="rounded-xl border border-cyan-800/60 bg-cyan-950/40 p-3.5 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-400">Order Reference Code:</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <strong className="text-sm font-mono font-bold text-cyan-300">
                          {createdOrder.payment_reference}
                        </strong>
                        <button
                          type="button"
                          onClick={() => handleCopy(createdOrder.payment_reference, 'ref')}
                          className="rounded p-1 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                          title="Copy Reference"
                        >
                          {copiedField === 'ref' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400">Amount Due:</span>
                      <div className="text-sm font-black text-white">
                        {createdOrder.fiat_amount.toFixed(2)} {createdOrder.currency}
                      </div>
                    </div>
                  </div>
                )}

                {/* Option 1: Direct Bank Transfer (FNB) */}
                {paymentMethod === 'bank_transfer' && bankDetails && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                      <div className="flex items-center gap-2 mb-3 text-xs font-bold text-cyan-300">
                        <Building2 className="w-4 h-4" />
                        <span>Official Platform Bank Account Details:</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-2.5">
                          <span className="text-slate-500 text-[10px] uppercase font-semibold">Bank Name</span>
                          <div className="font-bold text-white mt-0.5">{bankDetails.bankName}</div>
                        </div>

                        <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-2.5">
                          <span className="text-slate-500 text-[10px] uppercase font-semibold">Account Holder Name</span>
                          <div className="font-bold text-white mt-0.5">{bankDetails.accountName}</div>
                        </div>

                        <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-2.5 flex items-center justify-between">
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-semibold">Account Number</span>
                            <div className="font-mono font-bold text-cyan-400 mt-0.5">{bankDetails.accountNumber}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(bankDetails.accountNumber, 'acc')}
                            className="rounded p-1 bg-slate-800 text-slate-300 hover:text-white"
                          >
                            {copiedField === 'acc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>

                        <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-2.5">
                          <span className="text-slate-500 text-[10px] uppercase font-semibold">Branch Code / SWIFT</span>
                          <div className="font-bold text-white mt-0.5">{bankDetails.branchCode} ({bankDetails.swiftCode})</div>
                        </div>
                      </div>

                      <div className="mt-3 rounded-lg bg-amber-950/40 border border-amber-800/40 p-2.5 text-[11px] text-amber-300">
                        <strong>Important:</strong> When making your EFT / deposit, paste your Payment Reference Code (<code>{createdOrder.payment_reference}</code>) into the recipient narrative/payment reference field.
                      </div>
                    </div>

                    {/* Submit Confirmation Form */}
                    <form onSubmit={handleSubmitProof} className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <div className="text-xs font-bold text-white">Confirm Bank Transfer</div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Bank Transaction ID / Proof Reference
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. FNB-EFT-948102 or Bank Statement narrative"
                          value={proofReference}
                          onChange={(e) => setProofReference(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Additional Notes / Account Holder Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Transferred from John Doe FNB Account"
                          value={proofNotes}
                          onChange={(e) => setProofNotes(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => setStep('select')}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          Back to Packages
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting || !proofReference.trim()}
                          className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-50 transition-all"
                        >
                          {isSubmitting ? (
                            <span>Submitting Confirmation...</span>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Submit Deposit Confirmation</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Option 2: Instant Card Checkout */}
                {paymentMethod === 'card_instant' && (
                  <form onSubmit={handleInstantCardCheckout} className="space-y-3 rounded-xl border border-slate-700 bg-slate-950 p-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Secure Card Payment</span>
                      </div>
                      <span className="text-[10px] text-slate-400">256-Bit SSL Encryption</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Cardholder Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Neo Modise"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Card Number</label>
                      <input
                        type="text"
                        required
                        placeholder="4532 •••• •••• 8824"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          required
                          placeholder="12/28"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">CVC / CVV</label>
                        <input
                          type="text"
                          required
                          placeholder="892"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setStep('select')}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-md"
                      >
                        {isSubmitting ? (
                          <span>Authorizing Card...</span>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Pay & Credit Instantly ({createdOrder.fiat_amount.toFixed(2)} BWP)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Option 3: Mobile Money */}
                {paymentMethod === 'mobile_money' && bankDetails && (
                  <form onSubmit={handleSubmitProof} className="space-y-3 rounded-xl border border-slate-700 bg-slate-950 p-4">
                    <div className="text-xs font-bold text-white">Mobile Money Transfer</div>
                    <div className="rounded-lg bg-slate-900 p-3 text-xs border border-slate-800">
                      <div className="text-slate-400">Platform Mobile Numbers:</div>
                      <div className="font-mono font-bold text-cyan-400 mt-1">
                        {bankDetails.mobileMoneyDetails || 'Orange Money / Smega / FNB eWallet: +267 71 234 567'}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Send payment with narrative: <strong>{createdOrder.payment_reference}</strong>
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Mobile Money Reference / SMS Confirmation</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. OM-TRX-839219"
                        value={proofReference}
                        onChange={(e) => setProofReference(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button type="button" onClick={() => setStep('select')} className="text-xs text-slate-400 hover:text-white">
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !proofReference.trim()}
                        className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500"
                      >
                        Submit Confirmation
                      </button>
                    </div>
                  </form>
                )}

                {/* Option 4: Crypto USDT */}
                {paymentMethod === 'crypto_usdt' && bankDetails && (
                  <form onSubmit={handleSubmitProof} className="space-y-3 rounded-xl border border-slate-700 bg-slate-950 p-4">
                    <div className="text-xs font-bold text-white">USDT (TRC-20) Crypto Treasury</div>
                    <div className="rounded-lg bg-slate-900 p-3 text-xs border border-slate-800">
                      <div className="text-slate-400">Deposit Address:</div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="font-mono text-xs font-bold text-cyan-400 break-all">
                          {bankDetails.cryptoWalletAddress || 'No crypto wallet configured'}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(bankDetails.cryptoWalletAddress || 'No crypto wallet configured', 'crypto')}
                          className="rounded p-1 bg-slate-800 text-slate-300 ml-2"
                        >
                          {copiedField === 'crypto' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Blockchain Transaction Hash (TxID)</label>
                      <input
                        type="text"
                        required
                        placeholder="0x9f4a... or TRC-20 Tx Hash"
                        value={proofReference}
                        onChange={(e) => setProofReference(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button type="button" onClick={() => setStep('select')} className="text-xs text-slate-400 hover:text-white">
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !proofReference.trim()}
                        className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500"
                      >
                        Submit TxID
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* STEP 3: SUCCESS CONFIRMATION */}
            {step === 'success' && (
              <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/30 p-6 text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Payment Recorded Successfully!</h3>
                  <p className="mt-1 text-xs text-slate-300">
                    {successMessage || 'Your deposit has been processed. Your credit balance has been updated.'}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetModal();
                      onClose();
                    }}
                    className="rounded-lg bg-cyan-600 px-5 py-2 text-xs font-bold text-white hover:bg-cyan-500"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: DEPOSIT HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-8 text-center text-xs text-slate-500">
                No deposit orders found. Choose a package to top up your traffic reserves.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-300">{order.payment_reference}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          order.status === 'approved' 
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                            : order.status === 'pending'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                            : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                        }`}>
                          {order.status === 'approved' ? 'Credited' : order.status === 'pending' ? 'Pending Verification' : 'Rejected'}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        {order.package_name} • {new Date(order.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-white">{order.fiat_amount.toFixed(2)} {order.currency}</div>
                      <div className="text-[11px] font-semibold text-amber-400">+{order.credits_amount} CR</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
