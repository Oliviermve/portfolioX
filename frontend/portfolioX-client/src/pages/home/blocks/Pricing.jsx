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
    <section className="py-20 px-6 lg:px-20 bg-gray-900 text-white">
      <h2 className="text-center text-3xl font-bold">
        Our pricing is clear and transparent
      </h2>
      <p className="text-center text-gray-300 mt-3">
        Real feedback from brands we've helped scale.
      </p>

      <div className="flex justify-center mt-6">
        <div className="bg-white text-gray-800 shadow rounded-full flex">
          <button className="px-6 py-2 font-semibold">Monthly</button>
          <button className="px-6 py-2 text-gray-500">Yearly</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-12">
        {plans.map((item, index) => (
          <div
            key={index}
            className="bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-700"
          >
            <h3 className="text-xl font-bold">{item.type}</h3>
            <p className="text-purple-400 text-2xl mt-3">{item.price}</p>
            <p className="mt-4 text-gray-300">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Pricing;
