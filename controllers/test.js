const request = require('request');
const fs = require('fs');
var ProxyServer = require('./proxy');

class Test {
    /**
     * Trimite o cerere de test
     * @param {Request} req 
     * @param {Response} res 
     */
    testRequest(req, res) {
        const {
            server,
            text
        } = req.body;

        const config = JSON.parse(fs.readFileSync("config/config.json", 'UTF8'));
        const servers = config.servers;

        let key = null;
        let alg = null;
        let port = null;
        for (let s in servers) {
            if (servers[s].hostname == server) {
                key = servers[s].encSecretKey;
                alg = servers[s].encAlgorithm;
                port = servers[s].port;
                break;
            }
        }

        const ps = new ProxyServer();

        let encrypted = ps.encrypt(text, key, alg);

        request.post(`http://${server}:${port}/test/resolve`, {
            form: {
                data: encrypted,
                key,
                alg
            }
        }, (err, response, body) => {
            const data = JSON.parse(body).data;

            const decrypted = ps.decrypt(data.encrypted, key, data.iv, alg);

            return res.json({
                iv_1: encrypted.iv,
                text_encrypted: encrypted.encrypted,
                iv_2: data.iv,
                text2_encrypted: data.encrypted,
                text_decrypted: decrypted
            });
        })

    }

    /**
     * Rezolvă o cerere de tip test
     * @param {Request} req 
     * @param {Response} res 
     */
    resolveTestRequest(req, res) {
        const iv = req.body["data[iv]"];
        const data = req.body["data[encrypted]"];
        const key = req.body.key;
        const alg = req.body.alg;

        const ps = new ProxyServer();
        let decrypt = ps.decrypt(data, key, iv, alg);

        const text = `Am daugat zgomot aici. \n ${decrypt}
           \n Dar am adaugat zgomot si aici.
           \n Am putut intelege ceeea ce ai trimis.`;

        const encrypted = ps.encrypt(text, key, alg);

        return res.status(200).json({
            data: encrypted
        });
    }
}

module.exports = new Test();
