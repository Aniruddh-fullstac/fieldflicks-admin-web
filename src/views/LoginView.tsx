import { useState } from 'react';
import { ShieldAlert, ArrowRight, Loader, Smartphone, ShieldCheck } from 'lucide-react';
import { AdminApi } from '../services/api';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView = ({ onLoginSuccess }: LoginViewProps) => {
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Send OTP via backend
      await AdminApi.sendOtp(mobile);
      setStep('OTP');
    } catch (err: any) {
      console.error('Failed to send OTP:', err);
      setError(err.response?.data?.message || 'Failed to send OTP. Ensure number is authorized.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError('Please enter a valid OTP.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await AdminApi.verifyOtp(mobile, otp);
      if (res.token) {
        localStorage.setItem('fieldflix_admin_token', res.token);
        onLoginSuccess();
      } else {
        throw new Error('No token received');
      }
    } catch (err: any) {
      console.error('Failed to verify OTP:', err);
      setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-main)',
      padding: 24,
    }}>
      <div className="glass-card" style={{
        maxWidth: 400,
        width: '100%',
        padding: '40px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, rgba(0,230,118,0.15) 0%, rgba(0,0,0,0) 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -100,
          left: -100,
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, rgba(0,229,255,0.1) 0%, rgba(0,0,0,0) 70%)',
          borderRadius: '50%',
        }} />

        <div style={{
          background: 'rgba(0,230,118,0.1)',
          padding: 16,
          borderRadius: 20,
          marginBottom: 24,
          border: '1px solid rgba(0,230,118,0.2)',
          zIndex: 1,
        }}>
          <ShieldAlert size={36} color="var(--primary-neon)" />
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFF', marginBottom: 8, zIndex: 1 }}>
          FieldFlicks Admin
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 32, zIndex: 1, lineHeight: 1.5 }}>
          Authorized access only. Enter your registered master admin credentials to proceed.
        </p>

        {error && (
          <div style={{
            width: '100%',
            padding: 12,
            background: 'rgba(255, 61, 87, 0.1)',
            border: '1px solid var(--accent-crimson)',
            borderRadius: 8,
            color: 'var(--accent-crimson)',
            fontSize: '0.8rem',
            marginBottom: 24,
            textAlign: 'left',
            zIndex: 1,
          }}>
            {error}
          </div>
        )}

        {step === 'PHONE' ? (
          <form onSubmit={handleSendOtp} style={{ width: '100%', zIndex: 1 }}>
            <div style={{ marginBottom: 20, textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Registered Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }}>
                  <Smartphone size={18} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. 9321538768"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 12,
                    padding: '12px 16px 12px 42px',
                    color: '#FFF',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading || mobile.length < 10}
              className="btn-primary"
              style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '14px', borderRadius: 12, fontSize: '0.95rem' }}
            >
              {loading ? <Loader className="spin" size={18} /> : (
                <>
                  Send Authorization Code <ArrowRight size={18} style={{ marginLeft: 8 }} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ width: '100%', zIndex: 1 }}>
            <div style={{ marginBottom: 20, textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Enter OTP Code
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }}>
                  <ShieldCheck size={18} />
                </div>
                <input
                  type="text"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 12,
                    padding: '12px 16px 12px 42px',
                    color: '#FFF',
                    fontSize: '1.2rem',
                    letterSpacing: 2,
                    outline: 'none',
                    textAlign: 'center',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <span 
                  onClick={() => setStep('PHONE')} 
                  style={{ fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Change number
                </span>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="btn-primary"
              style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '14px', borderRadius: 12, fontSize: '0.95rem' }}
            >
              {loading ? <Loader className="spin" size={18} /> : 'Verify & Access Dashboard'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
