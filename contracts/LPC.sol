/**
    :::::::::::::::::::::::::::::=*+=+++++*::--------:::::::::::::::::::::::::::::::::::::::::
    ::::::::::::::::::::::::::::-++++++++*+*#*+-::::--++--::::::::::::::::::::::::::::::::::::
    :::::::::::::::::::::--:::::-:....::--===++*-.......-=-=::::::::::::::::::::::::::::::::::
    ::::::::::::::::::=*==.....-####*=...:---.............=-=-.:::::::::::::::::::::::::::::::
    :::::::::::::::-*#*#+=......:=+####=...:-=-........::::====--===----::::::::::::::::::::::
    ::::::::::::::=%%%%%%%=:.......:-=##*.....-==--::::...:==+++++==+++*##%%##*+=-::::::::::::
    ::::::::::::::=%%%%%%%%#=:......::==-::::::.....::-+++--===+*##%%%%%@@@%%@%%%*::::::::::::
    :::::::::::::::=%%%%%%##*==:::-==---......:--=+++==--=+*#%%%%%%%+:--------::::::::::::::::
    ::::::::::::::::-#*+++****++----=++++++++++===---=+#%%%%%%%%%@@@%-::::::::::::::::::::::::
    ::::::::::::::::::-#@@@@##%%%##*++==--------=+*#%%%%%%%%@@@@%%%%%#::::::::::::::::::::::::
    :::::::::::::::::::*@@@@#***##%%%%%%%%%%##%%%%@@@%##%%#*++***=%##@=:::::::::::::::::::::::
    :::::::::::::::::=*#@@@@#****##%%%%%%-...:::=**#*+*%*.      .+%##%#:::::::::::::::::::::::
    ::::::::::::::::-###+@@@@%****#%%%###%+-:.   .:-+%@@###**+*#######%:::::::::::::::::::::::
    :::::::::::::###%%%%%%@@@@@@%###################%#%%%%############%+::::::::::::::::::::::
    :::::::::::::+**#####+=##***###%%############%*+-:+=++*+*#***#****##::::::::::::::::::::::
    ::::::::::::::::-%###:::-**+++***############*+***#######%#########%-:::::::::::::::::::::
    ::::::::::::::::-%##%-::::=*###%%*+**##%%#***########%@@@%#########%%#=:::::::::::::::::::
    ::::::::::::::::+##%*::::-+*####%%%+=+*#%%##############@##########@%#%%#+=-::::::::::::::
    :::::::::::::::+*##%*=+*####*++%#**#=++=+**#######################%@@+==*%%%%%#:::::::::::
    ::::::::::::::+####%%####%+::::=%++*#=+==-++++**#################%*##%-+%#%%%+::::::::::::
    ::::::::::::::-####*+***+:::::::*#*#*++==-=--==++++*###########**+*+++%%#%#+-:::::::::::::
    ::::::::::::::::::::::::::::::::::=+++**+--------==++++*****+++++=--=+@%#=::::::::::::::::
    :::::::::::::::::::::::::::::::::::::-+*===-------=--=++++++=======+=-##::::::::::::::::::
    :::::::::::::::::::::::::::::::::::::::++--++++===----+++*==*##=+++**+=%::::::::::::::::::
    ::::::::::::::::::::::+::::::::::::::::::-=++=+*+-------##+=-*##+*#**#+*::::::::::::::::::
    ::::::::::::::::::::::%*::::::::::::::::::::#++=+-------+====+=--===-=+:::::::::::::::::::
    ::::::::::::::::::::::%##-::::::::::::::::::#+-:==-----======------+#=::::::::::::::::::::
    ::::::::::::::::::::::+%#%-::::::::::::::::::##*##*##########%%%##*-::::::::::::::::::::::
    :::::::::::::::::::::::+%##*=::::::::::::::::%**#################%=:::::::::::::::::::::::
    :::::::::::::::::::::::::*%###-:::::::::::-++#%##################%::::::::::::::::::::::::
    ::::::::::::::::::::::::::-+*##*=::::::-+####%@%%###############*-::::::::::::::::::::::::
    :::::::::::::::::::::::::::::-=+###***######%%#%############%#+-::::::::::::::::::::::::::
    :::::::::::::::::::::::::::::::::-=+#####################%#+-:::::::::::::::::::::::::::::
    ::::::::::::::::::::::::::::::::::::::-=+*#############+=:::::::::::::::::::::::::::::::::
 */

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

// @title:      Legal Peppers Club
// @twitter:    https://twitter.com/LegalPeppersNFT
// @url:        https://www.legalpepperclub.com/

/** 
                    _                       _         
   /  _  _  _  /  /_/ _   _   _  _  _  _  / ` /    /_
    /_,/_'/_//_|/  /   /_' /_/ /_//_'/ _\  /_, / /_//_/
        _/              /   /                                             
*/

import "./ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/finance/PaymentSplitter.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract LPC is ERC721A, Ownable, ReentrancyGuard, PaymentSplitter {
    using Address for address;
    using MerkleProof for bytes32[];

    enum Status {
        Pending,
        PreSale,
        PublicSale,
        Finished
    }

    Status public status;
    string public baseURI;
    string public notRevealedURI =
        "ipfs://QmYUuwLoiRb8woXwJCCsr1gvbr8E21KuxRtmVBmnH1tZz7/hidden.json";
    bool public revealed = false;
    bytes32 public root;
    uint256 public tokensReserved;
    uint256 public immutable maxSupply = 6666;
    uint256 public immutable reserveAmount = 30;
    uint256 public immutable maxPresaleMint = 12;
    uint256 public constant PRICE = 0.033 ether;

    event Minted(address minter, uint256 amount);
    event StatusChanged(Status status);
    event RootChanged(bytes32 root);
    event ReservedToken(address minter, address recipient, uint256 amount);

    mapping(address => uint256) public addressToMintCount;

    modifier callerIsUser() {
        require(tx.origin == msg.sender, "The caller is another contract");
        _;
    }

    constructor(
        address[] memory _payees,
        uint256[] memory _shares,
        bytes32 _merkleroot
    ) ERC721A("LegalPeppersClub", "LPC", 15) PaymentSplitter(_payees, _shares) {
        root = _merkleroot;
        status = Status.Pending;
    }

    /**
     * @dev Reserve some LPCs for the given address.
     * @param _recipient The address to which the token is minted.
     * @param _amount The amount of tokens to mint.
     */
    function reserveLPCs(address _recipient, uint256 _amount)
        external
        callerIsUser
        onlyOwner
    {
        require(_recipient != address(0), "Zero address");
        require((totalSupply() + _amount) <= maxSupply, "Sold out!");
        require(
            tokensReserved + _amount <= reserveAmount,
            "Max reserve amount exceeded"
        );

        uint256 numChunks = _amount / maxBatchSize;
        for (uint256 i = 0; i < numChunks; i++) {
            _safeMint(_recipient, maxBatchSize);
        }

        uint256 remainder = _amount % maxBatchSize;
        if (remainder > 0) {
            _safeMint(_recipient, remainder);
        }

        tokensReserved += _amount;
        emit ReservedToken(msg.sender, _recipient, _amount);
    }

    /**
     * @dev Presale mints the given amount of LPCs to the msg.sender.
     * @param _amount The amount of tokens to mint.
     * @param _proof The merkle proof that is used to verify the minter is whitelisted.
     */
    function presaleMint(uint256 _amount, bytes32[] calldata _proof)
        external
        payable
        callerIsUser
        nonReentrant
    {
        require(status == Status.PreSale, "Presale is not active.");
        require(_amount <= maxBatchSize, "Max mint amount per tx exceeded.");
        require(PRICE * _amount <= msg.value, "Not enough ETH");
        require(
            MerkleProof.verify(
                _proof,
                root,
                keccak256(abi.encodePacked(msg.sender))
            ),
            "Invalid proof."
        );
        require(
            addressToMintCount[msg.sender] + _amount <= maxPresaleMint,
            "Too many tokens"
        );

        require(
            totalSupply() + _amount + reserveAmount - tokensReserved <=
                maxSupply,
            "Max supply exceeded."
        );

        addressToMintCount[msg.sender] += _amount;

        _safeMint(msg.sender, _amount);
        refundIfOver(PRICE * _amount);

        emit Minted(msg.sender, _amount);
    }

    /**
     * @dev Mints the given amount of LPCs to the msg.sender.
     * @param _amount The amount of tokens to mint.
     */
    function mint(uint256 _amount) external payable callerIsUser nonReentrant {
        require(status == Status.PublicSale, "Public sale is not active.");
        require(_amount <= maxBatchSize, "Max mint amount per tx exceeded.");
        require(
            totalSupply() + _amount + reserveAmount - tokensReserved <=
                maxSupply,
            "Max supply exceeded."
        );

        _safeMint(msg.sender, _amount);
        refundIfOver(PRICE * _amount);

        emit Minted(msg.sender, _amount);
    }

    function setStatus(Status _status) external onlyOwner {
        status = _status;
        emit StatusChanged(_status);
    }

    function refundIfOver(uint256 _price) private {
        require(msg.value >= _price, "Need to send more ETH.");
        if (msg.value > _price) {
            payable(msg.sender).transfer(msg.value - _price);
        }
    }

    function setBaseURI(string memory _baseURI) external onlyOwner {
        baseURI = _baseURI;
    }

    function setNotRevealedURI(string memory _notRevealedURI)
        external
        onlyOwner
    {
        notRevealedURI = _notRevealedURI;
    }

    function reveal() external onlyOwner {
        revealed = true;
    }

    function setMerkleRoot(bytes32 _root) external onlyOwner {
        root = _root;
        emit RootChanged(root);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721A)
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        if (revealed == false) {
            return notRevealedURI;
        }

        return
            bytes(baseURI).length > 0
                ? string(
                    abi.encodePacked(
                        baseURI,
                        Strings.toString(tokenId),
                        ".json"
                    )
                )
                : "";
    }
}
