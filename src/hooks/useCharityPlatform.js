import { useWeb3 } from '../web3Context';
import { useState, useCallback } from 'react';

export const useCharityPlatform = () => {
    const { charityContract, account, web3 } = useWeb3();
    const [loading, setLoading] = useState(false);

    const createProject = useCallback(async (name, goalAmount, milestoneDescriptions, milestoneTargets) => {
        try {
            setLoading(true);
            const tx = await charityContract.methods
                .createProject(name, web3.utils.toWei(goalAmount), milestoneDescriptions, 
                    milestoneTargets.map(target => web3.utils.toWei(target)))
                .send({ from: account });
            return tx;
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [charityContract, account, web3]);

    const donate = useCallback(async (projectId, amount) => {
        try {
            setLoading(true);
            const tx = await charityContract.methods.donate(projectId)
                .send({ 
                    from: account, 
                    value: web3.utils.toWei(amount)
                });
            return tx;
        } catch (error) {
            console.error('Error donating:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [charityContract, account, web3]);

    const getProject = useCallback(async (projectId) => {
        try {
            const project = await charityContract.methods.getProject(projectId).call();
            return {
                name: project.name,
                charityAddress: project.charityAddress,
                goalAmount: web3.utils.fromWei(project.goalAmount),
                raisedAmount: web3.utils.fromWei(project.raisedAmount),
                isActive: project.isActive,
                milestoneCount: project.milestoneCount
            };
        } catch (error) {
            console.error('Error getting project:', error);
            throw error;
        }
    }, [charityContract, web3]);

    const getMilestone = useCallback(async (projectId, milestoneIndex) => {
        try {
            const milestone = await charityContract.methods
                .getMilestone(projectId, milestoneIndex)
                .call();
            return {
                description: milestone.description,
                targetAmount: web3.utils.fromWei(milestone.targetAmount),
                isCompleted: milestone.isCompleted,
                fundsReleased: milestone.fundsReleased
            };
        } catch (error) {
            console.error('Error getting milestone:', error);
            throw error;
        }
    }, [charityContract, web3]);

    const requestRefund = useCallback(async (projectId) => {
        try {
            setLoading(true);
            const tx = await charityContract.methods.requestRefund(projectId)
                .send({ from: account });
            return tx;
        } catch (error) {
            console.error('Error requesting refund:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [charityContract, account]);

    return {
        createProject,
        donate,
        getProject,
        getMilestone,
        requestRefund,
        loading
    };
};