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
     * Encrypt the content of the request based on host target.
     * @param {Request} bodyContent 
     * @param {String} hostTarget 
     * @private
     */
    proxyReqBodyDecorator(bodyContent, hostTarget) {

    }
    /**
     * Decrypt the content of the proxy.
     * @param {Object} proxyResData 
     * @private
     */
    hostResDecorator(proxyResData) {}
    /**
     * 
     * @param {Request} req 
     * @param {Response} res 
     * @param {String} hostTarget 
     */
    proxyRequest(req, res, hostTarget) {}
    /**
     * 
     * @param {Request} req 
     * @param {Response} res 
     * @param {Function} next 
     */
    proxy(req, res, next) {
        console.log(this);

        // this.proxyReqHostResolver(req);
        // this.proxyReqBodyDecorator(req.body)
    }
}

module.exports = new ProxyServer();