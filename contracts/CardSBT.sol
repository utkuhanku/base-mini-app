// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CardSBT
 * @notice Soulbound Token (SBT) for Base Mini App profiles.
 * @dev Non-transferable ERC721. Supports payments in USDC or ETH.
 *      Enforces strict soulbound behavior by overriding all transfer functions.
 */
contract CardSBT is ERC721, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- Enums ---
    enum PaymentMethod { USDC, ETH }

    // --- Structs ---
    struct Profile {
        string displayName;
        string avatarUrl;
        string bio;
        string socials;
        string websites;
    }

    // --- State Variables ---
    uint256 public totalSupply;
    IERC20 public immutable usdcToken;
    address public treasury;

    // Pricing
    uint256 public mintPriceUSDC;
    uint256 public mintPriceETH;
    
    uint256 public editPriceUSDC;
    uint256 public editPriceETH;

    // Storage
    mapping(uint256 => Profile) public profiles;
    mapping(address => uint256) public cardOf; // Maps wallet -> tokenId. 0 means no card.

    // --- Events ---
    event CardMinted(address indexed owner, uint256 indexed tokenId, PaymentMethod paymentMethod);
    event CardUpdated(address indexed owner, uint256 indexed tokenId, PaymentMethod paymentMethod);
    
    event PricingUpdated(
        uint256 mintPriceUSDC, 
        uint256 mintPriceETH, 
        uint256 editPriceUSDC, 
        uint256 editPriceETH
    );
    
    event TreasuryUpdated(address treasury);
    event FundsWithdrawn(address indexed token, uint256 amount);

    // --- Errors ---
    error Soulbound();
    error AlreadyHasCard();
    error NoCardFound();
    error InvalidTreasury();
    error InvalidPayment();
    error InsufficientPayment();
    error MixedPayment(); // Sending ETH when choosing USDC

    constructor(
        address _usdcToken,
        address _treasury,
        uint256 _mintPriceUSDC,
        uint256 _mintPriceETH,
        uint256 _editPriceUSDC,
        uint256 _editPriceETH
    ) ERC721("MiniApp Profile Card", "CARD") Ownable(msg.sender) {
        if (_treasury == address(0)) revert InvalidTreasury();
        
        usdcToken = IERC20(_usdcToken);
        treasury = _treasury;
        
        mintPriceUSDC = _mintPriceUSDC;
        mintPriceETH = _mintPriceETH;
        editPriceUSDC = _editPriceUSDC;
        editPriceETH = _editPriceETH;
    }

    // --- Core Logic ---

    /**
     * @notice Mint a new profile card. One per wallet.
     * @param _profile The initial profile data.
     * @param _method Payment method (USDC or ETH).
     */
    function mintCard(Profile memory _profile, PaymentMethod _method) external payable nonReentrant {
        if (cardOf[msg.sender] != 0) revert AlreadyHasCard();

        // Handle Payment
        _handlePayment(_method, mintPriceUSDC, mintPriceETH);

        // Mint Logic
        totalSupply++;
        uint256 newTokenId = totalSupply;

        profiles[newTokenId] = _profile;
        cardOf[msg.sender] = newTokenId;

        _safeMint(msg.sender, newTokenId);
        emit CardMinted(msg.sender, newTokenId, _method);
    }

    /**
     * @notice Update an existing profile card.
     * @param _profile New profile data.
     * @param _method Payment method (USDC or ETH).
     */
    function updateCard(Profile memory _profile, PaymentMethod _method) external payable nonReentrant {
        uint256 tokenId = cardOf[msg.sender];
        if (tokenId == 0) revert NoCardFound();

        // Handle Payment
        _handlePayment(_method, editPriceUSDC, editPriceETH);

        // Update Logic
        profiles[tokenId] = _profile;
        emit CardUpdated(msg.sender, tokenId, _method);
    }

    // --- Internal Payment Handler ---

    function _handlePayment(PaymentMethod _method, uint256 _priceUSDC, uint256 _priceETH) internal {
        if (_method == PaymentMethod.USDC) {
            // USDC Path: MUST NOT send ETH
            if (msg.value > 0) revert MixedPayment();
            
            // Safe Transfer USDC
            usdcToken.safeTransferFrom(msg.sender, address(this), _priceUSDC);
        } else {
            // ETH Path: MUST send exact ETH
            if (msg.value != _priceETH) revert InsufficientPayment();
        }
    }

    // --- Admin Functions ---

    function setPricing(
        uint256 _mintPriceUSDC,
        uint256 _mintPriceETH,
        uint256 _editPriceUSDC,
        uint256 _editPriceETH
    ) external onlyOwner {
        mintPriceUSDC = _mintPriceUSDC;
        mintPriceETH = _mintPriceETH;
        editPriceUSDC = _editPriceUSDC;
        editPriceETH = _editPriceETH;
        
        emit PricingUpdated(_mintPriceUSDC, _mintPriceETH, _editPriceUSDC, _editPriceETH);
    }

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert InvalidTreasury();
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    /**
     * @notice Withdraws both ETH and USDC to the Treasury.
     * @dev Only Owner can call. Funds ALWAYS go to Treasury.
     */
    function withdraw() external onlyOwner nonReentrant {
        // 1. Withdraw ETH
        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) {
            (bool success, ) = treasury.call{value: ethBalance}("");
            require(success, "ETH Transfer failed");
            emit FundsWithdrawn(address(0), ethBalance);
        }

        // 2. Withdraw USDC
        uint256 usdcBalance = usdcToken.balanceOf(address(this));
        if (usdcBalance > 0) {
            usdcToken.safeTransfer(treasury, usdcBalance);
            emit FundsWithdrawn(address(usdcToken), usdcBalance);
        }
    }

    // Allow contract to receive ETH (e.g. from mistakes or direct sends)
    receive() external payable {}

    // --- STRICT Soulbound Overrides ---

    /**
     * @dev Block transfers. Standard ERC721 transferFrom.
     */
    function transferFrom(address, address, uint256) public virtual override {
        revert Soulbound();
    }

    /**
     * @dev Block transfers. Standard ERC721 safeTransferFrom (with data).
     */
    function safeTransferFrom(address, address, uint256, bytes memory) public virtual override {
        revert Soulbound();
    }

    /* 
     * Note: safeTransferFrom(address, address, uint256) is non-virtual in OpenZeppelin ERC721 
     * and delegates to safeTransferFrom(address, address, uint256, bytes) which is overridden above.
     * Thus, it is securely blocked.
     */

    /**
     * @dev Block approvals. Access to approve is not needed for a Soulbound token.
     */
    function approve(address, uint256) public virtual override {
        revert Soulbound();
    }

    /**
     * @dev Block operator approvals.
     */
    function setApprovalForAll(address, bool) public virtual override {
        revert Soulbound();
    }
}
