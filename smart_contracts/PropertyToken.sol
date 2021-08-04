pragma solidity ^0.5.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v2.5.0/contracts/token/ERC721/ERC721Full.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v2.5.0/contracts/ownership/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v2.5.0/contracts/math/SafeMath.sol"; 

/*
@dev ERC721 Token representing a PropertyToken
*/

contract PropertyToken is ERC165, ERC721Full, Ownable  {

    using SafeMath for uint;
    using Counters for Counters.Counter;

    
    // one to one mapping of token to listing
    uint public tokenId;
    string public propertyAddress;    
    //PropertyListing public tokenListings;
    
    // Status of the listing, Available/UnAvailable - ?? Need more status?
    enum  Status { Available, UnAvailable, Removed } 
    
    // List all varaibles of the property
    // property owner
    address payable public propertyOwner;
    // uri of the ifps  
    string public ifpsAddress;
    // rent of property
    uint public rent;
    
    
    // nonrefundableFee - basically service fee that the renter will pay
    uint public nonRefundable;
    // depoist required
    uint public deposit;
    
    
    // status of the property
    Status public propertyStatus;
    
    // service fee or listingfee for listing the property
    //uint public listingFee;
    // start date of availibility
    uint public startAvailability;
    // end date of availiability
    uint public endAvailability;

    // Events generated 
    event AdieuMinted(uint indexed tokenId, address  indexed propertyOwner, string indexed listingURI);
    event AdieuBurned(uint indexed tokenId, address  indexed propertyOwner, string indexed listingURI);
    
    // Constrctors
    constructor(string memory name, string memory symbol) ERC721Full(name, symbol)  public {
    }
    
    
    function() external payable { } 
 
    // set decimals to 0, as each token is unqiue and one of a kind, as this pops up in metamask
    function decimals() external pure returns(uint) {
        return 0;
    }
    
    // Add properties of the listing 
    // cannot send all in mint, as stack is to deep
    function add(string calldata pAddr,
                string calldata listingIFPS, uint rentFee,  
                uint startDate, uint endDate) external onlyOwner()
    {
        // Calculate the reservation fee and the depoist fee
        rent = rentFee;
        nonRefundable = rent.mul(2).div(7) ; // reservationFee is 2/7th of the rent for the week
        deposit = rent; // Deposit is 7/7 of the rent, i.e. same as the rent
        propertyAddress = pAddr;
        ifpsAddress = listingIFPS;
        startAvailability =startDate;
        endAvailability = endDate;
        propertyStatus = Status.Available;

    }
  
    // @dev mint the nft this can only be called by deployer
    function mintNft(uint Id, address payable receiver, string calldata tokenURI) external onlyOwner() {
        require(!_exists(Id), "Token Already Exists");
        // set tokenId
        tokenId = Id;
        propertyOwner = receiver;
        // mint the token to the receiver
        _mint(receiver, tokenId);
        
        // set the token URI
        _setTokenURI(tokenId, tokenURI);
        
        // set Status
        propertyStatus = Status.Available;

        emit AdieuMinted(Id, receiver, ifpsAddress);
    }
    
    // Get Details of the token
    function getDetails()  external view returns(uint, string memory, 
                        address payable, uint, uint, uint, 
                        string memory, uint, uint, string memory)
    {
        string memory pStatus; 
        // return the status as string
        if (propertyStatus == Status.Available)
            pStatus = "Available";
        else if (propertyStatus == Status.UnAvailable)  
            pStatus = "UnAvailable";
        else if (propertyStatus == Status.Removed)  
            pStatus = "UnAvailable";
        else
            pStatus = "Unknown";
            
        return (tokenId, 
                propertyAddress,
                propertyOwner, 
                rent,
                nonRefundable,
                deposit,
                pStatus,
                startAvailability,
                endAvailability, ifpsAddress);
    }
   
    //@ dev burn the token 
    function burn() external onlyOwner() {
       _burn(tokenId);
       emit AdieuBurned(tokenId, propertyOwner, ifpsAddress);
    }

    function exists() external view returns(bool) {
        return _exists(tokenId);
    }
     
}