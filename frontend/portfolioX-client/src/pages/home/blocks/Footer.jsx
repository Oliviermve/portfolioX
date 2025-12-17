import React from "react";

const Footer = () => {
  return (
    <footer className="py-14 px-6 lg:px-20 bg-white relative">
      <div className="flex flex-col md:flex-row justify-between gap-10">
        <div>
          <h3 className="font-bold text-xl text-purple-700">PortfoliX</h3>
          {/* <p className="text-gray-600 mt-3 max-w-xs">
            Unlock performance with data-driven campaigns, creative storytelling,
            and impactful branding.
          </p> */}
        </div>

        <div className="flex gap-20">
          <ul>
            <h4 className="font-semibold mb-3">Explore</h4>
            <li>What We Offer</li>
            <li>Case Studies</li>
            <li>Blog</li>
            <li>Resources</li>
            <li>FAQs</li>
          </ul>

          <ul>
            <h4 className="font-semibold mb-3">Company</h4>
            <li>Home</li>
            <li>About</li>
            <li>Service</li>
            <li>Testimonials</li>
            <li>Pricing</li>
          </ul>

          <ul>
            <h4 className="font-semibold mb-3">Legal Links</h4>
            <li>Privacy Policy</li>
            <li>Cookies</li>
            <li>Disclaimer</li>
            <li>Copyright</li>
          </ul>
        </div>
      </div>

      <p className="text-center mt-10 text-gray-500">© 2025 PortfoliX</p>

      <img src="/images/footer_image.png" alt="footer logo" className="absolute bottom-0 z-0" />
    </footer>
  );
};

export default Footer;
