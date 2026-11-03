import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { TextRoll } from '@/components/core/text-roll'
import { SpotlightCard } from '@/components/core/spotlight-card'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Leaf,
  ScanSearch,
  BarChart3,
  ShieldCheck,
  Check,
  KeyRound,
  Loader2,
  AlertCircle,
} from 'lucide-react'

const BRAND = {
  primary: '#123C2A',
  secondary: '#16834B',
  accent: '#34A853',
  bg: '#F5FAF3',
  text: '#17231C',
  muted: '#66736B',
}

const LogoMark = ({ className = 'h-11 w-11' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
    <circle cx="24" cy="24" r="22" fill={BRAND.primary} />
    <circle cx="24" cy="24" r="16" fill={BRAND.secondary} />
    <circle cx="24" cy="24" r="11" fill={BRAND.accent} />
    <path
      d="M24 14.5c-3.9 2.4-5.4 5.9-5.4 8.9 0 3.5 2.4 6.1 5.4 6.1s5.4-2.6 5.4-6.1c0-3-1.5-6.5-5.4-8.9z"
      fill="#fff"
    />
    <path d="M24 14.5v15" stroke={BRAND.secondary} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
)

const MicrosoftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 23 23" aria-hidden="true">
    <rect width="10" height="10" fill="#F25022" />
    <rect x="13" width="10" height="10" fill="#7FBA00" />
    <rect y="13" width="10" height="10" fill="#00A4EF" />
    <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
  </svg>
)

const SkylineScene = () => (
  <svg
    viewBox="0 0 640 320"
    preserveAspectRatio="xMidYMax slice"
    className="absolute inset-x-0 bottom-0 h-full w-full"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="sceneSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E9F5EC" />
        <stop offset="100%" stopColor="#D2EBD8" />
      </linearGradient>
    </defs>
    <rect width="640" height="320" fill="url(#sceneSky)" />
    <circle cx="500" cy="70" r="46" fill="#CDEBD2" opacity="0.9" />

    <g fill="#C3E0CA" opacity="0.75">
      <rect x="24" y="140" width="62" height="180" />
      <rect x="100" y="172" width="46" height="148" />
      <rect x="158" y="128" width="72" height="192" />
      <rect x="246" y="162" width="52" height="158" />
      <rect x="308" y="140" width="66" height="180" />
      <rect x="392" y="172" width="52" height="148" />
      <rect x="456" y="142" width="72" height="178" />
      <rect x="548" y="168" width="46" height="152" />
    </g>

    <g fill="#A9D3B5">
      <rect x="64" y="186" width="82" height="134" />
      <rect x="186" y="208" width="56" height="112" />
      <rect x="336" y="196" width="72" height="124" />
      <rect x="480" y="212" width="62" height="108" />
    </g>

    <g>
      <rect x="40" y="238" width="6" height="34" rx="3" fill="#8FBF9C" />
      <circle cx="43" cy="230" r="20" fill="#7FB98E" />
      <rect x="236" y="250" width="6" height="30" rx="3" fill="#8FBF9C" />
      <circle cx="239" cy="244" r="17" fill="#86BE97" />
      <rect x="560" y="246" width="6" height="32" rx="3" fill="#8FBF9C" />
      <circle cx="563" cy="238" r="19" fill="#7FB98E" />
      <rect x="404" y="252" width="5" height="28" rx="2.5" fill="#8FBF9C" />
      <circle cx="406.5" cy="247" r="15" fill="#86BE97" />
    </g>

    <path d="M0 298 Q160 282 320 292 T640 288 V320 H0 Z" fill="#BDE3C6" />
    <path d="M0 314 Q200 302 400 312 T640 306 V320 H0 Z" fill="#9CD6AC" />

    <path
      d="M262 320 C 266 296 292 288 320 292 C 348 296 376 292 380 320 Z"
      fill="#F3EFE0"
      opacity="0.9"
    />
  </svg>
)

const FloatingLeaf = ({ className = '', delay = 0 }) => (
  <motion.div
    className={`pointer-events-none absolute text-[#34A853]/50 ${className}`}
    animate={{ y: [0, -14, 0], x: [0, 7, 0], rotate: [0, 14, 0] }}
    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay }}
    aria-hidden="true"
  >
    <Leaf className="h-5 w-5" fill="currentColor" strokeWidth={0} />
  </motion.div>
)

const LensIllustration = () => (
  <div className="relative h-52 w-52 sm:h-60 sm:w-60">
    <div className="absolute inset-0 overflow-hidden rounded-full border-[10px] border-[#123C2A] bg-gradient-to-b from-[#EFF8F1] to-[#D3EBDA] shadow-[0_24px_50px_-12px_rgba(18,60,42,0.35)]">
      <div className="absolute inset-2 rounded-full bg-white/25" />
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <rect x="30" y="34" width="40" height="46" rx="8" fill="#ffffff" stroke="#34A853" strokeWidth="2.5" />
        <path d="M35 30l4.5 8h21l4.5-8z" fill="#34A853" />
        <rect x="45" y="18" width="10" height="9" rx="2" fill="#16834B" />
        <circle cx="50" cy="58" r="9" fill="none" stroke="#16834B" strokeWidth="2" opacity="0.7" />
      </svg>

      <div className="absolute left-[18%] top-[16%] h-6 w-6 rounded-tl-xl border-l-[3px] border-t-[3px] border-[#34A853]" />
      <div className="absolute right-[18%] top-[16%] h-6 w-6 rounded-tr-xl border-r-[3px] border-t-[3px] border-[#34A853]" />
      <div className="absolute bottom-[16%] left-[18%] h-6 w-6 rounded-bl-xl border-b-[3px] border-l-[3px] border-[#34A853]" />
      <div className="absolute bottom-[16%] right-[18%] h-6 w-6 rounded-br-xl border-b-[3px] border-r-[3px] border-[#34A853]" />

      <motion.div
        className="absolute inset-x-[14%] h-[3px] rounded-full bg-[#34A853]/80"
        animate={{ top: ['16%', '78%', '16%'] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>

    <div className="absolute -bottom-7 -right-9 h-6 w-24 rotate-[42deg] rounded-full bg-[#123C2A]" />

    <motion.div
      className="absolute -right-3 -top-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#34A853] text-white shadow-lg shadow-[#34A853]/40"
      animate={{ scale: [1, 1.08, 1] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      <Check className="h-5 w-5" strokeWidth={3} />
    </motion.div>

    <div className="absolute -left-12 bottom-8 flex items-center gap-1.5 rounded-full border border-[#DCE7DE] bg-white/85 px-3 py-1.5 text-xs font-medium text-[#123C2A] shadow-sm backdrop-blur-sm">
      <ScanSearch className="h-3.5 w-3.5 text-[#16834B]" />
      AI Scanning
    </div>
  </div>
)

const Feature = ({ icon: Icon, title, desc }) => (
  <div className="flex flex-1 flex-col items-center gap-2 text-center">
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E7F4EA] text-[#16834B]">
      <Icon className="h-5 w-5" strokeWidth={1.8} />
    </div>
    <div className="text-sm font-semibold text-[#17231C]">{title}</div>
    <div className="text-xs leading-snug text-[#66736B]">{desc}</div>
  </div>
)

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Please enter email and password.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onLogin(email.trim(), password, remember)
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-2xl border border-[#DCE7DE] bg-white py-3.5 pl-12 pr-4 text-sm text-[#17231C] placeholder:text-[#9FB3A4] outline-none transition-all duration-200 focus:border-[#16834B] focus:ring-4 focus:ring-[#16834B]/10'

  return (
    <div className="min-h-screen w-full overflow-hidden bg-[#F5FAF3]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* ---------- Left branding panel ---------- */}
        <motion.section
          variants={container}
          initial="hidden"
          animate="show"
          className="relative hidden flex-col justify-between overflow-hidden px-12 py-12 lg:flex"
        >
          <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[#CFE8D6]/70 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-[26rem] w-[26rem] translate-x-1/3 translate-y-1/3 rounded-full bg-[#16834B]/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 top-1/3 h-80 w-80 rounded-full bg-[#34A853]/10 blur-3xl" />

          <motion.div variants={item} className="relative z-10 flex items-center gap-3">
            <LogoMark className="h-12 w-12" />
            <div>
              <TextRoll
                className="text-xl font-bold tracking-tight text-[#123C2A]"
                duration={0.5}
                getEnterDelay={(i) => i * 0.04}
                variants={{
                  enter: {
                    initial: { rotateX: 0, filter: 'blur(0px)' },
                    animate: { rotateX: 90, filter: 'blur(2px)' },
                  },
                  exit: {
                    initial: { rotateX: 90, filter: 'blur(2px)' },
                    animate: { rotateX: 0, filter: 'blur(0px)' },
                  },
                }}
              >
                Swach Lens
              </TextRoll>
              <div className="text-xs font-medium text-[#5F7A6B]">See Cleanliness. Build Change.</div>
            </div>
          </motion.div>

          <motion.div variants={item} className="relative z-10 mt-12 max-w-lg">
            <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-[#123C2A] xl:text-5xl">
              <TextRoll
                className="text-[#123C2A]"
                duration={0.5}
                getEnterDelay={(i) => i * 0.04}
                variants={{
                  enter: {
                    initial: { rotateX: 0, filter: 'blur(0px)' },
                    animate: { rotateX: 90, filter: 'blur(2px)' },
                  },
                  exit: {
                    initial: { rotateX: 90, filter: 'blur(2px)' },
                    animate: { rotateX: 0, filter: 'blur(0px)' },
                  },
                }}
              >
                {'AI-Powered Cleanliness\u00A0'}
              </TextRoll>
              <TextRoll
                className="text-[#16834B]"
                duration={0.5}
                getEnterDelay={(i) => i * 0.04 + 0.5}
                variants={{
                  enter: {
                    initial: { rotateX: 0, filter: 'blur(0px)' },
                    animate: { rotateX: 90, filter: 'blur(2px)' },
                  },
                  exit: {
                    initial: { rotateX: 90, filter: 'blur(2px)' },
                    animate: { rotateX: 0, filter: 'blur(0px)' },
                  },
                }}
              >
                Monitoring System
              </TextRoll>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[#5F7A6B]">
              Smart vision. Real-time insights. Cleaner environment for a better tomorrow.
            </p>
          </motion.div>

          <div className="relative z-10 mt-8 flex min-h-[320px] flex-1 items-end justify-center overflow-visible">
            <SkylineScene />
            <FloatingLeaf className="left-[8%] top-[16%] h-6 w-6" delay={0} />
            <FloatingLeaf className="right-[12%] top-[26%] h-4 w-4" delay={1.4} />
            <FloatingLeaf className="left-[16%] bottom-[34%] h-4 w-4" delay={2.6} />
            <div className="relative z-10 mb-10">
              <LensIllustration />
            </div>
          </div>

          <motion.div
            variants={item}
            className="relative z-10 mt-10"
          >
            <SpotlightCard
              spotlightClassName="from-emerald-400/50 via-teal-300/40 to-emerald-200/30 blur-2xl"
              spotlightSize={220}
            >
              <div className="flex items-center justify-between gap-4 rounded-2xl px-6 py-5">
                <Feature icon={ScanSearch} title="Detect" desc="Identify cleanliness issues" />
                <div className="h-12 w-px bg-[#DCE7DE]" />
                <Feature icon={BarChart3} title="Analyze" desc="AI-driven insights & analytics" />
                <div className="h-12 w-px bg-[#DCE7DE]" />
                <Feature icon={ShieldCheck} title="Improve" desc="Take action & create impact" />
              </div>
            </SpotlightCard>
          </motion.div>
        </motion.section>

        {/* ---------- Right login card ---------- */}
        <motion.section
          variants={container}
          initial="hidden"
          animate="show"
          className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-10"
        >
          <div className="pointer-events-none absolute -left-28 top-16 hidden h-80 w-80 rounded-full bg-[#CFE8D6]/60 blur-3xl lg:block" />
          <div className="pointer-events-none absolute -right-24 bottom-10 hidden h-80 w-80 rounded-full bg-[#16834B]/10 blur-3xl lg:block" />

          <div className="relative z-10 w-full max-w-[520px]">
            <motion.div variants={item} className="mb-8 flex flex-col items-center gap-2 lg:hidden">
              <LogoMark className="h-12 w-12" />
              <TextRoll
                className="text-lg font-bold tracking-tight text-[#123C2A]"
                duration={0.5}
                getEnterDelay={(i) => i * 0.04}
                variants={{
                  enter: {
                    initial: { rotateX: 0, filter: 'blur(0px)' },
                    animate: { rotateX: 90, filter: 'blur(2px)' },
                  },
                  exit: {
                    initial: { rotateX: 90, filter: 'blur(2px)' },
                    animate: { rotateX: 0, filter: 'blur(0px)' },
                  },
                }}
              >
                Swach Lens
              </TextRoll>
            </motion.div>

            <motion.div
              variants={item}
              className="rounded-[28px] border border-[#E4EEE6] bg-white p-8 shadow-[0_24px_60px_-16px_rgba(18,60,42,0.22)] sm:p-10"
            >
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F4EA] px-3 py-1 text-xs font-semibold text-[#16834B]">
                <Leaf className="h-3.5 w-3.5" strokeWidth={2.2} />
                Welcome Back!
              </div>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#17231C]">
                Login to your account
              </h2>
              <p className="mt-2 text-sm text-[#66736B]">Enter your credentials to continue</p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
                <div>
                  <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-[#33423A]">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9FB3A4]" />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="username"
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-[#33423A]">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9FB3A4]" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={loading}
                      className={`${inputClass} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9FB3A4] transition-colors hover:text-[#16834B]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex cursor-pointer select-none items-center gap-2 text-[#33423A]">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#16834B]"
                    />
                    Remember me
                  </label>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="font-medium text-[#16834B] transition-colors hover:text-[#123C2A]"
                  >
                    Forgot Password?
                  </a>
                </div>

                {error && (
                  <div
                    className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    role="alert"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#123C2A] to-[#16834B] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#16834B]/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#16834B]/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#16834B]/25 disabled:pointer-events-none disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Login'}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              </form>

              <div className="my-7 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-[#9FB3A4]">
                <div className="h-px flex-1 bg-[#E4EEE6]" />
                or continue with
                <div className="h-px flex-1 bg-[#E4EEE6]" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#DCE7DE] bg-white py-2.5 text-sm font-medium text-[#33423A] transition-all duration-200 hover:border-[#16834B]/40 hover:bg-[#F5FAF3]"
                >
                  <GoogleIcon />
                  Google
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#DCE7DE] bg-white py-2.5 text-sm font-medium text-[#33423A] transition-all duration-200 hover:border-[#16834B]/40 hover:bg-[#F5FAF3]"
                >
                  <MicrosoftIcon />
                  Microsoft
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#DCE7DE] bg-white py-2.5 text-sm font-medium text-[#33423A] transition-all duration-200 hover:border-[#16834B]/40 hover:bg-[#F5FAF3]"
                >
                  <KeyRound className="h-4 w-4 text-[#16834B]" />
                  SSO
                </button>
              </div>
            </motion.div>

            <motion.p
              variants={item}
              className="mt-8 text-center text-sm text-[#66736B]"
            >
              New to Swach Lens?{' '}
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="font-semibold text-[#16834B] transition-colors hover:text-[#123C2A]"
              >
                Sign up
              </a>
            </motion.p>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
