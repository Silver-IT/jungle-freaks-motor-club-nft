import * as dotenv from "dotenv";
import fs from "fs";
import hre, { ethers } from "hardhat";
import keccak256 from "keccak256";

dotenv.config();

const network = hre.network.name;

// Settings //////////////////////////////////////////////////////////////

const settingsNetwork = "rinkeby";
const maxPriorityFeePerGas = ethers.utils.parseUnits("0", "gwei");

const contractOwner = { address: "0x560f5AB13D3D93A674470F90B6d1089c2BB1ceEB" };
const contractSigner = {
  address: "0xd497c27C285E9D32cA316E8D9B4CCd735dEe4C15",
};

const legendaryCOFT =
  "64396628092031731206525383750081342765665389133291640817070595755125256486927";
const legendaryMTFM =
  "64396628092031731206525383750081342765665389133291640817070595754025744859163";

const merkleRoot = keccak256("MerkleRoot");
const date = new Date().toJSON().slice(0, 10);
const dir = `deployment/${network}`;
const contractDeploymentDetails = `${dir}/deployment-${date}.json`;

//////////////////////////////////////////////////////////////////////////

async function main() {
  const [contractDeployer] = await ethers.getSigners();
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
  const rrContractFactory = await ethers.getContractFactory("NJTHE4Q1");
  const rrContract = await rrContractFactory.deploy();
  console.log("deploy transaction hash:", rrContract.deployTransaction.hash);
  process.stdout.write("Deploying..." + "\r");
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
  const jungleFreaksContractFactory = await ethers.getContractFactory(
    "StandardERC721"
  );
  const jfContract = await jungleFreaksContractFactory.deploy();
  console.log("deploy transaction hash:", jfContract.deployTransaction.hash);
  process.stdout.write("Deploying..." + "\r");
  await jfContract.deployed();
  console.log("Fake Freaks Contract Address:", jfContract.address);
  console.log("");

  writeContractData({ jfAddress: jfContract.address });

  await keypress();

  // end fake freaks contract -----

  // Deploy JF Legendary contract --

  console.log("JF Legendary Contract");
  await keypress("Deploy? Press any key to continue and crtl-c to cancel");
  const jflContractFactory = await ethers.getContractFactory("StandardERC1155");
  const jflContract = await jflContractFactory.deploy();
  console.log("deploy transaction hash:", jflContract.deployTransaction.hash);
  process.stdout.write("Deploying..." + "\r");
  await jflContract.deployed();
  console.log("JF Legendary Contract Address:", jflContract.address);
  console.log("");

  writeContractData({ jflAddress: jflContract.address });

  await keypress();

  // end JF Legendary contract -----

  // Deploy Jungle Staking contract --

  console.log("Jungle Staking Contract");
  await keypress("Deploy? Press any key to continue and crtl-c to cancel");
  const jungleContractFactory = await ethers.getContractFactory("NFXHG2Q1");
  const jungleContract = await jungleContractFactory.deploy(
    jfContract.address,
    jflContract.address
  );
  console.log(
    "deploy transaction hash:",
    jungleContract.deployTransaction.hash
  );
  process.stdout.write("Deploying..." + "\r");
  await jungleContract.deployed();
  console.log("Jungle Staking Contract Address:", jungleContract.address);
  console.log("");

  writeContractData({ jungleAddress: jungleContract.address });

  await keypress();

  // end JJungle Staking contract -----

  console.log("Jungle Freaks Motor Club Contract");
  await keypress("Deploy? Press any key to continue and crtl-c to cancel");
  const ContractFactory = await ethers.getContractFactory("NJTG2YY1");
  const contract = await ContractFactory.deploy(
    contractSigner.address,
    rrContract.address,
    jfContract.address,
    jflContract.address,
    jungleContract.address,
    contractOwner.address
  );
  console.log("deploy transaction hash:", contract.deployTransaction.hash);
  process.stdout.write("Deploying..." + "\r");
  await contract.deployed();
  console.log("Jungle Freaks Motor Club Contract Address:", contract.address);

  writeContractData({ contractAddress: contract.address });

  console.log("Set Merkle Root");

  await keypress("Press any key to continue and crtl-c to cancel");
  let tx = await contract.setMerkleRoot(merkleRoot);
  console.log("merkle root transaction hash:", tx.hash);
  await tx.wait();

  await keypress();

  console.log("Mint testnet assets");
  tx = await jflContract.mintTo(contractOwner.address, legendaryCOFT, 1);
  console.log("mint legendaryCOFT transaction hash:", tx.hash);
  await tx.wait();
  tx = await jflContract.mintTo(contractOwner.address, legendaryMTFM, 1);
  console.log("mint legendaryMTFM transaction hash:", tx.hash);
  await tx.wait();
  tx = await jfContract.safeMintTo(contractOwner.address, 1);
  console.log("mint freaks mint transaction hash:", tx.hash);
  await tx.wait();

  console.log("Transfer Ownership to: " + contractOwner.address);

  await keypress("Press any key to continue and crtl-c to cancel");
  tx = await rrContract.transferOwnership(contractOwner.address);
  console.log("royalty owner transaction hash:", tx.hash);
  await tx.wait();
  tx = await contract.transferOwnership(contractOwner.address);
  console.log("jfmc owner transaction hash:", tx.hash);
  await tx.wait();
  tx = await jfContract.transferOwnership(contractOwner.address);
  console.log("freaks owner transaction hash:", tx.hash);
  await tx.wait();
  tx = await jungleContract.transferOwnership(contractOwner.address);
  console.log("jungle owner transaction hash:", tx.hash);
  await tx.wait();

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
