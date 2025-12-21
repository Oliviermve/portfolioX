import React from "react";

const Pricing = () => {
  const plans = [
    {
      type: "Lunch Pack",
      price: "10 000F cfa",
      desc: "Transformed content game in weeks with clear lift in traffic and conversions.",
    },
    {
      type: "Smart Plan",
      price: "30 000F cfa",
      desc: "Campaigns aligned with real customer connection and creative impact.",
    },
    {
      type: "Boost Kit",
      price: "20 000F cfa",
      desc: "Plug into a creative powerhouse with strategic direction and better conversions.",
    },
  ];

  return (
    <section className="py-12 px-4 bg-gray-900 text-white">
      <h2 className="text-center text-2xl font-bold">
        Clear pricing
      </h2>
      <p className="text-center text-gray-300 mt-2">
        Real feedback from brands
      </p>

      <div className="flex justify-center mt-6">
        <div className="bg-white text-gray-800 rounded-full flex">
          <button className="px-6 py-2 font-bold bg-purple-600 text-white rounded-full">
            Monthly
          </button>
          <button className="px-6 py-2 text-gray-600">
            Yearly
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-12">
        {plans.map((item, index) => (
          <div
            key={index}
            className="bg-gray-800 p-6 rounded-xl"
          >
            <h3 className="text-xl font-bold">{item.type}</h3>
            <p className="text-purple-400 text-2xl mt-2">{item.price}</p>
            <p className="mt-4 text-gray-300">{item.desc}</p>
            
            <button className="mt-6 w-full bg-purple-600 text-white py-3 rounded">
              Get Started
            </button>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-12">
        <p className="text-gray-400">
          <span className="text-green-400">14-day free trial</span>
        </p>
      </div>
    </section>
  );
};

export default Pricing;