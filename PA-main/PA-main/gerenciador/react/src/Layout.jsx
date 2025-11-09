import { Outlet } from "react-router-dom";
import NavBar from './components/NavBar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50"> 
      <NavBar />
      <main className="pt-20 pb-8"> 
        <Outlet />
      </main>
    </div>
  );
}
