// components/ProjectDashboard.js
import React, { useState, useEffect } from 'react';
import { useCharityPlatform } from '../hooks/useCharityPlatform';

export const ProjectDashboard = ({ projectId }) => {
    const [project, setProject] = useState(null);
    const [milestones, setMilestones] = useState([]);
    const { getProject, getMilestone } = useCharityPlatform();

    useEffect(() => {
        const fetchProjectData = async () => {
            try {
                const projectData = await getProject(projectId);
                setProject(projectData);
                
                const milestonePromises = [];
                for (let i = 0; i < projectData.milestoneCount; i++) {
                    milestonePromises.push(getMilestone(projectId, i));
                }
                
                const fetchedMilestones = await Promise.all(milestonePromises);
                setMilestones(fetchedMilestones);
            } catch (error) {
                console.error('Error fetching project data:', error);
            }
        };

        fetchProjectData();
    }, [projectId, getProject, getMilestone]);

    if (!project) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">{project.name}</h2>
            
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Project Progress</h3>
                <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                        className="bg-blue-500 rounded-full h-4"
                        style={{
                            width: `${(project.raisedAmount / project.goalAmount) * 100}%`
                        }}
                    />
                </div>
                <p className="mt-2">
                    {project.raisedAmount} ETH raised of {project.goalAmount} ETH goal
                </p>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Milestones</h3>
                {milestones.map((milestone, index) => (
                    <div
                        key={index}
                        className="border rounded-lg p-4"
                    >
                        <h4 className="font-medium">{milestone.description}</h4>
                        <p>Target: {milestone.targetAmount} ETH</p>
                        <p>Status: {milestone.isCompleted ? 'Completed' : 'In Progress'}</p>
                        {milestone.fundsReleased && (
                            <p className="text-green-500">Funds Released</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};