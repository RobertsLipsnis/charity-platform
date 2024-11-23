// components/DonationForm.js
import React, { useState } from 'react';
import { useCharityPlatform } from '../hooks/useCharityPlatform';

export const DonationForm = ({ projectId }) => {
    const [amount, setAmount] = useState('');
    const { donate } = useCharityPlatform();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleDonate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        try {
            await donate(projectId, amount);
            setSuccess('Donation successful!');
            setAmount('');
        } catch (error) {
            setError('Error processing donation: ' + error.message);
        }
    };

    return (
        <form onSubmit={handleDonate} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Donation Amount (ETH)
                </label>
                <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                />
            </div>
            
            {error && <p className="text-red-500">{error}</p>}
            {success && <p className="text-green-500">{success}</p>}
            
            <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
                Donate
            </button>
        </form>
    );
};