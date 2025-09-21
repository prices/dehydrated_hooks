#!/usr/bin/env node
/**
 * This is an implementation of the name.com API.
 * 
 * https://www.name.com/api-docs/dns
 * 
 * Information on how to implement a hook can be found at:
 * 
 * https://github.com/dehydrated-io/dehydrated/blob/master/docs/dns-verification.md
 * 
 */
const https = require('https');
const fs = require('fs');
const process = require('process');
const path = require('path');
const hostname = "api.dev.name.com";

const config = getConfig(path.dirname(fs.realpathSync(process.argv[1])));
console.log(process.argv);

if (!config.username && !config.token) {
    console.log("No username and/or token defined in config.ini");
    process.exit(1);
}
// The first two args are the node executable and the script name.
const args = process.argv.slice(2);
const hook = args[0];  // The name of the hook we are running.
const fqdn = args[1];  // The fully qualified domain name that we are updating
// args[2] is not used for this hook.
const digest = args[3]; // The digest that we need to set the txt record to
const domain = getDomain(fqdn);

// Do the hooky things.
switch (hook) {
    case "deploy_challenge":
        deploy(domain, acmeTxtRecord(fqdn, digest));
        break;
    case "clean_challenge":
        clean(domain, acmeTxtRecord(fqdn, digest));
        break;
    default:
        // Do nothing here
        //process.stdout.write(`Unimplement hook ${hook}`);
        break;
}

/**
 * This either returns the config if it finds it, or exits the program
 * with an error if it doesn't find it.
 * 
 * @param {*} dir The directory to look for the config file in
 * @returns The config
 */
function getConfig(dir) {
    const file = path.join(dir, "config.ini");
    try {
        return JSON.parse(fs.readFileSync(file));
    } catch(e) {
        console.log(e);
    }
    process.stderr.write(`Failed to read config file ${file}`)
    process.exit(1);
}

/**
 * Gets the domain for the fqdn that is given for the challenge.  This is
 * so that the right domain file can be updated on the DNS.
 * 
 * @param {*} fqdn The fully qualified domain name to get the domain for 
 * @returns The domain, or "unknown" if it doesn't know it.
 */
function getDomain(fqdn) {
    if (fqdn) {
        for (const k of config.domains) {
console.log(`Checking ${k} for ${fqdn}`);
            if (fqdn.includes(k)) {
console.log(`Got domain ${k}`);
                return k;
            }
        }
    }
    return "unknown";
}
/**
 * Gets the API token for a domain.  Errors out if it can not find
 * the token.
 * 
 * @param {*} domain The domain to get the toen for.
 * @returns The API token for the given domain
 */
function auth_header(domain) {
    if (config.username && config.token) {
        return 'Basic ' + new Buffer(config.username + ':' + config.token).toString('base64');
    }
    process.stderr.write(`No token found for ${domain}`);
    process.exit(1);
}

/**
 * Creates a text record for the update.
 * 
 * @param {*} fqdn The fqdn for the record
 * @param {*} digest The challenge digest for the record
 * @returns The record in Googles required format.
 */
function acmeTxtRecord(fqdn, digest) {
    return {
        host: `_acme-challenge.${fqdn}.`,
        type: `TXT`,
        answer: digest,
        ttl: 300,
    }
}

/**
 * Gets the records
 * @param {*} domain The domain to check
 * @returns An array of acmeTxtRecords
 */
async function get(domain) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname,
            path: `/v4/domains/${domain}/records`,
            method: `GET`,
            headers: {
                'Authorization': auth_header(domain),
            },
        }
        const req = https.request(options, (res) => {
            let data = [];
            /*
            const headerDate = res.headers && res.headers.date ? res.headers.date : 'no response date';
            console.log('Status Code:', res.statusCode);
            console.log('Date in Response header:', headerDate);
            */
            res.on('data', chunk => {
                data.push(chunk);
            });

            res.on('end', () => {
                try {
                    resolve(JSON.parse(Buffer.concat(data).toString()));
                } catch(e) {
                    reject(e);
                }
            });
        });
        
        req.on('error', err => {
            reject(err.message);
        });
        
        req.end();
    });
}
/**
 * Does the actual update of the txt records on the name.com DNS servers
 * 
 * @param {*} domain The domain to update
 * @param {*} add An acmeTxtRecord to add.
 * @returns  A Promise to do this request.
 */
async function deploy(domain, add) {
    return new Promise((resolve, reject) => {
        if (add !== undefined) {
            post = { ...add };
        }
        const postData = JSON.stringify(post);
        const options = {
            hostname,
            path: `/v4/domains/${domain}/records`,
            method: `POST`,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': auth_header(domain),
            },
        }
        const req = https.request(options, (res) => {
            let data = [];
            res.on('data', chunk => {
                data.push(chunk);
            });

            res.on('end', () => {
                try {
                    const ret = JSON.parse(Buffer.concat(data).toString());
                    if (add) {
                        const pause = 30000;
                        process.stdout.write(`Waiting ${pause/1000}s for propigation\r\n`);
                        setTimeout(() => resolve(ret), pause);
                    } else {
                        resolve(ret);
                    }
                } catch(e) {
                    reject(e);
                }
            });
        });
        
        req.on('error', err => {
            reject(err.message);
        });

        req.write(postData);
        req.end();
  });
}
/**
 * Does the actual update of the txt records on the name.com DNS servers
 * 
 * @param {*} domain The domain to update
 * @param {*} id The record id to delete.
 * @returns  A Promise to do this request.
 */
async function remove(domain, id) {
    return new Promise((resolve, reject) => {
        if (add !== undefined) {
            post = { ...add };
        }
        const postData = JSON.stringify(post);
        const options = {
            hostname,
            path: `/v4/domains/${domain}/records/${id}`,
            method: `DELETE`,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': auth_header(domain),
            },
        }
        const req = https.request(options, (res) => {
            if (res.statusCode === 200) {
                resolve();
            } else {
                reject();
            }
        });
        req.on('error', err => {
            reject(err.message);
        });

        req.end();
    });
}
