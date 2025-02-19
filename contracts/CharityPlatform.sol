import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./DonationToken.sol";

contract CharityPlatform is ReentrancyGuard, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant CHARITY_ROLE = keccak256("CHARITY_ROLE");

    DonationToken public donationToken;
    
    struct Project {
        string name;
        address charityAddress;
        uint256 goalAmount;
        uint256 raisedAmount;
        bool isActive;
        Milestone[] milestones;
        mapping(address => uint256) donations;
    }

    struct Milestone {
        string description;
        uint256 targetAmount;
        bool isCompleted;
        bool fundsReleased;
    }

    mapping(uint256 => Project) public projects;
    uint256 public projectCount;

    event ProjectCreated(uint256 indexed projectId, string name, address charityAddress);
    event DonationReceived(uint256 indexed projectId, address indexed donor, uint256 amount);
    event MilestoneCompleted(uint256 indexed projectId, uint256 milestoneIndex);
    event FundsReleased(uint256 indexed projectId, uint256 amount);
    event RefundIssued(uint256 indexed projectId, address indexed donor, uint256 amount);

    constructor(address _donationToken) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        donationToken = DonationToken(_donationToken);
    }

    function createProject(
        string memory _name,
        uint256 _goalAmount,
        string[] memory _milestoneDescriptions,
        uint256[] memory _milestoneTargets
    ) external onlyRole(CHARITY_ROLE) {
        require(_milestoneDescriptions.length == _milestoneTargets.length, "Milestone arrays must match");
        
        projectCount++;
        Project storage project = projects[projectCount];
        project.name = _name;
        project.charityAddress = msg.sender;
        project.goalAmount = _goalAmount;
        project.isActive = true;

        for(uint i = 0; i < _milestoneDescriptions.length; i++) {
            project.milestones.push(Milestone({
                description: _milestoneDescriptions[i],
                targetAmount: _milestoneTargets[i],
                isCompleted: false,
                fundsReleased: false
            }));
        }

        emit ProjectCreated(projectCount, _name, msg.sender);
    }

    function donate(uint256 _projectId) external payable nonReentrant {
        Project storage project = projects[_projectId];
        require(project.isActive, "Project is not active");
        require(msg.value > 0, "Donation amount must be greater than 0");

        project.donations[msg.sender] += msg.value;
        project.raisedAmount += msg.value;

        // Mint donation NFT
        donationToken.mint(msg.sender, _projectId, msg.value);

        emit DonationReceived(_projectId, msg.sender, msg.value);
    }

    function completeMilestone(uint256 _projectId, uint256 _milestoneIndex) external onlyRole(ADMIN_ROLE) {
        Project storage project = projects[_projectId];
        require(_milestoneIndex < project.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = project.milestones[_milestoneIndex];
        require(!milestone.isCompleted, "Milestone already completed");
        
        milestone.isCompleted = true;
        emit MilestoneCompleted(_projectId, _milestoneIndex);

        // Release funds for completed milestone
        if(!milestone.fundsReleased && project.raisedAmount >= milestone.targetAmount) {
            milestone.fundsReleased = true;
            uint256 releaseAmount = milestone.targetAmount;
            
            (bool success, ) = project.charityAddress.call{value: releaseAmount}("");
            require(success, "Fund transfer failed");
            
            emit FundsReleased(_projectId, releaseAmount);
        }
    }

    function requestRefund(uint256 _projectId) external nonReentrant {
        Project storage project = projects[_projectId];
        require(!project.isActive, "Project is still active");
        
        uint256 donationAmount = project.donations[msg.sender];
        require(donationAmount > 0, "No donation found");

        project.donations[msg.sender] = 0;
        
        (bool success, ) = msg.sender.call{value: donationAmount}("");
        require(success, "Refund transfer failed");

        emit RefundIssued(_projectId, msg.sender, donationAmount);
    }

    function deactivateProject(uint256 _projectId) external onlyRole(ADMIN_ROLE) {
        Project storage project = projects[_projectId];
        require(project.isActive, "Project already inactive");
        project.isActive = false;
    }

    // Multi-currency support functions
    function donateToken(uint256 _projectId, address _tokenAddress, uint256 _amount) external nonReentrant {
        Project storage project = projects[_projectId];
        require(project.isActive, "Project is not active");
        
        IERC20 token = IERC20(_tokenAddress);
        require(token.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");
        
        project.donations[msg.sender] += _amount;
        project.raisedAmount += _amount;

        // Mint donation NFT
        donationToken.mint(msg.sender, _projectId, _amount);
        
        emit DonationReceived(_projectId, msg.sender, _amount);
    }

    // Administrative functions
    function addCharity(address _charityAddress) external onlyRole(ADMIN_ROLE) {
        grantRole(CHARITY_ROLE, _charityAddress);
    }

    function removeCharity(address _charityAddress) external onlyRole(ADMIN_ROLE) {
        revokeRole(CHARITY_ROLE, _charityAddress);
    }

    // View functions
    function getProject(uint256 _projectId) external view returns (
        string memory name,
        address charityAddress,
        uint256 goalAmount,
        uint256 raisedAmount,
        bool isActive,
        uint256 milestoneCount
    ) {
        Project storage project = projects[_projectId];
        return (
            project.name,
            project.charityAddress,
            project.goalAmount,
            project.raisedAmount,
            project.isActive,
            project.milestones.length
        );
    }

    function getMilestone(uint256 _projectId, uint256 _milestoneIndex) external view returns (
        string memory description,
        uint256 targetAmount,
        bool isCompleted,
        bool fundsReleased
    ) {
        Project storage project = projects[_projectId];
        require(_milestoneIndex < project.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = project.milestones[_milestoneIndex];
        return (
            milestone.description,
            milestone.targetAmount,
            milestone.isCompleted,
            milestone.fundsReleased
        );
    }

    receive() external payable {}
}