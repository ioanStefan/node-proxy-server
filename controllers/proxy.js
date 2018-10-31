var request = require('request');

class ProxyServer {
    constructor() {

    }
    /**
     * Resolve the host where the request shall be sent.
     * @param {Request} req 
     * @private
     */
    proxyReqHostResolver(req) {
        console.log(req.headers.host);
        return true;
    }
    /**
     * 
     * @param {Request} req 
     * @param {Response} res 
     */
    proxyGetRequest(req, res) {
        // Request get with JSON
        console.log(req.url);
        request.get('http://172.17.0.111:3001', function (err, response, body) {
            let jsonBody = JSON.parse(body);
            return res.json({
                msg: jsonBody.msg
            })
        })

    }
    /**
     * 
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
}

module.exports = new ProxyServer();