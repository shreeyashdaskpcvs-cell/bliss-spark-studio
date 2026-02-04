import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Mail, ArrowRight, Loader2, CheckCircle2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type AuthStep = 'email' | 'otp' | 'success';

export default function Auth() {
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, signInWithOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    const { error } = await signInWithOtp(email);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setStep('otp');
    toast({
      title: 'Check your email',
      description: 'We sent you a 6-digit verification code.',
    });
  };

  const handleOtpComplete = async (value: string) => {
    setOtp(value);
    if (value.length !== 6) return;

    setIsLoading(true);
    const { error } = await verifyOtp(email, value);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Invalid code',
        description: 'Please check your code and try again.',
        variant: 'destructive',
      });
      setOtp('');
      return;
    }

    setStep('success');
    setTimeout(() => navigate('/'), 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 safe-top safe-bottom">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <MapPin className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">GeoSnap</h1>
          <p className="text-sm text-muted-foreground">Location-verified photos</p>
        </div>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-sm glass-card p-8 animate-scale-in">
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Welcome back</h2>
              <p className="text-muted-foreground mt-1">Enter your email to get started</p>
            </div>

            <div className="space-y-4">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                required
              />
              <Button 
                type="submit" 
                className="w-full h-12 bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              We'll send you a verification code to confirm your identity
            </p>
          </form>
        )}

        {step === 'otp' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Verify your email</h2>
              <p className="text-muted-foreground mt-1">
                Enter the code sent to<br />
                <span className="text-foreground font-medium">{email}</span>
              </p>
            </div>

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={handleOtpComplete}
                disabled={isLoading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-12 h-14 text-lg bg-secondary border-border" />
                  <InputOTPSlot index={1} className="w-12 h-14 text-lg bg-secondary border-border" />
                  <InputOTPSlot index={2} className="w-12 h-14 text-lg bg-secondary border-border" />
                  <InputOTPSlot index={3} className="w-12 h-14 text-lg bg-secondary border-border" />
                  <InputOTPSlot index={4} className="w-12 h-14 text-lg bg-secondary border-border" />
                  <InputOTPSlot index={5} className="w-12 h-14 text-lg bg-secondary border-border" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {isLoading && (
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}

            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setStep('email')}
            >
              Use a different email
            </Button>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">You're in!</h2>
            <p className="text-muted-foreground">Redirecting to camera...</p>
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
}
