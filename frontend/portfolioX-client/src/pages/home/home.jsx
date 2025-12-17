import React from 'react'
import Navbar from '../../components/Navbar'
import Hero from './blocks/Hero'
import Features from './blocks/Features'
import Pricing from './blocks/Pricing'
import Footer from './blocks/Footer'


const Home = () => {
  return (
    <div className="font-sans">
      {/* Navbar avec position fixed */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>
      <div className="pt-16"> 
       
        <Hero />
        <Features />
        <Pricing />
        <Footer />
      </div>
    </div>
  )
}

export default Home