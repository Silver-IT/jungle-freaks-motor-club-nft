// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

import "@massless/smart-contract-library/contracts/token/ERC721/ERC721A.sol";
import "@massless/smart-contract-library/contracts/royalty/Royalty.sol";
import "@massless/smart-contract-library/contracts/interfaces/IContractURI.sol";
import "@massless/smart-contract-library/contracts/sale/SaleState.sol";
import "@massless/smart-contract-library/contracts/signature/Signature.sol";
import "./JungleFreaksMotorClubWithdrawal.sol";
import "./interfaces/IJungle.sol";

error NotEnoughSupply();
error NotModeratorOrOwner();
error ProofFailed();

error SoldOut();
error IncorrectEthValue();

error MintAddressUsed();
error NotHoldingJungleFreaks();
error QuantityLimitExceeded();

error ReserveLimitExceeded();

error MustMintMinimumOne();
error TransactionMintLimit(uint256 limit);
error ArrayLengthMismatch();

error NoTrailingSlash();
error IncorrectValueJungle();

contract NJTG2YY1 is
    JungleFreaksMotorClubWithdrawal,
    AccessControl,
    ERC721A,
    Royalty,
    Signature,
    SaleState
{
    // Constants
    uint256 public SALE_PRICE = 0.1 ether; // not a constant for testing
    uint256 public MAX_SUPPLY = 8888; // not a constant for testing, reset to uint32 after testing
    uint256 public ALLOW_LIST_SUPPLY = 3333; // not a constant for testing, reset to uint32 after testing
    uint256 public MAX_BATCH_MINT = 5; // not a constant for testing, reset to uint32 after testing

    // Reserved
    uint256 public reserved = 100;

    // AllowList
    uint32 private _allowListQuantity;
    bytes32 public merkleRoot;

    // ERC721 Metadata
    string private _baseURI_ = "https://web3-api-???-uc.a.run.app/";

    // ECDSA
    address private _signer;
    mapping(string => bool) private _isNonceUsed;

    // JF holders
    IERC721 private _jfContract;
    mapping(uint256 => uint256) private _dataStore;

    // Staking
    IJungle private _jungleContract;

    // Legendary
    IERC1155 private _jflContract;

    uint256 private constant _LEGENDARY_COTF =
        64396628092031731206525383750081342765665389133291640817070595755125256486927;
    uint256 private constant _LEGENDARY_MTFM =
        64396628092031731206525383750081342765665389133291640817070595754025744859163;

    // Jungle Bank
    address public constant JUNGLE_BANK =
        0x8e5F332a0662C8c06BDD1Eed105Ba1C4800d4c2f;

    // Roles
    bytes32 public constant MODERATOR = keccak256("MODERATOR");

    // Events
    event SetBaseURI(string _baseURI_);
    event AllowListMintBegins();
    event HoldersGuaranteeMintBegins();
    event HoldersMintBegins();
    event PublicMintBegins();
    event MintEnds();

    constructor(
        address signer_,
        address moderator_,
        address royaltyReceiver_,
        IERC721 jfContract_,
        IERC1155 jflContract_,
        IJungle jungleContract_
    )
        ERC721A("NJTG2YY1", "NJTG2YY1")
        Royalty(royaltyReceiver_, 500) // 50%
        Signature(signer_)
    {
        _jfContract = jfContract_;
        _jflContract = jflContract_;
        _jungleContract = jungleContract_;

        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(MODERATOR, moderator_);
    }

    modifier maxSupplyLimit(uint256 quantity_) {
        uint256 limit = MAX_SUPPLY - reserved - ERC721A._currentIndex;
        if (quantity_ > limit) revert NotEnoughSupply();
        if (quantity_ == 0) revert MustMintMinimumOne();
        _;
    }

    modifier onlyAdmin() {
        if (!(owner() == _msgSender() || hasRole(MODERATOR, _msgSender())))
            revert NotModeratorOrOwner();
        _;
    }

    // Allow List Mint
    function allowListMint(
        bytes calldata signature_,
        bytes8 salt_,
        bytes32[] calldata merkleProof_
    )
        external
        payable
        whenSaleIsActive("AllowListMint")
        maxSupplyLimit(1)
        onlySignedTx(
            keccak256(abi.encodePacked(_msgSender(), salt_, merkleProof_)),
            signature_
        )
    {
        // Checking for staked holders
        uint256 stakedQuanitity = _jungleContract.getStakedAmount(_msgSender());
        if (stakedQuanitity == 0) {
            bool proofVerified = MerkleProof.verify(
                merkleProof_,
                merkleRoot,
                keccak256(abi.encodePacked(_msgSender()))
            );
            if (!proofVerified) revert ProofFailed();
        }

        // Only 3333 Mints
        if (_allowListQuantity >= ALLOW_LIST_SUPPLY) revert SoldOut();

        if (msg.value != SALE_PRICE) revert IncorrectEthValue();

        if (_getAllowListUsed()) revert MintAddressUsed();

        _setAllowListUsed();
        _allowListQuantity++;
        _safeMint(_msgSender(), 1);
    }

    // Holders Guarantee Minting
    function holdersGuaranteeMint(
        bytes calldata signature_,
        bytes8 salt_,
        uint256 jungle_
    )
        external
        payable
        whenSaleIsActive("HoldersGuaranteeMint")
        maxSupplyLimit(1)
        onlySignedTx(
            keccak256(abi.encodePacked(_msgSender(), salt_, jungle_)),
            signature_
        )
    {
        // Holders
        (uint256 tokenHoldings, ) = getTotalHoldings(_msgSender());
        if (tokenHoldings == 0) revert NotHoldingJungleFreaks();

        if (_getHoldersGuaranteeUsed()) revert MintAddressUsed();

        // Get the eth price when subsidised with jungle
        // Reverts when not a valid quantity of $JUNGLE
        uint256 ethPrice = holdersEthPrice(jungle_, 1);

        if (jungle_ > 0) {
            // Update the $JUNGLE contract to allow transfer from this contract
            _jungleContract.transferFrom(_msgSender(), JUNGLE_BANK, jungle_);
        }

        if (msg.value != ethPrice) revert IncorrectEthValue();

        _setHoldersGuaranteeUsed();
        _safeMint(_msgSender(), 1);
    }

    // Holders Minting
    function holdersMint(
        bytes calldata signature_,
        bytes8 salt_,
        uint256 jungle_,
        uint8 quantity_
    )
        external
        payable
        whenSaleIsActive("HoldersMint")
        maxSupplyLimit(quantity_)
        onlySignedTx(
            keccak256(
                abi.encodePacked(_msgSender(), salt_, jungle_, quantity_)
            ),
            signature_
        )
    {
        uint256 totalAllowance = getHoldersTotalAllowance(_msgSender());
        if (totalAllowance == 0) revert NotHoldingJungleFreaks();

        uint8 usedAllowance = _getHoldersUsed();

        if (usedAllowance + quantity_ > totalAllowance)
            revert QuantityLimitExceeded();

        // Get the eth price when subsidised with jungle
        // Reverts when not a valid quantity of $JUNGLE
        uint256 ethPrice = holdersEthPrice(jungle_, quantity_);

        if (jungle_ > 0) {
            // Update the $JUNGLE contract to allow transfer from this contract
            _jungleContract.transferFrom(_msgSender(), JUNGLE_BANK, jungle_);
        }

        if (msg.value != ethPrice) revert IncorrectEthValue();

        _setHoldersUsed(usedAllowance + quantity_);
        _safeMint(_msgSender(), quantity_);
    }

    // Public Minting
    function publicMint(
        bytes calldata signature_,
        bytes8 salt_,
        uint256 jungle_,
        uint8 quantity_
    )
        external
        payable
        whenSaleIsActive("PublicMint")
        maxSupplyLimit(quantity_)
        onlySignedTx(
            keccak256(
                abi.encodePacked(_msgSender(), salt_, jungle_, quantity_)
            ),
            signature_
        )
    {
        if (quantity_ > MAX_BATCH_MINT)
            revert TransactionMintLimit(MAX_BATCH_MINT);

        // Holders
        (uint256 tokenHoldings, ) = getTotalHoldings(_msgSender());

        // If they are not a holder, they can't pay with jungle
        if (tokenHoldings == 0) jungle_ = 0;

        // Get the eth price when subsidised with jungle
        // Reverts when not a valid quantity of $JUNGLE
        uint256 ethPrice = publicEthPrice(jungle_, quantity_);

        if (jungle_ > 0) {
            // Update the $JUNGLE contract to allow transfer from this contract
            _jungleContract.transferFrom(_msgSender(), JUNGLE_BANK, jungle_);
        }

        if (msg.value != ethPrice) revert IncorrectEthValue();

        _safeMint(_msgSender(), quantity_);
    }

    // Reserved
    function reservedMint(address to_, uint32 quantity_)
        public
        onlyOwner
        maxSupplyLimit(quantity_)
    {
        if (quantity_ > reserved) revert ReserveLimitExceeded();

        reserved -= quantity_;

        _safeMint(to_, quantity_);
    }

    // Giveaway
    function giveawayMint(address[] calldata to_, uint32[] calldata quantity_)
        public
        onlyOwner
        maxSupplyLimit(sumArray(quantity_))
    {
        if (to_.length != quantity_.length) revert ArrayLengthMismatch();

        for (uint256 i; i < to_.length; i++) {
            _safeMint(to_[i], quantity_[i]);
        }
    }

    // Burn
    function burn(uint256 tokenId) public {
        TokenOwnership memory prevOwnership = ownershipOf(tokenId);

        bool isApprovedOrOwner = (_msgSender() == prevOwnership.addr ||
            isApprovedForAll(prevOwnership.addr, _msgSender()) ||
            getApproved(tokenId) == _msgSender());

        if (!isApprovedOrOwner) revert TransferCallerNotOwnerNorApproved();

        _burn(tokenId);
    }

    function startAllowListMint() external onlyAdmin {
        _setSaleType("AllowListMint");
        _setSaleState(State.ACTIVE);

        emit AllowListMintBegins();
    }

    function startHoldersGuaranteeMint() external onlyAdmin {
        _setSaleType("HoldersGuaranteeMint");
        _setSaleState(State.ACTIVE);

        emit HoldersGuaranteeMintBegins();
    }

    function startHoldersMint() external onlyAdmin {
        _setSaleType("HoldersMint");
        _setSaleState(State.ACTIVE);

        emit HoldersMintBegins();
    }

    function startPublicMint() external onlyAdmin {
        _setSaleType("PublicMint");
        _setSaleState(State.ACTIVE);

        emit PublicMintBegins();
    }

    function unpauseMint() external onlyAdmin {
        _unpause();
    }

    function pauseMint() external onlyAdmin {
        _pause();
    }

    function endMint() external onlyAdmin {
        if (getSaleState() != State.ACTIVE) revert NoActiveSale();
        _setSaleState(State.FINISHED);
        emit MintEnds();
    }

    // Contract & token metadata
    function setBaseURI(string memory _uri) public onlyAdmin {
        if (bytes(_uri)[bytes(_uri).length - 1] != bytes1("/"))
            revert NoTrailingSlash();

        _baseURI_ = _uri;
        emit SetBaseURI(_uri);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_exists(tokenId), "URI query for nonexistent token");

        return
            string(
                abi.encodePacked(
                    _baseURI_,
                    "token/",
                    toString(tokenId),
                    ".json"
                )
            );
    }

    function contractURI() public view returns (string memory) {
        return string(abi.encodePacked(_baseURI_, "contract.json"));
    }

    // Whitelist
    function setMerkleRoot(bytes32 _merkleRoot) public onlyAdmin {
        merkleRoot = _merkleRoot;
    }

    // Utilities
    function sumArray(uint32[] calldata array_)
        private
        pure
        returns (uint256 result)
    {
        for (uint256 i; i < array_.length; i++) {
            result += array_[i];
        }
    }

    function holdersEthPrice(uint256 j_, uint256 q_)
        public
        pure
        returns (uint256)
    {
        if (j_ == 0 ether) return 0.08 ether * q_;
        if (j_ == 75 ether * q_) return 0.06 ether * q_;
        if (j_ == 150 ether * q_) return 0.04 ether * q_;
        if (j_ == 300 ether * q_) return 0 ether;

        revert IncorrectValueJungle();
    }

    function publicEthPrice(uint256 j_, uint256 q_)
        public
        pure
        returns (uint256)
    {
        if (j_ == 0 ether) return 0.1 ether * q_;
        if (j_ == 90 ether * q_) return 0.075 ether * q_;
        if (j_ == 185 ether * q_) return 0.05 ether * q_;
        if (j_ == 375 ether * q_) return 0 ether;

        revert IncorrectValueJungle();
    }

    function getHoldersTotalAllowance(address address_)
        public
        view
        returns (uint256 totalAllowance)
    {
        (uint256 tokenHoldings, uint256 stakedHoldings) = getTotalHoldings(
            address_
        );

        if (tokenHoldings == 0) return 0;
        else if (tokenHoldings < 5) totalAllowance = 1;
        else if (tokenHoldings < 10) totalAllowance = 2;
        else totalAllowance = 3;

        if (stakedHoldings > 0) totalAllowance += 2;
    }

    function getTotalHoldings(address address_)
        public
        view
        returns (uint256 totalTokenHoldings, uint256 stakedHoldings)
    {
        // Staked Holdings
        {
            (, , , , uint8 cotfStaked, uint8 mtfmStaked) = _jungleContract
                .legendariesStaked(address_);

            stakedHoldings = _jungleContract.getStakedAmount(address_);
            stakedHoldings += cotfStaked + mtfmStaked;
        }

        // Total Holdings
        {
            totalTokenHoldings += stakedHoldings;
            totalTokenHoldings += _jfContract.balanceOf(address_);
            totalTokenHoldings += _jflContract.balanceOf(
                address_,
                _LEGENDARY_COTF
            );
            totalTokenHoldings += _jflContract.balanceOf(
                address_,
                _LEGENDARY_MTFM
            );
        }
    }

    function _setAllowListUsed() private {
        uint64 packed = _getAux(_msgSender());
        _setAux(_msgSender(), packed | uint64(1));
    }

    function _getAllowListUsed() private view returns (bool) {
        uint64 packed = _getAux(_msgSender());
        return (packed & uint64(1)) == 1 ? true : false;
    }

    function _setHoldersGuaranteeUsed() private {
        uint64 packed = _getAux(_msgSender());
        _setAux(_msgSender(), packed | (uint64(1) << 1));
    }

    function _getHoldersGuaranteeUsed() private view returns (bool) {
        uint64 packed = _getAux(_msgSender());
        return ((packed >> 1) & uint64(1)) == 1 ? true : false;
    }

    function _setHoldersUsed(uint8 quantity) private {
        uint64 packed = _getAux(_msgSender());
        _setAux(
            _msgSender(),
            (packed & (~uint64(255) << 2)) | (uint64(quantity) << 2)
        );
    }

    function _getHoldersUsed() private view returns (uint8) {
        uint64 packed = _getAux(_msgSender());
        return uint8((packed >> 2) & uint64(255));
    }

    function toString(uint256 value) internal pure returns (string memory) {
        // Inspired by OraclizeAPI's implementation - MIT licence
        // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // Administration
    function transferOwnership(address newOwner)
        public
        virtual
        override
        onlyOwner
    {
        require(
            newOwner != address(0),
            "Ownable: new owner is the zero address"
        );

        _grantRole(DEFAULT_ADMIN_ROLE, newOwner);
        _revokeRole(DEFAULT_ADMIN_ROLE, owner());
        _transferOwnership(newOwner);
    }

    // Compulsory overrides
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721A, Royalty, AccessControl)
        returns (bool)
    {
        return
            interfaceId == type(IAccessControl).interfaceId ||
            interfaceId == type(IERC2981).interfaceId ||
            interfaceId == type(IContractURI).interfaceId ||
            interfaceId == type(IERC721Enumerable).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
