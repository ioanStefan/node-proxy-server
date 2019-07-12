var fs = require('fs');

class ConfigServer {

    constructor() { }
    /**
     * Metoda returnează fișierul de configurare.
     * @param {Request} req 
     * @param {Response} res 
     */
    getServers(req, res) {
        let configuration =
            JSON.parse(fs.readFileSync('config/config.json', 'utf8'));
        return res.json({
            configuration
        })
    }
    /**
     * Adăugarea unui nou server proxy
     * @param {Request} req 
     * @param {Response} res 
     * @param {Function} next 
     */
    setNewServer(req, res, next) {
        let newServer = req.body;
        newServer.status = "inactive";
        let configuration =
            JSON.parse(fs.readFileSync('config/config.json', 'utf8'));
        configuration.servers.push(newServer);
        fs.writeFile('config/config.json',
            JSON.stringify(configuration), (err) => {
                if (err)
                    return res.status(500).end();
            })
        return res.status(200).end();
    }
    /**
     * Modificarea datelor unui server proxy
     * @param {Request} req 
     * @param {Response} res 
     * @param {Function} next 
     */
    updateServer(req, res, next) {
        let server = req.body;
        let configuration =
            JSON.parse(fs.readFileSync('config/config.json', 'utf8'));
        let servers = configuration.servers;
        for (let i = 0; i < servers.length; i++) {
            if (servers[i].hostname === server.hostname) {
                servers[i].port = server.port;
                servers[i].encSecretKey = server.encSecretKey;
                servers[i].encAlgorithm = server.encAlgorithm;
                servers[i].details = server.details;
                break;
            }
        }
        configuration.servers = servers;
        fs.writeFile('config/config.json', JSON.stringify(configuration), (err) => {

            if (err)
                return res.status(500).end();

            return res.status(200).end();
        });
    }
    /**
     * Eliminarea unui server proxy
     * @param {Request} req 
     * @param {Response} res 
     */
    removeServer(req, res) {
        let configuration =
            JSON.parse(fs.readFileSync('config/config.json', 'utf8'));
        let servers = configuration.servers;
        let hostname = req.params['hostname'];
        for (let i = 0; i < servers.length; i++) {
            if (servers[i].hostname === hostname) {
                servers.splice(i, 1);
                break;
            }
        }
        configuration.servers = servers;
        fs.writeFile('config/config.json',
            JSON.stringify(configuration), (err) => {
                if (err) {
                    console.log(err)
                    return res.status(500).end();
                }

                return res.status(200).end();
            })
    }
    /**
     * Adaăugarea unei resurse noi
     * @param {Request} req 
     * @param {Response} res 
     */
    addNewtarget(req, res) {
        let newTarget = req.body;
        let configuration =
            JSON.parse(fs.readFileSync('config/config.json', 'utf8'));
        let servers = configuration.servers;
        for (let i = 0; i < servers.length; i++) {
            if (servers[i].hostname === newTarget.proxy) {
                let proxyTo = servers[i].proxyTo || [];

                proxyTo.push({
                    host: newTarget.host,
                    port: newTarget.port,
                    details: newTarget.details
                });

                servers[i].proxyTo = proxyTo;

                break;
            }
        }
        configuration.servers = servers;
        fs.writeFile('config/config.json',
            JSON.stringify(configuration), (err) => {
                if (err)
                    return res.status(500).end();
                return res.status(200).end();
            })
    }
    /**
     * Modificarea informatțiilor unei resurse
     * @param {Request} req 
     * @param {Response} res 
     */
    updateTarget(req, res) {
        let target = req.body;
        let configuration =
            JSON.parse(fs.readFileSync('config/config.json', 'utf8'));
        let servers = configuration.servers;
        let flag = false;
        for (let i = 0; i < servers.length; i++) {
            if (servers[i].hostname === target.proxy) {
                let proxyTo = servers[i].proxyTo;

                for (let j = 0; j < proxyTo.length; j++) {
                    if (proxyTo[j].host == target.host) {
                        proxyTo[j].port = target.port;
                        proxyTo[j].details = target.details;
                        flag = true;
                        break;
                    }
                }
                if (flag) {
                    servers[i].proxyTo = proxyTo;
                    break;
                }

            }
        }
        configuration.servers = servers;
        fs.writeFile('config/config.json',
            JSON.stringify(configuration), (err) => {

                if (err)
                    return res.status(500).end();
                return res.status(200).end();
            });
    }
    /**
     * Eliminarea unei resurse
     * @param {Request} req 
     * @param {Response} res 
     */
    removeTarget(req, res) {
        let configuration =
            JSON.parse(fs.readFileSync('config/config.json', 'utf8'));
        let servers = configuration.servers;
        let proxy = req.params['proxy'];
        let target = req.params['target'];
        for (let i = 0; i < servers.length; i++) {
            if (servers[i].hostname === proxy) {
                let targets = servers[i].proxyTo;
                for (let j = 0; j < targets.length; j++) {
                    if (targets[j].host == target) {
                        targets.splice(j, 1);
                        break;
                    }
                }
                servers[i].proxyTo = targets;
                break;
            }
        }
        configuration.servers = servers;
        fs.writeFile('config/config.json',
            JSON.stringify(configuration), (err) => {
                if (err) {
                    console.log(err)
                    return res.status(500).end();
                }
                return res.status(200).end();
            })
    }
    /**
     * Adăugarea unei resurse interne
     * @param {Request} req 
     * @param {Response} res 
     * @param {Function} next 
     */
    addNewInternalHost(req, res, next) {
        let newServer = req.body;
        let configuration =
            JSON.parse(fs.readFileSync('config/config.json', 'utf8'));
        configuration.internalHosts.push(newServer);
        fs.writeFile('config/config.json',
            JSON.stringify(configuration), (err) => {
                if (err)
                    return res.status(500).end();

                return res.status(200).end();
            })
    }
    /**
     * Modificarea informațiilor unei resurse interne
     * @param {Request} req 
     * @param {Response} res 
     * @param {Function} next 
     */
    updateInternalHost(req, res, next) {
        let internalHost = req.body;
        let configuration =
            JSON.parse(fs.readFileSync('config/config.json', 'utf8'));
        let internalHosts = configuration.internalHosts;
        for (let i = 0; i < internalHosts.length; i++) {
            if (internalHosts[i].host === internalHost.host) {
                internalHosts[i].port = internalHost.port;
                internalHosts[i].key = internalHost.key;
                internalHosts[i].encAlgorithm = internalHost.encAlgorithm;
                internalHosts[i].details = internalHost.details;
                break;
            }
        }
        configuration.internalHosts = internalHosts;
        fs.writeFile('config/config.json', JSON.stringify(configuration), (err) => {

            if (err)
                return res.status(500).end();
            return res.status(200).end();
        });
    }
    /**
     * Eliminarea unei resurse.
     * @param {Request} req 
     * @param {Response} res 
     */
    removeInternalHost(req, res) {
        let configuration = JSON.parse(fs.readFileSync('config/config.json', 'utf8'));
        let internalHosts = configuration.internalHosts;
        let hostname = req.params['host'];
        for (let i = 0; i < servers.length; i++) {
            if (internalHosts[i].host === hostname) {
                internalHosts.splice(i, 1);
                break;
            }
        }
        configuration.internalHosts = internalHosts;
        fs.writeFile('config/config.json', JSON.stringify(configuration), (err) => {
            if (err) {
                console.log(err)
                return res.status(500).end();
            }

            return res.status(200).end();
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