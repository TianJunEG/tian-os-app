import React, { useState } from 'react';
import { Menu, X, ChevronDown, Star, Users, Clock, CheckCircle, Zap, Shield, TrendingUp, ArrowRight, MessageSquare, Calendar, Award } from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-slate-900">AEO</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex gap-8">
              <a href="#features" className="text-slate-700 hover:text-blue-600 transition">Features</a>
              <a href="#how-it-works" className="text-slate-700 hover:text-blue-600 transition">How It Works</a>
              <a href="#tutors" className="text-slate-700 hover:text-blue-600 transition">Find Tutors</a>
              <a href="#pricing" className="text-slate-700 hover:text-blue-600 transition">Pricing</a>
            </div>

            <div className="hidden md:flex gap-4">
              <button className="px-6 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition">
                Sign In
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
                Get Started
              </button>
            </div>

            {/* Mobile Menu */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-slate-200">
              <a href="#features" className="block py-2 text-slate-700">Features</a>
              <a href="#how-it-works" className="block py-2 text-slate-700">How It Works</a>
              <a href="#tutors" className="block py-2 text-slate-700">Find Tutors</a>
              <a href="#pricing" className="block py-2 text-slate-700">Pricing</a>
              <div className="flex flex-col gap-2 mt-4">
                <button className="w-full py-2 text-blue-600 font-medium">Sign In</button>
                <button className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg">Get Started</button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-50 via-white to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block mb-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                ✨ Personalized Learning Starts Here
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Find Your Perfect Tutor in Minutes
              </h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Connect with qualified tutors who match your learning style. Real results, real progress, no subscriptions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2">
                  Start Free Search <ArrowRight size={20} />
                </button>
                <button className="px-8 py-4 border-2 border-slate-300 text-slate-900 font-medium rounded-lg hover:border-slate-400 transition">
                  Become a Tutor
                </button>
              </div>
              <div className="flex items-center gap-6 mt-12 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-yellow-400 fill-yellow-400" />
                  <span><strong>4.9</strong> avg rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-teal-600" />
                  <span><strong>50K+</strong> students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-orange-500" />
                  <span><strong>500K+</strong> hours taught</span>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-teal-300 rounded-3xl opacity-20 blur-3xl"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-teal-500 rounded-3xl p-8 text-white shadow-2xl">
                <div className="space-y-6">
                  <div className="bg-white bg-opacity-20 backdrop-blur rounded-2xl p-4">
                    <p className="text-sm opacity-90 mb-2">Featured Tutor</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-yellow-300 rounded-full flex items-center justify-center text-xl">👩‍🏫</div>
                      <div>
                        <p className="font-semibold">Sarah Chen</p>
                        <p className="text-sm opacity-90">AP Calculus Expert</p>
                      </div>
                      <div className="ml-auto flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} className="fill-yellow-300" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-20 backdrop-blur rounded-2xl p-4">
                    <p className="text-sm opacity-90 mb-3">Recent Session</p>
                    <p className="text-sm">"Math was intimidating until Sarah made it click for me!" - Alex</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white bg-opacity-20 backdrop-blur rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold">95%</p>
                      <p className="text-xs opacity-90">Pass Rate</p>
                    </div>
                    <div className="bg-white bg-opacity-20 backdrop-blur rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold">2.4K</p>
                      <p className="text-xs opacity-90">Hours Taught</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Why Choose AEO?</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              We've reimagined how students find tutors—making it faster, smarter, and more personal.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border border-blue-200">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Zap size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Smart Matching</h3>
              <p className="text-slate-700 mb-4">
                Our algorithm matches you with tutors based on teaching style, availability, and expertise—not just keywords.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-teal-600" />
                  <span>Personality compatibility matching</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-teal-600" />
                  <span>Real-time availability sync</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-teal-600" />
                  <span>Verified credentials</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-8 border border-teal-200">
              <div className="w-14 h-14 bg-teal-600 rounded-xl flex items-center justify-center mb-6">
                <Shield size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">100% Safe & Secure</h3>
              <p className="text-slate-700 mb-4">
                Verified tutors, secure payments, and transparent reviews. Your education journey is in safe hands.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-600" />
                  <span>Background verified tutors</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-600" />
                  <span>Secure payment processing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-600" />
                  <span>Transparent pricing</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 border border-orange-200">
              <div className="w-14 h-14 bg-orange-600 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Track Progress</h3>
              <p className="text-slate-700 mb-4">
                See measurable improvement with session notes, progress reports, and personalized feedback from your tutor.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-orange-600" />
                  <span>Detailed session notes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-orange-600" />
                  <span>Progress dashboards</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-orange-600" />
                  <span>Goal tracking</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Get Started in 4 Simple Steps</h2>
            <p className="text-xl text-slate-600">From signup to first session in less than an hour</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: '1', title: 'Sign Up', desc: 'Create your student profile in 2 minutes', icon: '👤' },
              { num: '2', title: 'Search & Match', desc: 'Find tutors by subject, rate & availability', icon: '🔍' },
              { num: '3', title: 'Book a Session', desc: 'Schedule your first lesson instantly', icon: '📅' },
              { num: '4', title: 'Learn & Grow', desc: 'Get personalized tutoring & track progress', icon: '📈' },
            ].map((step, idx) => (
              <div key={idx} className="relative">
                {idx < 3 && (
                  <div className="hidden md:block absolute top-12 -right-3 w-6 h-0.5 bg-gradient-to-r from-blue-600 to-transparent"></div>
                )}
                <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:border-blue-600 transition h-full">
                  <div className="text-4xl mb-4">{step.icon}</div>
                  <div className="inline-block mb-4 px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-bold text-sm">
                    Step {step.num}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-slate-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tutors Section */}
      <section id="tutors" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Vetted Expert Tutors</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Every tutor is verified, experienced, and passionate about helping you succeed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah Chen', subject: 'AP Calculus', rating: 4.9, reviews: 287, hourly: '$45', desc: 'MIT grad, 8 years experience', badge: 'Top Tutor' },
              { name: 'Marcus Johnson', subject: 'Physics', rating: 4.8, reviews: 195, hourly: '$40', desc: 'Physics teacher, Olympic coach', badge: 'Educator' },
              { name: 'Emma Rodriguez', subject: 'Spanish', rating: 4.95, reviews: 312, hourly: '$35', desc: 'Native speaker, travels often', badge: 'Native Speaker' },
            ].map((tutor, idx) => (
              <div key={idx} className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl transition">
                <div className="h-40 bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center text-6xl">
                  {idx === 0 ? '👩‍🏫' : idx === 1 ? '👨‍🔬' : '👩‍🏫'}
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{tutor.name}</h3>
                      <p className="text-blue-600 font-medium">{tutor.subject}</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                      {tutor.badge}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{tutor.desc}</p>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{tutor.rating}</span>
                    <span className="text-xs text-slate-500">({tutor.reviews})</span>
                  </div>
                  <button className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Students Love AEO</h2>
            <p className="text-xl text-slate-300">Real reviews from real learners</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Alex Martinez', grade: 'Junior, Boston High', text: 'My SAT score jumped 180 points! Maria helped me understand the concepts, not just memorize answers.' },
              { name: 'Jamie Wong', grade: 'Freshman, SF State', text: 'Chemistry was my nightmare until I found David. Now I actually enjoy problem sets. Best investment ever.' },
              { name: 'Priya Patel', grade: 'Sophomore, Chicago High', text: 'The matching algorithm nailed it—my tutor\'s style perfectly fits how I learn. Sessions fly by!' },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-white bg-opacity-10 backdrop-blur border border-white border-opacity-20 rounded-2xl p-8">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-lg mb-6 leading-relaxed">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p className="text-sm text-slate-300">{testimonial.grade}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Pay per session. No subscriptions, no hidden fees, no contracts.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Pay Per Session',
                price: 'Flexible',
                color: 'from-blue-50 to-blue-100',
                border: 'border-blue-200',
                features: ['One-off sessions', 'No commitment', 'Change tutors anytime', 'Average $35-50/hour', 'Best for: Trying it out']
              },
              {
                name: 'Monthly Packages',
                price: '4 sessions',
                color: 'from-teal-50 to-teal-100',
                border: 'border-teal-200',
                features: ['2 sessions/week', '10% savings', 'Dedicated tutor', 'Flexible scheduling', 'Best for: Regular learners'],
                badge: 'Most Popular'
              },
              {
                name: 'Intensive Plans',
                price: '8 sessions',
                color: 'from-orange-50 to-orange-100',
                border: 'border-orange-200',
                features: ['4 sessions/week', '20% savings', 'Priority support', 'Custom plan option', 'Best for: Test prep']
              },
            ].map((plan, idx) => (
              <div key={idx} className={`relative bg-gradient-to-br ${plan.color} rounded-2xl p-8 border-2 ${plan.border}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-teal-600 text-white text-sm font-bold rounded-full">
                    {plan.badge}
                  </div>
                )}
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-slate-600 mb-6">Starting at <span className="text-3xl font-bold text-slate-900">{plan.price}</span></p>
                <button className={`w-full py-3 mb-6 rounded-lg font-medium transition ${idx === 1 ? 'bg-teal-600 text-white hover:bg-teal-700' : 'border-2 border-slate-300 text-slate-900 hover:border-slate-400'}`}>
                  Get Started
                </button>
                <div className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle size={18} className="text-teal-600 flex-shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-200 text-center">
            <p className="text-slate-700">
              <strong>Have questions?</strong> Our student success team is here to help.{' '}
              <a href="#" className="text-blue-600 font-medium hover:underline">Start a free 15-min consultation</a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold mb-6">Ready to Transform Your Learning?</h2>
          <p className="text-xl mb-8 opacity-95">
            Join thousands of students achieving their goals with AEO tutors.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-slate-100 transition">
              Search Tutors Now
            </button>
            <button className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:bg-opacity-10 transition">
              Become a Tutor
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="font-bold text-white">AEO</span>
              </div>
              <p className="text-sm">Personalized learning, real progress.</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-3">Product</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">For Students</a></li>
                <li><a href="#" className="hover:text-white transition">For Tutors</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white mb-3">Company</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white mb-3">Legal</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-sm">
            <p className="text-center">© 2026 AEO. All rights reserved. | Empowering learners worldwide.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
