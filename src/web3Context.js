// web3Context.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import Web3 from 'web3';
import CharityPlatform from './contracts/CharityPlatform.json';
import DonationToken from './contracts/DonationToken.json';

const Web3Context = createContext(null);

export const Web3Provider = ({ children }) => {
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState(null);
    const [charityContract, setCharityContract] = useState(null);
    const [donationToken, setDonationToken] = useState(null);
    const [loading, setLoading] = useState(true);

    const initializeWeb3 = async () => {
        try {
            if (window.ethereum) {
                const web3Instance = new Web3(window.ethereum);
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                
                const accounts = await web3Instance.eth.getAccounts();
                const networkId = await web3Instance.eth.net.getId();
                
                // Initialize contracts
                const charityContractInstance = new web3Instance.eth.Contract(
                    CharityPlatform.abi,
                    CharityPlatform.networks[networkId].address
                );
                
                const donationTokenInstance = new web3Instance.eth.Contract(
                    DonationToken.abi,
                    DonationToken.networks[networkId].address
                );

                setWeb3(web3Instance);
                setAccount(accounts[0]);
                setCharityContract(charityContractInstance);
                setDonationToken(donationTokenInstance);
            } else {
                throw new Error('Please install MetaMask');
            }
        } catch (error) {
            console.error('Error initializing Web3:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initializeWeb3();
        
        // Handle account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                setAccount(accounts[0]);
            });
        }
    }, []);

    return (
        <Web3Context.Provider value={{ web3, account, charityContract, donationToken, loading }}>
            {children}
        </Web3Context.Provider>
    );
};

export const useWeb3 = () => useContext(Web3Context);