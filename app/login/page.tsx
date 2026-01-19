'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image' // Added import
import { supabase } from '@/lib/supabaseClient'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [captcha, setCaptcha] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const CAPTCHA_CODE = 'BVJZR3'

  const handleLogin = async () => {
    setError('')

    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    if (captcha !== CAPTCHA_CODE) {
      setError('Invalid captcha')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    // ✅ Login success → redirect
    router.push('/dashboard')
  }

  return (
    <div style={styles.wrapper}>
      {/* BACKGROUND IMAGE - Using Next/Image for reliability */}
      <Image
        src="/login/bg.png"
        alt="Background"
        fill
        priority
        quality={100}
        style={{
          objectFit: 'cover',
          objectPosition: 'center 25%',
          zIndex: -1,
        }}
      />

      {/* LOGIN CARD */}
      <div style={styles.card}>
        <h2 style={styles.title}>Login</h2>

        <div style={styles.field}>
          <label>User ID</label>
          <input
            type="email"
            placeholder="Enter User ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div style={styles.field}>
          <label>Password</label>
          <div style={styles.passwordWrapper}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div style={styles.captchaRow}>
          <div style={styles.captchaBox}>{CAPTCHA_CODE}</div>
          <input
            placeholder="Enter Captcha"
            value={captcha}
            onChange={(e) => setCaptcha(e.target.value)}
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={styles.button}
          disabled={loading}
          onClick={handleLogin}
        >
          {loading ? 'Logging in...' : 'Submit'}
        </button>

        <p style={styles.forgot}>Forgot Password?</p>
      </div>
    </div>
  )
}

/* ================= STYLES ================= */

const styles: any = {
  wrapper: {
    height: '100vh',
    width: '100%',
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Inter, sans-serif',
  },

  bgImage: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover', // Prevents stretching
    objectPosition: 'center bottom', // Anchors image to bottom to keep design elements visible
    zIndex: -1,
  },

  card: {
    width: '420px',
    background: 'rgba(255, 255, 255, 0.25)', // Increased transparency
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    zIndex: 1,
  },

  title: {
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '28px',
    fontWeight: '700',
    color: '#333',
  },

  field: {
    marginBottom: '18px',
  },

  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },

  eyeButton: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#555',
    display: 'flex',
    alignItems: 'center',
  },

  captchaRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '15px',
  },

  captchaBox: {
    minWidth: '110px',
    height: '44px',
    background: 'rgba(255, 255, 255, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    letterSpacing: '2px',
    borderRadius: '6px',
  },

  button: {
    width: '100%',
    height: '46px',
    marginTop: '15px',
    background: '#e50914',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.3s',
  },

  error: {
    color: '#d32f2f',
    fontSize: '14px',
    marginBottom: '10px',
    textAlign: 'center',
    background: 'rgba(255,255,255,0.8)',
    padding: '4px',
    borderRadius: '4px'
  },

  forgot: {
    marginTop: '18px',
    textAlign: 'center',
    color: '#333',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
}

/* GLOBAL INPUT + LABEL STYLES */
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.innerHTML = `
    input {
      width: 100%;
      height: 44px;
      padding: 0 12px;
      border: 1px solid #ccc;
      border-radius: 6px;
      box-sizing: border-box;
      font-size: 14px;
    }
    label {
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: 500;
    }
    /* Hide native password reveal button in Edge/IE */
    input::-ms-reveal,
    input::-ms-clear {
      display: none;
    }
  `
  document.head.appendChild(style)
}