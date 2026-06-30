import { SignIn } from "@clerk/react"

export function SignInPage() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4">
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <img src="/logo.svg" alt="FraudWatch" className="h-8 w-8" />
        <span className="text-xl font-bold text-primary">FraudWatch</span>
      </div>
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  )
}
