"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { useStore } from "@/store/useStore";
import { Avatar, VinylDisc } from "@/components/ui";
import { imgUrl } from "@/lib/api";
import {
  MdTrendingUp, MdPeople, MdLanguage, MdAlbum,
  MdDynamicFeed, MdStorefront, MdFavorite, MdStore,
  MdMessage, MdWorkspacePremium
} from "react-icons/md";
import { RiVipCrownFill } from "react-icons/ri";

const marqueeItems = [
  "Dark Side of the Moon","Abbey Road","Kind of Blue","Rumours",
  "Led Zeppelin IV","Pet Sounds","Thriller","Purple Rain",
  "Nevermind","Horses","Blue","A Love Supreme"
];

export default function HomePage() {
  const { user, isLoggedIn, trendingAlbums, blogs, loadHome, homeLoading } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadHome();
  }, []);

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="space-y-10 w-full">

        {/* ── Hero ── */}
        <div className="relative rounded-2xl overflow-hidden p-8 md:p-14 grid-bg w-full"
          style={{ border:"1px solid var(--bdr)", background:"linear-gradient(135deg,rgba(255,0,110,0.06),rgba(123,47,255,0.06))" }}>
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background:"rgba(255,0,110,0.05)" }}/>
          <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background:"rgba(0,245,255,0.04)" }}/>
          <div className="relative flex flex-col lg:flex-row lg:items-center gap-10">
            <div className="flex-1">
              <div className="lbl mb-4">The Vinyl Headquarters</div>
              <h1 className="font-bebas leading-none mb-5" style={{ fontSize:"clamp(3.5rem,8vw,7rem)" }}>
                <span className="g1 block">Discover.</span>
                <span className="npk block">Collect.</span>
                <span className="text-white block">Connect.</span>
              </h1>
              <p className="text-base mb-8 max-w-lg" style={{ color:"var(--tx2)" }}>
                The ultimate platform for vinyl record collectors. Browse the marketplace, build your digital collection, and connect with 50,000+ vinyl lovers worldwide.
              </p>
              <div className="flex flex-wrap gap-3">
                {isLoggedIn ? (
                  <>
                    <Link href="/feed"><button className="btn btn-pk btn-lg">Go to Feed</button></Link>
                    <Link href="/marketplace"><button className="btn btn-cy btn-lg">Marketplace</button></Link>
                  </>
                ) : (
                  <>
                    <Link href="/auth"><button className="btn btn-pk btn-lg">Get Started Free</button></Link>
                    <Link href="/marketplace"><button className="btn btn-cy btn-lg">Browse Records</button></Link>
                  </>
                )}
              </div>
            </div>
            <div className="hidden lg:flex items-center justify-center flex-shrink-0 spin-slow" style={{ filter:"drop-shadow(0 0 40px rgba(255,0,110,0.25))" }}>
              <VinylDisc color="#FF006E" size={220} />
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {[
            { n:"50K+", l:"Collectors",  c:"#FF006E", icon:<MdPeople size={22}/> },
            { n:"2M+",  l:"Records",     c:"#00F5FF", icon:<MdAlbum size={22}/> },
            { n:"12K+", l:"Listings",    c:"#FFE600", icon:<MdStorefront size={22}/> },
            { n:"120+", l:"Countries",   c:"#7B2FFF", icon:<MdLanguage size={22}/> },
          ].map(({ n,l,c,icon }) => (
            <div key={l} className="card-static p-5 text-center flex flex-col items-center gap-2">
              <div style={{ color:c }}>{icon}</div>
              <div className="stat-n text-4xl" style={{ color:c }}>{n}</div>
              <div className="text-xs font-syne font-bold tracking-widest uppercase" style={{ color:"var(--tx3)" }}>{l}</div>
            </div>
          ))}
        </div>

        {/* ── Marquee ── */}
        <div className="overflow-hidden rounded-xl py-4 w-full" style={{ background:"var(--card)", border:"1px solid var(--bdr)" }}>
          <div className="marquee flex gap-10 whitespace-nowrap" style={{ width:"max-content" }}>
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={i} className="font-bebas text-xl tracking-widest flex items-center gap-3" style={{ color:"var(--tx3)" }}>
                <MdAlbum size={16} style={{ color:"rgba(255,0,110,0.4)" }} />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* ── Trending Albums ── */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 lbl mb-1"><MdTrendingUp size={14}/> Hot Right Now</div>
              <div className="font-bebas text-3xl text-white">Trending Records</div>
            </div>
            <Link href="/marketplace"><button className="btn btn-ghost btn-sm">View All</button></Link>
          </div>

          {homeLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_,i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="w-full h-28 rounded-xl mb-3" style={{ background:"var(--surf)" }}/>
                  <div className="h-3 rounded mb-2" style={{ background:"var(--surf)", width:"80%" }}/>
                  <div className="h-3 rounded" style={{ background:"var(--surf)", width:"50%" }}/>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              {trendingAlbums.slice(0,8).map((album) => {
                const cover = imgUrl(album.coverUrl);
                const artist = album.albumArtists?.[0]?.artist?.name || "Unknown";
                return (
                  <Link key={album.id} href="/marketplace">
                    <div className="card p-4 cursor-pointer h-full">
                      <div className="relative w-full h-28 rounded-xl mb-3 flex items-center justify-center overflow-hidden"
                        style={{ background:"rgba(255,0,110,0.08)", border:"1px solid rgba(255,0,110,0.15)" }}>
                        {cover ? (
                          <img src={cover} alt={album.title} className="w-full h-full object-cover rounded-xl"/>
                        ) : (
                          <VinylDisc color="#FF006E" size={72}/>
                        )}
                        {album.trendingScore > 0 && <span className="badge badge-pk absolute top-2 left-2" style={{ fontSize:"0.52rem" }}>Hot</span>}
                      </div>
                      <div className="font-bold text-sm text-white truncate mb-0.5">{album.title}</div>
                      <div className="text-xs mb-2" style={{ color:"var(--tx2)" }}>{artist} · {album.year > 0 ? album.year : "—"}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:"rgba(0,245,255,0.1)", color:"var(--cy)" }}>
                          {album.trendingScore > 0 ? `↑ ${album.trendingScore}` : "New"}
                        </span>
                        <Link href="/marketplace"><button className="btn btn-pk btn-sm" onClick={e => e.preventDefault()}>View</button></Link>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Blog Posts ── */}
        {blogs.length > 0 && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 lbl mb-1"><MdDynamicFeed size={14}/> Editorial</div>
                <div className="font-bebas text-3xl text-white">From the Blog</div>
              </div>
              <Link href="/feed"><button className="btn btn-ghost btn-sm">All Posts</button></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {blogs.slice(0,3).map(blog => (
                <div key={blog.id} className="card p-5 flex flex-col gap-3">
                  <div className="flex flex-wrap gap-1">
                    {blog.tags?.slice(0,3).map(t => (
                      <span key={t.tag.name} className="badge badge-cy" style={{ fontSize:"0.5rem" }}>{t.tag.name}</span>
                    ))}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white leading-tight mb-1">{blog.title}</div>
                    <div className="text-xs leading-relaxed" style={{ color:"var(--tx2)" }}>{blog.excerpt?.slice(0,100)}…</div>
                  </div>
                  <div className="flex items-center gap-2 mt-auto pt-2 border-t" style={{ borderColor:"var(--bdr)" }}>
                    {imgUrl(blog.author.avatarUrl) ? (
                      <img src={imgUrl(blog.author.avatarUrl)!} className="w-6 h-6 rounded-full" alt=""/>
                    ) : (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background:"var(--surf)", color:"var(--tx2)" }}>
                        {blog.author.username[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs" style={{ color:"var(--tx3)" }}>@{blog.author.username}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Features Grid ── */}
        <div className="w-full">
          <div className="lbl mb-2">Everything You Need</div>
          <div className="font-bebas text-3xl text-white mb-6">Built for Collectors</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon:<MdAlbum size={26}/>,         title:"Digital Collection", desc:"Scan barcodes to add records instantly. Track value, condition and notes.", free:true,  href:"/collection" },
              { icon:<MdStorefront size={26}/>,     title:"P2P Marketplace",   desc:"Buy and sell with zero seller fees. Message directly, deal your way.", free:false, href:"/marketplace" },
              { icon:<MdDynamicFeed size={26}/>,   title:"Community Feed",    desc:"Hauls, setups, favourites — share your vinyl life.", free:false, href:"/feed" },
              { icon:<MdFavorite size={26}/>,       title:"Wish List",         desc:"Save records and get notified when prices drop.", free:false, href:"/wishlist" },
              { icon:<MdStore size={26}/>,          title:"Stores Directory",  desc:"Hand-curated map of the best record shops worldwide.", free:true,  href:"/stores" },
              { icon:<RiVipCrownFill size={24}/>,   title:"Premium",           desc:"Unlimited collection, marketplace, feed & messaging.", free:false, href:"/premium" },
            ].map(f => (
              <Link key={f.title} href={f.href}>
                <div className="card p-5 flex gap-4 hover:border-current transition-colors cursor-pointer h-full">
                  <div style={{ color: f.free ? "var(--cy)" : "var(--pk)", flexShrink:0, marginTop:2 }}>{f.icon}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-bold text-sm text-white">{f.title}</div>
                      {f.free
                        ? <span className="badge badge-gr" style={{ fontSize:"0.48rem" }}>FREE</span>
                        : <span className="badge badge-pk" style={{ fontSize:"0.48rem" }}>PRO</span>}
                    </div>
                    <div className="text-xs leading-relaxed" style={{ color:"var(--tx2)" }}>{f.desc}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        {!isLoggedIn && (
          <div className="rounded-2xl p-10 text-center w-full" style={{ background:"linear-gradient(135deg,rgba(255,0,110,0.08),rgba(123,47,255,0.08))", border:"1px solid rgba(255,0,110,0.15)" }}>
            <MdAlbum size={52} style={{ color:"var(--pk)", margin:"0 auto 16px" }}/>
            <div className="font-bebas text-4xl g1 mb-3">Ready to Join?</div>
            <div className="text-sm mb-6 max-w-md mx-auto" style={{ color:"var(--tx2)" }}>Free to start. Upgrade for unlimited collection, marketplace access, feed and messaging.</div>
            <Link href="/auth"><button className="btn btn-pk btn-lg">Start for Free — No Credit Card</button></Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
