#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const process = require('process');

const config = getConfig();
if (!config.domains) {
    console.log("No domains defined in config.ini");
    process.exit(1);
}
const args = process.argv.slice(2);
const hook = args[0];
const fqdn = args[1];
const digest = args[3];
const domain = getDomain(fqdn);


switch (hook) {
    case "deploy_challenge":
        deploy(domain, [ acmeTxtRecord(fqdn, digest) ]);
        break;
    case "clean_challenge":
        clean(domain, undefined, [ acmeTxtRecord(fqdn, digest) ]);

        break;
}



function getConfig() {
    try {
        return JSON.parse(fs.readFileSync("./config.ini"));
    } catch(e) {
        console.log(e);
    }
    process.exit(1);
}

function getDomain(fqdn) {
    if (fqdn) {
        for (const k in config.domains) {
            if (config.domains.hasOwnProperty(k)) {
                if (fqdn.includes(k)) {
                    return k;
                }
            }
        }
    }
    return "unknown";
}

function token(domain) {
    if (config.domains.hasOwnProperty(domain)) {
        return config.domains[domain];
    } else {
        console.log(`No token found for ${domain}`);
    }
    process.exit(1);
}

function acmeTxtRecord(fqdn, digest) {
    return {
        fqdn,
        digest,
    }
}

async function deploy(domain, record) {
    return rotateChallenges(domain, record);
}
async function clean(domain, record) {
    return rotateChallenges(domain, undefined, record);
}

async function get(domain) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: `acmedns.googleapis.com`,
            path: `/v1/acmeChallengeSets/${domain}`,
            method: `GET`,
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
async function rotateChallenges(domain, add, remove, keepExpired) {
    return new Promise((resolve, reject) => {
        const post = {
            accessToken: token(domain),
        };
        if (typeof keepExpired == "boolean") {
            post.keepExpiredRecords = keepExpired;
        }
        if (add !== undefined) {
            post.recordsToAdd = add;
        }
        if (remove !== undefined) {
            post.recordsToRemove = remove;
        }
        const postData = JSON.stringify(post);
        const options = {
            hostname: `acmedns.googleapis.com`,
            path: `/v1/acmeChallengeSets/${domain}:rotateChallenges`,
            method: `POST`,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
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

        req.write(postData);
        req.end();
  });
}
