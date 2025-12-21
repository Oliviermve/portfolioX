import React from "react";

const Hero = () => (
  <section className="text-center px-6">
    <h1 className="text-4xl font-bold">
      Ready to create a professional <br />Portfolio for minutes
    </h1>

    <p className="mt-8 text-white max-w-2xl mx-auto">
      Stand out in a competitive market with a professional portfolio,
      made simple. Portfolix lets you create a stunning, custom portfolio in minutes.
    </p>

    <a href="/models" className="inline-block mt-8 bg-purple-600 text-white px-8 py-3 rounded-full">
      Get started
    </a>

    <div 
      className="mt-12 rounded-3xl p-8"
      style={{
        background: "url('/images/Content.png') center/cover",
        height: "250px",
      }}
    >
      <div className="flex justify-center gap-4">
        <button className="px-4 py-2 bg-violet-700 rounded-full text-white">
          Components
        </button>
        <button className="px-4 py-2 bg-white rounded-full text-violet-700">
          Templates
        </button>
      </div>
    </div>
  </section>
);

export default Hero;