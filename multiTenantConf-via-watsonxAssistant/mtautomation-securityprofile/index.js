const axios = require('axios');
const https = require('https');
const { Client } = require('pg');
// const { exec } = require('child_process');
const { NodeSSH } = require('node-ssh');

async function main(params) {

  const headers = {
    'Accept': 'application/json',
    'SEC': process.env.SEC_TOKEN
  };

  const agent = new https.Agent({
    rejectUnauthorized: false, // Use with caution; for self-signed certificates
  });

  const apiIp = process.env.API_IP

  try {
    
    if(params.type && params.type === 'deploy') {

      const deployBody = {
        hosts: [],
        initiated_by: "Admin",
        initiated_from: apiIp,
        percent_complete: 100,
        status: "COMPLETE",
        type: "INCREMENTAL"
      };

      const deployUrl = `https://${apiIp}/api/staged_config/deploy_status`;
      const deployConfig = {
          method: 'POST',
          url: deployUrl,
          headers: headers,
          data: deployBody,
          httpsAgent: agent,
          // timeout: 240000 // 4 minutes in milliseconds
      };
      const deployResponse = await axios(deployConfig);
      if (deployResponse.status !== 200) {
        console.error("Unexpected response from QRadar API (Deploy Status):");
        return {
            statusCode: deployResponse.status,
            body: JSON.stringify({ error: 'Unexpected Error Response' })
        };
    } else {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: {
                deployStatus: deployResponse.data
            }
        };
    }
    }

    const {sp_name, log_source_group_id, domain_id } = params;

    const ssh = new NodeSSH();

    // Define your VM connection details
    const config = {
      host: process.env.HOST,  // IP address or hostname of the VM
      port: 8302,
      username: process.env.SSH_USERNAME,      // SSH username
      password: process.env.SSH_PASSWORD  // Path to your SSH private key (or password can be used instead)
    };

    // Function to stop iptables on the remote VM
    async function stopIptablesOnVM() {
      try {
        // Connect to the remote VM
        await ssh.connect(config);
        
        console.log('Connected to VM!');

        // Execute the command to stop iptables
        const result = await ssh.execCommand('sudo systemctl stop iptables');

        // Check if there are any errors
        if (result.stderr) {
          console.error(`Error stopping iptables: ${result.stderr}`);
        } else {
          console.log(`Command Output`, result);
        }

        // Close the SSH connection
        ssh.dispose();
      } catch (error) {
        console.error(`SSH Connection Error: ${error}`);
      }
    }

    // Run the function
    await stopIptablesOnVM();

    const client = new Client({
      host: process.env.HOST,
      port: 8303,
      user: 'qradar',
      database: 'qradar',
      ssl: false,
    });
    await client.connect();

    const spCreated = await client.query('INSERT INTO staging.securityprofile(epp, name) VALUES($1, $2);', ['Network AND Log Source',`${sp_name}`]);

    const sp = await client.query('SELECT * FROM staging.securityprofile Where name = $1;', [`${sp_name}`]);

    const sp_id = sp.rows[0].id;

    const domainAssigned = await client.query('INSERT INTO staging.sp_domain_link(sp_id, domain_id, has_all_domains) VALUES($1, $2, $3);', [`${sp_id}`, `${domain_id}`, 'f']);

    
    const networkAssigned = await client.query('INSERT INTO staging.sp_network_link(sp_id, netname) VALUES($1, $2);', [`${sp_id}`, 'ALL']);

    
    const logSourceGroupAssigned = await client.query('INSERT INTO staging.sp_sensordevice_group_link(sp_id, dg_id) VALUES($1, $2);', [`${sp_id}`, `${log_source_group_id}`]);

    await client.end();
    const deployBody = {
        hosts: [],
        initiated_by: "Admin",
        initiated_from: apiIp,
        percent_complete: 100,
        status: "COMPLETE",
        type: "INCREMENTAL"
    };
      const deployUrl = `https://${apiIp}/api/staged_config/deploy_status`;
      const deployConfig = {
          method: 'POST',
          url: deployUrl,
          headers: headers,
          data: deployBody,
          httpsAgent: agent,
          // timeout: 240000 // 4 minutes in milliseconds
      };

      const deployResponse = await axios(deployConfig);
    
      if (deployResponse.status !== 200) {
          console.error("Unexpected response from QRadar API (Deploy Status):");
          return {
              statusCode: deployResponse.status,
              body: JSON.stringify({ error: 'Unexpected Error Response' })
          };
      } else {
          return {
              statusCode: 200,
              headers: { 'Content-Type': 'application/json' },
              body: {
                  deployStatus: deployResponse.data,
                  sp_id: parseInt(sp_id)
              }
          };
      }



  } catch (error) {
    console.log('error', error.response.data)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error ' +  error.response.data.message})
    };
  }
}

// const inputParams = {
//   sp_name : 'check_sp9',
//   log_source_group_id: 100082,
//   domain_id: 1
// };

// main(inputParams)
//   .then((result) => {
//     console.log('Result:', result);
//   })
//   .catch(console.error);

// module.exports = { main };

module.exports.main = main;