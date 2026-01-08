'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      {/* LEFT PANEL */}
      <div style={styles.left}>
        <img src="/login/bg.jpg" alt="Insurance CRM" style={styles.bgImage} />

        <div style={styles.redDiagonal} />
        <div style={styles.blueDiagonal} />

        <div style={styles.leftContent}>
          <h1>Insurance CRM</h1>
          <p>Secure access to insurance operations</p>
        </div>

        <div style={styles.badge}>
          100% Satisfaction <br /> Guarantee
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={styles.right}>
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
            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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
    </div>
  )
}

/* ================= STYLES ================= */

const styles: any = {
  wrapper: {
    display: 'flex',
    height: '100vh',
    width: '100%',
    fontFamily: 'Inter, sans-serif',
  },

  left: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    color: '#fff',
  },

  bgImage: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 0,
  },

  redDiagonal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '60%',
    height: '45%',
    background: '#c4161c',
    clipPath: 'polygon(0 30%, 100% 0, 0 100%)',
    zIndex: 1,
  },

  blueDiagonal: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '65%',
    height: '55%',
    background: '#0b1f33',
    clipPath: 'polygon(100% 20%, 100% 100%, 0 100%)',
    zIndex: 1,
  },

  leftContent: {
    position: 'relative',
    zIndex: 2,
    padding: '80px',
    maxWidth: '420px',
  },

  badge: {
    position: 'absolute',
    bottom: '40px',
    left: '80px',
    zIndex: 2,
    fontSize: '22px',
    fontWeight: 600,
  },

  right: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    width: '420px',
    background: '#fff',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 20px 45px rgba(0,0,0,0.12)',
  },

  title: {
    textAlign: 'center',
    marginBottom: '30px',
  },

  field: {
    marginBottom: '18px',
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
    background: '#f1f1f1',
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
    cursor: 'pointer',
  },

  error: {
    color: '#d32f2f',
    fontSize: '14px',
    marginBottom: '10px',
  },

  forgot: {
    marginTop: '18px',
    textAlign: 'center',
    color: '#777',
    cursor: 'pointer',
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
  `
  document.head.appendChild(style)
}
