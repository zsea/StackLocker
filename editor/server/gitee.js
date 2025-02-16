const qs = require('qs'); // eslint-disable-line import/no-extraneous-dependencies
const request = require('request');
const conf = require('./conf');

function giteeToken(clientId, code, oauth2RedirectUri) {
  const clientIndex = conf.values.giteeClientId.split(',').indexOf(clientId);
  const clientSecret = conf.values.giteeClientSecret.split(',')[clientIndex];
  return new Promise((resolve, reject) => {
    request({
      method: 'POST',
      url: 'https://gitee.com/oauth/token',
      form: {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: oauth2RedirectUri,
      },
      json: true
    }, (err, res, body) => {
      if (err) {
        reject(err);
      }
      const token = body.access_token;
      if (token) {
        resolve(body);
      } else {
        reject(res.statusCode + ',body:' + JSON.stringify(body));
      }
    });
  });
}

exports.giteeToken = (req, res) => {
  giteeToken(req.query.clientId, req.query.code, req.query.oauth2RedirectUri)
    .then(
      tokenBody => res.send(tokenBody),
      err => res
        .status(400)
        .send(err ? err.message || err.toString() : 'bad_code'),
    );
};
