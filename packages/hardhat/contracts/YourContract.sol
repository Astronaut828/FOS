//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

// Use openzeppelin to inherit battle-tested implementations (ERC20, ERC721, etc)
// import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * A smart contract that allows changing a state variable of the contract and tracking the changes
 * It also allows the owner to withdraw the Ether in the contract
 * @author Quizford.eth / BuidlGuidl
 */
contract YourContract {
    address public immutable owner;
    mapping(address => mapping(uint256 => string)) public userCIDs; 
    mapping(address => uint256) private nextCIDIndex;
	mapping(address => mapping(address => bool)) public userFollows;
	mapping(address => address[]) private followedAddresses;

    event CidMapped(address indexed user, uint256 index, string cid);

	// Constructor: Called once on contract deployment
	// Check packages/hardhat/deploy/00_deploy_your_contract.ts
	constructor(address _owner) {
		owner = _owner;
	}

	// Modifier: used to define a set of rules that must be met before or after a function is executed
	// Check the withdraw() function
	modifier isOwner() {
		// msg.sender: predefined variable that represents address of the account that called the current function
		require(msg.sender == owner, "Not the Owner");
		_;
	}

    function setUserCID(string memory _cid) public {
        uint256 index = nextCIDIndex[msg.sender];
        userCIDs[msg.sender][index] = _cid;
        nextCIDIndex[msg.sender]++;
        emit CidMapped(msg.sender, index, _cid);
    }

	function getUserCIDs(address user, uint256 count) public view returns (string[] memory) {
		string[] memory cids = new string[](count);  // check where the count is given / use for pagination
		for (uint256 i = 0; i < count; i++) {
			cids[i] = userCIDs[user][i];
		}
		return cids;
	}

	function getUserCIDsCount(address user) public view returns (uint256) {
		return nextCIDIndex[user];
	}

	// Function that returns the addresses that a user follows
 	function isFollowing(address _user, address _following) public view returns (bool) {
        return userFollows[_user][_following];
    }

    // Updated followAddress function to also update the followedAddresses mapping
    function followAddress(address _toFollow) public {
        require(_toFollow != address(0), "Invalid address");
        require(!userFollows[msg.sender][_toFollow], "Already following");
		require(_toFollow != msg.sender, "Cannot follow yourself");

        userFollows[msg.sender][_toFollow] = true;
        followedAddresses[msg.sender].push(_toFollow); // Add the followed address to the list
    }

    // Function to get the list of followed addresses
    function getFollowedAddresses(address user) public view returns (address[] memory) {
        return followedAddresses[user];
    }

	/**
	 * Function that allows the owner to withdraw all the Ether in the contract
	 * The function can only be called by the owner of the contract as defined by the isOwner modifier
	 */
	function withdraw() public isOwner {
		(bool success, ) = owner.call{ value: address(this).balance }("");
		require(success, "Failed to send Ether");
	}

	/**
	 * Function that allows the contract to receive ETH
	 */
	receive() external payable {}
}
