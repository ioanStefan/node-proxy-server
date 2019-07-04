var request = require('request');
const fs = require('fs');
const crypto = require('crypto');
const url = require('url');

class ProxyServer {
    constructor() {
        this.proxyTargetHost = null;
        this.proxyTargetPort = null;
        this.proxyTargetEncSecretKey = null;
        this.proxyTargetEncAlgorithm = null;
        this.proxyEncKey = null;
    }
    /**
     * Metodă ce verifică dacă resursa căutată există
     * @param {Request} req 
     * @private
     */
    proxyReqHostResolver(req) {
        // Preluare adresă resursă căutată
        const host = req.headers.host;
        // Preluare rută
        const baseURL = req.baseUrl;

        // Citire fișier configurare
        let config = JSON.parse(fs.readFileSync("config/config.json", 'UTF8'));
        // Preluare listă servere acreditate
        let servers = config.servers;
        // Preluare cheie pentru criptarea adreselor
        this.proxyEncKey = config.encKeyForHosts;

        // Căutare resursă în lista de servere proxy acreditate
        for (let s in servers) {
            let proxyTo = servers[s].proxyTo;
            let hostIP = host.split(':')[0];
            let hostPORT = host.split(':')[1] || "";
            for (let p in proxyTo) {
                if (proxyTo[p].host == hostIP && proxyTo[p].port == hostPORT) {
                    // Inițializare proprietăți resursă
                    this.proxyTargetHost = servers[s].hostname;
                    this.proxyTargetPort = servers[s].port;
                    this.proxyTargetEncSecretKey = servers[s].encSecretKey;
                    this.proxyTargetEncAlgorithm = servers[s].encAlgorithm;

                    // Return adresă resursă
                    return `http://${host + baseURL}`;
                }
            }
        }
        return false;
    }
    /**
     * Metoda satisface cererile de tip GET.
     * @param {Request} req 
     * @param {Response} res
     * @public
     */
    proxyGetRequest(req, res) {
        // Se verifică dacă resursa cerută există.
        let targetClient = this.proxyReqHostResolver(req);

        if (!targetClient)
            // Dacă resursa nu există se afișează că nu a fost găsită.
            return res.status(404).send('<h1>Not found!</h1>');

        // Preluăm tipul de informație cerute.
        const contentType = req.headers['content-type'];

        // Se criptează adresa resursei.
        // Se utilizează cheia "encKeyForHosts".
        // Această cheie este destinată criptări/decriptări adreselor.
        targetClient = this.encrypt(targetClient, this.proxyEncKey,
            this.proxyTargetEncAlgorithm);

        // Se execută cererea către resursă.
        // Cererea este de tip POST.
        // În acest caz pentru că este o cere de tip GET
        // vor fi trimise doar adresa resursei și tipul metodei
        // către serverul proxy asociat resursei.
        request.post(`http://${this.proxyTargetHost}:${this.proxyTargetPort}/encreq`, {
            form: {
                targetClient,
                method: "GET"
            }
        }, (err, response, body) => {
            if (err)
                return res.status(404).send('<h1>Not found!</h1>');

            // Se parsează răspunsul în format JSON.
            const _body = JSON.parse(body);
            const data = _body.data;
            // Se decriptează datele primite
            const dataDecrypted = this.decrypt(data.encrypted,
                this.proxyTargetEncSecretKey, data.iv, this.proxyTargetEncAlgorithm);
            // Se verifică tipul de răspuns așteptat de client.
            if (contentType === 'text/html') {
                return res.status(response.statusCode).send(dataDecrypted);
            } else if (contentType === 'application/json') {
                return res.status(response.statusCode).json(
                    JSON.parse(dataDecrypted)
                )
            }
        });
    }
    /**
     * Metoda satisface cererile de tip POST. 
     * @param {Request} req 
     * @param {Response} res 
     * @public
     */
    proxyPostRequest(req, res) {
        // Se verifică dacă resursa cerută există.
        let targetClient = this.proxyReqHostResolver(req);

        if (!targetClient)
            // Dacă resursa nu există se afișează că nu a fost găsită.
            return res.status(404).send('<h1>Not found!</h1>');
        // Preluăm tipul de informație cerute.
        const contentType = req.headers['content-type'];

        // Se criptează adresa resursei.
        // Se utilizează cheia "encKeyForHosts".
        // Această cheie este destinată criptări/decriptări adreselor.
        targetClient = this.encrypt(targetClient,
            this.proxyTargetEncSecretKey, this.proxyTargetEncAlgorithm);

        // Se verifică tipul informației ce se trimite.
        let dataToEncrypt;
        if (contentType == 'text/plain')
            dataToEncrypt = req.body;
        else
            dataToEncrypt = JSON.stringify(req.body);

        // Criptare date.
        const data = this.encrypt(dataToEncrypt,
            this.proxyTargetEncSecretKey, this.proxyTargetEncAlgorithm);

        // Se execută cererea către resursă.
        // Cererea este de tip POST.
        // În acest caz pentru că este o cere de tip POST
        // vor fi trimise adresa resursei, tipul metodei
        // și date către serverul proxy asociat resursei.
        request.post(`http://${this.proxyTargetHost}:${this.proxyTargetPort}/encreq`, {
            form: {
                targetClient,
                method: "POST",
                data
            }
        }, (err, response, body) => {
            if (err)
                return res.status(404).send('<h1>Not found!</h1>');

            // Se parsează răspunsul în format JSON.
            const _body = JSON.parse(body);
            const data = _body.data;
            // Se decriptează răspunsul resursei.
            const dataDecrypted = this.decrypt(data.encrypted,
                this.proxyTargetEncSecretKey, data.iv, this.proxyTargetEncAlgorithm);
            // Se afișează răspunsul în formatul cerut de client. 
            if (contentType === 'text/html') {
                return res.status(response.statusCode).send(dataDecrypted);
            } else if (contentType === 'application/json') {
                return res.status(response.statusCode).json(
                    JSON.parse(dataDecrypted)
                )
            }
        });
    }
    /**
     * Metoda satisface cererile unui Server Proxy.
     * @param {Request} req 
     * @param {Response} res
     * @public 
     */
    proxyEncryptRequest(req, res) {
        // Preluare informații din fișierul de configurare.
        let config = JSON.parse(fs.readFileSync("config/config.json", 'UTF8'));
        // Setare resurse interne.
        const internalHosts = config.internalHosts;
        // Setare cheie pentru criparea/decriptarea adresei resursei
        this.proxyEncKey = config.encKeyForHosts;

        // Preluare indice Iv și adresă resursă
        const targetClientIv = req.body['targetClient[iv]'];
        const targetClientEncrypted = req.body['targetClient[encrypted]'];

        let method = req.body.method;
        let dataIv = req.body['data[iv]'] || "";
        let dataEncrypted = req.body['data[encrypted]'] || "";

        // Decriptare adresă resursă.
        let targetClient = this.decrypt(targetClientEncrypted,
            this.proxyEncKey, targetClientIv, "host");
        // Preluare IP resursă
        let targetIp = url.parse(targetClient).hostname;
        // Verificare adresă resursă
        const targetClientKey = this.checkInternalHosts(internalHosts, targetIp);
        if (!targetClientKey)
            return res.status(404).send('Not found!');

        let dataDecrypted = null;
        if (method === 'POST')
            // Dacă methoda folosită de client este POST
            // se decriptează datele trimise de acesta.
            dataDecrypted = this.decrypt(dataEncrypted,
                targetClientKey.key, dataIv, targetClientKey.startegy);

        // Se verifică metoda și se execută cererea specifică
        switch (method) {
            case "GET":
                // Se execută cere de tip GET către resursă
                request.get(targetClient,
                    (err, response, body) => {
                        if (err)
                            return res.status(500).send(err + ' Internal server error!');
                        // Se criptează răspunsul și se trimite clientului
                        const data = this.encrypt(body,
                            targetClientKey.key, targetClientKey.startegy);
                        res.status(response.statusCode).json({
                            data
                        });
                    })
                break;
            case "POST":
                // Se execută cere de tip POST către resursă                
                request.post(targetClient, {
                    form: {
                        dataDecrypted
                    }
                }, (err, response, body) => {
                    if (err)
                        return res.status(500).send('Internal server error!');
                    // Se criptează răspunsul și se trimite clientului
                    const data = this.encrypt(body,
                        targetClientKey.key, targetClientKey.startegy);
                    res.status(response.statusCode).json({
                        data
                    });
                })
                break;
            default:
                break;
        }
    }
    /**
     * Metodă utilizată pentru criptarea datelor
     * @param {String} data
     * @param {String} key
     * @param {String} strategy
     */
    encrypt(data, key, strategy) {
        let iv = null;
        let cipher = null;
        let encrypted = null;

        switch (strategy) {
            case 'aes-256-cbc':
                iv = crypto.randomBytes(16);
                cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);

                encrypted = cipher.update(data);
                encrypted = Buffer.concat([encrypted, cipher.final()]);
                return {
                    iv: iv.toString('hex'),
                        encrypted: encrypted.toString('hex')
                };
            case 'aes-256-ctr':
                iv = crypto.randomBytes(16);
                cipher = crypto.createCipheriv('aes-256-ctr', Buffer.from(key, 'hex'), iv);

                encrypted = cipher.update(data);
                encrypted = Buffer.concat([encrypted, cipher.final()]);
                return {
                    iv: iv.toString('hex'),
                        encrypted: encrypted.toString('hex')
                };
            case 'aes-256-cfb':
                iv = crypto.randomBytes(16);
                cipher = crypto.createCipheriv('aes-256-cfb', Buffer.from(key, 'hex'), iv);

                encrypted = cipher.update(data);
                encrypted = Buffer.concat([encrypted, cipher.final()]);
                return {
                    iv: iv.toString('hex'),
                        encrypted: encrypted.toString('hex')
                };
            case 'des-cbc':
                iv = crypto.randomBytes(key.length / 2);
                cipher = crypto.createCipheriv('des-cbc', Buffer.from(key, 'hex'), iv);

                encrypted = cipher.update(data);
                encrypted = Buffer.concat([encrypted, cipher.final()]);
                return {
                    iv: iv.toString('hex'),
                        encrypted: encrypted.toString('hex')
                };
            case 'des-cfb':
                iv = crypto.randomBytes(key.length / 2);
                cipher = crypto.createCipheriv('des-cfb', Buffer.from(key, 'hex'), iv);

                encrypted = cipher.update(data);
                encrypted = Buffer.concat([encrypted, cipher.final()]);
                return {
                    iv: iv.toString('hex'),
                        encrypted: encrypted.toString('hex')
                };
            case 'host':
                // Pentru criptarea adresei resursei se folosește
                // algoritmul aes-256-cbc
                iv = crypto.randomBytes(16);
                cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
                encrypted = cipher.update(data);
                encrypted = Buffer.concat([encrypted, cipher.final()]);
                return {
                    iv: iv.toString('hex'),
                        encrypted: encrypted.toString('hex')
                };
            default:
                break;
        }

    }
    /**
     * Methodă utilizată pentru decriptare
     * @param {String} data
     * @param {String} key
     * @param {String} iv
     * @param {String} strategy
     */
    decrypt(data, key, iv, strategy) {
        let decipher = null;
        let decrypted = null;
        switch (strategy) {
            case 'aes-256-cbc':
                decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
                decrypted = decipher.update(data, 'hex', 'utf8');
                decrypted += decipher.final('utf8');
                return decrypted;
            case 'aes-256-ctr':
                decipher = crypto.createDecipheriv('aes-256-ctr', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
                decrypted = decipher.update(data, 'hex', 'utf8');
                decrypted += decipher.final('utf8');
                return decrypted;
            case 'aes-256-cfb':
                decipher = crypto.createDecipheriv('aes-256-cfb', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
                decrypted = decipher.update(data, 'hex', 'utf8');
                decrypted += decipher.final('utf8');
                return decrypted;
            case 'des-cbc':
                decipher = crypto.createDecipheriv('des-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
                decrypted = decipher.update(data, 'hex', 'utf8');
                decrypted += decipher.final('utf8');
                return decrypted;
            case 'des-cfb':
                decipher = crypto.createDecipheriv('des-cfb', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
                decrypted = decipher.update(data, 'hex', 'utf8');
                decrypted += decipher.final('utf8');
                return decrypted;
            case 'host':
                // Pentru criptarea adresei resursei se folosește
                // algoritmul aes-256-cbc
                decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
                decrypted = decipher.update(data, 'hex', 'utf8');
                decrypted += decipher.final('utf8');
                return decrypted;
            default:
                break;
        }
    }

    /**
     * 
     * @param {Array} internalHosts 
     * @param {String} targetClient 
     */
    checkInternalHosts(internalHosts, targetIp) {
        for (let i = 0; i < internalHosts.length; i++) {
            if (internalHosts[i].host === targetIp)
                return {
                    key: internalHosts[i].key,
                    startegy: internalHosts[i].encAlgorithm
                }
        }

        return false;
    }
}

module.exports = ProxyServer;