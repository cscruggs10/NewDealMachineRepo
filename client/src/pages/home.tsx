import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            {/* Hero Logo */}
            <div className="flex justify-center mb-8 w-full">
              <img 
                src="/assets/deal-machine-logo.jpg" 
                alt="Deal Machine - Wholesale Auto Marketplace" 
                className="w-full h-auto max-h-48 md:max-h-64 lg:max-h-80 object-contain hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 relative">
              Your Buyer.<br />
              <span className="relative inline-block">
                Replaced.
                <svg className="absolute -top-2 -right-8 md:-right-12 w-8 h-8 md:w-12 md:h-12 text-yellow-400 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </span>
            </h1>
            <div className="mb-6">
              <Button 
                size="lg" 
                className="bg-white/10 border-2 border-white text-white hover:bg-white hover:text-gray-900 font-semibold px-8 py-4 text-lg backdrop-blur-sm"
                onClick={() => setLocation('/inventory')}
              >
                View Listings
              </Button>
            </div>
            <p className="text-lg md:text-xl opacity-90 leading-relaxed max-w-4xl mx-auto mb-10">
              Deal Machine replaces your traditional buyer with a complete wholesale solution. We source, buy, recondition to your standards, and deliver certified units ready for your lot - all while you focus on what matters: selling cars. 🚗 [Updated via GitHub]
            </p>
            <div className="flex flex-col items-center gap-3">
              <Button 
                size="lg" 
                className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-8 py-6 text-xl"
                onClick={() => window.open('sms:+19012385803', '_self')}
              >
                Text Us Now: (901) 238-5803
              </Button>
            </div>
            <p className="text-white/80 text-sm text-center mt-3">
              Skip the forms. Let's talk.
            </p>
            
            {/* Floating Sticky Button */}
            <Button
              className="fixed bottom-6 right-6 z-50 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 md:hidden"
              onClick={() => setLocation('/inventory')}
            >
              View Listings
            </Button>
          </div>
          <div className="mt-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Trusted by Industry Leaders</h2>
            <p className="text-center text-gray-300 mb-8">From publicly traded companies to national chains, dealers choose Deal Machine for reliable wholesale solutions.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center flex flex-col items-center justify-center">
                <img 
                  src="https://companieslogo.com/img/orig/CRMT_BIG-f9cf3333.png?t=1720244491" 
                  alt="America's Car-Mart Logo" 
                  className="h-12 w-auto mb-2 brightness-0 invert"
                />
                <div className="text-xs opacity-80">Publicly Traded</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center flex flex-col items-center justify-center">
                <img 
                  src="https://cdn.brandfetch.io/idgRuzz_Ud/w/800/h/190/theme/light/logo.png" 
                  alt="DriveTime Logo" 
                  className="h-8 w-auto mb-2 brightness-0 invert"
                />
                <div className="text-xs opacity-80">National Chain</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center flex flex-col items-center justify-center">
                <img 
                  src="https://companieslogo.com/img/orig/AN_BIG-fd41879e.png?t=1720244490" 
                  alt="AutoNation Logo" 
                  className="h-10 w-auto mb-2 brightness-0 invert"
                />
                <div className="text-xs opacity-80">Fortune 500</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center flex flex-col items-center justify-center">
                <div className="text-lg font-semibold mb-2">20+ More</div>
                <div className="text-xs opacity-80">Dealer Partners</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Value Proposition Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent">
              Why 20+ Dealers Choose Deal Machine Over Traditional Wholesale
            </span>
          </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Zero Downtime Costs</h3>
              <p className="text-gray-600 leading-relaxed">We purchase and carry inventory costs during reconditioning. You only take ownership when vehicles are certified and ready to sell - not when they're stuck in the shop costing you money.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Custom Reconditioning Control</h3>
              <p className="text-gray-600 leading-relaxed">From basic mechanical to near-CPO condition, you set the standards. Our end-to-end facility delivers exactly what your customers expect, every time.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Floor Plan Ready, Front Line Faster</h3>
              <p className="text-gray-600 leading-relaxed">Deal Machine Certified vehicles transfer seamlessly to your floor plan and move to your front line faster than traditional auction purchases. More selling time, less waiting time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Transformation Section */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            <span className="bg-gradient-to-r from-gray-900 via-purple-800 to-gray-900 bg-clip-text text-transparent">
              From Buyer Headaches to Buyer-Free Operations
            </span>
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            Eliminate the need for dedicated buyers, auction travel, and reconditioning surprises. Deal Machine handles sourcing, purchasing, and custom reconditioning while you focus on running your dealership. Whether you're Buy Here Pay Here, franchise, or independent - we've replaced traditional buyers for dealers of all sizes.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Three Steps to Better Wholesale</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg">
                1
              </div>
              <h3 className="text-xl font-bold mb-4">We Source & Buy</h3>
              <p className="text-gray-300">Professional sourcing without the buyer salary, benefits, or travel costs.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg">
                2
              </div>
              <h3 className="text-xl font-bold mb-4">Custom Reconditioning</h3>
              <p className="text-gray-300">You control standards, we handle execution. From basic to premium - your choice.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg">
                3
              </div>
              <h3 className="text-xl font-bold mb-4">Certified Delivery</h3>
              <p className="text-gray-300">Floor plan ready vehicles delivered faster than traditional wholesale.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Replace Your Buyer?</h2>
          <p className="text-xl mb-10 opacity-90">
            Join AutoNation, Carvana, and 20+ dealers who've transformed their wholesale operations with Deal Machine.
          </p>
          <div className="flex flex-col items-center gap-4 mb-8">
            <Button 
              size="lg" 
              className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-8 py-6 text-xl"
              onClick={() => window.open('sms:+19012385803', '_self')}
            >
              Text (901) 238-5803 Now
            </Button>
            <p className="text-gray-200 text-sm">
              Real dealers. Real conversations. Real solutions.
            </p>
          </div>
          <p className="text-gray-200">
            Already a dealer? <Button variant="link" className="text-white underline p-0" onClick={() => setLocation('/dealer/login')}>Access your portal</Button>
          </p>
        </div>
      </section>

    </div>
  );
}