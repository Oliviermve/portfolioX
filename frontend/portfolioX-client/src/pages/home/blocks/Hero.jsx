import React from "react";

const Hero = () => {
  return (
    <section className="text-center mt-10 px-6 lg:px-20">
      <h1 className="text-4xl md:text-5xl font-bold">
        Ready to create a professional <br />
        Portfolio for minutes
      </h1>

      <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
        Stand out in a competitive market with a professional portfolio,
        made simple. Portfolix lets you create a stunning, custom portfolio in minutes.
      </p>

      <a href="/models" className="inline-block mt-6 bg-purple-600 text-white px-8 py-3 rounded-full shadow-md hover:bg-purple-700 transition">
        Get started
      </a>

      <div 
        className="mt-12 rounded-3xl bg-gradient-to-br from-purple-50 to-purple-100 p-10 shadow-xl"
        style={{
          backgroundImage: "url('/images/Content.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "300px",
        }}
      >
        <div className="flex justify-center gap-6">
          <button className="px-6 py-2 bg-white shadow rounded-full font-medium">
            Components
          </button>
          <button className="px-6 py-2 bg-white shadow rounded-full font-medium">
            Templates
          </button>
        </div>
{/* 
        <p className="mt-6 text-gray-600">Premium rate: $72.5 / Month</p>
        <p className="mt-2 text-gray-600">Get Discount: 18% / First Pay</p> */}
      </div>
    </section>
  );
};

export default Hero;
