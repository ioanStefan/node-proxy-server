var request = require('request');
const fs = require('fs');

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
        const baseURL = req.baseURL;

        // Read config/config.json file
        let config = JSON.parse(fs.readFileSync("config/config.json", 'UTF8'));
        let servers = config.servers;

        // Search for requested server
        for (let s in servers) {
            let proxyTo = servers[s].proxyTo;
            let hostIP = host.split(':')[0];
            let hostPORT = host.split(':')[1];
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
        // Request get with JSON
        let proxyHost = this.proxyReqHostResolver(req);

        if (!proxyHost)
            return res.send('<h1>No access!</h1>');

        request.post(`http://${proxyHost}/encreq`, {
            form: {
                targetHost: this.proxyTargetHost,
                targetPort: this.proxyTargetPort,
                method: "GET"
            }
        }, function (err, response, body) {
            // let jsonBody = JSON.parse(body);
            return res.json({
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
        // Request post with JSON
        console.log(req.url)
        request.post('http://172.17.0.111:3001', {
            form: {
                msg: req.body.msg
            }
        }, function (err, response, body) {
            let jsonResponse = JSON.parse(response.body);
            jsonResponse.msg = jsonResponse.msg + " AM adaugat aici ceva in plus dupa ce am primit mesajul";

            return res.json({
                msg: jsonResponse.msg
            })
        })
        ProxyServer.proxy(req, res, next);
    }
    /**
     * A function that handle GET/POST request from a proxy server.
     * Encrypt request response and send it to proxy requester.
     * @param {Request} req 
     * @param {Response} res 
     */
    proxyEncryptRequest(req, res) {
        console.log(req.body);
        res.send('<h1>Hello world</h1>')
    }
}

module.exports = new ProxyServer();