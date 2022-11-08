// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract StandardERC1155 is ERC1155 {
    constructor()
        ERC1155("ipfs://QmentwAN9Lrffbix6iesK7VBT7oKEFGuMaeYmb1hJsQmqM/")
    {}

    function mintTo(
        address to,
        uint256 tokenId,
        uint256 quantity
    ) public {
        _mint(to, tokenId, quantity, "");
    }

    function mint(uint256 tokenId, uint256 quantity) public {
        _mint(msg.sender, tokenId, quantity, "");
    }
}
