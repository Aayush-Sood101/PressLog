import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { Newspaper } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="bg-[#f6f7f8] font-sans text-slate-900 min-h-screen flex flex-col overflow-x-hidden">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 px-6 md:px-10 py-4 bg-white">
        <Link href="/" className="flex items-center gap-3 text-[#1a355b] hover:opacity-90 transition-opacity">
          <div className="size-8 flex items-center justify-center bg-[#1a355b] rounded-lg text-white">
            <Newspaper className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold leading-tight tracking-tight">NewsTrack</h2>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 hidden sm:inline">Don&apos;t have an account?</span>
          <Link href="/sign-up" className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 border border-[#1a355b] text-[#1a355b] hover:bg-[#1a355b]/5 transition-colors text-sm font-bold">
            Sign Up
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-[520px] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col items-center">
          <div className="h-32 bg-[#1a355b] relative flex items-center justify-center overflow-hidden w-full">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDwG4Ggu1OlzDFqDG8ed9ZenEclWMqIHJKWttGLbj32cJqPUYMqwUtI8kLZ82aeGoasGRw9S5dOFPmWa9vZdPtEPpNu-PbBUeJRHtKKfqWwTx8X2-1QZQmRYpjAWb5oNwhKuKt_Pmbnw8SPjlEEsILtmlgR3TZGURPleY3OTUwGJIXi1ZRiGRBeNIt5CsXnv9_I82WMX5E3wd1L_f3o1nHZiFQYKIovPAZjupskdxOctEeiKbpZ4QG2XXiVLP3jciNg9-iROZ-PqC0l")', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            <div className="relative z-10 text-center">
              <h1 className="text-white text-2xl font-bold">Welcome Back</h1>
              <p className="text-slate-200 text-sm">Sign in to manage your university newspaper deliveries</p>
            </div>
          </div>
            
          <div className="p-8 w-full flex justify-center">
            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "w-full shadow-none border-none bg-transparent p-0",
                  header: "hidden", 
                  formButtonPrimary: "bg-[#1a355b] hover:bg-[#1a355b]/90 text-white font-bold h-12 rounded-lg",
                  socialButtonsBlockButton: "h-12 border-slate-200 hover:bg-slate-50 transition-colors",
                  formFieldInput: "h-12 rounded-lg border-slate-300 focus:ring-[#1a355b] focus:border-[#1a355b]",
                },
              }}
              routing="path"
              path="/sign-in"
              signUpUrl="/sign-up"
              fallbackRedirectUrl="/onboarding"
            />
          </div>
        </div>
      </main>

      <footer className="py-6 px-10 flex justify-center text-center gap-4 text-slate-400 text-xs">
        <p>© {new Date().getFullYear()} NewsTrack. All rights reserved.</p>
      </footer>
    </div>
  );
}
