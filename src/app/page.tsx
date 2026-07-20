import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VisitorForm from "@/components/VisitorForm";
import { Landmark, FileCheck2, Clock, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-navy via-navy-light to-navy relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_80%_60%,white,transparent_30%)]" />
          <div className="max-w-6xl mx-auto px-4 py-14 relative">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-saffron flex items-center justify-center shadow-lg">
                <Landmark className="text-navy" size={32} />
              </div>
              <h1 className="marathi text-3xl sm:text-4xl font-bold text-white">
                जिल्हाधिकारी कार्यालय, जालना — भेट व्यवस्थापन प्रणाली
              </h1>
              <p className="text-white/80 max-w-2xl">
                Visitor &amp; Grievance Management System — District Collector Office, Jalna.
                Register your application below and get an instant token number to track its status online.
              </p>
              <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-4 w-full max-w-lg">
                <Feature icon={<FileCheck2 size={20} />} label="Instant Token" />
                <Feature icon={<Clock size={20} />} label="Live Status" />
                <Feature icon={<ShieldCheck size={20} />} label="Secure & Transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* Registration Form */}
        <section className="max-w-3xl mx-auto px-4 -mt-8 pb-16">
          <div className="bg-white rounded-2xl card-shadow p-6 sm:p-8">
            <h2 className="marathi text-xl font-bold text-navy mb-1">भेटीसाठी नोंदणी करा</h2>
            <p className="text-sm text-gray-500 mb-6">
              Fill the form below to register your visit / application to meet the District Collector.
            </p>
            <VisitorForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-white/10 rounded-xl py-3 px-2 backdrop-blur">
      <div className="text-saffron-light">{icon}</div>
      <div className="text-white text-xs font-medium text-center">{label}</div>
    </div>
  );
}
