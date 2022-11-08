import * as dotenv from "dotenv";
import fs from "fs";
import hre, { ethers } from "hardhat";
import keccak256 from "keccak256";

dotenv.config();

const network = hre.network.name;

// Settings //////////////////////////////////////////////////////////////

const settingsNetwork = "local";
const maxPriorityFeePerGas = ethers.utils.parseUnits("1", "gwei");

const merkleRoot = keccak256("MerkleRoot");
const date = new Date().toJSON().slice(0, 10);
const dir = `deployment/${network}`;
const contractDeploymentDetails = `${dir}/deployment-${date}.json`;

//////////////////////////////////////////////////////////////////////////

async function main() {
  const [contractDeployer, contractOwner, contractSigner] =
    await ethers.getSigners();
  console.log("***************************");
  console.log("*   Contract Deployment   *");
  console.log("***************************");
  console.log("\n");

  console.log("Settings");
  console.log("Network:", network, settingsNetwork == network);
  console.log(
    "Contract Owner Address:",
    contractOwner.address,
    ethers.utils.isAddress(contractOwner.address)
  );
  console.log("\n");

  writeContractData({
    date,
    network,
    contractOwnerAddress: contractOwner.address,
    signerAddress: contractSigner.address,
  });

  await keypress();

  console.log("Deployment Wallet");
  const initialBalance = await contractDeployer.getBalance();
  console.log("Address:", contractDeployer.address);
  console.log("Balance:", ethers.utils.formatEther(initialBalance), "Ether");
  console.log("\n");

  writeContractData({ deployerAddress: contractDeployer.address });

  await keypress();

  // Deploy JFMC royalty receiver contract --

  console.log("Jungle Freaks Motor Club Royalty Receiver Contract");
  await keypress("Deploy? Press any key to continue and crtl-c to cancel");
  process.stdout.write("Deploying..." + "\r");
  const rrContractFactory = await ethers.getContractFactory(
    "JungleFreaksMotorClubRoyaltyReceiver"
  );
  const rrContract = await rrContractFactory.deploy({
    maxPriorityFeePerGas,
  });
  await rrContract.deployed();
  console.log(
    "JungleFreaksMotorClubRoyaltyReceiver Contract Address:",
    rrContract.address
  );
  console.log("");

  writeContractData({ rrAddress: rrContract.address });

  await keypress();

  // end JFMC royalty receiver contract -----

  // Deploy fake jungle freaks contract --

  console.log("Fake Freaks Contract");
  await keypress("Deploy? Press any key to continue and crtl-c to cancel");
  process.stdout.write("Deploying..." + "\r");
  const jungleFreaksContractFactory = await ethers.getContractFactory(
    "StandardERC721"
  );
  const jfContract = await jungleFreaksContractFactory.deploy({
    maxPriorityFeePerGas,
  });
  await jfContract.deployed();
  console.log("Fake Freaks Contract Address:", jfContract.address);
  console.log("");

  writeContractData({ jfAddress: jfContract.address });

  await keypress();

  // end fake freaks contract -----

  // Deploy JF Legendary contract --

  console.log("JF Legendary Contract");
  await keypress("Deploy? Press any key to continue and crtl-c to cancel");
  process.stdout.write("Deploying..." + "\r");
  const jflContractFactory = await ethers.getContractFactory("StandardERC1155");
  const jflContract = await jflContractFactory.deploy({
    maxPriorityFeePerGas,
  });
  await jflContract.deployed();
  console.log("JF Legendary Contract Address:", jflContract.address);
  console.log("");

  writeContractData({ jflAddress: jflContract.address });

  await keypress();

  // end JF Legendary contract -----

  // Deploy Jungle Staking contract --

  console.log("Jungle Staking Contract");
  await keypress("Deploy? Press any key to continue and crtl-c to cancel");
  process.stdout.write("Deploying..." + "\r");
  const jungleContractFactory = await ethers.getContractFactory(
    "InsecureJungle"
  );
  const jungleContract = await jungleContractFactory.deploy(
    jfContract.address,
    jflContract.address,
    {
      maxPriorityFeePerGas,
    }
  );
  await jungleContract.deployed();
  console.log("Jungle Staking Contract Address:", jungleContract.address);
  console.log("");

  writeContractData({ jungleAddress: jungleContract.address });

  await keypress();

  // end JJungle Staking contract -----

  console.log("Jungle Freaks Motor Club Contract");
  await keypress("Deploy? Press any key to continue and crtl-c to cancel");
  process.stdout.write("Deploying..." + "\r");
  const ContractFactory = await ethers.getContractFactory(
    "JungleFreaksMotorClub"
  );
  const contract = await ContractFactory.deploy(
    contractSigner.address,
    rrContract.address,
    jfContract.address,
    jflContract.address,
    jungleContract.address,
    contractOwner.address,
    { maxPriorityFeePerGas }
  );
  await contract.deployed();
  console.log("Jungle Freaks Motor Club Contract Address:", contract.address);

  writeContractData({ contractAddress: contract.address });

  console.log("Set Merkle Root");

  await keypress("Press any key to continue and crtl-c to cancel");
  await contract.setMerkleRoot(merkleRoot, { maxPriorityFeePerGas });

  await keypress();

  console.log("Transfer Ownership to: " + contractOwner.address);

  await keypress("Press any key to continue and crtl-c to cancel");
  await rrContract.transferOwnership(contractOwner.address, {
    maxPriorityFeePerGas,
  });
  await contract.transferOwnership(contractOwner.address, {
    maxPriorityFeePerGas,
  });

  console.log("Completed Successfully");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

async function keypress(text: string = "Press any key to continue...") {
  process.stdout.write(text);
  process.stdin.setRawMode(true);
  return new Promise((resolve) =>
    process.stdin.once("data", (data) => {
      const byteArray = [...data];
      if (byteArray.length > 0 && byteArray[0] === 3) {
        console.log("\n^C");
        process.exit(1);
      }
      process.stdin.setRawMode(false);
      process.stdout.write("\r" + " ".repeat(text.length) + "\r");
      resolve(() => {});
    })
  );
}

function writeContractData(value: any) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  let fileContent = Buffer.from("{}");
  try {
    fileContent = fs.readFileSync(contractDeploymentDetails);
  } catch {}

  let deploymentDetails = JSON.parse(fileContent.toString());
  deploymentDetails = { ...deploymentDetails, ...value };
  fs.writeFileSync(
    contractDeploymentDetails,
    JSON.stringify(deploymentDetails)
  );
}
