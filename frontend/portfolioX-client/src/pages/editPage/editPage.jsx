import { useState } from "react";
import TemplatePreview from "./components/template_preview";

export default function EditPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative w-full h-screen bg-gray-400 flex">

      {/* ICON OPEN SIDEBAR */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="absolute left-4 top-4 z-50 text-purple-500"
      >
        <img src="/icons/folder.svg" className="w-10 h-10" />
      </button>

      {/* SIDEBAR */}
      {/* <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-white shadow-xl border-r border-purple-300
          transform transition-transform duration-300 z-40
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
       
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-3 top-3 text-gray-600 hover:text-black"
        >
          ✕
        </button>

        <div className="p-4">
         
          <input
            type="text"
            placeholder="Search"
            className="w-full border rounded px-3 py-2 mb-4"
          />

          <button className="w-full bg-purple-500 text-white py-2 rounded">
            Import file
          </button>

          
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="w-full h-20 bg-gray-300 rounded" />
            ))}
          </div>
        </div>
      </aside> */}

      {/* SideBar */}
      

      {/* MAIN CONTENT */}
      <TemplatePreview />

    </div>
  );
}
