import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom' // Note: 'react-router-dom' pas 'react-router'
import Home from '../pages/home/home'
import Login from '../pages/login/login'
import Logout from '../pages/Logout/Logout'
import Public from '../pages/public/Public'
import EditPage from '../pages/editPage/editPage'
import Profile from '../pages/profile/Profile'
import Create_portfolio from '../pages/portfolio/create_portfolio'
import PortfolioDetail from '../pages/portfolio/PortfolioDetail'
import MyPortfolio from '../pages/portfolio/MyPortfolio'
import Models from '../pages/models/Models'
import TemplatePreview from '../pages/editPage/components/template_preview'
import TemplateDetail from '../pages/models/TemplateDetail'

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/public" element={<Public />} />
        <Route path="/edit" element={<EditPage />} />
        <Route path="/portfolio" element={<Create_portfolio />} />
        <Route path="/portfolioDetail/:id" element={<PortfolioDetail />} /> 
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-portfolios" element={< MyPortfolio />}/>
        <Route path="models/" element={<Models/>}/>
        <Route path="templatePreview/" element={<TemplatePreview/>}/>
        <Route path="/template/:id" element={<TemplateDetail />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes