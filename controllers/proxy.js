var request = require('request');
const fs = require('fs');
const crypto = require('crypto');

class ProxyServer {
    constructor() {
        this.proxyTargetHost = null;
        this.proxyTargetPort = null;
        this.proxyTargetEncSecretKey = null;
        this.proxyTargetEncAlgorithm = null;
    }
    /**
     * Resolve the host where the request shall be sent.
     * @param {Request} req 
     * @private
     */
    proxyReqHostResolver(req) {
        // GET requested client host and baseURL
        const host = req.headers.host;
        const baseURL = req.baseUrl;

        // Read config/config.json file
        let config = JSON.parse(fs.readFileSync("config/config.json", 'UTF8'));
        let servers = config.servers;

        // Search for requested server
        for (let s in servers) {
            let proxyTo = servers[s].proxyTo;
            let hostIP = host.split(':')[0];
            let hostPORT = host.split(':')[1] || "";
            for (let p in proxyTo) {
                if (proxyTo[p].host == hostIP && proxyTo[p].port == hostPORT) {
                    this.proxyTargetHost = servers[s].hostname;
                    this.proxyTargetPort = servers[s].port;
                    this.proxyTargetEncSecretKey = servers[s].encSecretKey;
                    this.proxyTargetEncAlgorithm = servers[s].encAlgorithm;

                    return `http://${host + baseURL}`;
                }
            }
        }
        return false;
    }
    /**
     * A function that handle GET requests for a local client.
     * Here response from a proxy server is decrypted and send to requester client.
     * @param {Request} req 
     * @param {Response} res 
     */
    proxyGetRequest(req, res) {
        // Request GET with JSON
        let targetClient = this.proxyReqHostResolver(req);

        if (!targetClient)
            return res.status(404).send('<h1>Not found!</h1>');

        // Encrypt targetClient
        targetClient = this.encrypt(targetClient, this.proxyTargetEncSecretKey, this.proxyTargetEncAlgorithm);


        request.post(`http://${this.proxyTargetHost}:${this.proxyTargetPort}/encreq`, {
            form: {
                targetClient: {
                    host: targetClient,
                    encAlg: this.proxyTargetEncAlgorithm
                },
                method: "GET"
            }
        }, (err, response, body) => {
            // let jsonBody = JSON.parse(body);  
            // console.log(this.proxyTargetHost);
            if (err)
                return res.status(404).send('<h1>Not found!</h1>');

            // If success decrypt response and send to client            
            return res.status(response.statusCode).json({
                msg: body
            })
        })

    }
    /**
     * A function that handle POST requests for a local client.
     * Here response from a proxy server is decrypted and send to requester client.
     * @param {Request} req 
     * @param {Response} res 
     */
    proxyPostRequest(req, res) {
        // Request POST with JSON
        let targetClient = this.proxyReqHostResolver(req);

        if (!targetClient)
            return res.status(404).send('<h1>Not found!</h1>');

        // Encrypt targetClient

        request.post(`http://${this.proxyTargetHost}:${this.proxyTargetPort}/encreq`, {
            form: {
                targetClient: targetClient,
                method: "POST",
                data: {}
            }
        }, function (err, response, body) {
            // let jsonBody = JSON.parse(body);
            if (err)
                return res.status(404).send('<h1>Not found!</h1>');

            // If success decrypt response and send to client
            return res.status(response.statusCode).json({
                msg: body
            })
        })
    }
    /**
     * A function that handle GET/POST request from a proxy server.
     * Encrypt request response and send it to proxy requester.
     * @param {Request} req 
     * @param {Response} res 
     */
    proxyEncryptRequest(req, res) {

        let targetClient = req.body.targetClient;
        let method = req.body.method;
        let data = req.body.data || "";

        switch (method) {
            case "GET":
                request.get(targetClient.host,
                    function (err, response, body) {
                        // Encrypt data and send back to the client
                        res.json({
                            data: {}
                        });
                    })
                break;
            case "POST":
                request.post(targetClient.host, {
                    form: {
                        data
                    }
                }, function (err, response, body) {
                    // Encrypt data and send back to the client
                    res.json({
                        data: {}
                    });
                })
                break;
            default:
                break;
        }
    }
    /**
     * A function that encrypt request data and response data
     * @param {String} data
     * @param {String} key
     * @param {String} strategy
     */
    encrypt(data, key, strategy) {

        switch (strategy) {
            case 'AES-CTR':
                const iv = crypto.randomBytes(16);
                const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);

                let encrypted = cipher.update(data);
                encrypted = Buffer.concat([encrypted, cipher.final()]);
                return {
                    iv: iv.toString('hex'),
                    ecrypted: encrypted.toString('hex')
                }
            default:
                break;
        }

    }
    /**
     * A function that decrypt request data and response data
     */
    decrypt(data, key, strategy) {

    }
}

module.exports = ProxyServer;