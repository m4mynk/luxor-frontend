import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AccountDetails = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('${process.env.REACT_APP_API_URL}/api/auth/me', { withCredentials: true });
        setUser(res.data.user);
      } catch (err) {
        console.error(err);
        setError('Failed to load user details.');
      }
    };

    fetchUser();
  }, []);

  if (error) return <div className="text-center text-red-500 py-10">{error}</div>;
  if (!user) return <div className="text-center py-10">Loading account details...</div>;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-2">Account Details</h2>
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-gray-700">Name</h3>
          <p className="text-gray-900">{user.name}</p>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-gray-700">Email</h3>
          <p className="text-gray-900">{user.email}</p>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-gray-700">Address</h3>
          <p className="text-gray-900">
            {user.address?.street}, {user.address?.city}, {user.address?.postalCode}, {user.address?.state}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-gray-700">Phone</h3>
          <p className="text-gray-900">{user.address?.phone || 'Not provided'}</p>
        </div>
      </div>
      <div className="mt-10 border-t pt-6">
        <h3 className="text-xl font-semibold mb-4">Update Address</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const formData = {
                phone: e.target.phone.value,
                address: {
                  street: e.target.address.value,
                  city: e.target.city.value,
                  postalCode: e.target.postalCode.value,
                  state: e.target.state.value,
                },
              };
              const res = await axios.post('${process.env.REACT_APP_API_URL}/api/auth/update-address', formData, {
                withCredentials: true,
              });
              setUser(res.data.user);
              alert('Address updated successfully!');
            } catch (err) {
              console.error('Error updating address:', err);
              if (err.response?.data?.message) {
                alert(`Error: ${err.response.data.message}`);
              } else {
                alert('Failed to update address');
              }
            }
          }}
          className="space-y-4"
        >
          <input name="email" defaultValue={user.email} placeholder="Email" className="w-full border px-4 py-2 rounded" disabled />
          <input
            name="address"
            defaultValue={user.address?.street || ''}
            placeholder="Address"
            className="w-full border px-4 py-2 rounded"
          />
          <input
            name="city"
            defaultValue={user.address?.city || ''}
            placeholder="City"
            className="w-full border px-4 py-2 rounded"
          />
          <input
            name="postalCode"
            defaultValue={user.address?.postalCode || ''}
            placeholder="Postal Code"
            className="w-full border px-4 py-2 rounded"
          />
          <input
            name="state"
            defaultValue={user.address?.state || ''}
            placeholder="State"
            className="w-full border px-4 py-2 rounded"
          />
          <input
            name="phone"
            defaultValue={user.address?.phone || ''}
            placeholder="Phone Number"
            className="w-full border px-4 py-2 rounded"
          />
          <button type="submit" className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800">
            Save Address
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccountDetails;