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

    uint256 public immutable maxSupply = 6666;
    uint256 public immutable reservedSize = 10;
    uint256 public constant PRICE = 0.033 ether;

    event Minted(address minter, uint256 amount);
    event StatusChanged(Status status);
    event RootChanged(bytes32 root);
    event ReservedToken(address minter, address recipient, uint256 amount);

    mapping(address => uint256) public addressMintBalance;

    uint256[] private _teamShares = [60, 35, 5]; // 3 PEOPLE IN THE TEAM
    address[] private _team = [
        0x933572D5F83B00A998102b7bf1a99c0f197E685B, // Admin Account gets 25% of the total revenue
        0x82de9CE4a49fFeC4C41Cf733126F618eD83a879C, // Test Account gets 35% of the total revenue
        0x8a7aC9834e2D4487Da22Dc130C97Ee8fBDc85568 // VIP Account gets 40% of the total revenue
    ];

    modifier callerIsUser() {
        require(tx.origin == msg.sender, "The caller is another contract");
        _;
    }

    constructor()
        ERC721A("LegalPeppersClub", "LPC", 10)
        PaymentSplitter(_team, _teamShares)
    {}

    // ===== Dev mint =====
    function devMint(uint256 _amount) external callerIsUser onlyOwner {
        require(
            _amount <= reservedSize,
            "Minting amount exceeds reserved size"
        );
        require((totalSupply() + _amount) <= maxSupply, "Sold out!");
        require(
            _amount % maxBatchSize == 0,
            "Can only mint a multiple of the maxBatchSize"
        );
        uint256 numChunks = _amount / maxBatchSize;
        for (uint256 i = 0; i < numChunks; i++) {
            _safeMint(msg.sender, maxBatchSize);
        }
    }

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
            addressMintBalance[msg.sender] + _amount <= 10,
            "Too many tokens"
        );

        require(
            totalSupply() + _amount + reservedSize <= maxSupply,
            "Max supply exceeded."
        );

        addressMintBalance[msg.sender] += _amount;

        _safeMint(msg.sender, _amount);
        refundIfOver(PRICE * _amount);

        emit Minted(msg.sender, _amount);
    }

    function mint(uint256 _amount) external payable callerIsUser nonReentrant {
        require(status == Status.PublicSale, "Public sale is not active.");
        require(_amount <= maxBatchSize, "Max mint amount per tx exceeded.");
        require(
            totalSupply() + _amount + reservedSize <= maxSupply,
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

    function refundIfOver(uint256 price) private {
        require(msg.value >= price, "Need to send more ETH.");
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
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
