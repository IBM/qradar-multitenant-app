const axios = require('axios');
const https = require('https');

async function main(params) {
  const headers = {
    'Accept': 'application/json',
    'SEC': 'QRADAR_TOKEN'
  };

  const type = params.type

  const agent = new https.Agent({
    rejectUnauthorized: false, // Use with caution; for self-signed certificates
  });

  const qradarLogSourceConfig = {
    method: 'GET',
    url: `https://150.239.57.231:8300/api/config/event_sources/log_source_management/log_source_groups`,
    headers: headers,
    httpsAgent: agent
  };

  try {
    // Fetch log source groups
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
        const { tenantName, domainName, logSourceGroup } = params
        let tenantBody = {
            deleted: true,
            description: `${tenantName}-description created by script`,
            event_rate_limit: 42,
            flow_rate_limit: 42,
            name: tenantName
        }
        const tenantUrl = 'https://150.239.57.231:8300/api/config/access/tenant_management/tenants'
        const response = await axios.post(tenantUrl, tenantBody, { headers, httpsAgent: agent });
        console.log('responsessssss', response.status)
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
          }
          const domainUrl = `https://150.239.57.231:8300/api/config/domain_management/domains`
          const domainResponse = await axios.post(domainUrl, domainBody, { headers, httpsAgent: agent });;
          if (domainResponse.status !== 201) {
              console.error("Unexpected response from QRadar API (Tenants):", domainResponse.status, domainResponse.data);
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
    }

  } catch (error) {
    console.error('Error:', error.response.status);
    if(error && error.response && error.response.status && error.response.status === 409) {
      return {
        statusCode: error.response.status,
        body: { error: error.response.data.message }
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