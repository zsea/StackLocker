import hex from 'crypto-js/enc-hex';
import sha256 from 'crypto-js/sha256';

function EncryptionPassword(password, nonce) {
  if (!password) return '';
  if (!nonce) {
    return sha256(password).toString(hex);
  }
  return sha256(nonce + sha256(password).toString(hex)).toString(hex);
}
function ValidatePassword(inputPassword, dbPassword, nonce) {
  const encPassword = sha256(nonce + dbPassword).toString(hex);
  return inputPassword === encPassword;
}
export default { EncryptionPassword, ValidatePassword };
