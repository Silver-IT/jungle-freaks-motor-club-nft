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

const rrContract = { address: "0xD1f55C01b44b9F27147a7c351793EF82c2A7B256" };
const jfContract = { address: "0xCF26d81BCbafec9bcc5bAB1c484f1b32e4000b67" };
const jflContract = { address: "0x747C8fE6ad863D515bCBBeC417d4fC964283DfbC" };
const jungleContract = {
  address: "0xd91215bB92b5c19B132A900747e672248d99F72A",
};
const moderators = [
  { address: "0x859010BaAD3E7f51A5EF1e43550056ea29542Fb0" },
  { address: "0x423c8646C235b08d8578A4Ec9B78DA589097Aa08" },
];

const contractName = "NJTG2YY4";

const legendaryCOFT =
  "64396628092031731206525383750081342765665389133291640817070595755125256486927";
const legendaryMTFM =
  "64396628092031731206525383750081342765665389133291640817070595754025744859163";

const merkleRoot =
  "0x6f6de1c903fe8247b645cd2d4b728523f3482f68d5059f7e69c3baf447485ae9";
const date = new Date().toJSON().slice(0, 10);
const dir = `deployment/${network}`;
const contractDeploymentDetails = `${dir}/deployment-${date}-redeploy.json`;

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

  console.log("Jungle Freaks Motor Club Contract");
  await keypress("Deploy? Press any key to continue and ctrl-c to cancel");
  const ContractFactory = await ethers.getContractFactory(contractName);
  const contract = await ContractFactory.deploy(
    contractSigner.address,
    moderators[0].address,
    rrContract.address,
    jfContract.address,
    jflContract.address,
    jungleContract.address
  );
  console.log("deploy transaction hash:", contract.deployTransaction.hash);
  process.stdout.write("Deploying..." + "\r");
  await contract.deployed();
  console.log("Jungle Freaks Motor Club Contract Address:", contract.address);

  writeContractData({ jfmcAddress: contract.address });

  console.log("Set Merkle Root");

  await keypress("Press any key to continue and ctrl-c to cancel");
  let tx = await contract.setMerkleRoot(merkleRoot);
  console.log("merkle root transaction hash:", tx.hash);
  await tx.wait();

  console.log("Add moderators");

  await keypress("Press any key to continue and ctrl-c to cancel");
  for (var mod of moderators) {
    let tx = await contract.grantRole(keccak256("MODERATOR"), mod.address);
    console.log("grantRole transaction hash:", tx.hash);
    await tx.wait();
  }

  await keypress();

  console.log("Transfer Ownership to: " + contractOwner.address);

  tx = await contract.transferOwnership(contractOwner.address);
  console.log("jfmc owner transaction hash:", tx.hash);
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
