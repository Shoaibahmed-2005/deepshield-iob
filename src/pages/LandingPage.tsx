import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Camera,
  CircleCheckBig,
  Radar,
  ScanFace,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeepShieldLogo, IOBLogo } from '@/components/branding/BrandLogos'
import { fadeInUp, hoverLift, staggerContainer } from '@/lib/motion'

const trustCards = [
  {
    title: 'AI Deepfake Detection',
    description: 'Advanced biometric checks identify synthetic and replayed identity attempts in real time.',
    icon: ShieldAlert,
  },
  {
    title: 'Real-time Face Authentication',
    description: 'Continuous on-device face analysis verifies that the person in front of the camera is live.',
    icon: ScanFace,
  },
  {
    title: 'Secure Banking Verification',
    description: 'Built for high-trust banking access with frictionless guidance for everyday customers.',
    icon: ShieldCheck,
  },
  {
    title: 'Anti-Spoofing Protection',
    description: 'Movement, depth, and temporal consistency checks block sophisticated spoofing attacks.',
    icon: Radar,
  },
]

const howItWorks = [
  { title: 'Scan Face', detail: 'Start camera capture in a secure guided frame.', icon: Camera },
  { title: 'Verify Movement', detail: 'Follow short live prompts for natural head movement.', icon: Sparkles },
  { title: 'AI Security Analysis', detail: 'DeepShield validates stability, timing, and depth consistency.', icon: ShieldAlert },
  { title: 'Secure Access Granted', detail: 'Trusted sessions proceed instantly to banking services.', icon: CircleCheckBig },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      <header className="border-b border-[#d8e4fb] bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="text-sm font-medium text-[#6481b2]">Enterprise biometric security platform</div>
          <IOBLogo />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d3e0fb] bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#2f5ea9]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Banking-grade identity trust
            </div>
            <DeepShieldLogo className="mb-7" />
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-[#0e3b88] md:text-5xl">
              Secure every banking login with effortless live identity verification.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#5e759f] md:text-lg">
              DeepShield combines guided facial authentication, anti-spoofing intelligence, and customer-friendly UX for modern digital banking access.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="brand" size="lg" onClick={() => navigate('/enroll')}>
                Start Secure Authentication
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/hacker')}>
                View Security Demo
              </Button>
            </div>
          </motion.div>

          <motion.div
            className="soft-glass relative overflow-hidden p-6"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(15,62,146,0.20),transparent_40%)]" />
            <div className="relative grid gap-4 sm:grid-cols-2">
              {[
                { label: 'Session Guidance', value: '10-15s', hint: 'Human-friendly instructions' },
                { label: 'Verification Layers', value: '6', hint: 'Depth, timing, motion, artifacts' },
                { label: 'Signal Confidence', value: '98%', hint: 'Stable live-capture quality' },
                { label: 'Fraud Response', value: '<1s', hint: 'Real-time risk flagging' },
              ].map((item) => (
                <motion.div key={item.label} className="premium-card p-4" {...hoverLift}>
                  <p className="text-xs uppercase tracking-[0.12em] text-[#6a83ae]">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-[#0d3f92]">{item.value}</p>
                  <p className="mt-1 text-sm text-[#6781ad]">{item.hint}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <motion.section className="mt-18" variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <motion.div variants={fadeInUp}>
            <h2 className="section-title">Trusted Security Stack</h2>
            <p className="section-subtitle mt-2 max-w-2xl">
              Designed for non-technical users while preserving enterprise-level identity assurance.
            </p>
          </motion.div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {trustCards.map((feature) => (
              <motion.div key={feature.title} className="premium-card p-5" variants={fadeInUp} {...hoverLift}>
                <feature.icon className="h-5 w-5 text-[#0f3e92]" />
                <h3 className="mt-4 text-base font-semibold text-[#153f89]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#607aa5]">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section className="mt-18 rounded-3xl border border-[#d6e2fb] bg-white/80 p-6 md:p-8" {...fadeInUp}>
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle mt-2">Simple guided flow built for secure banking login.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {howItWorks.map((step, index) => (
              <motion.div key={step.title} className="premium-card p-5" {...hoverLift}>
                <div className="mb-4 flex items-center justify-between">
                  <step.icon className="h-5 w-5 text-[#154596]" />
                  <span className="rounded-full bg-[#e8efff] px-2.5 py-1 text-xs font-semibold text-[#234d99]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#264f98]">{step.title}</h3>
                <p className="mt-2 text-sm text-[#5f79a4]">{step.detail}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </main>

      <footer className="border-t border-[#d8e4fb] bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-[#647ea8] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>DeepShield by Indian Overseas Bank</span>
          <span>Secure Authentication Platform • Production-grade UX</span>
        </div>
      </footer>
    </div>
  )
}
