"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { useStore } from "@/store/useStore";
import { VinylDisc } from "@/components/ui";
import { imgUrl } from "@/lib/api";
import {
  MdTrendingUp, MdPeople, MdLanguage, MdAlbum,
  MdDynamicFeed, MdStorefront, MdFavorite, MdStore,
} from "react-icons/md";
import { RiVipCrownFill } from "react-icons/ri";

// ── Swiper imports ────────────────────────────────────────────────────────────
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Autoplay, EffectFade, Navigation, Pagination,
} from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";

// ── GSAP – dynamically imported so SSR doesn't break ─────────────────────────
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ── Marquee items ─────────────────────────────────────────────────────────────
const marqueeItems = [
  "Dark Side of the Moon", "Abbey Road", "Kind of Blue", "Rumours",
  "Led Zeppelin IV", "Pet Sounds", "Thriller", "Purple Rain",
  "Nevermind", "Horses", "Blue", "A Love Supreme",
];

// ── Fallback gradient colours per slide index ─────────────────────────────────
const GRAD_PAIRS = [
  ["#FF006E", "#7B2FFF"],
  ["#00F5FF", "#7B2FFF"],
  ["#FFE600", "#FF006E"],
  ["#7B2FFF", "#00F5FF"],
  ["#FF006E", "#00F5FF"],
  ["#00F5FF", "#FFE600"],
  ["#FFE600", "#7B2FFF"],
  ["#7B2FFF", "#FF006E"],
];

// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { isLoggedIn, trendingAlbums, blogs, loadHome, homeLoading } = useStore();
  const [mounted, setMounted] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  // GSAP refs
  const heroTextRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    loadHome();
  }, []);

  // ── GSAP scroll animations ───────────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;

    // Stats count-up on scroll
    if (statsRef.current) {
      gsap.fromTo(
        statsRef.current.querySelectorAll(".stat-card"),
        { opacity: 0, y: 40, scale: 0.93 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.65,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: statsRef.current,
            start: "top 82%",
          },
        }
      );
    }

    // Features stagger
    if (featuresRef.current) {
      gsap.fromTo(
        featuresRef.current.querySelectorAll(".feat-card"),
        { opacity: 0, y: 50 },
        {
          opacity: 1, y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
          },
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [mounted]);

  // Hero text GSAP on mount
  useEffect(() => {
    if (!heroTextRef.current) return;
    const els = heroTextRef.current.querySelectorAll(".hero-anim");
    gsap.fromTo(
      els,
      { opacity: 0, y: 32, skewY: 4 },
      {
        opacity: 1, y: 0, skewY: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
        delay: 0.15,
      }
    );
  }, [mounted]);

  if (!mounted) return null;

  const slides = homeLoading || trendingAlbums.length === 0
    ? Array.from({ length: 5 }, (_, i) => ({ id: String(i), title: "Loading…", coverUrl: "", albumArtists: [], year: 0, trendingScore: 0, format: "", trendingScore: 0 }))
    : trendingAlbums.slice(0, 8);

  const activeAlbum = slides[activeIdx] || slides[0];
  const activeArtist = activeAlbum?.albumArtists?.[0]?.artist?.name || "Unknown";
  const activeCover = imgUrl(activeAlbum?.coverUrl);
  const [c1, c2] = GRAD_PAIRS[activeIdx % GRAD_PAIRS.length];

  return (
    <AppLayout>
      <div className="space-y-10 w-full">

        {/* ════════════════════════════════════════════════════════════════════
            HERO — full-bleed Swiper banner with floating text
        ════════════════════════════════════════════════════════════════════ */}
        <div
          className="relative rounded-2xl overflow-hidden w-full"
          style={{
            minHeight: "clamp(420px, 56vw, 680px)",
            border: "1px solid var(--bdr)",
          }}
        >
          {/* ── Dynamic background colour that follows active slide ── */}
          <div
            className="absolute inset-0 transition-all duration-700 ease-in-out"
            style={{
              background: `linear-gradient(135deg, ${c1}18, ${c2}14, #0a0a0f)`,
              zIndex: 0,
            }}
          />

          {/* ── Grid overlay ── */}
          <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" style={{ zIndex: 1 }} />

          {/* ── Glow orbs that change with slide ── */}
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-700"
            style={{ background: `${c1}22`, zIndex: 1 }}
          />
          <div
            className="absolute bottom-0 left-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-700"
            style={{ background: `${c2}18`, zIndex: 1 }}
          />

          {/* ── LEFT: hero copy ── */}
          <div
            ref={heroTextRef}
            className="absolute left-0 top-0 bottom-0 z-20 flex flex-col justify-center"
            style={{
              width: "min(480px, 52%)",
              padding: "clamp(1.5rem,4vw,3.5rem)",
            }}
          >
            <div className="lbl mb-3 hero-anim" style={{ opacity: 0 }}>The Vinyl Headquarters</div>

            <h1
              className="font-bebas leading-none mb-5"
              style={{ fontSize: "clamp(3rem,7.5vw,6.5rem)" }}
            >
              <span className="g1 block hero-anim" style={{ opacity: 0 }}>Discover.</span>
              <span className="npk block hero-anim" style={{ opacity: 0 }}>Collect.</span>
              <span className="text-white block hero-anim" style={{ opacity: 0 }}>Connect.</span>
            </h1>

            <p
              className="text-sm md:text-base mb-7 max-w-sm hero-anim"
              style={{ color: "var(--tx2)", opacity: 0 }}
            >
              The ultimate platform for vinyl record collectors. Browse the
              marketplace, build your digital collection, and connect with
              50,000+ vinyl lovers worldwide.  
            </p>

            <div className="flex flex-wrap gap-3 hero-anim" style={{ opacity: 0 }}>
              {isLoggedIn ? (
                <>
                  <Link href="/feed"><button className="btn btn-pk btn-lg">Go to Feed</button></Link>
                  <Link href="/marketplace"><button className="btn btn-cy btn-lg ">Marketplace</button></Link>
                </>
              ) : (
                <>
                  <Link href="/auth"><button className="btn btn-pk btn-lg">Get Started Free</button></Link>
                  <Link href="/marketplace"><button className="btn btn-cy btn-lg">Browse Records</button></Link>
                </>
              )}
            </div>

            {/* ── Active album info badge ── */}
            {!homeLoading && activeAlbum?.title && (
              <div
                className="mt-8 hero-anim flex items-center gap-3"
                style={{ opacity: 0 }}
              >
                <div
                  className="w-1 self-stretch rounded-full"
                  style={{ background: c1 }}
                />
                <div>
                  <div className="text-xs font-syne font-bold tracking-widest uppercase mb-0.5" style={{ color: c1 }}>
                    Now Trending
                  </div>
                  <div className="text-sm font-bold text-white truncate max-w-xs">
                    {activeAlbum.title}
                  </div>
                  <div className="text-xs" style={{ color: "var(--tx3)" }}>
                    {activeArtist} {activeAlbum.year > 0 ? `· ${activeAlbum.year}` : ""}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Swiper album covers ── */}
          <div
            className="absolute right-0 top-0 bottom-0 z-10"
            style={{ width: "min(560px, 55%)", overflow: "hidden" }}
          >
            {/* gradient mask on the left edge to blend with text */}
            <div
              className="absolute top-0 bottom-0 left-0 w-28 z-10 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to right, var(--bg, #0a0a0f) 0%, transparent 100%)",
              }}
            />

            <Swiper
              modules={[Autoplay, EffectFade, Navigation, Pagination]}
              effect="fade"
              autoplay={{ delay: 3800, disableOnInteraction: false, pauseOnMouseEnter: true }}
              loop
              speed={900}
              pagination={{ clickable: true, dynamicBullets: true }}
              navigation={false}
              onSlideChange={(s) => setActiveIdx(s.realIndex)}
              className="h-full w-full"
              style={{ height: "clamp(420px, 56vw, 680px)" }}
            >
              {slides.map((album, i) => {
                const cover = imgUrl(album.coverUrl);
                const [a1, a2] = GRAD_PAIRS[i % GRAD_PAIRS.length];
                return (
                  <SwiperSlide key={album.id}>
                    <div className="relative w-full h-full flex items-center justify-center">
                      {cover ? (
                        <>
                          {/* Blurred full bg */}
                          <img
                            src={cover}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ filter: "blur(28px) saturate(1.3) brightness(0.35)", transform: "scale(1.1)" }}
                          />
                          {/* Main cover – floating card */}
                          <div
                            className="relative z-10 rounded-2xl overflow-hidden shadow-2xl"
                            style={{
                              width: "clamp(200px,28vw,340px)",
                              aspectRatio: "1",
                              boxShadow: `0 0 60px ${a1}44, 0 30px 80px rgba(0,0,0,0.7)`,
                              border: `1px solid ${a1}33`,
                              animation: "heroFloat 4s ease-in-out infinite",
                            }}
                          >
                            <img src={cover} alt={album.title} className="w-full h-full object-cover" />
                            {/* Sheen overlay */}
                            <div
                              className="absolute inset-0"
                              style={{
                                background: `linear-gradient(135deg, ${a1}22 0%, transparent 60%, ${a2}22 100%)`,
                              }}
                            />
                          </div>
                          {/* Floating vinyl behind cover */}
                          <div
                            className="absolute z-0 spin-slow opacity-30"
                            style={{ right: "8%", top: "50%", transform: "translateY(-50%)" }}
                          >
                            <VinylDisc color={a1} size={clamp(120, 18, 200)} />
                          </div>
                        </>
                      ) : (
                        /* Loading skeleton */
                        <div
                          className="relative z-10 rounded-2xl animate-pulse"
                          style={{
                            width: "clamp(200px,28vw,340px)",
                            aspectRatio: "1",
                            background: "var(--surf)",
                          }}
                        />       
                      )}
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>

            {/* Thumbnail strip at bottom */}
            {!homeLoading && trendingAlbums.length > 0 && (
              <div
                className="absolute bottom-4 left-6 right-6 z-20 flex gap-2 overflow-x-auto scrollbar-hide"
                style={{ scrollbarWidth: "none" }}
              >
                {slides.map((album, i) => {
                  const cv = imgUrl(album.coverUrl);
                  const [ta] = GRAD_PAIRS[i % GRAD_PAIRS.length];
                  return (
                    <div
                      key={album.id}
                      className="flex-shrink-0 rounded-lg overflow-hidden transition-all duration-300 cursor-pointer"
                      style={{
                        width: 44, height: 44,
                        border: `2px solid ${i === activeIdx ? ta : "transparent"}`,
                        opacity: i === activeIdx ? 1 : 0.45,
                        transform: i === activeIdx ? "scale(1.1)" : "scale(1)",
                        background: "var(--surf)",
                      }}
                    >
                      {cv
                        ? <img src={cv} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full" style={{ background: ta + "44" }} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            STATS
        ════════════════════════════════════════════════════════════════════ */}
        <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {[
            { n: "50K+", l: "Collectors",  c: "#FF006E", icon: <MdPeople size={22} /> },
            { n: "2M+",  l: "Records",     c: "#00F5FF", icon: <MdAlbum size={22} /> },
            { n: "12K+", l: "Listings",    c: "#FFE600", icon: <MdStorefront size={22} /> },
            { n: "120+", l: "Countries",   c: "#7B2FFF", icon: <MdLanguage size={22} /> },
          ].map(({ n, l, c, icon }) => (
            <div key={l} className="card-static stat-card p-5 text-center flex flex-col items-center gap-2" style={{ opacity: 0 }}>
              <div style={{ color: c }}>{icon}</div>
              <div className="stat-n text-4xl" style={{ color: c }}>{n}</div>
              <div className="text-xs font-syne font-bold tracking-widest uppercase" style={{ color: "var(--tx3)" }}>{l}</div>
            </div>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            MARQUEE
        ════════════════════════════════════════════════════════════════════ */}
        <div className="overflow-hidden rounded-xl py-4 w-full" style={{ background: "var(--card)", border: "1px solid var(--bdr)" }}>
          <div className="marquee flex gap-10 whitespace-nowrap" style={{ width: "max-content" }}>
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={i} className="font-bebas text-xl tracking-widest flex items-center gap-3" style={{ color: "var(--tx3)" }}>
                <MdAlbum size={16} style={{ color: "rgba(255,0,110,0.4)" }} />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TRENDING ALBUMS GRID (below hero)
        ════════════════════════════════════════════════════════════════════ */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 lbl mb-1"><MdTrendingUp size={14} /> Hot Right Now</div>
              <div className="font-bebas text-3xl text-white">Trending Records</div>
            </div>
            <Link href="/marketplace"><button className="btn btn-ghost btn-sm">View All</button></Link>
          </div>

          {homeLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="w-full h-28 rounded-xl mb-3" style={{ background: "var(--surf)" }} />
                  <div className="h-3 rounded mb-2" style={{ background: "var(--surf)", width: "80%" }} />
                  <div className="h-3 rounded" style={{ background: "var(--surf)", width: "50%" }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              {trendingAlbums.slice(0, 8).map((album, i) => {
                const cover = imgUrl(album.coverUrl);
                const artist = album.albumArtists?.[0]?.artist?.name || "Unknown";
                const [ac] = GRAD_PAIRS[i % GRAD_PAIRS.length];
                return (
                  <Link key={album.id} href="/marketplace">
                    <div className="card p-4 cursor-pointer h-full group" style={{ transition: "transform 0.2s, box-shadow 0.2s" }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 30px ${ac}33`;
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.transform = "";
                        (e.currentTarget as HTMLElement).style.boxShadow = "";
                      }}
                    >
                      <div
                        className="relative w-full h-28 rounded-xl mb-3 flex items-center justify-center overflow-hidden"
                        style={{ background: `${ac}12`, border: `1px solid ${ac}28` }}
                      >
                        {cover ? (
                          <img src={cover} alt={album.title} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <VinylDisc color={ac} size={72} />
                        )}
                        {album.trendingScore > 0 && (
                          <span className="badge badge-pk absolute top-2 left-2" style={{ fontSize: "0.52rem" }}>Hot</span>
                        )}
                      </div>
                      <div className="font-bold text-sm text-white truncate mb-0.5">{album.title}</div>
                      <div className="text-xs mb-2" style={{ color: "var(--tx2)" }}>{artist} · {album.year > 0 ? album.year : "—"}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${ac}18`, color: ac }}>
                          {album.trendingScore > 0 ? `↑ ${album.trendingScore}` : "New"}
                        </span>
                        <button className="btn btn-pk btn-sm">View</button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            BLOG POSTS
        ════════════════════════════════════════════════════════════════════ */}
        {blogs.length > 0 && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 lbl mb-1"><MdDynamicFeed size={14} /> Editorial</div>
                <div className="font-bebas text-3xl text-white">From the Blog</div>
              </div>
              <Link href="/feed"><button className="btn btn-ghost btn-sm">All Posts</button></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {blogs.slice(0, 3).map(blog => (
                <div key={blog.id} className="card p-5 flex flex-col gap-3">
                  <div className="flex flex-wrap gap-1">
                    {blog.tags?.slice(0, 3).map(t => (
                      <span key={t.tag.name} className="badge badge-cy" style={{ fontSize: "0.5rem" }}>{t.tag.name}</span>
                    ))}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white leading-tight mb-1">{blog.title}</div>
                    <div className="text-xs leading-relaxed" style={{ color: "var(--tx2)" }}>{blog.excerpt?.slice(0, 100)}…</div>
                  </div>
                  <div className="flex items-center gap-2 mt-auto pt-2 border-t" style={{ borderColor: "var(--bdr)" }}>
                    {imgUrl(blog.author.avatarUrl) ? (
                      <img src={imgUrl(blog.author.avatarUrl)!} className="w-6 h-6 rounded-full" alt="" />
                    ) : (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "var(--surf)", color: "var(--tx2)" }}>
                        {blog.author.username[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs" style={{ color: "var(--tx3)" }}>@{blog.author.username}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            FEATURES GRID
        ════════════════════════════════════════════════════════════════════ */}
        <div ref={featuresRef} className="w-full">
          <div className="lbl mb-2">Everything You Need</div>
          <div className="font-bebas text-3xl text-white mb-6">Built for Collectors</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: <MdAlbum size={26} />,       title: "Digital Collection", desc: "Scan barcodes to add records instantly. Track value, condition and notes.", free: true,  href: "/collection" },
              { icon: <MdStorefront size={26} />,   title: "P2P Marketplace",   desc: "Buy and sell with zero seller fees. Message directly, deal your way.",  free: false, href: "/marketplace" },
              { icon: <MdDynamicFeed size={26} />,  title: "Community Feed",    desc: "Hauls, setups, favourites — share your vinyl life.",                    free: false, href: "/feed" },
              { icon: <MdFavorite size={26} />,     title: "Wish List",         desc: "Save records and get notified when prices drop.",                       free: false, href: "/wishlist" },
              { icon: <MdStore size={26} />,        title: "Stores Directory",  desc: "Hand-curated map of the best record shops worldwide.",                  free: true,  href: "/stores" },
              { icon: <RiVipCrownFill size={24} />, title: "Premium",           desc: "Unlimited collection, marketplace, feed & messaging.",                  free: false, href: "/premium" },
            ].map(f => (
              <Link key={f.title} href={f.href}>
                <div className="card feat-card p-5 flex gap-4 hover:border-current transition-colors cursor-pointer h-full" style={{ opacity: 0 }}>
                  <div style={{ color: f.free ? "var(--cy)" : "var(--pk)", flexShrink: 0, marginTop: 2 }}>{f.icon}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-bold text-sm text-white">{f.title}</div>
                      {f.free
                        ? <span className="badge badge-gr" style={{ fontSize: "0.48rem" }}>FREE</span>
                        : <span className="badge badge-pk" style={{ fontSize: "0.48rem" }}>PRO</span>}
                    </div>
                    <div className="text-xs leading-relaxed" style={{ color: "var(--tx2)" }}>{f.desc}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            CTA
        ════════════════════════════════════════════════════════════════════ */}
        {!isLoggedIn && (
          <div className="rounded-2xl p-10 text-center w-full" style={{ background: "linear-gradient(135deg,rgba(255,0,110,0.08),rgba(123,47,255,0.08))", border: "1px solid rgba(255,0,110,0.15)" }}>
            <MdAlbum size={52} style={{ color: "var(--pk)", margin: "0 auto 16px" }} />
            <div className="font-bebas text-4xl g1 mb-3">Ready to Join?</div>
            <div className="text-sm mb-6 max-w-md mx-auto" style={{ color: "var(--tx2)" }}>Free to start. Upgrade for unlimited collection, marketplace access, feed and messaging.</div>
            <Link href="/auth"><button className="btn btn-pk btn-lg">Start for Free — No Credit Card</button></Link>
          </div>
        )}
      </div>

      {/* ── Hero float keyframe ── */}
      <style jsx global>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50%       { transform: translateY(-14px) rotate(1deg); }
        }
        .swiper-pagination-bullet {
          background: rgba(255,255,255,0.35) !important;
          width: 7px !important;
          height: 7px !important;
        }
        .swiper-pagination-bullet-active {
          background: #FF006E !important;
          width: 22px !important;
          border-radius: 4px !important;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </AppLayout>
  );
}

// tiny helper used inline (avoids importing clamp from elsewhere)
function clamp(val: number, _min: number, _max: number) { return val; }