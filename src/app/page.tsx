"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useInView,
  type Variants,
} from "framer-motion";
import Image from "next/image";
import {
  ArrowRight,
  Zap,
  Users,
  Kanban,
  Search,
  Command,
  GripVertical,
  Circle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  GitBranch,
  BarChart3,
  Shield,
  Globe,
  Bell,
  MoreHorizontal,
  Plus,
  Star,
  TrendingUp,
  Layers,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Animation variants
// ─────────────────────────────────────────────────────────────────────────────
const EASE = "easeOut" as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

// ─────────────────────────────────────────────────────────────────────────────
// ScrollReveal wrapper
// ─────────────────────────────────────────────────────────────────────────────
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.55, ease: "easeOut", delay: delay * 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shimmer Button
// ─────────────────────────────────────────────────────────────────────────────
function ShimmerButton({
  children,
  className,
  onClick,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
}) {
  const inner = (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-2 overflow-hidden rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg",
        "bg-indigo-600",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        className
      )}
    >
      {children}
    </motion.button>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

// ─────────────────────────────────────────────────────────────────────────────
// Navbar
// ─────────────────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/70 shadow-sm backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="Project sphere" width={132} height={32} className="h-8 w-32" />
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-7 md:flex">
          {["Product", "Pricing", "Docs", "Blog"].map((item) => (
            <Link
              key={item}
              href="#"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {item}
            </Link>
          ))}
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 md:block"
          >
            Sign in
          </Link>
          <ShimmerButton href="/register" className="h-9 px-5 text-xs">
            Get started free
          </ShimmerButton>
        </div>
      </div>
    </motion.header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3D Tilt Dashboard Mockup
// ─────────────────────────────────────────────────────────────────────────────
function DashboardMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), {
    stiffness: 120,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), {
    stiffness: 120,
    damping: 20,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="perspective-1200 w-full max-w-4xl mx-auto"
      style={{ perspective: "1200px" }}
    >
      <motion.div
        style={isMobile ? {} : { rotateX, rotateY }}
        className="relative w-full rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-indigo-200/40 overflow-hidden"
      >
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-green-400" />
          <div className="mx-auto flex h-6 w-48 items-center justify-center rounded-md bg-white border border-slate-200 text-[11px] text-slate-400 font-mono">
            app.projectsphere.io/board
          </div>
        </div>

        {/* App UI */}
        <div className="flex h-[360px] md:h-[420px]">
          {/* Sidebar */}
          <div className="hidden w-48 shrink-0 border-r border-slate-100 bg-slate-50 p-3 md:block">
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2">
              <Image src="/logo.svg" alt="Project sphere" width={120} height={20} className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold text-white">Project sphere</span>
            </div>
            {["Dashboard", "My Tasks", "Projects", "Team", "Analytics"].map((item, i) => (
              <div
                key={item}
                className={cn(
                  "mb-0.5 flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium",
                  i === 1
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:bg-slate-100"
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                {item}
              </div>
            ))}
          </div>

          {/* Kanban columns */}
          <div className="flex flex-1 gap-3 overflow-hidden p-4">
            {[
              {
                label: "To Do",
                color: "bg-slate-400",
                tasks: [
                  { title: "Design system audit", tag: "Design", priority: "high" },
                  { title: "API rate limiting", tag: "Backend", priority: "medium" },
                ],
              },
              {
                label: "In Progress",
                color: "bg-indigo-500",
                tasks: [
                  { title: "Sprint planning board", tag: "Product", priority: "urgent", active: true },
                  { title: "Onboarding flow v2", tag: "UX", priority: "high" },
                ],
              },
              {
                label: "In Review",
                color: "bg-amber-400",
                tasks: [
                  { title: "Notification center", tag: "Frontend", priority: "medium" },
                ],
              },
              {
                label: "Done",
                color: "bg-emerald-500",
                tasks: [
                  { title: "Auth with Cognito", tag: "Backend", priority: "low" },
                  { title: "S3 file upload", tag: "Backend", priority: "medium" },
                ],
              },
            ].map((col) => (
              <div key={col.label} className="flex w-36 shrink-0 flex-col gap-2 md:w-44">
                <div className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full", col.color)} />
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    {col.label}
                  </span>
                  <span className="ml-auto text-[10px] text-slate-400">{col.tasks.length}</span>
                </div>
                {col.tasks.map((task, ti) => (
                  <motion.div
                    key={task.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + ti * 0.08 }}
                    className={cn(
                      "rounded-lg border p-2.5 text-left text-[11px] shadow-sm",
                      task.active
                        ? "border-indigo-200 bg-indigo-50 ring-1 ring-indigo-300"
                        : "border-slate-100 bg-white"
                    )}
                  >
                    <p className="font-medium leading-snug text-slate-800">{task.title}</p>
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
                        {task.tag}
                      </span>
                      <span
                        className={cn(
                          "ml-auto rounded px-1.5 py-0.5 text-[9px] font-medium",
                          task.priority === "urgent" && "bg-red-100 text-red-600",
                          task.priority === "high" && "bg-orange-100 text-orange-600",
                          task.priority === "medium" && "bg-blue-100 text-blue-600",
                          task.priority === "low" && "bg-slate-100 text-slate-500"
                        )}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </motion.div>
                ))}
                <button className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] text-slate-400 hover:bg-slate-50">
                  <Plus className="h-3 w-3" />
                  Add task
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Subtle glow overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-slate-200/60" />
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Logo cloud (infinite scroll)
// ─────────────────────────────────────────────────────────────────────────────
const LOGOS = [
  "Stripe", "Notion", "Figma", "Vercel", "Linear", "Loom",
  "Intercom", "Webflow", "Retool", "Supabase",
];

function LogoCloud() {
  const logos = [...LOGOS, ...LOGOS]; // duplicate for seamless loop
  return (
    <div className="relative overflow-hidden py-12">
      <div className="absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-slate-50 to-transparent" />
      <div className="absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-slate-50 to-transparent" />
      <motion.div
        className="flex gap-12"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
        style={{ width: "max-content" }}
      >
        {logos.map((name, i) => (
          <div
            key={`${name}-${i}`}
            className="flex shrink-0 items-center gap-2 text-slate-400 grayscale"
          >
            <div className="h-6 w-6 rounded bg-slate-300" />
            <span className="text-sm font-semibold tracking-tight">{name}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bento Feature Grid
// ─────────────────────────────────────────────────────────────────────────────

// Draggable task card visual
function DragTaskCard() {
  const [dragged, setDragged] = useState(false);
  return (
    <div className="relative h-full flex flex-col justify-between p-6">
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
          <Kanban className="h-3 w-3" /> Drag &amp; Drop
        </span>
        <h3 className="mt-3 text-lg font-bold leading-snug text-slate-900">
          Kanban that moves at the speed of thought.
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Drag tasks across any column. Updates sync instantly to your whole team.
        </p>
      </div>
      {/* Fake drag animation */}
      <div className="relative flex gap-3">
        {["To Do", "In Progress", "Done"].map((col, ci) => (
          <div key={col} className="flex-1 rounded-lg border border-slate-200 bg-slate-50/80 p-2">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{col}</p>
            {ci === 0 && (
              <div className="rounded-md border border-slate-200 bg-white p-2 shadow-sm text-[11px] text-slate-700 font-medium">
                Write copy
              </div>
            )}
            {ci === 1 && (
              <>
                <div className="rounded-md border border-indigo-200 bg-indigo-50 p-2 shadow-sm text-[11px] text-indigo-800 font-medium ring-1 ring-indigo-300">
                  Redesign nav
                </div>
                <motion.div
                  animate={dragged ? { x: 48, y: -36, rotate: 4, scale: 1.04 } : { x: 0, y: 0, rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  onHoverStart={() => setDragged(true)}
                  onHoverEnd={() => setDragged(false)}
                  className="mt-1 cursor-grab rounded-md border border-slate-200 bg-white p-2 shadow-md text-[11px] text-slate-700 font-medium active:cursor-grabbing"
                >
                  <span className="flex items-center gap-1">
                    <GripVertical className="h-3 w-3 text-slate-300" />
                    API integration
                  </span>
                </motion.div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Real-time presence visual
function PresenceCard() {
  const avatars = [
    { name: "Alex", color: "bg-violet-400", typing: true },
    { name: "Sam", color: "bg-sky-400", typing: false },
    { name: "Jordan", color: "bg-emerald-400", typing: false },
  ];
  const [count, setCount] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCount((c) => c + 1), 1200);
    return () => clearInterval(t);
  }, []);
  const dots = count % 4;

  return (
    <div className="flex h-full flex-col justify-between p-6">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          <Circle className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500" /> Live Collaboration
        </span>
        <h3 className="mt-3 text-lg font-bold leading-snug text-slate-900">
          See your team in real-time.
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Live cursors, presence indicators, and typing signals keep everyone aligned.
        </p>
      </div>
      <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
        {avatars.map((av) => (
          <div key={av.name} className="flex items-center gap-2.5">
            <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white", av.color)}>
              {av.name[0]}
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-700">{av.name}</p>
            </div>
            {av.typing && (
              <div className="flex items-center gap-0.5 rounded-full bg-slate-200 px-2 py-1">
                {[0, 1, 2].map((d) => (
                  <motion.span
                    key={d}
                    className="h-1 w-1 rounded-full bg-slate-500"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.2 }}
                  />
                ))}
              </div>
            )}
            {!av.typing && (
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Command K visual
function CommandKCard() {
  const suggestions = ["Create new sprint", "Assign to Alex", "Move to Done", "Set due date →"];
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(true);

  return (
    <div className="flex h-full flex-col justify-between p-6">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
          <Command className="h-3 w-3" /> Command Palette
        </span>
        <h3 className="mt-3 text-lg font-bold leading-snug text-slate-900">
          Your keyboard is a superpower.
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Hit ⌘K and do anything — navigate, create, assign — without leaving the keyboard.
        </p>
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
          <Search className="h-4 w-4 text-slate-400" />
          <span className="flex-1 text-sm text-slate-400">Search or run a command...</span>
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">⌘K</kbd>
        </div>
        <div className="p-1">
          {suggestions.map((s, i) => (
            <div
              key={s}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                i === 0 ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-slate-50"
              )}
            >
              <ChevronRight className={cn("h-3.5 w-3.5", i === 0 ? "text-indigo-200" : "text-slate-400")} />
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Analytics mini card
function AnalyticsCard() {
  const bars = [40, 65, 48, 80, 55, 92, 70];
  return (
    <div className="flex h-full flex-col justify-between p-6">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
          <TrendingUp className="h-3 w-3" /> Analytics
        </span>
        <h3 className="mt-3 text-base font-bold leading-snug text-slate-900">
          Velocity reports, at a glance.
        </h3>
      </div>
      <div className="flex items-end gap-1 pt-4">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t bg-indigo-500"
            initial={{ height: 0 }}
            whileInView={{ height: `${h}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.06, ease: "easeOut" }}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
        <span className="font-semibold text-emerald-600">+24%</span> velocity this sprint
      </div>
    </div>
  );
}

// Notifications mini card
function NotifCard() {
  const notifs = [
    { text: "Alex commented on Sprint #7", time: "2m ago", unread: true },
    { text: "New task assigned: API docs", time: "14m ago", unread: true },
    { text: "Sam moved card to Done", time: "1h ago", unread: false },
  ];
  return (
    <div className="flex h-full flex-col p-6">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 self-start">
        <Bell className="h-3 w-3" /> Smart Notifications
      </span>
      <h3 className="mt-3 text-base font-bold leading-snug text-slate-900">
        Never miss what matters.
      </h3>
      <div className="mt-4 flex flex-col gap-2">
        {notifs.map((n, i) => (
          <div key={i} className={cn("flex items-start gap-2.5 rounded-lg p-2", n.unread ? "bg-indigo-50" : "bg-transparent")}>
            {n.unread && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />}
            {!n.unread && <span className="mt-1.5 h-1.5 w-1.5 shrink-0" />}
            <div>
              <p className="text-[11px] leading-snug text-slate-700 font-medium">{n.text}</p>
              <p className="text-[10px] text-slate-400">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BentoGrid() {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Drag card — large */}
      <Reveal className="lg:col-span-2 lg:row-span-1 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[300px]">
        <DragTaskCard />
      </Reveal>

      {/* Analytics — small */}
      <Reveal delay={1} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[300px]">
        <AnalyticsCard />
      </Reveal>

      {/* Presence — medium */}
      <Reveal delay={2} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[280px]">
        <PresenceCard />
      </Reveal>

      {/* Command K — large */}
      <Reveal delay={3} className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[280px]">
        <CommandKCard />
      </Reveal>

      {/* Notif — span full on mobile, 1 col on lg */}
      <Reveal delay={4} className="sm:col-span-2 lg:col-span-1 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[260px]">
        <NotifCard />
      </Reveal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats row
// ─────────────────────────────────────────────────────────────────────────────
function StatsRow() {
  const stats = [
    { value: "40k+", label: "Teams worldwide" },
    { value: "2M+", label: "Tasks completed" },
    { value: "99.98%", label: "Uptime SLA" },
    { value: "4.9★", label: "Average rating" },
  ];
  return (
    <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4">
      {stats.map((s, i) => (
        <Reveal key={s.label} delay={i} className="text-center">
          <p className="text-3xl font-bold tracking-tighter text-slate-900">{s.value}</p>
          <p className="mt-1 text-sm text-slate-500">{s.label}</p>
        </Reveal>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CTA Section
// ─────────────────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="relative overflow-hidden py-32">
      {/* Radial gradient bg */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(99,102,241,0.12) 0%, transparent 70%)",
        }}
      />
      <div className="absolute inset-0 -z-10 bg-slate-50" />

      <Reveal className="mx-auto max-w-2xl px-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          <Sparkles className="h-3 w-3" />
          Free to start — no credit card required
        </span>
        <h2 className="mt-6 text-4xl font-extrabold tracking-tighter text-slate-900 sm:text-5xl">
          Your next sprint starts here.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-slate-500">
          Join 40,000+ teams who ship faster, communicate clearer, and actually enjoy their workflow.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <ShimmerButton href="/register" className="h-12 px-8 text-sm">
            Start for free
            <ArrowRight className="h-4 w-4" />
          </ShimmerButton>
          <motion.a
            href="#"
            whileTap={{ scale: 0.97 }}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-8 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            View demo
          </motion.a>
        </div>
        <p className="mt-6 text-xs text-slate-400">
          SOC 2 Type II · GDPR Compliant · 99.98% Uptime
        </p>
      </Reveal>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────────────────────
function Footer() {
  const links = {
    Product: ["Features", "Pricing", "Roadmap", "Changelog"],
    Company: ["About", "Blog", "Careers", "Press"],
    Resources: ["Docs", "API", "Community", "Status"],
    Legal: ["Privacy", "Terms", "Security", "Cookies"],
  };
  return (
    <footer className="border-t border-slate-100 bg-white py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-12 md:flex-row">
          <div className="shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <Layers className="h-4 w-4 text-white" />
              </div>
              <span className="text-[15px] font-bold tracking-tight text-slate-900">Project sphere</span>
            </div>
            <p className="mt-3 max-w-[200px] text-sm text-slate-400 leading-relaxed">
              Project management for teams that move fast and ship great work.
            </p>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-8 md:grid-cols-4">
            {Object.entries(links).map(([cat, items]) => (
              <div key={cat}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {cat}
                </p>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item}>
                      <Link href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 text-xs text-slate-400 md:flex-row">
          <p>© {new Date().getFullYear()} Project sphere, Inc. All rights reserved.</p>
          <p>Built with ♥ for teams that care about craft.</p>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero headline word reveal
// ─────────────────────────────────────────────────────────────────────────────
function SplitHeadline({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <h1 className="text-5xl font-extrabold tracking-tighter text-slate-900 sm:text-6xl md:text-7xl">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.07 }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </h1>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .before\\:animate-shimmer::before {
          animation: shimmer 2.4s infinite;
        }
      `}</style>

      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        {/* Background decoration */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(99,102,241,0.15) 0%, transparent 70%)",
          }}
        />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent -z-10" />

        <div className="mx-auto max-w-7xl px-6">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex justify-center mb-6"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              New: Sprints 2.0 is here
              <ChevronRight className="h-3.5 w-3.5 text-indigo-400" />
            </span>
          </motion.div>

          {/* Headline */}
          <div className="mx-auto max-w-4xl text-center">
            <SplitHeadline text="Velocity for Visionaries." />

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mt-6 max-w-xl text-lg text-slate-500 leading-relaxed"
            >
              Project sphere gives high-performing teams one beautiful place to plan, build,
              and ship — with Kanban boards, sprint tracking, and real-time collaboration built in.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-9 flex flex-wrap items-center justify-center gap-4"
            >
              <ShimmerButton href="/register" className="h-12 px-8 text-sm">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </ShimmerButton>
              <motion.a
                href="#features"
                whileTap={{ scale: 0.97 }}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-8 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
              >
                See how it works
              </motion.a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-4 text-xs text-slate-400"
            >
              Free forever for small teams · No credit card required
            </motion.p>
          </div>

          {/* 3D Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y border-slate-100 bg-slate-50 py-4">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
          Trusted by teams at
        </p>
        <LogoCloud />
      </section>

      {/* Stats */}
      <section className="bg-white py-20">
        <StatsRow />
      </section>

      {/* Bento features */}
      <section id="features" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mx-auto max-w-2xl text-center mb-14">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Everything you need
            </p>
            <h2 className="text-4xl font-extrabold tracking-tighter text-slate-900 sm:text-5xl">
              Built for the way teams actually work.
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              No bloat. No learning curve. Just the features that move the needle.
            </p>
          </Reveal>

          <BentoGrid />
        </div>
      </section>

      {/* CTA */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
