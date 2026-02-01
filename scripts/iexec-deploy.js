/**
 * Deploy iExec TEE Tasks
 */

const { IExec } = require('@iexec/sdk');

async function deployTeeTask(taskName, taskPath) {
  const iexec = new IExec({
    ethProvider: process.env.PROVIDER_URL,
    privateKey: process.env.PRIVATE_KEY,
  });

  console.log(`Deploying ${taskName}...`);

  try {
    // Deploy app to iExec
    const app = await iexec.app.deployApp({
      name: `ccao-${taskName}`,
      type: 'DOCKER',
      multiaddr: taskPath, // Docker image address
      checksum: '0x', // Image checksum
      mrenclave: process.env.MRENCLAVE, // TEE enclave measurement
    });

    console.log(`${taskName} deployed at: ${app.address}`);
    return app.address;
  } catch (error) {
    console.error(`Error deploying ${taskName}:`, error);
    throw error;
  }
}

async function main() {
  const tasks = [
    { name: 'bid-matching', path: './tee-tasks/bid-matching' },
    { name: 'asset-valuation', path: './tee-tasks/asset-valuation' },
    { name: 'compliance-check', path: './tee-tasks/compliance-check' },
  ];

  const deployments = {};

  for (const task of tasks) {
    try {
      const address = await deployTeeTask(task.name, task.path);
      deployments[task.name] = {
        address,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Failed to deploy ${task.name}`);
    }
  }

  console.log('\nDeployments:', JSON.stringify(deployments, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
