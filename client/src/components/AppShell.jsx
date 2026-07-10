import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './AppShell.css';

const AppShell = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`app-layout ${isCollapsed ? 'collapsed' : ''}`}>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className="main-content">
        <Topbar />
        <div className="page-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AppShell;
