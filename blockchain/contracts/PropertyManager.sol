pragma solidity ^0.5.0;


import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v2.5.0/contracts/math/SafeMath.sol"; 


import "./PropertyToken.sol";


contract PropertyManager  {

    using SafeMath for uint;
    using Counters for Counters.Counter;

    uint constant  SERVICE_FEE = 100;

    // Weeks avaiable for tenting
    struct WeeksAvailable {
        uint startDate;
        uint endDate;
    }
    
    // array of all tokens
    PropertyToken[] public  propertyTokens;
    
    // tokenid to index
    mapping(uint => uint) public tokenIdToIndex;
    
    // owner to index of the token in in the tokens array 
    mapping(address => uint[]) /*public*/ ownerTokens;

    // counter to generate id for each new token 
    Counters.Counter _tokenIds;  
    
    // mappings of weeks avaiable
    mapping(uint => WeeksAvailable[]) /*public*/ weeksAvailable;

    mapping(string => uint) public addressToToken;
    
    //fall back function to accept eth
    function() external payable { } 
 
    // @ dev add a listing and mints a token for the propertyOwner
    function addListing(address payable propertyOwner, 
                        string calldata pAddr,
                        string calldata tokenURI,
                        string calldata ipfsAddress,
                        uint rent,
                        uint startDate, 
                        uint endDate) external payable  returns(uint)  {
                 
        // check if service fee is sent                     
        require(msg.value == SERVICE_FEE, "Service Fee is 100 wei" );
        // Should be listed for atleast a week
        require(endDate > (startDate + 7 days), "End date should be atleast a week" );
        // check to see if _checkDuplicate
        require(!_checkDuplicate(pAddr), "Property Already Exists");
        
        // increment and get token id
        _tokenIds.increment();
        uint tokenId = _tokenIds.current();
        // Instantiate the token
    
        PropertyToken token = new PropertyToken("Property Token", "PROP");
        
        
        // Add details, cant send all the parameters in mind as stack to deep error
        token.add(pAddr, ipfsAddress, rent, startDate, endDate);
        
        // mint it
        token.mintNft(tokenId, propertyOwner, tokenURI);
        
        // push property token in the array of ll tokens
        propertyTokens.push(token);
        
        uint index = propertyTokens.length.sub(1);
        
        // Set tokenId to index of the token in array 
        tokenIdToIndex[tokenId] = index;
        
        // Set push the index of the token on the ownerTokens mapping  
        ownerTokens[propertyOwner].push(index);
        
        // Add the address to token id mapping
        addressToToken[pAddr] = tokenId;
        
        // Generate the array of lists for the token
        //_generateWeeks(index);
        
        return tokenId;
                        
    }
    
    // @Get the address of the token, to verify in metamask
    function getTokenAddress(uint index) external view returns (address)
    {
        return address(propertyTokens[index]);  
    }
    
    //@ dev get details of the token, this is for the UI 
    // returns all properties of the token at an index 
    // Will remove this function once can figure out how react can load an object via web3 
    function getDetails(uint index) external view returns 
                                                (
                                                uint token_id,  
                                                string memory pAddr, 
                                                address payable  propertyOwner,
                                                uint  rentFee,
                                                uint  nonRefundableFee,
                                                uint  depositFee,
                                                string memory  propertyStatus,
                                                uint  startAvailability,
                                                uint  endAvailability,
                                                string memory ifps)
        
            {
        
        return propertyTokens[index].getDetails();
    }

    // @dev Similarly to the above, this just returns all tokens for the owner
    // returns all properties of the token at an index 
    // Will remove this function once can figure out how react can load an object via web3 
    function getOwnerTokenDetails(address propertyOwner1, uint index) external view 
                                                    returns (uint token_id, 
                                                    string memory pAddr, 
                                                    address propertyOwner,   
                                                    uint  rentFee,
                                                    uint  nonRefundableFee,
                                                    uint  depositFee,
                                                    string memory  propertyStatus,
                                                    uint  startAvailability,
                                                    uint  endAvailability, string memory ifps)
    {
        uint index1 = ownerTokens[propertyOwner1][index];
        return propertyTokens[index1].getDetails();
    }

    //@dev Removes the token from all lists and burns it
    // have to check 
    function removeToken(address propertyOwner, uint tokenId) external  payable
    {
        // TO DO check to see if any rental tokens for property that are still not fullfilled
        // if any then dont let removeToken
        //otherwise remove
        require(msg.value == 1 ether, "Please bay 1 eth to remove");
        uint index = tokenIdToIndex[tokenId];
        require(propertyOwner == propertyTokens[index].propertyOwner(), "Invalid Owner" );
        delete ownerTokens[propertyOwner][index] ;
        delete tokenIdToIndex[tokenId];
        delete propertyTokens[index];
        propertyTokens[index].burn();
    }

    //@dev get count of all tokens, put in place for frontend
    function getCount()  external view returns (uint) {
        return propertyTokens.length;
    }
    //@dev get count of all tokens belonging to owner, put in place for frontend
    function getOwnerCount(address propertyOwner)  external view returns (uint) {
        return ownerTokens[propertyOwner].length;
    }
    //@Dev returns the total weeks available for renting
    function getWeeksCount(uint tokenId) external view returns(uint) {
        return weeksAvailable[tokenId].length;
    }

   // @ generate the weeks
    function _generateWeeks(uint index) private  
    {
        
        uint sDate = propertyTokens[index].startAvailability();
        uint endDate = propertyTokens[index].endAvailability().sub(7 days);
        while (sDate <= endDate)
        {
            WeeksAvailable memory wAvail;
            wAvail.startDate =  sDate;
            wAvail.endDate =  endDate;
            weeksAvailable[propertyTokens[index].tokenId()].push(wAvail);
            sDate = sDate.add(7 days);
        }
    }
    //@dev checks if the property already exists
    // assumes that the exact same address is entered
    // does not check for variation of addresses
    // assumes that the same format ia always sent by the frontend (i.e PLACE is always used, never PL)
    function _checkDuplicate(string memory pAddr) public view returns(bool) 
    {
        
        return addressToToken[pAddr] != 0;
    }

}