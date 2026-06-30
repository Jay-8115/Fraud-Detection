import { SignUp } from "@clerk/react"

export function SignUpPage() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4">
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <img src="/logo.svg" alt="FraudWatch" className="h-8 w-8" />
        <span className="text-xl font-bold text-primary">FraudWatch</span>
      </div>
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  )
}
