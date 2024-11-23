// components/ProjectList.js
import React, { useState, useEffect } from 'react';
import { useCharityPlatform } from '../hooks/useCharityPlatform';
import { useWeb3 } from '../web3Context';

export const ProjectList = () => {
    const [projects, setProjects] = useState([]);
    const { getProject } = useCharityPlatform();
    const { charityContract } = useWeb3();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const projectCount = await charityContract.methods.projectCount().call();
                const projectPromises = [];
                
                for (let i = 1; i <= projectCount; i++) {
                    projectPromises.push(getProject(i));
                }
                
                const fetchedProjects = await Promise.all(projectPromises);
                setProjects(fetchedProjects);
            } catch (error) {
                console.error('Error fetching projects:', error);
            }
        };

        if (charityContract) {
            fetchProjects();
        }
    }, [charityContract, getProject]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {projects.map((project, index) => (
                <div key={index} className="border rounded-lg p-4 shadow-md">
                    <h3 className="text-xl font-bold mb-2">{project.name}</h3>
                    <p>Goal: {project.goalAmount} ETH</p>
                    <p>Raised: {project.raisedAmount} ETH</p>
                    <p>Status: {project.isActive ? 'Active' : 'Inactive'}</p>
                </div>
            ))}
        </div>
    );
};