const axios = require('axios');
const https = require('https');

async function main(params) {
  const headers = {
    'Accept': 'application/json',
    'SEC': process.env.SEC_TOKEN // Use environment variable
  };

  const type = params.type;
  const apiIp = process.env.API_IP; // Use environment variable

  const agent = new https.Agent({
    rejectUnauthorized: false, // Use with caution; for self-signed certificates
  });

  const qradarLogSourceConfig = {
    method: 'GET',
    url: `https://${apiIp}/api/config/event_sources/log_source_management/log_source_groups`,
    headers: headers,
    httpsAgent: agent
  };

  try {
    if(type === 'log') {
        const logSourceResponse = await axios(qradarLogSourceConfig);
        if (logSourceResponse.status !== 200) {
          console.error("Unexpected response from QRadar API (Log Source Groups):", logSourceResponse.status, logSourceResponse.data);
          return {
            statusCode: logSourceResponse.status,
            body: JSON.stringify({ error: 'Unexpected Response' })
          };
        } else {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  logSourceGroups: logSourceResponse.data
                })
            };
        }
    } else if(type === 'tenant') {
        const { tenantName, domainName, logSourceGroup } = params;
        let tenantBody = {
            deleted: true,
            description: `${tenantName}-description created by script`,
            event_rate_limit: 42,
            flow_rate_limit: 42,
            name: tenantName
        };
        const tenantUrl = `https://${apiIp}/api/config/access/tenant_management/tenants`;
        const response = await axios.post(tenantUrl, tenantBody, { headers, httpsAgent: agent });
        console.log('response', response.status);
        if (response.status !== 201) {
            console.error("Unexpected response from QRadar API (Tenants):", response.status, response.data);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: 'Unexpected Response' })
            };
        } else {
          let domainBody = {
            deleted: true,
            description: `${domainName}-description`,
            log_source_group_ids: [ parseInt(logSourceGroup) ],
            name: domainName,
            tenant_id: response.data.id
          };
          const domainUrl = `https://${apiIp}/api/config/domain_management/domains`;
          const domainResponse = await axios.post(domainUrl, domainBody, { headers, httpsAgent: agent });
          if (domainResponse.status !== 201) {
              console.error("Unexpected response from QRadar API (Domains):", domainResponse.status, domainResponse.data);
              return {
                  statusCode: domainResponse.status,
                  body: JSON.stringify({ error: 'Unexpected Response' })
              };
          } else {
              return {
                  statusCode: 200,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    domain: domainResponse.data,
                    tenant: response.data
                  })
              };
          }
        }
    } else if(type === 'deploy') {
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
            timeout: 240000 // 4 minutes in milliseconds
        };
        const deployResponse = await axios(deployConfig);
        if (deployResponse.status !== 200) {
            console.error("Unexpected response from QRadar API (Deploy Status):", deployResponse.status, deployResponse.data);
            return {
                statusCode: deployResponse.status,
                body: JSON.stringify({ error: 'Unexpected Response' })
            };
        } else {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deployStatus: deployResponse.data
                })
            };
        }
    }

  } catch (error) {
    console.error('Error:', error.response ? error.response.status : error.message);
    if (error.response && error.response.status && error.response.status === 409) {
      return {
        statusCode: error.response.status,
        body: JSON.stringify({ error: error.response.data.message })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
}

// Export Main Function for Code Engine Execution
module.exports.main = main;
