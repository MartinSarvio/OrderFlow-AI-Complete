import { useState } from 'react';
import { X, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import type { RestaurantConfig } from '@/types';

interface AuthModalProps {
  restaurant: RestaurantConfig | null;
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export function AuthModal({ restaurant, isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const { signIn, signUp } = useAuth();

  if (!restaurant) return null;
  const { branding } = restaurant;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const result = await signIn(email, password);
        if (result.error) {
          setError(result.error === 'Invalid login credentials' ? 'Forkert email eller adgangskode' : result.error);
        } else {
          onClose();
          resetForm();
        }
      } else {
        if (!name.trim()) { setError('Navn er påkrævet'); setLoading(false); return; }
        const result = await signUp(email, password, name, phone);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess('Konto oprettet! Tjek din email for bekræftelse.');
          setTimeout(() => { onClose(); resetForm(); }, 2000);
        }
      }
    } catch {
      setError('Der opstod en fejl. Prøv igen.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail(''); setPassword(''); setName(''); setPhone('');
    setError(''); setSuccess('');
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login');
    setError(''); setSuccess('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { onClose(); resetForm(); }}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden"
        style={{ backgroundColor: branding.colors.background }}
      >
        <DialogHeader className="p-5 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold" style={{ fontFamily: branding.fonts.heading }}>
              {mode === 'login' ? 'Log ind' : 'Opret konto'}
            </DialogTitle>
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: `${branding.colors.error}15`, color: branding.colors.error }}>
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: `${branding.colors.success}15`, color: branding.colors.success }}>
              {success}
            </div>
          )}

          {mode === 'signup' && (
            <>
              <div>
                <Label htmlFor="auth-name">Navn *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input id="auth-name" placeholder="Dit navn" value={name} onChange={e => setName(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <div>
                <Label htmlFor="auth-phone">Telefon</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input id="auth-phone" type="tel" placeholder="+45 12 34 56 78" value={phone} onChange={e => setPhone(e.target.value)} className="pl-10" />
                </div>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="auth-email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input id="auth-email" type="email" placeholder="din@email.dk" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" required />
            </div>
          </div>

          <div>
            <Label htmlFor="auth-password">Adgangskode *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mindst 6 tegn"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
                minLength={6}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-5 text-base font-semibold rounded-xl"
            style={{ backgroundColor: branding.colors.primary, color: '#fff' }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : mode === 'login' ? 'Log ind' : 'Opret konto'}
          </Button>

          <div className="text-center text-sm" style={{ color: branding.colors.textMuted }}>
            {mode === 'login' ? 'Har du ikke en konto? ' : 'Har du allerede en konto? '}
            <button type="button" onClick={switchMode} className="font-semibold hover:underline" style={{ color: branding.colors.primary }}>
              {mode === 'login' ? 'Opret konto' : 'Log ind'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
