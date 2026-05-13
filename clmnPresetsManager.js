// ============================================
// Configuration
// ============================================
const Config = {
  VERSION: "2026.05.13",
  API_VERSION: "v23.0",
  API_URL: "https://adsmanager-graph.facebook.com/v23.0/",
  EXPORT_SCHEMA_VERSION: "2.0.0",
  RETRY_MAX_ATTEMPTS: 4,
  RETRY_BASE_DELAY_MS: 600
};

const UITheme = {
  fontFamily: 'Inter, "Segoe UI", Arial, sans-serif',
  panelBg: "#0f1715",
  panelText: "#e8fff0",
  panelBorder: "1px solid #2b433a",
  panelShadow: "0 24px 60px rgba(0,0,0,.45)",
  accent: "#4dff8f",
  accentMuted: "#99b3a6",
  label: "#c7e0d2",
  controlBg: "#121f1b",
  controlBorder: "1px solid #2f4a40",
  controlText: "#e8fff0",
  inputBg: "#121f1b",
  inputBorder: "1px solid #2f4a40",
  inputText: "#e8fff0",
  logBg: "#0b1210",
  logBorder: "1px solid #22372f",
  logText: "#e8fff0",
  success: "#9bff7d",
  warning: "#ffd27d",
  error: "#ff8f8f"
};

// ============================================
// Helpers
// ============================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeApiError(responseJson, context = "API request") {
  if (!responseJson || !responseJson.error) return null;
  const err = responseJson.error;
  return {
    message: err.message || `${context} failed`,
    type: err.type || "GraphApiError",
    code: err.code,
    subcode: err.error_subcode,
    isTransient: Boolean(err.is_transient),
    fbtrace_id: err.fbtrace_id
  };
}

function shouldRetryApiError(apiErr) {
  if (!apiErr) return false;
  if (apiErr.isTransient) return true;
  return [1, 2, 4, 17, 32, 341, 613].includes(apiErr.code);
}

function validatePresetImportContent(payload) {
  if (!payload || typeof payload !== "object") {
    return { valid: false, error: "Invalid JSON: expected object" };
  }
  if (!payload.preset || typeof payload.preset !== "object") {
    return { valid: false, error: "Invalid JSON: missing 'preset' object" };
  }
  if (!Array.isArray(payload.preset.columns)) {
    return { valid: false, error: "Invalid JSON: preset.columns must be an array" };
  }
  if (payload.sizes && !Array.isArray(payload.sizes)) {
    return { valid: false, error: "Invalid JSON: sizes must be an array" };
  }
  if (payload.customMetrics && !Array.isArray(payload.customMetrics)) {
    return { valid: false, error: "Invalid JSON: customMetrics must be an array" };
  }
  return { valid: true };
}

const DEFAULT_PRESET_CONTENT = {"schemaVersion":"2.0.0","exportedAt":"2026-05-13T21:33:35.851Z","source":{"accountId":"1777998319827792","apiVersion":"v23.0","toolVersion":"2026.05.13"},"preset":{"attribution_windows":["default"],"columns":[{"column_id":"name","width":0},{"column_id":"campaign_name","width":0},{"column_id":"delivery","width":0},{"column_id":"recommendations_guidance","width":0},{"column_id":"budget","width":0},{"column_id":"spend","width":0},{"column_id":"results","width":0},{"column_id":"cost_per_result","width":0},{"column_id":"result_roas","width":0},{"column_id":"result_values","width":0},{"column_id":"reach","width":0},{"column_id":"impressions","width":0},{"column_id":"frequency","width":0},{"column_id":"clicks","width":0},{"column_id":"cpc","width":0},{"column_id":"actions:lead","width":0},{"column_id":"cost_per_action_type:lead","width":0},{"column_id":"actions:omni_complete_registration","width":0},{"column_id":"cost_per_action_type:omni_complete_registration","width":0},{"column_id":"ctr","width":0},{"column_id":"cpm","width":0}],"id":"1544300400749191","name":"TMPZDM Preset","time_created":"2026-05-06T10:58:16+0300","time_updated":"2026-05-14T00:33:02+0300"},"sizes":[{"page":"ACCOUNT","tab":"CAMPAIGN_GROUP","view":"table_view","columns":[{"key":"forAttributionWindow(results,default)","value":"112"},{"key":"cpm","value":"104"},{"key":"ctr","value":"88"},{"key":"forAttributionWindow(cost_per_result,default)","value":"112"},{"key":"forAttributionWindow(result_roas,default)","value":"102"},{"key":"forObjectType(toggle,CAMPAIGN_GROUP)","value":"94"},{"key":"forObjectType(delivery,CAMPAIGN_GROUP)","value":"104"},{"key":"impressions","value":"88"},{"key":"clicks","value":"101"},{"key":"forAttributionWindow(cost_per_action_type:lead,default)","value":"113"},{"key":"forAttributionWindow(cost_per_action_type:omni_complete_registration,default)","value":"116"},{"key":"forAttributionWindow(result_values,default)","value":"95"},{"key":"reach","value":"98"},{"key":"cpc","value":"92"},{"key":"forObjectType(budget,CAMPAIGN_GROUP)","value":"111"},{"key":"forAttributionWindow(actions:lead,default)","value":"101"},{"key":"frequency","value":"99"},{"key":"forAttributionWindow(actions:omni_complete_registration,default)","value":"131"},{"key":"recommendations_guidance","value":"75"},{"key":"spend","value":"115"},{"key":"forObjectType(name,CAMPAIGN_GROUP)","value":"250"}],"id":"120245824486030493"}],"customMetrics":[]};

// ============================================
// Logger Class
// ============================================
class Logger {
  constructor(uiInstance = null) {
    this.ui = uiInstance;
  }
  
  setUI(uiInstance) {
    this.ui = uiInstance;
  }
  
  log(message, type = "info") {
    if (this.ui && this.ui.log) {
      this.ui.log(message, type);
    }
    if (type === "error") {
      console.error(message);
    } else {
      console.log(message);
    }
  }
  
  info(message) {
    this.log(message, "info");
  }
  
  error(message) {
    this.log(message, "error");
  }
  
  success(message) {
    this.log(message, "success");
  }
  
  warning(message) {
    this.log(message, "warning");
  }
}

// Global logger instance
const logger = new Logger();

// ============================================
// FileHelper Class
// ============================================
class FileHelper {
  async readFileAsJsonAsync(file) {
    try {
      const fileContent = await this.readFileAsync(file);
      return JSON.parse(fileContent);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  readFileAsync(file) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject("Error reading file");
      reader.readAsText(file);
    });
  }
}

// ============================================
// FileSelector Class
// ============================================
class FileSelector {
  constructor(fileProcessor) {
    this.fileProcessor = fileProcessor;
  }

  createDiv() {
    this.div = document.createElement("div");
    this.div.style.position = "fixed";
    this.div.style.top = "50%";
    this.div.style.left = "50%";
    this.div.style.transform = "translate(-50%, -50%)";
    this.div.style.width = "min(320px, calc(100vw - 24px))";
    this.div.style.background = UITheme.panelBg;
    this.div.style.border = UITheme.panelBorder;
    this.div.style.boxShadow = UITheme.panelShadow;
    this.div.style.zIndex = "2147483647";
    this.div.style.display = "flex";
    this.div.style.flexDirection = "column";
    this.div.style.alignItems = "center";
    this.div.style.justifyContent = "center";
    this.div.style.padding = "14px";
    this.div.style.boxSizing = "border-box";
    this.div.style.borderRadius = "14px";
    this.div.style.fontFamily = UITheme.fontFamily;

    var title = document.createElement("div");
    title.innerHTML = "Выберите JSON-файл пресета";
    title.style.textAlign = "center";
    title.style.fontWeight = "700";
    title.style.color = UITheme.panelText;
    title.style.fontSize = "13px";

    var closeButton = document.createElement("button");
    closeButton.innerHTML = "X";
    closeButton.style.position = "absolute";
    closeButton.style.top = "5px";
    closeButton.style.right = "5px";
    closeButton.style.border = "none";
    closeButton.style.background = "transparent";
    closeButton.style.color = UITheme.accentMuted;
    closeButton.style.cursor = "pointer";
    closeButton.onclick = () => {
      document.body.removeChild(this.div);
    };

    this.div.appendChild(title);
    this.div.appendChild(closeButton);
  }

  createFileInput() {
    this.fileInput = document.createElement("input");
    this.fileInput.type = "file";
    this.fileInput.accept = ".json";
    this.fileInput.style.display = "none";
  }

  createButton() {
    this.button = document.createElement("button");
    this.button.textContent = "Выбрать файл";
    this.button.style.marginTop = "10px";
    this.button.style.padding = "8px 10px";
    this.button.style.border = UITheme.controlBorder;
    this.button.style.borderRadius = "9px";
    this.button.style.background = UITheme.accent;
    this.button.style.color = "#052012";
    this.button.style.fontWeight = "700";
    this.button.onclick = () => {
      this.fileInput.click();
    };
  }

  show() {
    return new Promise((resolve, reject) => {
      this.createDiv();
      this.createFileInput();
      this.createButton();

      this.div.appendChild(this.button);
      this.div.appendChild(this.fileInput);
      document.body.appendChild(this.div);

      this.fileInput.onchange = async () => {
        if (!this.fileInput.files || this.fileInput.files.length === 0) {
          document.body.removeChild(this.div);
          alert("Операция отменена");
          reject("Выбор файла отменён пользователем");
          return;
        }

        try {
          const result = await this.fileProcessor(this.fileInput.files[0]);
          document.body.removeChild(this.div);
          resolve(result);
        } catch (error) {
          document.body.removeChild(this.div);
          reject(error);
        }
      };
    });
  }
}

// ============================================
// Facebook API Class
// ============================================
class FbApi {
  apiUrl = Config.API_URL;
  
  async withRetry(requestFn, context = "API request") {
    let attempt = 0;
    let lastError = null;
    while (attempt < Config.RETRY_MAX_ATTEMPTS) {
      attempt++;
      try {
        const responseJson = await requestFn();
        const apiErr = normalizeApiError(responseJson, context);
        if (!apiErr) {
          return responseJson;
        }
        lastError = apiErr;
        if (!shouldRetryApiError(apiErr) || attempt >= Config.RETRY_MAX_ATTEMPTS) {
          throw new Error(`${context}: ${apiErr.message} (code ${apiErr.code ?? "n/a"})`);
        }
        const delayMs = Config.RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
        logger.warning(`${context} failed (attempt ${attempt}/${Config.RETRY_MAX_ATTEMPTS}). Retrying in ${delayMs}ms...`);
        await sleep(delayMs);
      } catch (error) {
        lastError = error;
        if (attempt >= Config.RETRY_MAX_ATTEMPTS) throw error;
        const delayMs = Config.RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
        logger.warning(`${context} network/error on attempt ${attempt}. Retrying in ${delayMs}ms...`);
        await sleep(delayMs);
      }
    }
    throw lastError ?? new Error(`${context} failed`);
  }

  async getRequest(path, qs = null, token = null) {
    token = token ?? __accessToken;
    let finalUrl = path.startsWith('http') ? path : this.apiUrl + path;
    
    const hasAccessToken = finalUrl.includes('access_token=');
    
    if (!hasAccessToken) {
      qs = qs != null ? `${qs}&access_token=${token}` : `access_token=${token}`;
      const separator = finalUrl.includes('?') ? '&' : '?';
      finalUrl = `${finalUrl}${separator}${qs}`;
    } else if (qs) {
      finalUrl = `${finalUrl}&${qs}`;
    }
    
    return this.withRetry(async () => {
      let f = await fetch(finalUrl, {
        headers: {
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
          "accept-language": "ca-ES,ca;q=0.9,en-US;q=0.8,en;q=0.7",
          "cache-control": "max-age=0",
          "sec-ch-ua": '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
        },
        referrerPolicy: "strict-origin-when-cross-origin",
        body: null,
        method: "GET",
        mode: "cors",
        credentials: "include",
        referrer: "https://business.facebook.com/",
      });
      return await f.json();
    }, `GET ${path}`);
  }

  async getAllPages(path, qs, token = null) {
    let items = [];
    let page = await this.getRequest(path, qs, token);
    items = items.concat(page.data);

    while (page.paging && page.paging.next) {
      page = await this.getRequest(page.paging.next, null, token);
      items = items.concat(page.data);
    }

    return items;
  }

  async postRequest(path, body, token = null) {
    token = token ?? __accessToken;
    body["access_token"] = token;
    let headers = {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/x-www-form-urlencoded",
      "sec-ch-ua": '"Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
    };
    let finalUrl = path.startsWith('http') ? path : this.apiUrl + path;
    return this.withRetry(async () => {
      let f = await fetch(finalUrl, {
        headers: headers,
        referrer: "https://business.facebook.com/",
        referrerPolicy: "origin-when-cross-origin",
        body: new URLSearchParams(body).toString(),
        method: "POST",
        mode: "cors",
        credentials: "include",
      });
      return await f.json();
    }, `POST ${path}`);
  }
}

// Global API instance
const API = new FbApi();

// ============================================
// Account Manager Class
// ============================================
class AccountManager {
  constructor() {
    this.accounts = [];
  }
  
  async loadAll() {
    try {
      logger.info("Loading all accounts...");
      const accounts = await API.getAllPages("me/adaccounts", "fields=id,name,account_status");
      
      this.accounts = accounts.map(account => {
        const accountId = account.id.replace("act_", "");
        return {
          id: accountId,
          name: account.name || accountId,
          status: account.account_status
        };
      });
      
      logger.success(`Loaded ${this.accounts.length} accounts.`);
      return this.accounts;
    } catch (error) {
      logger.error("Error loading accounts: " + error);
      throw error;
    }
  }
  
  getAll() {
    return this.accounts;
  }
  
  findById(accountId) {
    return this.accounts.find(acc => acc.id === accountId);
  }
}

// Global account manager instance
const accountManager = new AccountManager();

// Legacy global variable accessor
let allAccountsData = new Proxy({}, {
  get(target, prop) {
    if (typeof prop === 'symbol') return undefined;
    const accounts = accountManager.getAll();
    if (prop === 'length') return accounts.length;
    if (prop === 'find') return accounts.find.bind(accounts);
    if (prop === 'map') return accounts.map.bind(accounts);
    if (prop === 'filter') return accounts.filter.bind(accounts);
    if (prop === 'forEach') return accounts.forEach.bind(accounts);
    return accounts[prop];
  }
});

// ============================================
// Custom Derived Metrics Functions
// ============================================
const CUSTOM_METRIC_PREFIX = "custom_derived_metrics:";

async function fetchCustomMetrics(accountId) {
  const accId = accountId ?? require("BusinessUnifiedNavigationContext").adAccountID;
  logger.info(`Loading custom metrics for account ${accId}...`);
  
  const metrics = await API.getAllPages(
    `act_${accId}/ad_custom_derived_metrics`,
    `fields=name,formula,format_type,description`
  );
  
  logger.success(`Loaded ${metrics.length} custom metrics.`);
  return metrics;
}

async function createCustomMetric(accountId, metricData) {
  const accId = accountId ?? require("BusinessUnifiedNavigationContext").adAccountID;
  logger.info(`Creating custom metric "${metricData.name}" on account ${accId}...`);
  
  const data = {
    name: metricData.name,
    formula: metricData.formula,
    format_type: metricData.format_type || "FLOAT",
    permission: "shared"
  };
  
  if (metricData.description) {
    data.description = metricData.description;
  }
  
  const result = await API.postRequest(`act_${accId}/ad_custom_derived_metrics`, data);
  
  if (result.id) {
    logger.success(`Created custom metric "${metricData.name}" with ID ${result.id}`);
    return result.id;
  } else {
    logger.error(`Failed to create custom metric "${metricData.name}": ${JSON.stringify(result)}`);
    return null;
  }
}

function extractCustomMetricIds(preset) {
  const customMetricIds = [];
  if (preset.columns && Array.isArray(preset.columns)) {
    for (const col of preset.columns) {
      if (col.column_id && col.column_id.startsWith(CUSTOM_METRIC_PREFIX)) {
        const metricId = col.column_id.replace(CUSTOM_METRIC_PREFIX, "");
        customMetricIds.push(metricId);
      }
    }
  }
  return customMetricIds;
}

function replaceCustomMetricIds(preset, idMapping) {
  if (!preset.columns || !Array.isArray(preset.columns)) return preset;
  
  const newColumns = preset.columns.map(col => {
    if (col.column_id && col.column_id.startsWith(CUSTOM_METRIC_PREFIX)) {
      const oldId = col.column_id.replace(CUSTOM_METRIC_PREFIX, "");
      const newId = idMapping[oldId];
      if (newId) {
        return { ...col, column_id: `${CUSTOM_METRIC_PREFIX}${newId}` };
      }
    }
    return col;
  });
  
  return { ...preset, columns: newColumns };
}

// ============================================
// Column Preset Functions
// ============================================
async function fetchAccountPresets(accountId) {
  const accId = accountId ?? require("BusinessUnifiedNavigationContext").adAccountID;
  logger.info(`Loading presets for account ${accId}...`);
  
  let js = await API.getRequest(
    `act_${accId}`,
    `fields=["user_settings{id,column_presets{attribution_windows,columns,id,name,time_created,time_updated}},ad_column_sizes{page,tab,report,view,columns}"]`
  );

  const presets = js.user_settings?.column_presets?.data || [];
  const sizes = js.ad_column_sizes?.data || [];
  
  logger.success(`Loaded ${presets.length} presets.`);
  return { presets, sizes };
}

async function exportColumnPreset(selectedPreset, sizes = [], accountId = null) {
  if (!selectedPreset) {
    logger.warning("No preset selected");
    return null;
  }

  const jsFile = {
    schemaVersion: Config.EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    source: {
      accountId: accountId ?? require("BusinessUnifiedNavigationContext").adAccountID,
      apiVersion: Config.API_VERSION,
      toolVersion: Config.VERSION
    },
    preset: selectedPreset,
    sizes: sizes,
    customMetrics: []
  };
  
  // Check for custom metrics in preset
  const customMetricIds = extractCustomMetricIds(selectedPreset);
  if (customMetricIds.length > 0) {
    logger.info(`Found ${customMetricIds.length} custom metric(s) in preset, fetching details...`);
    
    const allMetrics = await fetchCustomMetrics(accountId);
    const usedMetrics = allMetrics.filter(m => customMetricIds.includes(m.id));
    
    jsFile.customMetrics = usedMetrics.map(m => ({
      id: m.id,
      name: m.name,
      formula: m.formula,
      format_type: m.format_type,
      description: m.description || ""
    }));
    
    logger.success(`Included ${jsFile.customMetrics.length} custom metric(s) in export.`);
  }
  
  const blob = new Blob([JSON.stringify(jsFile)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${selectedPreset.name}.json`;
  a.click();
  
  logger.success(`Exported preset: ${selectedPreset.name}`);
  return selectedPreset;
}

async function fetchUserSettingsId(adAccountId) {
  let accId = adAccountId ?? require("BusinessUnifiedNavigationContext").adAccountID;
  logger.info(`Getting user settings for acc ${accId}...`);
  let js = await API.getRequest(`act_${accId}`, `fields=[]`);
  let usId = js?.user_settings?.id;
  if (usId == null) {
    logger.info(`No default user settings found! Creating them...`);
    js = await API.getRequest(`act_${accId}/user_settings`, `method=post`);
    usId = js.id;
  }
  return usId;
}

async function uploadPreset(userSettingsId, presetData) {
  let data = {
    name: presetData.name,
    attribution_windows: JSON.stringify(presetData.attribution_windows),
    columns: JSON.stringify(presetData.columns),
  };
  logger.info(`Uploading preset ${presetData.name} to user settings ${userSettingsId}...`);
  let js = await API.postRequest(`${userSettingsId}/column_presets`, data);
  return js.id;
}

async function setDefaultColumnPreset(adAccountId, presetId) {
  let accId = adAccountId ?? require("BusinessUnifiedNavigationContext").adAccountID;
  logger.info(`Setting default column preset for acc ${accId}, preset id ${presetId}...`);
  let data = {
    default_column_preset: `{ "id": "${presetId}" }`,
    default_column_preset_id: presetId,
  };
  let js = await API.postRequest(`act_${accId}/user_settings`, data);
  return js;
}

async function uploadSize(adAccountId, size) {
  let accId = adAccountId ?? require("BusinessUnifiedNavigationContext").adAccountID;
  const columns = size.columns.reduce((acc, { key, value }) => {
    acc[key] = parseInt(value, 10);
    return acc;
  }, {});

  let data = {
    page: size.page,
    tab: size.tab,
    columns: JSON.stringify(columns),
  };
  logger.info(`Uploading sizes to ad account ${accId}...`);
  let js = await API.postRequest(`act_${accId}/ad_column_sizes`, data);
  const sizeId = js.id;

  js = await API.postRequest(sizeId, data);
  return js.success;
}

async function importPresetToAccount(accountId, presetContent) {
  try {
    let presetToUpload = { ...presetContent.preset };
    
    // Handle custom metrics if present
    if (presetContent.customMetrics && presetContent.customMetrics.length > 0) {
      logger.info(`Creating ${presetContent.customMetrics.length} custom metric(s) on account ${accountId}...`);
      
      const idMapping = {};
      const existingMetrics = await fetchCustomMetrics(accountId);
      const metricsByFingerprint = new Map();
      for (const m of existingMetrics) {
        const key = `${m.name}||${m.formula}||${m.format_type || "FLOAT"}`;
        metricsByFingerprint.set(key, m.id);
      }

      for (const metric of presetContent.customMetrics) {
        const fingerprint = `${metric.name}||${metric.formula}||${metric.format_type || "FLOAT"}`;
        const existingId = metricsByFingerprint.get(fingerprint);

        if (existingId) {
          idMapping[metric.id] = existingId;
          logger.info(`Metric "${metric.name}" already exists, reusing ID ${existingId}`);
          continue;
        }

        const newId = await createCustomMetric(accountId, metric);
        if (newId) {
          idMapping[metric.id] = newId;
          metricsByFingerprint.set(fingerprint, newId);
        } else {
          logger.warning(`Skipping metric "${metric.name}" - creation failed`);
        }
      }
      
      // Replace old IDs with new IDs in preset
      presetToUpload = replaceCustomMetricIds(presetToUpload, idMapping);
    }
    
    const userSettingsId = await fetchUserSettingsId(accountId);
    let presetId = await uploadPreset(userSettingsId, presetToUpload);
    await setDefaultColumnPreset(accountId, presetId);
    logger.success(`Imported preset to account ${accountId}`);
    return { success: true, presetId };
  } catch (error) {
    logger.error(`Error importing to account ${accountId}: ${error}`);
    return { success: false, error };
  }
}

async function importPresetToSelectedAccounts(accountIds, presetContent, uiInstance) {
  logger.info(`Importing preset to ${accountIds.length} accounts...`);
  let successCount = 0;
  let failedCount = 0;
  
  for (let i = 0; i < accountIds.length; i++) {
    const accountId = accountIds[i];
    logger.info(`Processing account ${accountId} (${i+1}/${accountIds.length})...`);
    
    const result = await importPresetToAccount(accountId, presetContent);
    
    if (result.success) {
      successCount++;
    } else {
      failedCount++;
    }
    
    // Add delay between accounts to avoid rate limiting
    if (i < accountIds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  const summaryMessage = `Processed ${accountIds.length} accounts: ${successCount} successful, ${failedCount} failed.`;
  logger.success(summaryMessage);
}

async function importSizesToAccount(accountId, sizes) {
  try {
    for (let i = 0; i < sizes.length; i++) {
      logger.info(`Uploading size ${i+1}/${sizes.length} to account ${accountId}...`);
      await uploadSize(accountId, sizes[i]);
    }
    logger.success(`Imported ${sizes.length} sizes to account ${accountId}`);
    return { success: true };
  } catch (error) {
    logger.error(`Error importing sizes to account ${accountId}: ${error}`);
    return { success: false, error };
  }
}

function reloadPageWithPreset(presetId) {
  const urlObj = new URL(window.location.href);
  urlObj.searchParams.set("column_preset", presetId);
  window.location.href = urlObj.toString();
}

// ============================================
// Column Presets Manager UI Class
// ============================================
class ColumnPresetsManagerUI {
  constructor() {
    this.div = null;
    this.buttons = {};
    this.selectedExportAccountId = null;
    this.selectedImportAccountIds = [];
    this.logArea = null;
    this.accountPresets = [];  // Presets loaded for selected account
    this.selectedPreset = null; // Currently selected preset
    this.accountSizes = [];    // Column sizes for selected account
  }

  createDiv() {
    this.div = document.createElement("div");
    this.div.style.position = "fixed";
    this.div.style.top = "50%";
    this.div.style.left = "50%";
    this.div.style.transform = "translate(-50%, -50%)";
    this.div.style.width = "min(420px, calc(100vw - 24px))";
    this.div.style.maxHeight = "calc(100vh - 40px)";
    this.div.style.overflowY = "hidden";
    this.div.style.overflowX = "hidden";
    this.div.style.background = UITheme.panelBg;
    this.div.style.color = UITheme.panelText;
    this.div.style.border = UITheme.panelBorder;
    this.div.style.zIndex = "2147483647";
    this.div.style.display = "flex";
    this.div.style.flexDirection = "column";
    this.div.style.alignItems = "center";
    this.div.style.justifyContent = "flex-start";
    this.div.style.padding = "14px";
    this.div.style.boxSizing = "border-box";
    this.div.style.borderRadius = "14px";
    this.div.style.boxShadow = UITheme.panelShadow;
    this.div.style.fontFamily = UITheme.fontFamily;

    // Create and style the title
    const title = document.createElement("div");
    title.innerHTML = `<h2 style="margin:0;color:${UITheme.accent};font-size:32px;line-height:1.05;font-weight:800;letter-spacing:.01em;">FB Preset Manager</h2><p style="margin:4px 0 0 0;color:${UITheme.accentMuted};font-size:11px;">v ${Config.VERSION}</p>`;
    title.style.textAlign = "left";
    title.style.width = "100%";
    title.style.marginBottom = "10px";

    // Create and style the close button
    const closeButton = document.createElement("button");
    closeButton.innerHTML = "X";
    closeButton.style.position = "absolute";
    closeButton.style.top = "12px";
    closeButton.style.right = "12px";
    closeButton.style.border = "none";
    closeButton.style.background = "transparent";
    closeButton.style.color = UITheme.controlText;
    closeButton.style.fontSize = "24px";
    closeButton.style.fontWeight = "700";
    closeButton.style.cursor = "pointer";
    closeButton.onclick = () => {
      document.body.removeChild(this.div);
    };

    this.div.appendChild(title);
    this.div.appendChild(closeButton);

    return this.div;
  }

  createButton(id, text, onClick) {
    const button = document.createElement("button");
    button.id = id;
    button.textContent = text;
    button.style.margin = "10px 0 0";
    button.style.padding = "9px";
    button.style.width = "100%";
    button.style.background = UITheme.controlBg;
    button.style.color = UITheme.controlText;
    button.style.border = UITheme.controlBorder;
    button.style.borderRadius = "9px";
    button.style.cursor = "pointer";
    button.style.fontSize = "13px";
    button.style.fontWeight = "700";
    button.setAttribute("data-original-text", text);
    
    this.buttons[id] = button;
    
    button.onclick = async () => {
      this.setButtonLoading(id, true);
      try {
        await onClick();
      } finally {
        this.setButtonLoading(id, false);
      }
    };

    return button;
  }
  
  setButtonLoading(id, isLoading) {
    const button = this.buttons[id];
    if (!button) return;
    
    if (isLoading) {
      button.disabled = true;
      button.style.opacity = "0.72";
      button.style.cursor = "not-allowed";
      button.textContent = "Обработка...";
    } else {
      button.disabled = false;
      button.style.opacity = "1";
      button.style.cursor = "pointer";
      button.textContent = button.getAttribute("data-original-text");
    }
  }
  
  createExportAccountDropdown() {
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.margin = "8px 0 0";
    
    const label = document.createElement("label");
    label.textContent = "Аккаунт для экспорта:";
    label.style.display = "block";
    label.style.marginBottom = "4px";
    label.style.fontSize = "12px";
    label.style.color = UITheme.label;
    label.style.fontWeight = "500";
    
    const select = document.createElement("select");
    select.id = "ywbExportAccountSelect";
    select.style.width = "100%";
    select.style.padding = "9px";
    select.style.borderRadius = "9px";
    select.style.border = UITheme.inputBorder;
    select.style.background = UITheme.inputBg;
    select.style.color = UITheme.inputText;
    select.style.fontSize = "13px";
    
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Выберите аккаунт";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);
    
    allAccountsData.forEach(account => {
      const option = document.createElement("option");
      option.value = account.id;
      option.textContent = `${account.id} - ${account.name}`;
      select.appendChild(option);
    });
    
    select.onchange = async () => {
      this.selectedExportAccountId = select.value;
      this.selectedPreset = null;
      this.accountPresets = [];
      this.accountSizes = [];
      
      // Load presets for selected account
      if (select.value) {
        try {
          const { presets, sizes } = await fetchAccountPresets(select.value);
          this.accountPresets = presets;
          this.accountSizes = sizes;
          this.refreshPresetDropdown();
        } catch (error) {
          logger.error(`Error loading presets: ${error}`);
        }
      } else {
        this.refreshPresetDropdown();
      }
    };
    
    container.appendChild(label);
    container.appendChild(select);
    
    return container;
  }
  
  createPresetDropdown() {
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.margin = "8px 0 0";
    
    const label = document.createElement("label");
    label.textContent = "Пресет для экспорта:";
    label.style.display = "block";
    label.style.marginBottom = "4px";
    label.style.fontSize = "12px";
    label.style.color = UITheme.label;
    label.style.fontWeight = "500";
    
    const select = document.createElement("select");
    select.id = "ywbPresetSelect";
    select.style.width = "100%";
    select.style.padding = "9px";
    select.style.borderRadius = "9px";
    select.style.border = UITheme.inputBorder;
    select.style.background = UITheme.inputBg;
    select.style.color = UITheme.inputText;
    select.style.fontSize = "13px";
    
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Сначала выберите аккаунт";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);
    
    select.onchange = () => {
      const selectedIndex = parseInt(select.value, 10);
      if (!isNaN(selectedIndex) && this.accountPresets[selectedIndex]) {
        this.selectedPreset = this.accountPresets[selectedIndex];
      } else {
        this.selectedPreset = null;
      }
    };
    
    container.appendChild(label);
    container.appendChild(select);
    
    return container;
  }
  
  refreshPresetDropdown() {
    const select = document.getElementById("ywbPresetSelect");
    if (!select) return;
    
    select.innerHTML = "";
    
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    
    if (this.accountPresets.length === 0) {
      defaultOption.textContent = this.selectedExportAccountId
        ? "Пресеты не найдены"
        : "Сначала выберите аккаунт";
      select.appendChild(defaultOption);
      return;
    }
    
    defaultOption.textContent = "Выберите пресет";
    select.appendChild(defaultOption);
    
    this.accountPresets.forEach((preset, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = preset.name;
      select.appendChild(option);
    });
  }
  
  createImportAccountDropdown() {
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.margin = "8px 0 0";
    
    const label = document.createElement("label");
    label.textContent = "Аккаунты для импорта:";
    label.style.display = "block";
    label.style.marginBottom = "4px";
    label.style.fontSize = "12px";
    label.style.color = UITheme.label;
    label.style.fontWeight = "500";
    
    const selectAllContainer = document.createElement("div");
    selectAllContainer.style.marginBottom = "6px";
    selectAllContainer.style.display = "flex";
    selectAllContainer.style.alignItems = "center";
    selectAllContainer.style.gap = "8px";
    
    const selectAllCheckbox = document.createElement("input");
    selectAllCheckbox.type = "checkbox";
    selectAllCheckbox.id = "ywbSelectAllAccounts";
    selectAllCheckbox.style.margin = "0";
    
    const selectAllLabel = document.createElement("label");
    selectAllLabel.htmlFor = "ywbSelectAllAccounts";
    selectAllLabel.innerHTML = `Выбрать все аккаунты <span style="color:${UITheme.accentMuted};">(Ctrl/Cmd для мультивыбора)</span>`;
    selectAllLabel.style.fontSize = "12px";
    selectAllLabel.style.color = UITheme.label;
    selectAllLabel.style.margin = "0";
    
    selectAllContainer.appendChild(selectAllCheckbox);
    selectAllContainer.appendChild(selectAllLabel);
    
    const select = document.createElement("select");
    select.id = "ywbImportAccountSelect";
    select.multiple = true;
    select.size = Math.min(allAccountsData.length, 6);
    select.style.width = "100%";
    select.style.padding = "9px";
    select.style.borderRadius = "9px";
    select.style.border = UITheme.inputBorder;
    select.style.background = UITheme.inputBg;
    select.style.color = UITheme.inputText;
    select.style.fontSize = "12px";
    
    allAccountsData.forEach(account => {
      const option = document.createElement("option");
      option.value = account.id;
      option.textContent = `${account.id} - ${account.name}`;
      select.appendChild(option);
    });
    
    const updateSelection = () => {
      this.selectedImportAccountIds = Array.from(select.selectedOptions).map(opt => opt.value);
    };
    
    select.onchange = updateSelection;
    
    selectAllCheckbox.onchange = () => {
      if (selectAllCheckbox.checked) {
        Array.from(select.options).forEach(opt => opt.selected = true);
      } else {
        Array.from(select.options).forEach(opt => opt.selected = false);
      }
      updateSelection();
    };
    
    container.appendChild(label);
    container.appendChild(selectAllContainer);
    container.appendChild(select);
    
    return container;
  }
  
  refreshDropdowns() {
    const exportSelect = document.getElementById("ywbExportAccountSelect");
    const importSelect = document.getElementById("ywbImportAccountSelect");
    
    if (exportSelect) {
      const currentValue = exportSelect.value;
      exportSelect.innerHTML = "";
      
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "-- Выберите аккаунт --";
      defaultOption.disabled = true;
      defaultOption.selected = !currentValue;
      exportSelect.appendChild(defaultOption);
      
      allAccountsData.forEach(account => {
        const option = document.createElement("option");
        option.value = account.id;
        option.textContent = `${account.id} - ${account.name}`;
        if (account.id === currentValue) {
          option.selected = true;
        }
        exportSelect.appendChild(option);
      });
    }
    
    if (importSelect) {
      const currentValues = Array.from(importSelect.selectedOptions).map(opt => opt.value);
      importSelect.innerHTML = "";
      
      allAccountsData.forEach(account => {
        const option = document.createElement("option");
        option.value = account.id;
        option.textContent = `${account.id} - ${account.name}`;
        if (currentValues.includes(account.id)) {
          option.selected = true;
        }
        importSelect.appendChild(option);
      });
    }
  }

  createTabs() {
    const tabContainer = document.createElement("div");
    tabContainer.style.display = "flex";
    tabContainer.style.width = "100%";
    tabContainer.style.marginBottom = "10px";
    tabContainer.style.borderBottom = UITheme.controlBorder;
    
    const exportTab = document.createElement("button");
    exportTab.id = "ywbExportTab";
    exportTab.textContent = "Экспорт";
    exportTab.style.flex = "1";
    exportTab.style.padding = "9px";
    exportTab.style.border = "none";
    exportTab.style.background = "transparent";
    exportTab.style.cursor = "pointer";
    exportTab.style.fontSize = "13px";
    exportTab.style.fontWeight = "700";
    exportTab.style.borderBottom = `2px solid ${UITheme.accent}`;
    exportTab.style.color = UITheme.panelText;
    
    const importTab = document.createElement("button");
    importTab.id = "ywbImportTab";
    importTab.textContent = "Импорт";
    importTab.style.flex = "1";
    importTab.style.padding = "9px";
    importTab.style.border = "none";
    importTab.style.background = "transparent";
    importTab.style.color = UITheme.panelText;
    importTab.style.cursor = "pointer";
    importTab.style.fontSize = "13px";
    importTab.style.fontWeight = "700";
    
    exportTab.onclick = () => {
      exportTab.style.borderBottom = `2px solid ${UITheme.accent}`;
      importTab.style.borderBottom = "none";
      document.getElementById("ywbExportTabContent").style.display = "block";
      document.getElementById("ywbImportTabContent").style.display = "none";
    };
    
    importTab.onclick = () => {
      importTab.style.borderBottom = `2px solid ${UITheme.accent}`;
      exportTab.style.borderBottom = "none";
      document.getElementById("ywbExportTabContent").style.display = "none";
      document.getElementById("ywbImportTabContent").style.display = "block";
    };
    
    tabContainer.appendChild(exportTab);
    tabContainer.appendChild(importTab);
    
    return tabContainer;
  }
  
  createLogArea() {
    const logContainer = document.createElement("div");
    logContainer.style.width = "100%";
    logContainer.style.alignSelf = "stretch";
    logContainer.style.marginTop = "10px";
    logContainer.style.marginLeft = "auto";
    logContainer.style.marginRight = "auto";
    logContainer.style.boxSizing = "border-box";
    
    const logLabel = document.createElement("div");
    logLabel.textContent = "Лог обработки:";
    logLabel.style.fontSize = "12px";
    logLabel.style.fontWeight = "500";
    logLabel.style.marginBottom = "4px";
    logLabel.style.color = UITheme.label;
    
    this.logArea = document.createElement("div");
    this.logArea.id = "ywbLogArea";
    this.logArea.style.width = "100%";
    this.logArea.style.maxWidth = "100%";
    this.logArea.style.alignSelf = "stretch";
    this.logArea.style.boxSizing = "border-box";
    this.logArea.style.minHeight = "120px";
    this.logArea.style.maxHeight = "320px";
    this.logArea.style.overflowY = "auto";
    this.logArea.style.backgroundColor = UITheme.logBg;
    this.logArea.style.border = UITheme.logBorder;
    this.logArea.style.borderRadius = "10px";
    this.logArea.style.padding = "8px";
    this.logArea.style.fontSize = "12px";
    this.logArea.style.fontFamily = "monospace";
    this.logArea.style.lineHeight = "1.4";
    this.logArea.style.color = UITheme.logText;
    
    logContainer.appendChild(logLabel);
    logContainer.appendChild(this.logArea);
    
    return logContainer;
  }
  
  log(message, type = "info") {
    if (!this.logArea) return;
    
    const logEntry = document.createElement("div");
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    if (type === "error") {
      logEntry.style.color = UITheme.error;
    } else if (type === "success") {
      logEntry.style.color = UITheme.success;
    } else if (type === "warning") {
      logEntry.style.color = UITheme.warning;
    }
    
    this.logArea.appendChild(logEntry);
    this.updateLogAreaHeight();
    this.logArea.scrollTop = this.logArea.scrollHeight;
  }
  
  updateLogAreaHeight() {
    if (!this.logArea) return;
    this.logArea.style.height = "auto";
    const nextHeight = Math.min(this.logArea.scrollHeight + 4, 320);
    this.logArea.style.height = `${Math.max(nextHeight, 120)}px`;
  }

  clearLog() {
    if (this.logArea) {
      this.logArea.innerHTML = "";
      this.updateLogAreaHeight();
    }
  }

  pickJsonPresetFile() {
    return new Promise((resolve, reject) => {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".json,application/json";
      fileInput.style.display = "none";
      document.body.appendChild(fileInput);

      let settled = false;
      const cleanup = () => {
        if (fileInput.parentNode) fileInput.parentNode.removeChild(fileInput);
        window.removeEventListener("focus", onFocus, true);
      };
      const finishResolve = value => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(value);
      };
      const finishReject = error => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      };

      const onFocus = () => {
        setTimeout(() => {
          if (settled) return;
          if (!fileInput.files || fileInput.files.length === 0) {
            finishResolve(null);
          }
        }, 250);
      };

      window.addEventListener("focus", onFocus, true);
      fileInput.onchange = () => {
        if (!fileInput.files || fileInput.files.length === 0) {
          finishResolve(null);
          return;
        }
        finishResolve(fileInput.files[0]);
      };

      try {
        fileInput.click();
      } catch (error) {
        finishReject(error);
      }
    });
  }

  show() {
    const div = this.createDiv();

    // Create tabs
    const tabs = this.createTabs();
    div.appendChild(tabs);

    // Export Tab Content
    const exportTabContent = document.createElement("div");
    exportTabContent.id = "ywbExportTabContent";
    exportTabContent.style.width = "100%";
    exportTabContent.style.display = "block";
    
    const exportDropdown = this.createExportAccountDropdown();
    const presetDropdown = this.createPresetDropdown();
    
    const exportButton = this.createButton("export-btn", "Скачать пресет в JSON", async () => {
      if (!this.selectedExportAccountId) {
        alert("Выберите аккаунт для экспорта.");
        return;
      }
      if (!this.selectedPreset) {
        alert("Выберите пресет для экспорта.");
        return;
      }
      await exportColumnPreset(this.selectedPreset, this.accountSizes, this.selectedExportAccountId);
    });
    
    exportTabContent.appendChild(exportDropdown);
    exportTabContent.appendChild(presetDropdown);
    exportTabContent.appendChild(exportButton);

    // Import Tab Content
    const importTabContent = document.createElement("div");
    importTabContent.id = "ywbImportTabContent";
    importTabContent.style.width = "100%";
    importTabContent.style.overflowX = "hidden";
    importTabContent.style.display = "none";
    
    const importDropdown = this.createImportAccountDropdown();
    
    const runPresetImport = async presetContent => {
      const validation = validatePresetImportContent(presetContent);
      if (!validation.valid) {
        logger.error(validation.error);
        alert(validation.error);
        return;
      }

      const dryRunMessage = [
        `Готов к импорту пресета: ${presetContent.preset.name || "Без названия"}`,
        `Целевых аккаунтов: ${this.selectedImportAccountIds.length}`,
        `Кастомных метрик: ${(presetContent.customMetrics || []).length}`
      ].join("\n");

      if (!confirm(`${dryRunMessage}\n\nПродолжить импорт?`)) {
        logger.warning("Import cancelled in dry-run confirmation.");
        return;
      }

      await importPresetToSelectedAccounts(this.selectedImportAccountIds, presetContent, this);
      if (presetContent.sizes && presetContent.sizes.length > 0) {
        for (const accountId of this.selectedImportAccountIds) {
          try {
            await importSizesToAccount(accountId, presetContent.sizes);
          } catch (sizeError) {
            logger.warning(`Фоновый импорт ширин для аккаунта ${accountId} пропущен: ${sizeError}`);
          }
        }
      }

      const currentAccountId = require("BusinessUnifiedNavigationContext").adAccountID;
      if (this.selectedImportAccountIds.includes(currentAccountId)) {
        if (confirm("Пресеты в текущем аккаунте изменились. Перезагрузить страницу?")) {
          location.reload();
        }
      }
      logger.success("Import complete!");
    };

    const importButton = this.createButton("import-btn", "Импорт JSON", async () => {
      if (!this.selectedImportAccountIds || this.selectedImportAccountIds.length === 0) {
        alert("Выберите хотя бы один аккаунт для импорта.");
        return;
      }
      
      const fileHelper = new FileHelper();
      
      try {
        logger.info("Открытие выбора JSON-файла...");
        const file = await this.pickJsonPresetFile();
        if (!file) {
          logger.warning("Выбор файла отменён пользователем.");
          return;
        }
        const presetContent = await fileHelper.readFileAsJsonAsync(file);
        await runPresetImport(presetContent);
      } catch (error) {
        logger.error(`Error: ${error}`);
      }
    });

    const tmpzdmButton = this.createButton("tmpzdm-btn", "TMPZDM Preset", async () => {
      if (!this.selectedImportAccountIds || this.selectedImportAccountIds.length === 0) {
        alert("Выберите хотя бы один аккаунт для импорта.");
        return;
      }
      try {
        await runPresetImport(DEFAULT_PRESET_CONTENT);
      } catch (error) {
        logger.error(`Error: ${error}`);
      }
    });

    const importButtonsRow = document.createElement("div");
    importButtonsRow.style.display = "flex";
    importButtonsRow.style.gap = "8px";
    importButton.style.width = "50%";
    tmpzdmButton.style.width = "50%";
    importButtonsRow.appendChild(importButton);
    importButtonsRow.appendChild(tmpzdmButton);
    
    importTabContent.appendChild(importDropdown);
    importTabContent.appendChild(importButtonsRow);

    // Add tab contents to div
    div.appendChild(exportTabContent);
    div.appendChild(importTabContent);
    
    // Add log area
    const logArea = this.createLogArea();
    logArea.style.maxWidth = "100%";
    logArea.style.width = "100%";
    logArea.style.marginLeft = "auto";
    logArea.style.marginRight = "auto";
    div.appendChild(logArea);
    
    // Add div to body
    document.body.appendChild(div);
    
    // Initial log message
	    this.log("Интерфейс готов к работе.", "success");
  }
}

// ============================================
// Main function to show the column presets manager UI
// ============================================
async function showColumnPresetsManager() {
  try {
    // Load all accounts
    await accountManager.loadAll();
    
    // Show UI
    const ui = new ColumnPresetsManagerUI();
    logger.setUI(ui);
    ui.show();
  } catch (error) {
    console.error("Error loading accounts:", error);
    alert(`Error loading accounts: ${error.message || error}`);
  }
}

// Function to copy the script as base64 bookmarklet
function copyScriptAsBase64Bookmarklet() {
  try {
    const configStr = `const Config = ${JSON.stringify(Config)};`;
    
    const scriptContent = `// FB Column Preset Manager ${Config.VERSION}
${configStr}
${Logger.toString()}
const logger = new Logger();
${FileHelper.toString()}
${FileSelector.toString()}
${FbApi.toString()}
const API = new FbApi();
${AccountManager.toString()}
const accountManager = new AccountManager();
let allAccountsData = new Proxy({}, {
  get(target, prop) {
    if (typeof prop === 'symbol') return undefined;
    const accounts = accountManager.getAll();
    if (prop === 'length') return accounts.length;
    if (prop === 'find') return accounts.find.bind(accounts);
    if (prop === 'map') return accounts.map.bind(accounts);
    if (prop === 'filter') return accounts.filter.bind(accounts);
    if (prop === 'forEach') return accounts.forEach.bind(accounts);
    return accounts[prop];
  }
});
const CUSTOM_METRIC_PREFIX = "custom_derived_metrics:";
${fetchCustomMetrics.toString()}
${createCustomMetric.toString()}
${extractCustomMetricIds.toString()}
${replaceCustomMetricIds.toString()}
${fetchAccountPresets.toString()}
${exportColumnPreset.toString()}
${fetchUserSettingsId.toString()}
${uploadPreset.toString()}
${setDefaultColumnPreset.toString()}
${uploadSize.toString()}
${importPresetToAccount.toString()}
${importPresetToSelectedAccounts.toString()}
${importSizesToAccount.toString()}
${reloadPageWithPreset.toString()}
${ColumnPresetsManagerUI.toString()}
${showColumnPresetsManager.toString()}
${copyScriptAsBase64Bookmarklet.toString()}
window.showColumnPresetsManager = showColumnPresetsManager;
window.copyScriptAsBase64Bookmarklet = copyScriptAsBase64Bookmarklet;
showColumnPresetsManager();`;
    
    const base64Content = btoa(unescape(encodeURIComponent(scriptContent)));
    const bookmarkletCode = `javascript:eval(decodeURIComponent(escape(atob("${base64Content}"))));`;
    
    navigator.clipboard.writeText(bookmarkletCode)
      .then(() => {
        alert("Bookmarklet copied to clipboard!");
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        const textArea = document.createElement("textarea");
        textArea.value = bookmarkletCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert("Bookmarklet copied to clipboard!");
      });
  } catch (error) {
    console.error('Error creating bookmarklet:', error);
    alert(`Error creating bookmarklet: ${error.message}`);
  }
}

// Make the functions available globally
window.showColumnPresetsManager = showColumnPresetsManager;
window.copyScriptAsBase64Bookmarklet = copyScriptAsBase64Bookmarklet;

// Auto-run when script is loaded
showColumnPresetsManager();
