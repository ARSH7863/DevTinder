import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import confetti from "canvas-confetti";
import axios from "axios";
import { addUser } from "../utils/userSlice";
import { BASE_URL } from "../utils/constants";

const PLANS = [
  {
    id: "starter",
    name: "Developer Starter",
    badge: null,
    popular: false,
    description: "Great for newly onboarded developers exploring connections.",
    monthlyPrice: 0,
    annualMonthlyPrice: 0,
    features: [
      { text: "10 connection requests / day", included: true },
      { text: "Standard developer feed", included: true },
      { text: "Standard profile card & skills", included: true },
      { text: "Community Discord access", included: true },
      { text: "Verified Blue Badge", included: false },
      { text: "See who viewed your profile", included: false },
      { text: "Direct message before matching", included: false },
      { text: "Unlimited connection requests", included: false },
    ],
    ctaText: "Current Plan",
    buttonClass: "btn-outline btn-neutral",
  },
  {
    id: "silver",
    name: "Dev Pro (Silver)",
    badge: "Most Popular",
    popular: true,
    description: "Accelerate your career networking with verification & priority.",
    monthlyPrice: 499,
    annualMonthlyPrice: 375,
    features: [
      { text: "100 connection requests / day", included: true },
      { text: "Verified Blue Badge 🛡️ on profile", included: true },
      { text: "See who viewed your profile (30 days)", included: true },
      { text: "Attach custom note with requests", included: true },
      { text: "2x Boost in developer feed algorithm", included: true },
      { text: "Priority email & chat support", included: true },
      { text: "Direct message before matching", included: false },
      { text: "Mentors & Founders lounge access", included: false },
    ],
    ctaText: "Upgrade to Silver",
    buttonClass: "btn-primary",
  },
  {
    id: "gold",
    name: "Dev Elite (Gold)",
    badge: "Best Value",
    popular: false,
    isGold: true,
    description: "For founders, seniors, and devs who want zero limits.",
    monthlyPrice: 999,
    annualMonthlyPrice: 749,
    features: [
      { text: "Unlimited connection requests 🔥", included: true },
      { text: "Golden VIP Crown Badge 👑 on profile", included: true },
      { text: "Direct Instant Message before matching", included: true },
      { text: "Top 1% Algorithmic Feed Spotlight", included: true },
      { text: "Unlimited profile visitor analytics", included: true },
      { text: "Exclusive Tech Mentors & Founders Lounge", included: true },
      { text: "1-on-1 resume & GitHub review session", included: true },
      { text: "24/7 dedicated VIP assistance", included: true },
    ],
    ctaText: "Get Gold Access",
    buttonClass: "btn-warning text-black font-bold",
  },
];

const COMPARISON_ROWS = [
  { feature: "Daily Connection Requests", starter: "10 / day", silver: "100 / day", gold: "Unlimited" },
  { feature: "Profile Verification Badge", starter: "None", silver: "Blue Shield 🛡️", gold: "VIP Gold Crown 👑" },
  { feature: "Feed Algorithm Boost", starter: "Standard", silver: "2x Boost", gold: "Top 1% Spotlight" },
  { feature: "Who Viewed Your Profile", starter: "❌", silver: "Last 30 days", gold: "Full Analytics" },
  { feature: "Personal Note on Requests", starter: "❌", silver: "✅ Included", gold: "✅ Included" },
  { feature: "Direct DM before Match", starter: "❌", silver: "❌", gold: "✅ Unlimited" },
  { feature: "Mentors Lounge Access", starter: "❌", silver: "❌", gold: "✅ Full Access" },
  { feature: "Support Tier", starter: "Community", silver: "Priority Email", gold: "24/7 VIP Concierge" },
];

const FAQS = [
  {
    q: "Can I cancel or switch my plan at any time?",
    a: "Yes, absolutely. You can upgrade, downgrade, or cancel your subscription at any time with a single click. If you cancel, your premium benefits remain active until the end of the billing period.",
  },
  {
    q: "How does the Blue Tick and Gold Crown verification work?",
    a: "Once your subscription is active, the verification badge automatically attaches to your avatar and profile card throughout the feed, requests, and connection views, establishing instant credibility.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We support all major payment options: UPI (Google Pay, PhonePe, Paytm), Credit & Debit cards (Visa, Mastercard, RuPay, Amex), and Net Banking via secure SSL-encrypted gateways.",
  },
  {
    q: "Is there a refund policy if I'm unsatisfied?",
    a: "We offer a 100% money-back guarantee within the first 14 days of subscription. If you feel DevTinder Premium hasn't accelerated your networking, contact support for a full refund.",
  },
];

const TESTIMONIALS = [
  {
    name: "Rohan Verma",
    role: "Full-stack Engineer at Fintech Unicorn",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    text: "DevTinder Gold was a game changer. The VIP badge and direct messaging allowed me to pitch my portfolio directly to an engineering lead who hired me 2 weeks later!",
  },
  {
    name: "Sneha Patel",
    role: "Co-founder & CTO",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    text: "The Dev Pro plan allowed me to find our senior React developer and AI engineer in record time. The response rate is vastly higher when you have a verified badge.",
  },
];

const Premium = () => {
  const user = useSelector((store) => store.user);
  const dispatch = useDispatch();
  const [isAnnual, setIsAnnual] = useState(true);
  const [selectedPlanModal, setSelectedPlanModal] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [downgradeLoading, setDowngradeLoading] = useState(false);

  // Derive activePlan from the Redux store so it always reflects the real membership
  const activePlan = user?.isPremium && user?.membershipType
    ? user.membershipType.toLowerCase()
    : "starter";

  const handleOpenCheckout = (plan) => {
    if (plan.id === "starter" || plan.id === activePlan) return;
    setSelectedPlanModal(plan);
    setPaymentSuccess(false);
  };

  const fireConfetti = () => {
    confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 }, colors: ["#f59e0b", "#3b82f6", "#10b981", "#ec4899", "#8b5cf6"] });
    setTimeout(() => {
      confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0.2, y: 0.7 } });
      confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 0.8, y: 0.7 } });
    }, 300);
  };

  const handleCompletePayment = async () => {
    setProcessingPayment(true);
    try {
      // Step 1: Create Razorpay order on backend
      const orderRes = await axios.post(
        BASE_URL + "/payment/create",
        { membershipType: selectedPlanModal.id },
        { withCredentials: true }
      );
      const { orderId, amount, currency, notes, keyId } = orderRes.data;

      // Step 2: Open Razorpay checkout modal
      const options = {
        key: keyId,
        amount,
        currency,
        name: "DevTinder",
        description: selectedPlanModal.name + " Membership",
        order_id: orderId,
        prefill: {
          name: notes?.firstName || user?.firstName || "",
          email: notes?.emailId || user?.emailId || "",
        },
        theme: { color: selectedPlanModal.isGold ? "#f59e0b" : "#6366f1" },
        handler: async function (response) {
          // Step 3: Verify payment signature on backend
          const verifyRes = await axios.post(
            BASE_URL + "/payment/verify",
            {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
            { withCredentials: true }
          );
          if (verifyRes.data.success) {
            // Update Redux store with new membership
            dispatch(addUser({
              ...user,
              isPremium: true,
              membershipType: selectedPlanModal.id,
            }));
            setPaymentSuccess(true);
            fireConfetti();
          }
        },
        modal: {
          ondismiss: () => setProcessingPayment(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setProcessingPayment(false);
        alert("Payment failed. Please try again.");
      });
      rzp.open();
    } catch (err) {
      console.error("Payment Error:", err);
      alert(err?.response?.data?.error || "Payment failed. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleDowngrade = async (targetMembershipType) => {
    setDowngradeLoading(true);
    try {
      const res = await axios.post(
        BASE_URL + "/payment/downgrade",
        { targetMembershipType },
        { withCredentials: true }
      );
      if (res.data.success) {
        dispatch(addUser({
          ...user,
          isPremium: res.data.isPremium,
          membershipType: res.data.membershipType || null,
        }));
      }
    } catch (err) {
      console.error("Downgrade Error:", err);
      alert(err?.response?.data?.error || "Downgrade failed. Please try again.");
    } finally {
      setDowngradeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 text-base-content py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header / Hero */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-semibold mb-4 border border-primary/20">
          <span>✨</span>
          <span>Supercharge Your Developer Career</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
          Unlock Unlimited Connections with{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            DevTinder Premium
          </span>
        </h1>
        <p className="text-base sm:text-lg text-base-content/70">
          Get verified, skip the limits, send instant direct notes, and get discovered by top founders, recruiters, and engineering leads.
        </p>

        {/* Active Plan Banner (if upgraded) */}
        {activePlan !== "starter" && (
          <div className="alert alert-success shadow-lg mt-6 text-left flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{activePlan === "gold" ? "👑" : "🛡️"}</span>
              <div>
                <h3 className="font-bold text-sm sm:text-base">
                  You are currently on {activePlan === "gold" ? "Dev Elite (Gold)" : "Dev Pro (Silver)"}!
                </h3>
                <div className="text-xs opacity-90">
                  Your premium benefits and verified badge are active.
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {activePlan === "gold" && (
                <button
                  onClick={() => handleDowngrade("silver")}
                  disabled={downgradeLoading}
                  className="btn btn-xs btn-outline btn-ghost"
                >
                  {downgradeLoading ? <span className="loading loading-spinner loading-xs"></span> : "↓ Silver"}
                </button>
              )}
              <button
                onClick={() => handleDowngrade("free")}
                disabled={downgradeLoading}
                className="btn btn-xs btn-error btn-outline"
              >
                {downgradeLoading ? <span className="loading loading-spinner loading-xs"></span> : "Cancel Plan"}
              </button>
            </div>
          </div>
        )}

        {/* Billing Cycle Switcher */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <span
            className={`text-sm font-medium cursor-pointer transition-colors ${
              !isAnnual ? "text-primary font-bold" : "text-base-content/60"
            }`}
            onClick={() => setIsAnnual(false)}
          >
            Monthly Billing
          </span>

          <label className="swap swap-rotate relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isAnnual}
              onChange={() => setIsAnnual(!isAnnual)}
              className="toggle toggle-primary toggle-md"
            />
          </label>

          <span
            className={`text-sm font-medium cursor-pointer transition-colors flex items-center gap-2 ${
              isAnnual ? "text-primary font-bold" : "text-base-content/60"
            }`}
            onClick={() => setIsAnnual(true)}
          >
            <span>Annual Billing</span>
            <span className="badge badge-accent badge-sm font-bold animate-pulse">
              Save 25%
            </span>
          </span>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-16">
        {PLANS.map((plan) => {
          const isCurrent = activePlan === plan.id;
          const displayPrice = isAnnual ? plan.annualMonthlyPrice : plan.monthlyPrice;
          const billedTotal = isAnnual ? plan.annualMonthlyPrice * 12 : plan.monthlyPrice;

          return (
            <div
              key={plan.id}
              className={`card bg-base-200/80 backdrop-blur-sm shadow-xl rounded-2xl border transition-all duration-300 flex flex-col justify-between hover:shadow-2xl relative ${
                plan.popular
                  ? "border-primary ring-2 ring-primary/40 shadow-primary/10 md:-translate-y-2"
                  : plan.isGold
                  ? "border-warning/60 ring-2 ring-warning/30 shadow-warning/10"
                  : "border-base-300"
              }`}
            >
              {/* Badge for Popular or Best Value */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span
                    className={`badge badge-sm sm:badge-md font-bold px-3 py-1 shadow-md ${
                      plan.isGold ? "badge-warning text-black" : "badge-primary text-primary-content"
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="card-body p-6 sm:p-8 flex flex-col flex-grow">
                {/* Plan Header */}
                <div className="mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <span>{plan.name}</span>
                    {plan.isGold && <span>👑</span>}
                    {plan.id === "silver" && <span>🛡️</span>}
                  </h2>
                  <p className="text-xs text-base-content/70 mt-1 min-h-[32px]">
                    {plan.description}
                  </p>
                </div>

                {/* Price Display */}
                <div className="my-4 pb-4 border-b border-base-300">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black">
                      ₹{displayPrice}
                    </span>
                    <span className="text-xs sm:text-sm text-base-content/60">
                      / month
                    </span>
                  </div>
                  {plan.monthlyPrice > 0 ? (
                    <div className="text-xs text-base-content/60 mt-1">
                      {isAnnual
                        ? `Billed annually (₹${billedTotal}/yr)`
                        : `Billed monthly (₹${billedTotal}/mo)`}
                    </div>
                  ) : (
                    <div className="text-xs text-base-content/60 mt-1">
                      Free forever, no credit card required
                    </div>
                  )}
                </div>

                {/* Features List */}
                <ul className="space-y-3 my-4 flex-grow text-xs sm:text-sm">
                  {plan.features.map((feat, idx) => (
                    <li
                      key={idx}
                      className={`flex items-start gap-2.5 ${
                        feat.included ? "text-base-content" : "text-base-content/40 line-through"
                      }`}
                    >
                      {feat.included ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 shrink-0 mt-0.5 ${
                            plan.isGold
                              ? "text-warning"
                              : plan.popular
                              ? "text-primary"
                              : "text-success"
                          }`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 shrink-0 mt-0.5 text-base-content/30"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                      <span>{feat.text}</span>
                    </li>
                  ))}
                </ul>

                {/* Action CTA */}
                <div className="card-actions mt-6">
                  <button
                    onClick={() => handleOpenCheckout(plan)}
                    disabled={isCurrent}
                    className={`btn w-full shadow-md transition-transform active:scale-95 ${
                      isCurrent ? "btn-disabled" : plan.buttonClass
                    }`}
                  >
                    {isCurrent ? "Active Plan" : plan.ctaText}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-base-200/50 rounded-2xl p-6 sm:p-8 border border-base-300 shadow-md mb-16">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Compare Plan Features</h2>
          <p className="text-sm text-base-content/70 mt-1">
            See everything included in each tier at a glance
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="table table-zebra w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-base-300">
                <th className="font-bold text-base-content">Feature</th>
                <th className="text-center font-bold text-base-content">Starter</th>
                <th className="text-center font-bold text-primary">Silver (Pro)</th>
                <th className="text-center font-bold text-warning">Gold (Elite)</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr key={i} className="hover">
                  <td className="font-medium">{row.feature}</td>
                  <td className="text-center text-base-content/70">{row.starter}</td>
                  <td className="text-center font-semibold text-primary">{row.silver}</td>
                  <td className="text-center font-bold text-warning">{row.gold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Social Proof / Testimonials */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Loved by Developers</h2>
          <p className="text-sm text-base-content/70 mt-1">
            See how DevTinder Premium transformed their professional network
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="card bg-base-200/60 border border-base-300 shadow-sm p-6 rounded-2xl"
            >
              <p className="italic text-sm text-base-content/80 mb-4">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/40"
                />
                <div>
                  <div className="font-bold text-sm flex items-center gap-1.5">
                    <span>{t.name}</span>
                    <span className="badge badge-primary badge-xs">Verified</span>
                  </div>
                  <div className="text-xs text-base-content/60">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="max-w-3xl mx-auto mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          <p className="text-sm text-base-content/70 mt-1">
            Have questions? We have got answers.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="collapse collapse-plus bg-base-200 border border-base-300 rounded-xl"
            >
              <input type="radio" name="premium-accordion" defaultChecked={idx === 0} />
              <div className="collapse-title text-base font-semibold">
                {faq.q}
              </div>
              <div className="collapse-content text-xs sm:text-sm text-base-content/75 leading-relaxed">
                <p>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Money-back Guarantee Callout */}
      <div className="text-center p-6 bg-base-200/40 rounded-2xl border border-dashed border-base-300 max-w-xl mx-auto">
        <div className="text-3xl mb-2">🛡️</div>
        <h3 className="font-bold text-base">14-Day Money-Back Guarantee</h3>
        <p className="text-xs text-base-content/70 mt-1">
          Try DevTinder Premium risk-free. If it does not boost your connections, get a full refund within 14 days without any hassle.
        </p>
      </div>

      {/* Checkout / Payment Modal */}
      {selectedPlanModal && (
        <dialog id="checkout_modal" className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box max-w-md bg-base-200 border border-base-300 shadow-2xl rounded-2xl">
            {!paymentSuccess ? (
              <>
                <div className="flex items-center justify-between border-b border-base-300 pb-3 mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <span>Upgrade to {selectedPlanModal.name}</span>
                    {selectedPlanModal.isGold ? <span>👑</span> : <span>🛡️</span>}
                  </h3>
                  <button
                    onClick={() => setSelectedPlanModal(null)}
                    className="btn btn-sm btn-circle btn-ghost"
                  >
                    ✕
                  </button>
                </div>

                {/* Plan Summary */}
                <div className="bg-base-100 p-4 rounded-xl mb-4 border border-base-300">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm">
                      {selectedPlanModal.name} ({isAnnual ? "Annual" : "Monthly"})
                    </span>
                    <span className="font-bold text-sm">
                      ₹{isAnnual ? selectedPlanModal.annualMonthlyPrice * 12 : selectedPlanModal.monthlyPrice}
                    </span>
                  </div>
                  <div className="text-xs text-base-content/60 flex justify-between">
                    <span>Billing Frequency</span>
                    <span>{isAnnual ? "Billed once yearly (Save 25%)" : "Billed monthly"}</span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="mb-4">
                  <label className="label text-xs font-bold text-base-content/70 py-1">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("upi")}
                      className={`btn btn-sm text-xs flex flex-col h-auto py-2 ${
                        paymentMethod === "upi" ? "btn-primary" : "btn-outline btn-neutral"
                      }`}
                    >
                      <span>⚡ UPI</span>
                      <span className="text-[9px] opacity-80">GPay, PhonePe</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`btn btn-sm text-xs flex flex-col h-auto py-2 ${
                        paymentMethod === "card" ? "btn-primary" : "btn-outline btn-neutral"
                      }`}
                    >
                      <span>💳 Card</span>
                      <span className="text-[9px] opacity-80">Visa, Master</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("netbanking")}
                      className={`btn btn-sm text-xs flex flex-col h-auto py-2 ${
                        paymentMethod === "netbanking" ? "btn-primary" : "btn-outline btn-neutral"
                      }`}
                    >
                      <span>🏦 Bank</span>
                      <span className="text-[9px] opacity-80">NetBanking</span>
                    </button>
                  </div>
                </div>

                {/* Security info */}
                <div className="flex items-center justify-center gap-2 text-xs text-base-content/60 my-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-success"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>256-bit SSL encrypted secure checkout</span>
                </div>

                {/* Action Buttons */}
                <div className="modal-action mt-4">
                  <button
                    onClick={() => setSelectedPlanModal(null)}
                    disabled={processingPayment}
                    className="btn btn-sm btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCompletePayment}
                    disabled={processingPayment}
                    className={`btn btn-sm flex-1 ${
                      selectedPlanModal.isGold ? "btn-warning text-black font-bold" : "btn-primary"
                    }`}
                  >
                    {processingPayment ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      `Pay ₹${isAnnual ? selectedPlanModal.annualMonthlyPrice * 12 : selectedPlanModal.monthlyPrice} & Activate`
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Payment Success State */
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-4 text-3xl animate-bounce">
                  ✓
                </div>
                <h3 className="font-extrabold text-2xl mb-2">Welcome to {selectedPlanModal.name}!</h3>
                <p className="text-sm text-base-content/75 mb-6">
                  Your subscription is active! Your profile now shines with your verified badge and elevated limits.
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setSelectedPlanModal(null)}
                    className="btn btn-primary btn-sm"
                  >
                    Start Networking
                  </button>
                  <Link
                    to="/profile"
                    onClick={() => setSelectedPlanModal(null)}
                    className="btn btn-outline btn-neutral btn-sm"
                  >
                    View My Profile
                  </Link>
                </div>
              </div>
            )}
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setSelectedPlanModal(null)}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
};

export default Premium;
