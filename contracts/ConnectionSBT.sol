// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ConnectionSBT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    uint256 private _nextTokenId;

    constructor() ERC721("ConnectionSBT", "CSBT") Ownable(msg.sender) {}

    function mintConnection(address partner, string memory uri) public {
        uint256 tokenId1 = _nextTokenId++;
        _safeMint(msg.sender, tokenId1);
        _setTokenURI(tokenId1, uri);

        uint256 tokenId2 = _nextTokenId++;
        _safeMint(partner, tokenId2);
        _setTokenURI(tokenId2, uri);
    }

    // Soulbound: Prevent transfers
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("ConnectionSBT: Soulbound token cannot be transferred");
        }
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
