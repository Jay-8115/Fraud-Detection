import { Link } from "wouter"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Activity, Database, Lock, ChevronRight, BarChart3, Fingerprint } from "lucide-react"

export function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="FraudWatch" className="h-8 w-8" />
            <span className="text-xl font-bold text-primary">FraudWatch</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 px-6 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary font-medium">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              Enterprise Fraud Detection
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900">
              Detect financial fraud with <span className="text-primary">surgical precision.</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Upload transaction datasets. Run advanced ML models in seconds. Generate audit-ready reports. Built for analysts who trust their tools with real money.
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Link href="/sign-up">
                <Button size="lg" className="h-12 px-8 text-base shadow-lg hover:shadow-primary/25 transition-all">
                  Start Analyzing <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-slate-50 border-t">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold">Unquestionably Reliable</h2>
              <p className="mt-4 text-slate-600">The platform designed for rigorous financial auditing.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  icon: Activity,
                  title: "Multi-Model Execution",
                  description: "Run Random Forest, XGBoost, Isolation Forest and more simultaneously to cross-verify anomalies."
                },
                {
                  icon: BarChart3,
                  title: "Dense Data Visualization",
                  description: "Information-rich dashboards built for analysts. Spot trends, inspect outliers, and dive into raw transaction data."
                },
                {
                  icon: ShieldCheck,
                  title: "Audit-Ready Reporting",
                  description: "Export comprehensive PDF reports detailing risk scores, model accuracy metrics, and AI-generated summaries."
                },
                {
                  icon: Fingerprint,
                  title: "Explainable AI",
                  description: "Don't just get a risk score. Get the 'why'. Feature importance analysis shows exactly what triggered the alert."
                },
                {
                  icon: Database,
                  title: "Large Dataset Support",
                  description: "Process thousands of transactions in seconds. Securely upload CSV or Excel files up to 10MB."
                },
                {
                  icon: Lock,
                  title: "Bank-Grade Security",
                  description: "Your data is encrypted at rest and in transit. Built with stringent role-based access controls."
                }
              ].map((feature, i) => (
                <div key={i} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-all">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white py-12">
        <div className="container mx-auto px-6 text-center text-slate-500">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/logo.svg" alt="FraudWatch" className="h-6 w-6 grayscale opacity-50" />
            <span className="font-semibold text-slate-900">FraudWatch</span>
          </div>
          <p>© {new Date().getFullYear()} FraudWatch Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
