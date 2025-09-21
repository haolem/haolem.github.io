function base64Decode(b64) {
    try {
        return atob(b64);
    } catch {
        return null;
    }
}

function strToBuf(str) {
    return new TextEncoder().encode(str);
}
function bufToStr(buf) {
    return new TextDecoder().decode(buf);
}

async function sha256Hex(str) {
    return CryptoJS.SHA256(str).toString(CryptoJS.enc.Hex);
}

function rleEncode(str) {
    let result = '';
    let count = 1;
    for (let i = 1; i <= str.length; i++) {
        if (str[i] === str[i-1]) {
            count++;
        } else {
            if (count > 3) {
                result += count + str[i-1];
            } else {
                result += str[i-1].repeat(count);
            }
            count = 1;
        }
    }
    return result;
}

function rleDecode(str) {
    return str.replace(/(\d+)(.)/g, (_, num, char) => char.repeat(Number(num)));
}

function aesDecrypt(base64Cipher, password) {
    try {
        let raw = CryptoJS.enc.Base64.parse(base64Cipher);
        let iv = CryptoJS.lib.WordArray.create(raw.words.slice(0, 4), 16); // 16 bytes
        let data = CryptoJS.lib.WordArray.create(raw.words.slice(4), raw.sigBytes - 16);
        let key = CryptoJS.SHA256(password);
        let decrypted = CryptoJS.AES.decrypt(
            { ciphertext: data },
            key,
            { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
        );

        return CryptoJS.enc.Utf8.stringify(decrypted);
    } catch (e) {
        console.error("aesDecrypt error:", e);
        return null;
    }
}

async function decodeEnc90(value) {
    if (!value) return null;
    let arr = value.split("");
    let keep910 = arr.slice(9, 11).join("");
    arr.splice(9, 2);
    arr.splice(5, 1);
    arr.splice(4, 1);
    arr.splice(1, 1);
    arr.splice(0, 1);
    let cleaned = arr.join("");
    let step1 = base64Decode(cleaned);
    if (!step1) return ["invalid"];
    let dataPart = step1.slice(0, -64);
    let shaPart = step1.slice(-64);
    let calcSha = await sha256Hex(dataPart);
    if (calcSha !== shaPart) {
        return ["invalid"];
    }
    let step2 = base64Decode(dataPart);
    if (!step2) return ["invalid"];
    let parts = step2.split("|");
    if (parts.length < 2) return ["invalid"];
    let base64Data = parts[0];
    let base64Pass = parts[1];
    let password = base64Decode(base64Pass);
    if (!password) return ["invalid"];
    let decrypted = await aesDecrypt(base64Data, password);
    if (!decrypted) return ["invalid"];
    if (keep910 === "JN") {
        try {
            return JSON.parse(decrypted);
        } catch {
            return ["invalid"];
        }
    }
    return decrypted;
}

function onPath(urlPath) {
  let current = window.location.pathname;
  current = current.replace(/^\/+|\/+$/g, "");
  urlPath = urlPath.replace(/^\/+|\/+$/g, "");
  if (!current) current = "index";
  if (!urlPath) urlPath = "index";
  const stripHtmlExt = str => str.replace(/\.(html?|HTML?)$/, "");
  const isHtml = str => /\.(html?|HTML?)$/.test(str);
  let currentBase = isHtml(current) ? stripHtmlExt(current) : current;
  let urlBase = isHtml(urlPath) ? stripHtmlExt(urlPath) : urlPath;
  const startsWithRoot = /^\/\//.test(arguments[0]);
  const endsStrict = /\/\/$/.test(arguments[0]);
  if (startsWithRoot && endsStrict) {
    return currentBase.toLowerCase() === urlBase.toLowerCase();
  }

  if (startsWithRoot) {
    return currentBase.toLowerCase().startsWith(urlBase.toLowerCase());
  }
  return currentBase.toLowerCase() === urlBase.toLowerCase();
}

function getHash() {
    return window.location.hash ? window.location.hash.substring(1).split("?")[0] : "";
}

async function getQuery(name, type) {
    const params = new URLSearchParams(window.location.search);
    let value = params.get(name);
    if (value === null) return null;
    let values = value.split(",");
    if (!type) {
        return values.length === 1 ? values[0] : values;
    }
    if (type === String || type === "string") {
        return values.length === 1 ? values[0] : values;
    }
    if (type === Number || type === "int" || type === "number") {
        let nums = values.map(v => Number(v));
        return nums.length === 1 ? nums[0] : nums;
    }
    if (type === "base64") {
        let decoded = values.map(v => {
            try {
                return atob(v);
            } catch (e) {
                return null;
            }
        });
        return decoded.length === 1 ? decoded[0] : decoded;
    } else if (type === "enc90") {
        let results = [];
        for (let v of values) {
            results.push(await decodeEnc90(v));
        }
        return results.length === 1 ? results[0] : results;
    }
    return values.length === 1 ? values[0] : values;
}

