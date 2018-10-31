var fs = require('fs')

class ConfigServer {

    constructor() {}

    /**
     * Add a new server where to proxy requests.
     * @param {Request} req 
     * @param {Response} res 
     * @param {Function} next 
     */
    setNewServer(req, res, next) {
        let newServer = req.body.newServer;
        newServer.status = "inactive";

        // Add new server to config.json
        let configuration = JSON.parse(fs.readFileSync('config/config.json', 'utf8'));

        configuration.servers.push(newServer);

        fs.writeFile('config/config.json', this.configuration, (err) => {
            console.log(err);

            return res.json({
                success: false,
                msg: "Can't add this server!"
            })
        })

        return res.json({
            success: true,
            msg: "Added successfully!"
        })
    }

    /**
     * Remove a server from the system.
     * @param {Request} req 
     * @param {Response} res 
     * @param {Function} next 
     */
    removeServer(req, res, next) {

        let configuration = JSON.parse(fs.readFileSync('config/config.json', 'utf8'));
        let servers = configuration.servers;

        let server_host = req.body.server_host;

        for (let i = 0; i < servers.length; i++) {
            if (servers[i].hostname === server_host) {
                servers.splice(i, 1);
                break;
            }
        }

        configuration.servers = servers;

        fs.writeFile('config/config.json', this.configuration, (err) => {
            console.log(err);

            return res.json({
                success: false,
                msg: "Can't add this server!"
            })
        })

        return res.json({
            success: true,
            msg: "Added successfully!"
        })

    }
    /**
     * 
     * @param {Request} req 
     * @param {Response} res 
     */
    establishConnection(req, res) {
        console.log("Connection established!");

        res.json({
            msg: 'Connection established'
        })
    }
}

module.exports = new ConfigServer();