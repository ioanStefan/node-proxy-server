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

    proxyGetRequest(req, res) {
        // Request get with JSON

        request.get('http://172.17.0.111:3001', function (err, response, body) {
            let jsonBody = JSON.parse(body);
            return res.json({
                msg: jsonBody.msg
            })
        })

    }

    proxyPostRequest(req, res) {
        // Request post with JSON

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