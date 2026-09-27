import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  CircleDollarSign,
  Eye,
  EyeOff,
  Fingerprint,
  GraduationCap,
  Menu,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Split,
  Store,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CampusCoin — Money, mastered for campus life" },
      {
        name: "description",
        content:
          "CampusCoin is the student money app for campus payments, smart budgets, shared bills, and secure everyday spending.",
      },
      { property: "og:title", content: "CampusCoin — Student money, made smarter" },
      {
        property: "og:description",
        content: "Pay on campus, split bills, and stay ahead of every semester with CampusCoin.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CampusCoin,
});

const navItems = ["Product", "Benefits", "Campus", "Security"];

const benefits = [
  {
    icon: ShieldCheck,
    number: "01",
    title: "Protected by design",
    copy: "Freeze your card instantly, verify every payment, and stay in control with real-time alerts.",
  },
  {
    icon: TrendingUp,
    number: "02",
    title: "A budget that thinks ahead",
    copy: "See what's safe to spend after rent, fees, and subscriptions—before the month gets expensive.",
  },
  {
    icon: WalletCards,
    number: "03",
    title: "One balance, every campus",
    copy: "Pay at cafés, bookstores, societies, and events from one student-first digital wallet.",
  },
];

const transactions = [
  { icon: Store, name: "Campus Café", meta: "Today · Food", amount: "− $8.40" },
  { icon: Split, name: "Maya paid you", meta: "Today · Split bill", amount: "+ $24.00", positive: true },
  { icon: ReceiptText, name: "Bookstore", meta: "Yesterday · Study", amount: "− $32.90" },
];

function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={cn("brand-mark", inverse && "brand-mark-inverse")} aria-hidden="true">
      <span className="brand-mark-core" />
    </span>
  );
}

function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <a href="#top" className={cn("flex items-center gap-2.5", inverse ? "text-hero-foreground" : "text-foreground")}>
      <BrandMark inverse={inverse} />
      <span className="text-lg font-extrabold">Campus<span className="text-brand">Coin</span></span>
    </a>
  );
}

function PaymentCard({ className }: { className?: string }) {
  return (
    <div className={cn("campus-card", className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-card-ink">
          <BrandMark />
          <span className="text-sm font-extrabold">CampusCoin</span>
        </div>
        <div className="contactless" aria-label="Contactless card" />
      </div>
      <div className="mt-auto flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold text-card-ink/60">STUDENT</p>
          <p className="mt-1 text-sm font-bold text-card-ink">AVA CARTER</p>
        </div>
        <div className="flex -space-x-2">
          <span className="h-8 w-8 rounded-full bg-card-orbit/85" />
          <span className="h-8 w-8 rounded-full bg-card-sun/85" />
        </div>
      </div>
    </div>
  );
}

function PhonePreview() {
  const [balanceVisible, setBalanceVisible] = useState(true);

  return (
    <div className="phone-shell">
      <div className="phone-screen">
        <div className="phone-island" />
        <div className="flex items-center justify-between pt-7">
          <div>
            <p className="text-xs text-muted-foreground">Good morning</p>
            <p className="font-bold">Ava</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent">
            <span className="text-xs font-bold">AC</span>
          </div>
        </div>
        <div className="mt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-xs font-medium">Available balance</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={() => setBalanceVisible((value) => !value)}
              aria-label={balanceVisible ? "Hide balance" : "Show balance"}
            >
              {balanceVisible ? <Eye /> : <EyeOff />}
            </Button>
          </div>
          <p className="mt-1 text-3xl font-extrabold">{balanceVisible ? "$1,248.60" : "••••••••"}</p>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            [ArrowRight, "Send"],
            [ArrowDown, "Add"],
            [Split, "Split"],
          ].map(([Icon, label]) => (
            <Button key={String(label)} variant="secondary" className="h-auto flex-col gap-2 py-3 text-xs">
              <Icon className="text-brand" />
              {String(label)}
            </Button>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <h3 className="text-sm font-bold">Recent activity</h3>
          <span className="text-xs font-semibold text-brand">See all</span>
        </div>
        <div className="mt-2 space-y-1">
          {transactions.map((item) => (
            <div key={item.name} className="flex items-center gap-3 py-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent">
                <item.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold">{item.name}</span>
                <span className="block text-[10px] text-muted-foreground">{item.meta}</span>
              </span>
              <span className={cn("text-xs font-bold", item.positive && "text-growth")}>{item.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CampusCoin() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main id="top" className="overflow-hidden bg-background">
      <section className="hero-grid relative min-h-[92svh] bg-hero text-hero-foreground">
        <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-8">
          <Logo inverse />
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            {navItems.map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-xs font-semibold text-hero-muted transition-colors hover:text-hero-foreground">
                {item}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Button asChild variant="ghost" className="text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground">
              <a href="#download">Log in</a>
            </Button>
            <Button asChild className="rounded-full bg-highlight text-highlight-foreground shadow-none hover:bg-highlight/90">
              <a href="#download">Get CampusCoin <ArrowRight /></a>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground md:hidden"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </header>
        {menuOpen && (
          <div className="absolute inset-x-4 top-20 z-30 rounded-lg border border-hero-line bg-hero p-5 shadow-2xl md:hidden">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)} className="py-3 text-sm font-bold">
                  {item}
                </a>
              ))}
              <Button asChild className="mt-3 rounded-full bg-highlight text-highlight-foreground">
                <a href="#download">Get CampusCoin</a>
              </Button>
            </div>
          </div>
        )}

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-14 md:min-h-[calc(92svh-88px)] md:grid-cols-[1.08fr_.92fr] md:px-8 md:pb-24 md:pt-8">
          <div className="max-w-3xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-hero-line px-3 py-1.5 text-xs font-semibold text-hero-muted">
              <Sparkles className="h-3.5 w-3.5 text-highlight" /> Built around student life
            </div>
            <h1 className="max-w-3xl text-[clamp(3.4rem,7.5vw,7.2rem)] font-black leading-[.89]">
              Money, mastered for campus life.
            </h1>
            <p className="mt-8 max-w-lg text-base leading-7 text-hero-muted md:text-lg">
              Pay, split, save, and stay ahead of every semester—all in one secure student wallet.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-12 rounded-full bg-highlight px-6 text-highlight-foreground shadow-none hover:bg-highlight/90">
                <a href="#download">Open your account <ArrowRight /></a>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-12 rounded-full border border-hero-line px-6 text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground">
                <a href="#product">See how it works</a>
              </Button>
            </div>
          </div>

          <div className="hero-visual relative mx-auto h-[420px] w-full max-w-[570px] md:h-[560px]">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="float-chip chip-one"><BadgeCheck /> Verified student</div>
            <div className="float-chip chip-two"><TrendingUp /> +12% saved</div>
            <PaymentCard className="hero-card" />
            <div className="hero-phone-edge">
              <div className="h-1.5 w-20 rounded-full bg-hero-line" />
              <p className="mt-7 text-xs text-hero-muted">This month</p>
              <p className="mt-1 text-2xl font-extrabold">$642.18</p>
              <div className="mt-6 flex h-24 items-end gap-2">
                {[42, 68, 50, 84, 62, 94, 76].map((height, index) => (
                  <span key={index} className="flex-1 rounded-t bg-highlight/80" style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2 rounded-full border-4 border-hero bg-highlight p-4 text-highlight-foreground">
          <ArrowDown className="h-5 w-5" />
        </div>
      </section>

      <section id="product" className="section-space bg-background">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="grid gap-8 border-b border-border pb-12 md:grid-cols-[.75fr_1.25fr] md:items-end">
            <p className="eyebrow">A better money app</p>
            <h2 className="section-title">Your finances should feel clear—not like another exam.</h2>
          </div>
          <div className="grid md:grid-cols-3">
            {benefits.map((benefit) => (
              <article key={benefit.title} className="benefit-panel">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-brand"><benefit.icon /></span>
                  <span className="text-xs font-bold text-muted-foreground">{benefit.number}</span>
                </div>
                <h3 className="mt-16 text-2xl font-extrabold">{benefit.title}</h3>
                <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">{benefit.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="benefits" className="bg-soft py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-[.9fr_1.1fr]">
            <div className="app-stage relative min-h-[620px]">
              <div className="absolute left-0 top-20 hidden w-[280px] rotate-[-8deg] rounded-lg bg-hero p-5 text-hero-foreground shadow-2xl sm:block">
                <p className="text-xs text-hero-muted">Safe to spend</p>
                <p className="mt-2 text-3xl font-extrabold">$286.40</p>
                <div className="mt-8 h-2 overflow-hidden rounded-full bg-hero-line"><div className="h-full w-3/4 bg-growth" /></div>
                <div className="mt-4 flex justify-between text-[10px] text-hero-muted"><span>Spent $413</span><span>Budget $700</span></div>
              </div>
              <div className="absolute right-0 top-0 z-10"><PhonePreview /></div>
              <div className="absolute bottom-3 left-4 z-20 rounded-lg border border-border bg-background p-4 shadow-xl sm:left-20">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-growth-soft text-growth"><CircleDollarSign /></span>
                  <div><p className="text-xs text-muted-foreground">Cashback earned</p><p className="font-extrabold">$42.80</p></div>
                </div>
              </div>
            </div>
            <div>
              <p className="eyebrow">Built for real student life</p>
              <h2 className="section-title mt-5">Know where your money is going. Before it goes.</h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
                CampusCoin turns everyday spending into a clear plan. Your essentials, shared costs, and goals stay visible in one calm, secure place.
              </p>
              <Tabs defaultValue="budget" className="mt-10">
                <TabsList className="h-auto w-full justify-start gap-1 bg-transparent p-0">
                  <TabsTrigger value="budget" className="rounded-full border border-border px-4 py-2.5 data-[state=active]:border-foreground data-[state=active]:shadow-none">Smart budget</TabsTrigger>
                  <TabsTrigger value="split" className="rounded-full border border-border px-4 py-2.5 data-[state=active]:border-foreground data-[state=active]:shadow-none">Split bills</TabsTrigger>
                  <TabsTrigger value="rewards" className="rounded-full border border-border px-4 py-2.5 data-[state=active]:border-foreground data-[state=active]:shadow-none">Rewards</TabsTrigger>
                </TabsList>
                <TabsContent value="budget" className="mt-7 border-l-2 border-brand pl-5"><h3 className="font-extrabold">A live safe-to-spend number</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">CampusCoin accounts for rent, tuition plans, and upcoming subscriptions automatically.</p></TabsContent>
                <TabsContent value="split" className="mt-7 border-l-2 border-growth pl-5"><h3 className="font-extrabold">Settle shared costs in seconds</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Split groceries, society fees, or a group dinner without awkward reminders.</p></TabsContent>
                <TabsContent value="rewards" className="mt-7 border-l-2 border-highlight pl-5"><h3 className="font-extrabold">Useful rewards, not noise</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Earn at participating campus spots and put rewards straight toward your goals.</p></TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </section>

      <section id="campus" className="section-space bg-background">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div><p className="eyebrow">One wallet. Every day.</p><h2 className="section-title mt-5 max-w-2xl">From first coffee to final submission.</h2></div>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">Designed around the moments that actually make up campus life.</p>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-12">
            <article className="feature-block feature-blue md:col-span-7">
              <div><GraduationCap className="h-7 w-7" /><h3 className="mt-20 max-w-md text-3xl font-extrabold">Your campus identity meets your everyday wallet.</h3></div>
              <div className="mt-10 flex items-center gap-2 text-sm font-bold">Pay on campus <ChevronRight /></div>
            </article>
            <article className="feature-block bg-hero text-hero-foreground md:col-span-5">
              <Fingerprint className="h-7 w-7 text-highlight" /><p className="mt-20 text-sm text-hero-muted">Protected access</p><h3 className="mt-2 text-3xl font-extrabold">You are the password.</h3><p className="mt-5 text-sm leading-6 text-hero-muted">Biometric approval and instant alerts keep every payment visible.</p>
            </article>
            <article className="feature-block bg-growth-soft md:col-span-5">
              <TrendingUp className="h-7 w-7 text-growth" /><h3 className="mt-20 text-3xl font-extrabold">Goals that grow with you.</h3><p className="mt-4 text-sm leading-6 text-muted-foreground">Round up purchases or move spare money automatically.</p>
            </article>
            <article className="feature-block bg-highlight md:col-span-7">
              <div className="flex items-center justify-between"><Split className="h-7 w-7" /><span className="text-xs font-bold">No awkward maths</span></div><h3 className="mt-20 max-w-lg text-3xl font-extrabold">Split the bill. Keep the friendship.</h3><div className="mt-8 flex -space-x-3">{["AC", "MK", "JL", "+2"].map((initial) => <span key={initial} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-highlight bg-background text-xs font-bold">{initial}</span>)}</div>
            </article>
          </div>
        </div>
      </section>

      <section id="security" className="bg-hero py-20 text-hero-foreground md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-[.8fr_1.2fr] md:px-8">
          <div><p className="eyebrow text-highlight">Student trusted</p><h2 className="section-title mt-5">Less money stress. More room to live.</h2></div>
          <div className="grid gap-px overflow-hidden rounded-lg bg-hero-line md:grid-cols-2">
            {[{quote:"I finally know what I can spend without checking three different apps.",name:"Maya · 2nd year"},{quote:"Splitting house bills takes seconds now. No spreadsheets, no chasing.",name:"Noah · Postgrad"},{quote:"The campus card is the first student product that actually feels premium.",name:"Zara · 1st year"},{quote:"Saving for summer happens quietly in the background. That's the best part.",name:"Leo · Final year"}].map((item) => (
              <figure key={item.name} className="bg-hero p-7 md:p-9"><div className="mb-10 flex gap-1 text-highlight">★★★★★</div><blockquote className="text-lg font-bold leading-7">“{item.quote}”</blockquote><figcaption className="mt-8 text-xs text-hero-muted">{item.name}</figcaption></figure>
            ))}
          </div>
        </div>
      </section>

      <section id="download" className="relative overflow-hidden bg-highlight py-24 md:py-32">
        <div className="download-lines" />
        <div className="relative z-10 mx-auto max-w-4xl px-5 text-center md:px-8">
          <BrandMark />
          <h2 className="mx-auto mt-8 max-w-3xl text-5xl font-black leading-[.95] md:text-7xl">Your money era starts here.</h2>
          <p className="mx-auto mt-6 max-w-lg text-sm leading-6 text-highlight-foreground/70">Join students building calmer, smarter money habits with CampusCoin.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="h-14 rounded-full bg-hero px-7 text-hero-foreground hover:bg-hero/90">Get it on iOS <ArrowRight /></Button>
            <Button size="lg" variant="outline" className="h-14 rounded-full border-highlight-foreground/25 bg-transparent px-7 hover:bg-highlight-foreground/10">Get it on Android</Button>
          </div>
        </div>
      </section>

      <footer className="bg-hero py-12 text-hero-foreground">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex flex-col justify-between gap-10 border-b border-hero-line pb-10 md:flex-row">
            <div><Logo inverse /><p className="mt-4 max-w-xs text-sm leading-6 text-hero-muted">The modern money account made around student life.</p></div>
            <div className="grid grid-cols-2 gap-x-16 gap-y-3 text-sm text-hero-muted"><a href="#product">Product</a><a href="#benefits">Benefits</a><a href="#campus">Campus</a><a href="#security">Security</a><a href="mailto:hello@campuscoin.app">Help centre</a><a href="#top">Back to top</a></div>
          </div>
          <div className="flex flex-col justify-between gap-3 pt-7 text-xs text-hero-muted sm:flex-row"><p>© 2026 CampusCoin. All rights reserved.</p><p>Student money, made smarter.</p></div>
        </div>
      </footer>
    </main>
  );
}