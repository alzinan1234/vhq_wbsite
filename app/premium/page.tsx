"use client";
import AppLayout from "@/components/layout/AppLayout";
import { useStore } from "@/store/useStore";
import { MdCheckCircle, MdCancel, MdAlbum, MdStorefront, MdDynamicFeed, MdMessage, MdFavorite, MdNotifications } from "react-icons/md";
import { RiVipCrownFill } from "react-icons/ri";

const FREE_FEATURES = [
  { label:"25 records in collection", ok:true },
  { label:"Browse marketplace", ok:true },
  { label:"Record store directory", ok:true },
  { label:"Create posts & view feed", ok:false },
  { label:"Sell on marketplace", ok:false },
  { label:"Message other collectors", ok:false },
  { label:"Unlimited collection", ok:false },
  { label:"Wish list", ok:false },
];

const PRO_FEATURES = [
  { icon:<MdAlbum size={20}/>,      label:"Unlimited Collection",     desc:"Add as many records as you own. No caps." },
  { icon:<MdStorefront size={20}/>, label:"Sell on Marketplace",      desc:"List vinyl, CDs and equipment with zero seller fees." },
  { icon:<MdDynamicFeed size={20}/>,label:"Community Feed",           desc:"Post hauls, setups and discoveries. Engage with collectors." },
  { icon:<MdMessage size={20}/>,    label:"Direct Messaging",         desc:"Message sellers and other collectors directly." },
  { icon:<MdFavorite size={20}/>,   label:"Wish List",                desc:"Save albums and get notified when they appear for sale." },
  { icon:<MdNotifications size={20}/>,label:"Priority Notifications", desc:"Never miss a message or marketplace update." },
];

export default function PremiumPage() {
  const { user, isLoggedIn } = useStore();
  const isPro = user?.tier === "PREMIUM";

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto w-full space-y-10">
        {/* Hero */}
        <div className="text-center py-8">
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background:"linear-gradient(135deg,rgba(255,0,110,0.2),rgba(123,47,255,0.2))", border:"1px solid rgba(255,0,110,0.3)" }}>
              <RiVipCrownFill size={40} style={{ color:"var(--pk)" }}/>
            </div>
          </div>
          <div className="font-bebas text-5xl g1 mb-3">VHQ Premium</div>
          <p className="text-base max-w-md mx-auto" style={{ color:"var(--tx2)" }}>
            Everything a serious collector needs. No ads, no limits, no fees.
          </p>
          {isPro && (
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full" style={{ background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.3)", color:"#4ADE80" }}>
              <MdCheckCircle size={16}/> You are on Premium — enjoy!
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="card p-6 flex flex-col gap-4">
            <div>
              <div className="font-bebas text-2xl text-white mb-1">Free</div>
              <div className="stat-n text-4xl" style={{ color:"var(--tx2)" }}>$0<span className="text-lg font-normal">/mo</span></div>
              <div className="text-xs mt-1" style={{ color:"var(--tx3)" }}>Forever free, no credit card</div>
            </div>
            <div className="space-y-2.5 flex-1">
              {FREE_FEATURES.map(f => (
                <div key={f.label} className="flex items-center gap-2.5 text-sm">
                  {f.ok
                    ? <MdCheckCircle size={16} style={{ color:"#4ADE80", flexShrink:0 }}/>
                    : <MdCancel size={16} style={{ color:"var(--tx3)", flexShrink:0 }}/>}
                  <span style={{ color: f.ok ? "var(--tx)" : "var(--tx3)" }}>{f.label}</span>
                </div>
              ))}
            </div>
            {!isLoggedIn && <a href="/auth"><button className="btn btn-ghost btn-md w-full">Get Started Free</button></a>}
          </div>

          {/* Premium */}
          <div className="card p-6 flex flex-col gap-4 relative overflow-hidden"
            style={{ border:"1px solid rgba(255,0,110,0.4)", background:"linear-gradient(135deg,rgba(255,0,110,0.06),rgba(123,47,255,0.06))" }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background:"rgba(255,0,110,0.08)" }}/>
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <div className="font-bebas text-2xl text-white">Premium</div>
                <span className="badge badge-pk">BEST VALUE</span>
              </div>
              <div>
                <span className="stat-n text-4xl g1">$4.99</span>
                <span className="text-lg" style={{ color:"var(--tx2)" }}>/mo</span>
              </div>
              <div className="text-xs mt-1" style={{ color:"var(--tx3)" }}>Cancel anytime · No contracts</div>
            </div>
            <div className="space-y-2.5 flex-1 relative">
              {FREE_FEATURES.map(f => (
                <div key={f.label} className="flex items-center gap-2.5 text-sm">
                  <MdCheckCircle size={16} style={{ color:"#4ADE80", flexShrink:0 }}/>
                  <span style={{ color:"var(--tx)" }}>{f.label}</span>
                </div>
              ))}
            </div>
            <div className="relative">
              {isPro ? (
                <div className="btn btn-ghost btn-md w-full text-center" style={{ color:"#4ADE80", cursor:"default" }}>
                  ✓ Active Plan
                </div>
              ) : isLoggedIn ? (
                <div>
                  <button className="btn btn-pk btn-md w-full mb-2" onClick={() => alert("Purchase via the VHQ mobile app (iOS/Android)")}>
                    Upgrade to Premium
                  </button>
                  <div className="text-xs text-center" style={{ color:"var(--tx3)" }}>Available via iOS & Android app</div>
                </div>
              ) : (
                <a href="/auth"><button className="btn btn-pk btn-md w-full">Get Started</button></a>
              )}
            </div>
          </div>
        </div>

        {/* Features detail */}
        <div>
          <div className="font-bebas text-3xl text-white mb-5 text-center">Everything in Premium</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRO_FEATURES.map(f => (
              <div key={f.label} className="card p-5 flex gap-4">
                <div style={{ color:"var(--pk)", flexShrink:0, marginTop:2 }}>{f.icon}</div>
                <div>
                  <div className="font-bold text-sm text-white mb-1">{f.label}</div>
                  <div className="text-xs leading-relaxed" style={{ color:"var(--tx2)" }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="card-static p-6 space-y-4">
          <div className="font-bebas text-2xl text-white mb-2">Common Questions</div>
          {[
            ["Can I cancel anytime?","Yes, cancel anytime from the mobile app. You keep Premium until your billing period ends."],
            ["Is there a free trial?","The Free plan is available forever. We don't offer time-limited trials."],
            ["How do I pay?","Via the VHQ iOS or Android app through Apple App Store or Google Play billing."],
            ["What if I sell something?","Zero seller fees on all marketplace listings, even on the Free plan."],
          ].map(([q,a]) => (
            <div key={q} className="border-b pb-4" style={{ borderColor:"var(--bdr)" }}>
              <div className="font-bold text-sm text-white mb-1">{q}</div>
              <div className="text-sm" style={{ color:"var(--tx2)" }}>{a}</div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
