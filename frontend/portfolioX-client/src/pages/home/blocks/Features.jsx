import React from "react";

const Features = () => {
  const items = [
    {
      img: "/images/1.jpeg",
      title: "Seamless Portfolio Creation",
      text: "Build your professional identity in minutes",
    },
    {
      img: "/images/2.jpeg",
      title: "Smart Template Management",
      text: "Design freedom at your fingertips",
    },
    {
      img: "/images/3.jpeg",
      title: "Secure User and Content Management",
      text: "Your creativity deserves protection",
    },
  ];

  return (
    <section className="text-center py-16 px-4">
      <h2 className="text-2xl font-bold text-purple-700">
        Main features
      </h2>

      <div className="grid md:grid-cols-3 gap-6 mt-4">
        {items.map((f, index) => (
          <div key={index} className="flex flex-col items-center">
            <img src={f.img} alt={f.title} className="rounded-lg" />
            <h3 className="mt-3 text-md font-semibold">{f.title}</h3>
            <p className="text-gray-600 mt-1">{f.text}</p>
          </div>
        ))}
      </div> 

      <button className="mt-8 px-5 py-2 bg-purple-600 text-white rounded">
        <a href="/">View all</a> 
      </button>
    </section>
  );
};

export default Features;