// scripts/deploy.js
async function main() {
  // Deploy DonationToken
  const DonationToken = await ethers.getContractFactory("DonationToken");
  const donationToken = await DonationToken.deploy();
  await donationToken.deployed();
  console.log("DonationToken deployed to:", donationToken.address);

  // Deploy CharityPlatform
  const CharityPlatform = await ethers.getContractFactory("CharityPlatform");
  const charityPlatform = await CharityPlatform.deploy(donationToken.address);
  await charityPlatform.deployed();
  console.log("CharityPlatform deployed to:", charityPlatform.address);

  // Save contract addresses
  const fs = require("fs");
  const addresses = {
    donationToken: donationToken.address,
    charityPlatform: charityPlatform.address,
  };
  
  fs.writeFileSync("src/utils/contractAddresses.json", JSON.stringify(addresses, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });