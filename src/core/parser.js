import yaml from 'js-yaml';

/**
 * Parses a raw text input (either links or YAML) and converts it to Mihomo format.
 * @param {string} rawText The raw text input from the user.
 * @returns {object[]} An array of Mihomo compatible proxy objects.
 */
export function parse(rawText) {
  if (!rawText) {
    return { success: true, data: [], error: null };
  }

  const trimmedText = rawText.trim();

  // 尝试解析为 YAML
  try {
    const data = yaml.load(trimmedText);
    if (data && typeof data === 'object') {
      // 如果是包含 proxies 字段的对象
      if (data.proxies && Array.isArray(data.proxies)) {
        return { success: true, data: data.proxies, error: null };
      }
      // 如果是数组
      if (Array.isArray(data)) {
        return { success: true, data: data, error: null };
      }
      // 如果是单个代理对象（包含 type 字段）
      if (data.type && typeof data.type === 'string') {
        return { success: true, data: [data], error: null };
      }
    }
  } catch (e) {
    // YAML 解析失败，回退到链接解析
  }

  // 回退到链接解析
  const links = trimmedText.split(/\r?\n/).filter(link => link.trim() !== '');
  const proxies = [];
  let hasValidLinks = false;

  for (const link of links) {
    try {
      if (link.startsWith('vless://')) {
        const proxy = _parseVless(link);
        if (proxy) {
          proxies.push(proxy);
          hasValidLinks = true;
        }
      } else if (link.startsWith('vmess://')) {
        const proxy = _parseVmess(link);
        if (proxy) {
          proxies.push(proxy);
          hasValidLinks = true;
        }
      } else if (link.startsWith('trojan://')) {
        const proxy = _parseTrojan(link);
        if (proxy) {
          proxies.push(proxy);
          hasValidLinks = true;
        }
      } else if (link.startsWith('ss://')) {
        const proxy = _parseSs(link);
        if (proxy) {
          proxies.push(proxy);
          hasValidLinks = true;
        }
      } else if (link.startsWith('hysteria2://')) {
        const proxy = _parseHysteria2(link);
        if (proxy) {
          proxies.push(proxy);
          hasValidLinks = true;
        }
      }
    } catch (error) {
      console.error(`Failed to parse link: ${link}`, error);
    }
  }

  // 如果没有解析出任何有效的代理，返回错误
  if (proxies.length === 0 && !hasValidLinks) {
    return {
      success: false,
      data: [],
      error: '输入格式不正确！请检查输入是否为有效的 YAML 格式或代理链接。'
    };
  }

  return { success: true, data: proxies, error: null };
}

/**
 * Parses a VLESS link.
 * @param {string} link The VLESS link.
 * @returns {object|null} A Mihomo proxy object or null if parsing fails.
 */
function _parseVless(link) {
  const url = new URL(link);
  const params = url.searchParams;

  const proxy = {
    name: decodeURIComponent(url.hash).substring(1) || `${url.hostname}:${url.port}`,
    type: 'vless',
    server: url.hostname,
    port: parseInt(url.port, 10),
    uuid: url.username,
    tls: params.get('security') === 'tls' || params.get('security') === 'reality',
    network: params.get('type') || 'tcp',
    'client-fingerprint': params.get('fp') || 'chrome',
    servername: params.get('sni') || undefined,
    flow: params.get('flow') || undefined,
  };

  if (proxy.network === 'ws') {
    proxy['ws-opts'] = {
      path: params.get('path') || '/',
      headers: {
        Host: params.get('host') || url.hostname,
      },
    };
    // For ws, servername should be the host
    proxy.servername = params.get('host') || url.hostname;
  }

  if (params.get('security') === 'reality') {
    proxy['reality-opts'] = {
      'public-key': params.get('pbk'),
      'short-id': params.get('sid'),
    };
  }
  
  // Add other common parameters with default values
  proxy.tfo = params.get('tfo') === 'true' || false;
  proxy['skip-cert-verify'] = params.get('scv') === 'true' || false;


  return proxy;
}

/**
 * Parses a VMess link.
 * @param {string} link The VMess link.
 * @returns {object|null} A Mihomo proxy object or null if parsing fails.
 */
function _parseVmess(link) {
    const base64Data = link.substring('vmess://'.length);
    const decoded = _safeBase64Decode(base64Data);
    const vmessConfig = JSON.parse(decoded);

    const proxy = {
        name: vmessConfig.ps || `${vmessConfig.add}:${vmessConfig.port}`,
        type: 'vmess',
        server: vmessConfig.add,
        port: parseInt(vmessConfig.port, 10),
        uuid: vmessConfig.id,
        alterId: vmessConfig.aid,
        cipher: vmessConfig.scy || 'auto',
        tls: vmessConfig.tls === 'tls',
        network: vmessConfig.net || 'tcp',
    };

    if (proxy.tls) {
        proxy.servername = vmessConfig.sni || vmessConfig.host || vmessConfig.add;
        proxy['skip-cert-verify'] = vmessConfig.verify_cert === false;
    }
    
    if (vmessConfig.net === 'ws') {
        proxy['ws-opts'] = {
            path: vmessConfig.path || '/',
            headers: {
                Host: vmessConfig.host || vmessConfig.add
            }
        };
    }

    return proxy;
}

/**
 * Safely decodes a Base64 string.
 * @param {string} b64 The Base64 string.
 * @returns {string} The decoded string.
 */
function _safeBase64Decode(b64) {
    // In browser environment
    if (typeof atob === 'function') {
        return atob(b64);
    }
    // In Node.js environment
    else if (typeof Buffer === 'function') {
        return Buffer.from(b64, 'base64').toString('utf-8');
    }
    throw new Error('No Base64 decoding method available.');
  }
  
  /**
   * Parses a Shadowsocks (SS) link.
   * @param {string} link The SS link.
   * @returns {object|null} A Mihomo proxy object or null if parsing fails.
   */
  function _parseSs(link) {
      const url = new URL(link);
      let name = decodeURIComponent(url.hash).substring(1);
      let server = url.hostname;
      let port = parseInt(url.port, 10);
      let method;
      let password;
  
      // Check for Base64 encoded format
      if (url.username && !url.password) {
          try {
              const decodedPart = _safeBase64Decode(url.username);
              const parts = decodedPart.split(':');
              method = parts;
              password = parts;
          } catch (e) {
              // It might not be Base64, but a user:pass format
              const userPass = _safeBase64Decode(link.substring('ss://'.length).split('@'));
              [method, password] = userPass.split(':');
          }
      } else {
          method = url.username;
          password = url.password;
      }
  
      if (!name) {
          name = `${server}:${port}`;
      }
  
      return {
          name,
          type: 'ss',
          server,
          port,
          cipher: method,
          password,
      };
  }

/**
 * Parses a Trojan link.
 * @param {string} link The Trojan link.
 * @returns {object|null} A Mihomo proxy object or null if parsing fails.
 */
function _parseTrojan(link) {
  const url = new URL(link);
  const params = url.searchParams;

  const proxy = {
    name: decodeURIComponent(url.hash).substring(1) || `${url.hostname}:${url.port}`,
    type: 'trojan',
    server: url.hostname,
    port: parseInt(url.port, 10),
    password: url.username,
    tls: true, // Trojan always uses TLS
    network: params.get('type') || 'tcp',
    'client-fingerprint': params.get('fp') || 'chrome',
    servername: params.get('sni') || url.hostname,
    'skip-cert-verify': params.get('scv') === 'true' || false,
    tfo: params.get('tfo') === 'true' || false,
  };

  return proxy;
}

/**
 * Parses a Hysteria2 link.
 * @param {string} link The Hysteria2 link.
 * @returns {object|null} A Mihomo proxy object or null if parsing fails.
 */
function _parseHysteria2(link) {
  const url = new URL(link);
  const params = url.searchParams;

  const proxy = {
    name: decodeURIComponent(url.hash).substring(1) || `${url.hostname}:${url.port}`,
    type: 'hysteria2',
    server: url.hostname,
    port: parseInt(url.port, 10),
    password: url.username,
    auth: url.username,
    'skip-cert-verify': params.get('insecure') === '1' || true, // Default to true based on user feedback
    sni: params.get('sni') || url.hostname,
  };

  return proxy;
}