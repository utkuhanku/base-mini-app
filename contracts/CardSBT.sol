// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CardSBT
 * @notice Soulbound Token (SBT) for Base Mini App profiles.
 * @dev Non-transferable ERC721. Mints cost $1 (USDC), updates cost $2 (USDC).
 */
contract CardSBT is ERC721, Ownable {
    // --- Structs ---
    struct Profile {
        string displayName;
        string avatarUrl;
        string bio;
        string socials; // Store as JSON string or delimiter-separated for gas efficiency
        string websites;
    }

    // --- State Variables ---
    uint256 public totalSupply;
    address public stableToken; // USDC
    address public treasury;

    uint256 public mintPrice; // e.g., 1000000 (1 USDC)
    uint256 public editPrice; // e.g., 2000000 (2 USDC)

    mapping(uint256 => Profile) public profiles;
    mapping(address => uint256) public cardOf; // Maps wallet -> tokenId. 0 means no card.

    // --- Events ---
    event CardMinted(address indexed owner, uint256 indexed tokenId);
    event CardUpdated(address indexed owner, uint256 indexed tokenId);
    event PricingUpdated(uint256 mintPrice, uint256 editPrice);
    event TreasuryUpdated(address treasury);
    event StableTokenUpdated(address token);

    // --- Errors ---
    error Soulbound();
    error AlreadyHasCard();
    error NoCardFound();
    error PaymentFailed();
    error InvalidTreasury();

    constructor(
        address _stableToken,
        address _treasury,
        uint256 _mintPrice,
        uint256 _editPrice
    ) ERC721("MiniApp Profile Card", "CARD") Ownable(msg.sender) {
        stableToken = _stableToken;
        treasury = _treasury;
        mintPrice = _mintPrice;
        editPrice = _editPrice;
    }

    // --- Core Logic ---

    /**
     * @notice Mint a new profile card. One per wallet.
     * @param _profile The initial profile data.
     */
    function mintCard(Profile memory _profile) external {
        if (cardOf[msg.sender] != 0) revert AlreadyHasCard();

        // Transfer Payment
        bool success = IERC20(stableToken).transferFrom(msg.sender, address(this), mintPrice);
        if (!success) revert PaymentFailed();

        // Increment ID
        totalSupply++;
        uint256 newTokenId = totalSupply;

        // Store Data
        profiles[newTokenId] = _profile;
        cardOf[msg.sender] = newTokenId;

        // Optimize: Emit full data only if needed off-chain, otherwise handled by indexers via view
        // For Mini Apps, we rely on the contract state.

        _safeMint(msg.sender, newTokenId);
        emit CardMinted(msg.sender, newTokenId);
    }

    /**
     * @notice Update an existing profile card.
     * @param _profile New profile data.
     */
    function updateCard(Profile memory _profile) external {
        uint256 tokenId = cardOf[msg.sender];
        if (tokenId == 0) revert NoCardFound();

        // Card ownership check is redundant due to cardOf mapping logic (1:1), 
        // but strictly `_requireOwned(tokenId)` is internal.
        // Since cardOf maps user->id and is only set on mint, msg.sender represents the owner.

        // Transfer Payment
        bool success = IERC20(stableToken).transferFrom(msg.sender, address(this), editPrice);
        if (!success) revert PaymentFailed();

        profiles[tokenId] = _profile;
        emit CardUpdated(msg.sender, tokenId);
    }

    // --- Admin Functions ---

    function setPricing(uint256 _mintPrice, uint256 _editPrice) external onlyOwner {
        mintPrice = _mintPrice;
        editPrice = _editPrice;
        emit PricingUpdated(_mintPrice, _editPrice);
    }

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert InvalidTreasury();
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function setStableToken(address _token) external onlyOwner {
        stableToken = _token;
        emit StableTokenUpdated(_token);
    }

    function withdraw() external {
        require(msg.sender == owner() || msg.sender == treasury, "Not authorized");
        uint256 balance = IERC20(stableToken).balanceOf(address(this));
        IERC20(stableToken).transfer(treasury, balance);
    }

    function withdrawETH() external {
        require(msg.sender == owner() || msg.sender == treasury, "Not authorized");
        uint256 balance = address(this).balance;
        (bool success, ) = treasury.call{value: balance}("");
        require(success, "ETH Transfer failed");
    }

    // Allow contract to receive ETH just in case
    receive() external payable {}

    // --- Soulbound Overrides ---

    function transferFrom(address, address, uint256) public virtual override {
        revert Soulbound();
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public virtual override {
        revert Soulbound();
    }

    // Note: No standard approval functions overridden because they usually facilitate transfers.
    // If transfer reverts, approval is useless but harmless. 
    // We strictly block transfers. 
    // (Optional: Block approve() too for clarity, but minimal is safe.)
    function approve(address, uint256) public virtual override {
        revert Soulbound();
    }

    function setApprovalForAll(address, bool) public virtual override {
        revert Soulbound();
    }
}
