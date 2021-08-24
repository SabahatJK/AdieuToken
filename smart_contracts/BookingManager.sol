pragma solidity ^0.5.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v2.5.0/contracts/ownership/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v2.5.0/contracts/math/SafeMath.sol"; 

import "./PropertyToken.sol";
import "./RentalToken.sol";
import "./PropertyManager.sol";


/*
    @dev Contract that manages the all rental related activities
    // 1. rental process (nonRefundable=>deposit=>rent), mints the Adieu Token
    // 2. Withdrwal of rent by the owner 5 days after the rent has ended
    // 3. withdrwal of deposit (called refund) 5 days after the rental period has ended
    // 4. breach contract Logic
        
    
*/
contract BookingManager {
    
    using SafeMath for uint;
 
    using Counters for Counters.Counter;
    
    // counter to generate new tokenids and keep track
    Counters.Counter  _tokenIds;
   
    // signifies the startdate and #of weeks
    struct ReservedWeek {
        uint startDate;
        uint endDate;
        bool reserved;
    }
    
    // array of bookings (until it converts to token)
    BookingToken[] bookings;

    //Property Address => Reserved Week
    mapping(uint => ReservedWeek[])  reservedWeeks;

    // array of rented tokens  index in  Bookings
    uint[] public rentalTokens;
    
    //mapping of propertyId to index in array
    mapping(uint => uint[]) public propertyBookings;


    // tenant => index in BookingToken
    mapping(address => uint[]) public tenantTokens;

    //bookingid to depoist
    mapping(uint => uint) deposits;
    
    // rentalID to rent
    mapping(uint => uint) rents;
  
    // map of tokenid to index
    mapping(uint => uint ) tokenIndex;

    // map of bookingindex to rental index
    mapping(uint => uint ) bookingToRental;
    
    // address of property BookingManager
    PropertyManager pManager;
    
    // dummy variable to fast forward time, for 
    uint public _fakenow  = now;

    //events
    event Withdrwal(address propOwner, uint propertyId, uint BookingId, uint amount, uint sDateOfWithWithrwawal);
    event Refund(address propTenant, uint propertyId, uint BookingId, uint amount, uint sDateOfWithWithrwawal);
    event RentWithdrawn(address propOwner,uint propertyId, uint BookingId, uint amount);
    event RefundWithdrawn(address propTenant, uint propertyId, uint BookingId, uint amount);
    event NonRefundable(uint indexed tokenId, address  indexed renter, uint indexed amount);
    //event Deposit indexed tokenId, address  indexed renter, uint indexed amount);
    //event Rent(uint indexed tokenId, address  indexed renter, uint indexed amount);
    
    //fall back function to accept eth
    function() external payable { } 
 
    //@ dev load the propertyManager at that address
    constructor(address payable managerAddr) public {
        require(managerAddr != address(0), "Invalid Address");
        // Get PropetyToken at the address
        pManager = PropertyManager(managerAddr);
        require(address(pManager) != address(0), "Invalid Address");
    }

    
    //@ dev pay the non refundable fee for the property to start the process of renting
    // creates the smart contract for the booking
    // sets status to DepositRequired
    function reserve(uint propertyId,  uint startDate, uint noOfWeeks, address payable tenant) 
                                external payable returns (uint)
    {

        // booking for more than a week
        require(noOfWeeks > 0, "Book for alteast one week");
        
        // calculate the end date
        uint tempEndDate = startDate.add(noOfWeeks.mul(7).mul(24).mul(60).mul(60));
        
        // Get the index of the token in the array
        uint pIndex = pManager.tokenIdToIndex(propertyId);
        // get the property Token    
        PropertyToken pToken = pManager.propertyTokens(pIndex);
        
        // check that the token can be loaded
        require(address(pToken) != address(0), "Invalid Property");
        
        
        // check that the token can be loaded
        require(pToken.exists(), "Invalid Property");


        
        // Check if the start date and number of weeks fall in the property availaibilty range
        require((startDate >= pToken.startAvailability()) && ( tempEndDate  < pToken.endAvailability()), "Unavailable Property");
        
        // Check if the eth passed matches the rental amount
        require(msg.value == pToken.nonRefundable(), "Invalid Non Refundable fee");
        
        // check if its not already rented
        require(_isAvailable(propertyId, startDate, tempEndDate), "Already Rented"); 
        
        // get the nect token Id
        _tokenIds.increment();
        uint tokenId = _tokenIds.current();
    
        // Create a booking Token
        BookingToken bToken = new BookingToken(tokenId, pToken.ifpsAddress(),
                propertyId,
                pToken.propertyOwner(),
                tenant, 
                startDate, 
                noOfWeeks, 
                pToken.rent(), 
                pToken.deposit(), 
                pToken.nonRefundable());
                
        // Push to the array of tokens        
        bookings.push(bToken);
        
        //Get the index in the array- assuimg this is the last one inserted
        // possible bug ?? 
        uint index = bookings.length.sub(1);
        
        // Push index of the property in bookings array to the property address mapping
        // This is to keep track of the of 
        propertyBookings[propertyId].push(index); 
        
        // reserve the weeks 
        //?? Logic needs to be looked at
        reservedWeeks[propertyId].push(ReservedWeek(startDate, tempEndDate, true));

        // push the index on the tenants booking
        tenantTokens[tenant].push(index);
        
        //mapping of tokenId to index
        tokenIndex[tokenId] =  index;
        
        emit NonRefundable(tokenId, tenant, bToken.nonRefundable());   
        return tokenId;
    }

 
    //@dev recieves the desposit in wie for the booking id   
    // updates the status to Rented
    function deposit(uint bookingId) external payable 
    {
        // Get the index of the booking from the bookingId
        uint index = tokenIndex[bookingId];
        // Check if the sender is the tenant
        require(msg.sender == bookings[index].tenant(), "Unauthorized ");
        //Check we have the booking at the right step by checking the status
        require(bookings[index].status() == BookingToken.WorkflowStatus.DepositRequired, "Must Pay non refunadable first ");
        // Check the sender is paying the correct deposit        
        require (msg.value == bookings[index].deposit(), "Invalid deposit Fee");
        // set the bookingId to the depoist paid
        deposits[bookingId] = msg.value;
        // call the token function to update status
        bookings[index].depositRequest();
        
        uint wDate = calculateWithdralDate(bookings[index].startDate(), bookings[index].noOfWeeks());
        
        emit Refund(bookings[index].propertyOwner(), bookings[index].tokenId(), bookingId, msg.value, wDate );    
    }
    
  
    //@dev recieves the rent in wie  
    // mints the token to the tenant of the bookingId
    // updates status to rented
    function rent(uint bookingId, string calldata tokenURI) external payable 
    {
        // Get the index of the booking from the bookingId
        uint index = tokenIndex[bookingId];
        // Check if the sender is the tenant
        require(msg.sender == bookings[index].tenant(), "Unauthorized ");
        //Check we have the booking at the right step by checking the status
        require(bookings[index].status() == BookingToken.WorkflowStatus.RentRequired, "Must deposit first ");
        // Check the sender is paying the correct deposit  
        require (msg.value == bookings[index].rent(), "Invalid rent Fee");
        // push the index on the rentals array
        rentalTokens.push(index);
        uint rIndex = rentalTokens.length.sub(1); 

        // set the rent paid to the depoist paid
        rents[bookingId] = msg.value;
        //mint the token now
        bookings[index]._mintNft(tokenURI, bookingId);
        bookingToRental[index] = rIndex;
        uint wDate = calculateWithdralDate(bookings[index].startDate(), bookings[index].noOfWeeks());
        
        emit Withdrwal(bookings[index].propertyOwner(), bookings[index].tokenId(), bookingId, msg.value, wDate );    
    }

    //@ dev get address of the token
    function getTokenAddress(uint tokenId) external view  returns (address) {
         // get index from token Id
        uint index = tokenIndex[tokenId];
        return address(bookings[index]);
    }
    
    
    //@dev Property Owner can withdraw the rent from the contract 5 days after the rental contract has ended 
    function withdraw(uint rentalId) external 
    {
        // Get the index of the booking from the bookingId
        uint index = tokenIndex[rentalId];
        // Get the booking/rental at that index
        BookingToken bToken = bookings[index];
        // Check that its a valid booking
        require (address(bToken) != address(0), "Invalid Booking" );
        require(bToken.rent() > 0, "Already Withdrawn");
        // Only the propery owner can withdraw the funds
        require (msg.sender == bToken.propertyOwner(), "Unauthorized" );
        // Check if the status is rented
        require(bToken.status() == BookingToken.WorkflowStatus.Rented, "Not yet Rented");
        // calculate the withdrawal date
        uint withDate = bToken.startDate().add(bToken.noOfWeeks().mul(3600).mul(24).div(7).add(5 days));
        require ( _fakenow > withDate, "Too Early" );
        // get the rent amount
        uint amount = rents[rentalId];
        // Set it to 0
        rents[rentalId] = 0;
        // tranfer to the amount to the property owner
        bToken.propertyOwner().transfer(amount);
        //emit RentWithdrawn(bToken.propertyOwner(),bToken.propertyToken().tokenId(), rentalId, amount);
    
    }
        
    //@dev tenant can refund the deposit to the renter 5 days after the rental contract has ended 
    function refund(uint rentalId) external
    {
        // get index from token Id
        uint index = tokenIndex[rentalId];
        //load the booking 
        BookingToken bToken = bookings[index];
        // Check valid booking
        require (address(bToken) != address(0), "Invalid Booking" );
        //check if authorized
        require (msg.sender == bToken.tenant(), "Unauthorized" );
        // Check if already refunded
        require(bToken.deposit() > 0, "Nothing to refund");
        //Check if at correct status
        require(bToken.status() == BookingToken.WorkflowStatus.Rented, "Not yet Rented");
        //calculate withdrawal date
        uint withDate = bToken.startDate().add(bToken.noOfWeeks().mul(3600).mul(24).div(7).add(5 days));
        // Check if its time to withdraw
        //require (now > withDate, "Too Early" );
        require ( _fakenow > withDate, "Too Early" );
        // get amount to refund
        uint amount = deposits[rentalId];
        // set to 0
        deposits[rentalId] = 0;
        //refunf the amount
        bToken.tenant().transfer(amount);
        //emit RefundWithdrawn(bToken.propertyOwner(),bToken.propertyToken.tokenId(), rentalId, amount);
   

   
    }
    
    function getRefund(uint rentalId) external view returns(bool)
    {
        bool result = false;
        if (deposits[rentalId] > 0 )
            result = true;
        return result;        
        
    }
    function getWithdrawal(uint rentalId) external view returns(bool)
    {
        bool result = false;
        if (rents[rentalId] > 0 )
            result = true;
        return result;        
        
    }
    // @dev getdetails of token at index
    function getDetails(uint8 index) external view returns 
                            (uint tokenid, 
                            string memory addr,
                            uint startDate, 
                            uint noOfWeeks, 
                            uint _rent, 
                            uint _deposit, 
                            /*uint refund, stack to deep error */
                            address tenant,
                            address token,
                            BookingToken.WorkflowStatus _status
                            )  
            {
            uint pIndex = pManager.tokenIdToIndex(bookings[index].propertyToken());
            string memory addr1 = pManager.propertyTokens(pIndex).propertyAddress(); 
            return bookings[index].getDetails(addr1); 

                
        }
        
    // @dev Encapsulates logic for when contract is contractBreached
    // Can only be called by propert owner
    // The owner pays half the month rent as breach fee and forfiets his/her/thier rights to the rent paid
    // by the tenant, this is to discourage breaching. This money stays in the contract
    // 
    // the tenant pays the breachfee/damagefee that the renter charges for damage to the property
    // the remaining depost is sent back to the tenant
    function contractBreached(uint rentalId, uint breachFee)  external payable
    {
        uint index = tokenIndex[rentalId];
        BookingToken bToken = bookings[index];
        uint fee = bToken.rent().div(2);
        
        // The owner is calling the breach 
        require(msg.sender == bToken.propertyOwner(), "Unauthorized");
        // make sure the property has been rented
        require(bToken.status() == BookingToken.WorkflowStatus.Rented, "Must rented");
        // 
        require(msg.value == fee, "Invalid breach fee");
        // Breach can only be callled if after start date and the deposit has not been refunded
        // or the rent has not been withdrwan
        require(_fakenow >= bToken.startDate(), "The rental has not started");
        require(deposits[rentalId] >0 , "The deposit has been refunded");
        require(rents[rentalId] >0 , "The rent has been Withdrawn");

        
        // Subtract the breachFee from the deposit of the rental, this will be returned to tenant
        uint amount = deposits[rentalId].sub(breachFee);
        // Set the deposit to 0
        deposits[rentalId] = 0;
        // Set the rent to 0
        rents[rentalId] = 0;
        
        // get the rental index from booking Id
        uint rIndex = bookingToRental[rentalId];
        //Delete rental
        delete rentalTokens[rIndex];
        // Delete booking to rental
        delete bookingToRental[index];
        
        // delete the rest
        //??? Error on this line delete propertyBookings[bToken.propertyToken()][index];
        /* for (uint8 i=0; i <= propertyBookings[bToken.propertyToken()].length; i++)
        {
            
            if (propertyBookings[bToken.propertyToken()][i] == index)
            {
                delete propertyBookings[bToken.propertyToken()][i];
                break;
            }

        }
        
        for (uint8 i=0; i <= tenantTokens[bToken.propertyOwner()].length; i++)
        {
            
            if (tenantTokens[bToken.propertyOwner()][i] == index)
            {
                delete tenantTokens[bToken.propertyOwner()][i];
                break;
            }

        }    
        */
        
        delete deposits[rentalId];
        delete rents[rentalId];

        
        //delete tenantTokens[msg.sender][index];
        delete tokenIndex[rentalId];
        delete bookings[index];
        
        // transter the remaining deposit to the tenant
        bToken.tenant().transfer(amount);
        // Burn the tenant token, the tenant can no longer have the token
        bToken.burn(bToken.tenant());
        
    
    }
    
    // Get the bookings count for the tenant
    function getCntForTenant(address tenant) external view returns (uint)
    {
        return tenantTokens[tenant].length;
    }
    
    
   //Other functions needed for front end
   function getCntForProperty(uint propertyId) external view returns (uint)
    {
        return propertyBookings[propertyId].length;
    }
    

   //@dev fast forward time to test the the withdrwal 
    function fastForward(uint fDate) external {
        _fakenow = fDate;
    }

    // Checks if the dates requested are available
    function _isAvailable(uint propertyId, uint startDate, uint endDate ) private view returns (bool)
    {
        bool isAvialable = true;
        // Loop through the reserved weeks and see if the start date or end date fall between the dates
        // the property is already rented
        for (uint j = 0; j < reservedWeeks[propertyId].length; j++ )
        {
            if ((startDate >= reservedWeeks[propertyId][j].startDate
                &&  startDate < reservedWeeks[propertyId][j].endDate) ||
                (endDate >= reservedWeeks[propertyId][j].startDate
                &&  endDate < reservedWeeks[propertyId][j].endDate) )
            
               isAvialable =  isAvialable && false;
        }       
        return isAvialable;
    
  
    }
    //@ dev calculates the date that the deposit and rent can be withdrawn
    // this is 5 days after the rent period has ended
    function calculateWithdralDate(uint startDate, uint noOfWeeks) private pure returns (uint)
    {
        return startDate.add(noOfWeeks.mul(3600).mul(24).div(7).add(5 days));

    }
}