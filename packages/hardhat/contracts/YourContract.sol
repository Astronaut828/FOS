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
	event NewFollowerAdded(address indexed user, address indexed follower);


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
		emit NewFollowerAdded(_toFollow, msg.sender);
    }

	// Function to unfollow an address by setting the mapping to false and overwriting the address in the array
	function unfollowAddress(address _toUnfollow) public {
		require(_toUnfollow != address(0), "Invalid address");
		require(userFollows[msg.sender][_toUnfollow], "Not following this address");

		userFollows[msg.sender][_toUnfollow] = false;

		// Iterate over the array to find and overwrite the address with null address
		for (uint256 i = 0; i < followedAddresses[msg.sender].length; i++) {
			if (followedAddresses[msg.sender][i] == _toUnfollow) {
				followedAddresses[msg.sender][i] = address(0); // Overwrite with null address
				break;
			}
		}
	}

    // Function to get the list of followed addresses, ignoring the null addresses
	function getFollowedAddresses(address user) public view returns (address[] memory) {
		uint256 count = 0;
		for (uint256 i = 0; i < followedAddresses[user].length; i++) {
			if (followedAddresses[user][i] != address(0)) {
				count++;
			}
		}

		address[] memory validFollowed = new address[](count);
		uint256 index = 0;
		for (uint256 i = 0; i < followedAddresses[user].length; i++) {
			if (followedAddresses[user][i] != address(0)) {
				validFollowed[index] = followedAddresses[user][i];
				index++;
			}
		}

		return validFollowed;
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
