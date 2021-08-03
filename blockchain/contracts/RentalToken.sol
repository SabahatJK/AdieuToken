
pragma solidity ^0.5.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v2.5.0/contracts/token/ERC721/ERC721Full.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v2.5.0/contracts/ownership/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v2.5.0/contracts/math/SafeMath.sol"; 

/*
    @dev Token for rental Access of a property 
*/

contract BookingToken is ERC165, ERC721Full, Ownable {

    using SafeMath for uint;
    
    // workflow Status of the contract untill it is minted
    // NonRefundableFee Required => Deposit Required => Rent Required => Rented
    enum WorkflowStatus {NonRefundableFeeRequired, DepositRequired, RentRequired, Rented}
        
    // All properties of the rental
    // booking/tokenId
    uint public tokenId;
    // Address of the property
    uint public propertyToken;
    // Owner of the property
    address payable public propertyOwner;
    // tenant that wants to rent
    address payable public tenant;
    // Start of rental
    uint public startDate;
    // Nof of weeeks to rent
    uint public noOfWeeks;
    // rent of the rental
    uint public  rent;
    // deposit of the rental
    uint public  deposit;
    // nonrefundable fee of the rental
    uint public  nonRefundable;
    // status in workflow
    WorkflowStatus public status;
    
    
    // Events generated 
    event NonRefundable(uint indexed tokenId, address  indexed renter, uint indexed amount);
    event Deposit(uint indexed tokenId, address  indexed renter, uint indexed amount);
    event TokenMinted(uint indexed tokenId, address  indexed renter, string indexed rentalURI, uint amount);
    event TokenBurned(uint indexed tokenId, address  indexed renter);
    

    // Construct the token
    constructor(uint Id,  string memory propURI,
        uint propToken, 
        address payable propOwner, 
        address payable propTenant, 
        uint startRentedDate, 
        uint noOfWeeksRented, 
        uint rentFee, 
        uint depositFee, 
        uint nonRefundableFee) 
        ERC721Full("Adieu Coin", "ADIEU") public  {
            tokenId = Id;
            propertyToken = propToken;
            propertyOwner = propOwner;
            tenant = propTenant;
            startDate = startRentedDate;
            noOfWeeks = noOfWeeksRented;
            rent = rentFee * noOfWeeksRented;
            deposit = depositFee * noOfWeeksRented;
            nonRefundable = nonRefundableFee;
            status = WorkflowStatus.DepositRequired;
        _setBaseURI(propURI);
        emit NonRefundable(tokenId, tenant, nonRefundable);
    }

    // set decimals to 0, as each token is unqiue and one of a kind, as this pops up in metamask
    function decimals() external pure returns(uint) {
        return 0;
    }

   function getStatus() external view returns(string memory) {
       //enum WorkflowStatus {NonRefundableFeeRequired, DepositRequired, RentRequired, Rented}
       string memory pStatus;
       // return the status as string
        if (status == WorkflowStatus.NonRefundableFeeRequired)
            pStatus = "NonRefundableFeeRequired";
        else if (status == WorkflowStatus.DepositRequired)  
            pStatus = "DepositRequired";
        else if (status == WorkflowStatus.RentRequired)  
            pStatus = "RentRequired";
        else if (status == WorkflowStatus.Rented)  
            pStatus = "Rented";
        
        return pStatus;
        
   } 
    // @dev change status to deposit
    function depositRequest() external onlyOwner() {
        status = WorkflowStatus.RentRequired;
        emit Deposit(tokenId, tenant, deposit);
    }
    // mint the nft for rental access
    function _mintNft(string calldata URI, uint Id) external onlyOwner() returns (uint)
        {
            // make sure token id does not exists
            require(!_exists(Id), "Token Already Exists");
            tokenId = Id;
            // set status to rented
            status = WorkflowStatus.Rented;
            // mint the token to the tenant
            _mint(tenant, Id );
            // set URI
            _setTokenURI(Id, URI);
            
            emit TokenMinted(tokenId, tenant, URI, rent);
            return tokenId;
        
        }
    // @dev burn the token 
    function burn(address propTenant) external onlyOwner() {
        require(propTenant == tenant, "Not your token");
        _burn(tokenId);
        emit TokenBurned(tokenId, tenant);
    }
    
     

}