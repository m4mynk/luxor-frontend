import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { User, Heart, ShoppingBag, Settings } from 'lucide-react';

const UserDashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-6 rounded-r-3xl">
        <h2 className="text-2xl font-bold mb-6 tracking-wider text-black">My Luxor</h2>
        <nav className="flex flex-col space-y-4">
          <NavLink
            to="orders"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                isActive ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`
            }
          >
            <ShoppingBag size={20} />
            Orders
          </NavLink>
          <NavLink
            to="wishlist"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                isActive ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`
            }
          >
            <Heart size={20} />
            Wishlist
          </NavLink>
          <NavLink
            to="account"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                isActive ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`
            }
          >
            <User size={20} />
            Account
          </NavLink>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default UserDashboard;