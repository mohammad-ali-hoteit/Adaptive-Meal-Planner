import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './AppShell.css';

const AppShell = () => {
  return (
    <div className="app-layout">
      <Sidebar />
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
