import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Stats from '../components/Stats'
import HowItWorks from '../components/HowItWorks'
import Features from '../components/Features'
import CTASection from '../components/CTASection'
import Footer from '../components/Footer'

const LandingPage = () => {
  return (
    <div className="min-h-screen font-sans">
      <Navbar />
      <Hero />
      <Stats />
      <HowItWorks />
      <Features />
      <CTASection />
      <Footer />
    </div>
  )
}

export default LandingPage