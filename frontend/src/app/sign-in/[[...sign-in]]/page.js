import { SignIn } from '@clerk/nextjs';
import { Newspaper } from 'lucide-react';
import { PageBackground } from '@/components/shared';

export default function SignInPage() {
  return (
    <PageBackground>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="relative animate-fade-in-up max-w-md w-full">
          {/* Branding header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Newspaper className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">PressLog</h1>
            <p className="text-sm text-muted-foreground mt-1">Welcome back — sign in to continue</p>
          </div>

          <SignIn
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-lg rounded-lg border border-border/60",
              },
            }}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/onboarding"
          />

          {/* Footer links */}
          <div className="mt-6 text-center text-xs text-muted-foreground space-x-4">
            <span>Help Center</span>
            <span>·</span>
            <span>Privacy Policy</span>
            <span>·</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </PageBackground>
  );
}
