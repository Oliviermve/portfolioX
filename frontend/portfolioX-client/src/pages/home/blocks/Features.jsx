import React from "react";

const Features = () => {
  const items = [
    {
      img: "/images/Content.png",
      title: "Seamless Portfolio Creation",
      text: "Build your professional identity in minutes",
    },
    {
      img: "/images/Content.png",
      title: "Smart Template Management",
      text: "Design freedom at your fingertips",
    },
    {
      img: "/images/Content.png",
      title: "Secure User and Content Management",
      text: "Your creativity deserves protection",
    },
  ];

  return (
    <section className="text-center py-20 px-6 lg:px-20">
      <h2 className="text-3xl font-bold text-purple-700">
        The three main features of PortfoliX
      </h2>

      <div className="grid md:grid-cols-3 gap-10 mt-10">
        {items.map((f, index) => (
          <div key={index} className="flex flex-col items-center">
            <img src={f.img} alt={f.title} className="rounded-xl shadow-md" />
            <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
            <p className="text-gray-600 mt-2">{f.text}</p>
          </div>
        ))}
      </div>

      <button className="mt-10 px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700">
        View all
      </button>
    </section>
  );
};

export default Features;
