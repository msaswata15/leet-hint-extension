// Debug configuration
const DEBUG_CONFIG = {
    // Enable/disable debug logging
    ENABLED: true,
    
    // Log levels: 'debug', 'info', 'warn', 'error'
    LOG_LEVEL: 'debug',
    
    // Enable/disable console colors (for Chrome/Firefox)
    USE_COLORS: true,
    
    // Max string length for logging objects
    MAX_STRING_LENGTH: 1000,
    
    // Log to console
    LOG_TO_CONSOLE: true,
    
    // Log to a visible debug panel
    LOG_TO_PANEL: true,
    
    // Log to chrome.storage.local (for persistence)
    LOG_TO_STORAGE: true,
    MAX_STORAGE_LOGS: 100
};

// Log levels for comparison
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

class Debugger {
    constructor(prefix = '') {
        this.prefix = prefix ? `[${prefix}]` : '';
        this.enabled = DEBUG_CONFIG.ENABLED;
        this.logLevel = LOG_LEVELS[DEBUG_CONFIG.LOG_LEVEL] || 0;
        this.logs = [];
        this.initialized = false;
        
        this.init();
    }
    
    init() {
        if (this.initialized) return;
        
        // Add styles for the debug panel
        if (DEBUG_CONFIG.LOG_TO_PANEL && !document.getElementById('debug-styles')) {
            const style = document.createElement('style');
            style.id = 'debug-styles';
            style.textContent = `
                #debug-panel {
                    position: fixed;
                    bottom: 0;
                    right: 0;
                    width: 100%;
                    max-width: 800px;
                    max-height: 300px;
                    overflow-y: auto;
                    background: rgba(0, 0, 0, 0.9);
                    color: #00ff00;
                    font-family: monospace;
                    font-size: 12px;
                    padding: 10px;
                    z-index: 10000;
                    border-top: 1px solid #333;
                    border-left: 1px solid #333;
                }
                .debug-entry {
                    border-bottom: 1px solid #333;
                    padding: 2px 0;
                    word-break: break-word;
                }
                .debug-debug { color: #888; }
                .debug-info { color: #4CAF50; }
                .debug-warn { color: #FFC107; }
                .debug-error { color: #F44336; }
                .debug-timestamp { color: #03A9F4; }
                .debug-prefix { color: #9C27B0; }
                #debug-toggle {
                    position: fixed;
                    bottom: 10px;
                    right: 10px;
                    z-index: 10001;
                    padding: 5px 10px;
                    background: #333;
                    color: white;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                }
            `;
            document.head.appendChild(style);
            
            // Create debug panel
            const panel = document.createElement('div');
            panel.id = 'debug-panel';
            panel.style.display = 'none';
            document.body.appendChild(panel);
            
            // Create toggle button
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'debug-toggle';
            toggleBtn.textContent = '🐞';
            toggleBtn.title = 'Toggle Debug Panel';
            toggleBtn.addEventListener('click', () => {
                const panel = document.getElementById('debug-panel');
                if (panel) {
                    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                }
            });
            document.body.appendChild(toggleBtn);
        }
        
        // Load previous logs from storage
        if (DEBUG_CONFIG.LOG_TO_STORAGE) {
            chrome.storage.local.get(['debugLogs'], (result) => {
                if (result.debugLogs && Array.isArray(result.debugLogs)) {
                    this.logs = result.debugLogs.slice(-DEBUG_CONFIG.MAX_STORAGE_LOGS);
                    this._renderLogs();
                }
            });
        }
        
        this.initialized = true;
    }
    
    _getTimestamp() {
        const now = new Date();
        return now.toISOString().substr(11, 12) + ':' + 
               now.getSeconds().toString().padStart(2, '0') + '.' + 
               now.getMilliseconds().toString().padStart(3, '0');
    }
    
    _stringify(obj) {
        if (typeof obj === 'string') return obj;
        try {
            let str = JSON.stringify(obj, (key, value) => {
                if (typeof value === 'function') return '[Function]';
                if (value instanceof Error) {
                    return {
                        name: value.name,
                        message: value.message,
                        stack: value.stack
                    };
                }
                return value;
            });
            
            if (str.length > DEBUG_CONFIG.MAX_STRING_LENGTH) {
                str = str.substring(0, DEBUG_CONFIG.MAX_STRING_LENGTH) + '...';
            }
            return str;
        } catch (e) {
            return String(obj);
        }
    }
    
    _log(level, ...args) {
        if (!this.enabled || LOG_LEVELS[level] < this.logLevel) return;
        
        const timestamp = this._getTimestamp();
        const messages = args.map(arg => this._stringify(arg));
        const logEntry = {
            timestamp,
            level,
            prefix: this.prefix,
            messages,
            time: Date.now()
        };
        
        // Add to logs array
        this.logs.push(logEntry);
        
        // Keep logs within limit
        if (this.logs.length > DEBUG_CONFIG.MAX_STORAGE_LOGS * 1.5) {
            this.logs = this.logs.slice(-DEBUG_CONFIG.MAX_STORAGE_LOGS);
        }
        
        // Log to console
        if (DEBUG_CONFIG.LOG_TO_CONSOLE) {
            const consoleMethod = console[level] || console.log;
            const style = DEBUG_CONFIG.USE_COLORS ? 
                `color: ${this._getColor(level)}; font-weight: bold;` : '';
            
            consoleMethod(
                `%c${timestamp} ${this.prefix}`,
                style,
                ...args.map(arg => (typeof arg === 'object' && arg !== null) ? 
                    JSON.parse(JSON.stringify(arg, (k, v) => 
                        typeof v === 'bigint' ? v.toString() : v
                    )) : arg
                )
            );
        }
        
        // Update UI
        this._renderLogs();
        
        // Save to storage
        if (DEBUG_CONFIG.LOG_TO_STORAGE) {
            chrome.storage.local.set({
                debugLogs: this.logs.slice(-DEBUG_CONFIG.MAX_STORAGE_LOGS)
            });
        }
    }
    
    _getColor(level) {
        const colors = {
            debug: '#888',
            info: '#4CAF50',
            warn: '#FFC107',
            error: '#F44336'
        };
        return colors[level] || '#000';
    }
    
    _renderLogs() {
        if (!DEBUG_CONFIG.LOG_TO_PANEL) return;
        
        const panel = document.getElementById('debug-panel');
        if (!panel) return;
        
        // Only render if panel is visible
        if (panel.style.display === 'none') return;
        
        // Create HTML for logs
        const logsHtml = this.logs.map(log => {
            const messages = log.messages.map(msg => 
                typeof msg === 'string' ? msg : this._stringify(msg)
            ).join(' ');
            
            return `
                <div class="debug-entry">
                    <span class="debug-timestamp">${log.timestamp}</span>
                    <span class="debug-${log.level}">${log.level.toUpperCase()}</span>
                    <span class="debug-prefix">${log.prefix}</span>
                    <span class="debug-message">${this._escapeHtml(messages)}</span>
                </div>
            `;
        }).join('');
        
        panel.innerHTML = logsHtml;
        panel.scrollTop = panel.scrollHeight;
    }
    
    _escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Public methods
    debug(...args) { this._log('debug', ...args); }
    info(...args) { this._log('info', ...args); }
    warn(...args) { this._log('warn', ...args); }
    error(...args) { this._log('error', ...args); }
    
    // Log API calls
    apiCall(url, options = {}) {
        const startTime = Date.now();
        this.debug(`API Call: ${options.method || 'GET'} ${url}`, options.body || '');
        
        return (response) => {
            const duration = Date.now() - startTime;
            const status = response.status;
            const statusText = response.statusText;
            const logMethod = status >= 400 ? 'error' : 'info';
            
            this[logMethod](`API Response: ${status} ${statusText} (${duration}ms) ${url}`);
            
            // Clone the response so we can read it multiple times
            return response.clone().json()
                .then(data => {
                    this.debug('API Data:', data);
                    return response;
                })
                .catch(() => response);
        };
    }
    
    // Log function execution
    wrapFunction(fn, name) {
        return async (...args) => {
            this.debug(`Calling ${name}`, { args });
            try {
                const result = await fn(...args);
                this.debug(`Function ${name} succeeded`, { result });
                return result;
            } catch (error) {
                this.error(`Function ${name} failed`, error);
                throw error;
            }
        };
    }
    
    // Clear logs
    clear() {
        this.logs = [];
        if (DEBUG_CONFIG.LOG_TO_STORAGE) {
            chrome.storage.local.remove('debugLogs');
        }
        this._renderLogs();
    }
}

// Create a default instance
const defaultDebugger = new Debugger('LeetCodeHintGenie');

// Export the createDebugger function
function createDebugger(prefix, options) {
    return new Debugger(prefix, options);
}

// Export as a global when loaded as a script
if (typeof window !== 'undefined') {
    window.createDebugger = createDebugger;
}

// Export for ES modules
export { createDebugger };
export default createDebugger;

if (typeof window !== 'undefined') {
    window.__DEBUG_CONFIG = DEBUG_CONFIG;
}
