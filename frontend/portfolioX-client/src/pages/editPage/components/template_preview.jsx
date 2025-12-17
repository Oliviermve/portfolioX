import React from 'react'

const TemplatePreview = () => {
  return (
      <main className="flex-1 overflow-auto p-10 ml-0 bg-white">
        <div className="max-w-4xl mx-auto">

          <div className="w-full h-80 bg-gray-300 rounded mb-8" />

          <h1 className="text-4xl font-bold mb-8">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </h1>

          <h2 className="text-3xl font-bold mb-6">Projects</h2>

          <div className="grid grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-full h-40 bg-gray-300 rounded" />
            ))}
          </div>

        </div>
      </main>
  )
}

export default TemplatePreview
