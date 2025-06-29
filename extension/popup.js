// Debug utility will be loaded asynchronously
let debug = {
    info: console.log.bind(console, '[INFO]'),
    debug: console.debug.bind(console, '[DEBUG]'),
    warn: console.warn.bind(console, '[WARN]'),
    error: console.error.bind(console, '[ERROR]')
};

// Track the current request ID
let currentRequestId = 0;

// Load debug module asynchronously
(async () => {
    try {
        const debugModule = await import('./debug.js');
        const debugInstance = debugModule.createDebugger('Popup');
        
        // Replace the debug methods with the actual implementation
        Object.assign(debug, {
            info: debugInstance.info.bind(debugInstance),
            debug: debugInstance.debug.bind(debugInstance),
            warn: debugInstance.warn.bind(debugInstance),
            error: debugInstance.error.bind(debugInstance)
        });
        
        debug.info('Debug module loaded successfully');
    } catch (error) {
        console.error('Failed to load debug module:', error);
        // Continue with console-based logging
    }
})();

// Helper function to set loading state
function setLoading(button, isLoading) {
    const logContext = { buttonId: button?.id, isLoading };
    debug.debug('Setting loading state', logContext);
    
    if (!button) {
        debug.warn('No button provided to setLoading', logContext);
        return;
    }
    
    try {
        const icon = button.querySelector('.button-icon');
        const text = button.querySelector('.button-text');
        
        if (isLoading) {
            debug.debug('Enabling loading state', { buttonId: button.id });
            button.disabled = true;
            
            if (icon) {
                icon.style.display = 'none';
            } else {
                debug.debug('No icon element found', { buttonId: button.id });
            }
            
            if (!button.querySelector('.loading')) {
                const loader = document.createElement('span');
                loader.className = 'loading';
                loader.textContent = '...';
                
                try {
                    if (text) {
                        button.insertBefore(loader, text.nextSibling);
                    } else {
                        button.appendChild(loader);
                    }
                    debug.debug('Added loading indicator', { buttonId: button.id });
                } catch (e) {
                    debug.error('Failed to add loading indicator', { 
                        buttonId: button.id,
                        error: e.message,
                        stack: e.stack 
                    });
                }
            }
        } else {
            debug.debug('Disabling loading state', { buttonId: button.id });
            button.disabled = false;
            
            const loader = button.querySelector('.loading');
            if (loader) {
                try {
                    loader.remove();
                    debug.debug('Removed loading indicator', { buttonId: button.id });
                } catch (e) {
                    debug.error('Failed to remove loading indicator', { 
                        buttonId: button.id,
                        error: e.message 
                    });
                }
            }
            
            if (icon) {
                icon.style.display = 'inline-block';
            }
        }
    } catch (error) {
        debug.error('Error in setLoading', { 
            buttonId: button?.id,
            error: error.message,
            stack: error.stack 
        });
    }
}

// Helper function to show error message with enhanced debugging
function showError(element, message, details = null) {
    const errorId = `err-${Date.now()}`;
    const logContext = { 
        errorId,
        elementId: element?.id,
        message: typeof message === 'string' ? message : 'Error object provided',
        hasDetails: !!details
    };
    
    debug.error('Showing error to user', logContext);
    
    if (!element) {
        debug.error('Cannot show error - element is null', logContext);
        return;
    }
    
    try {
        // Create error display
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-message';
        errorContainer.id = errorId;
        
        // Add error icon
        const icon = document.createElement('span');
        icon.textContent = '⚠️ ';
        icon.style.marginRight = '5px';
        
        // Add error message
        const messageSpan = document.createElement('span');
        messageSpan.textContent = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
        
        // Add details toggle if details are available
        if (details) {
            const detailsId = `details-${errorId}`;
            const toggle = document.createElement('a');
            toggle.href = '#';
            toggle.textContent = ' [Show details]';
            toggle.style.marginLeft = '5px';
            toggle.style.fontSize = '0.9em';
            toggle.onclick = (e) => {
                e.preventDefault();
                const detailsEl = document.getElementById(detailsId);
                if (detailsEl) {
                    const isHidden = detailsEl.style.display === 'none';
                    detailsEl.style.display = isHidden ? 'block' : 'none';
                    toggle.textContent = isHidden ? ' [Hide details]' : ' [Show details]';
                    debug.debug('Toggled error details', { errorId, isVisible: isHidden });
                }
            };
            
            const detailsEl = document.createElement('pre');
            detailsEl.id = detailsId;
            detailsEl.style.display = 'none';
            detailsEl.style.background = 'rgba(0,0,0,0.05)';
            detailsEl.style.padding = '8px';
            detailsEl.style.borderRadius = '4px';
            detailsEl.style.marginTop = '5px';
            detailsEl.style.overflowX = 'auto';
            detailsEl.textContent = typeof details === 'string' ? details : JSON.stringify(details, null, 2);
            
            errorContainer.appendChild(icon);
            errorContainer.appendChild(messageSpan);
            errorContainer.appendChild(toggle);
            errorContainer.appendChild(detailsEl);
        } else {
            errorContainer.appendChild(icon);
            errorContainer.appendChild(messageSpan);
        }
        
        // Clear existing content and add new error
        element.innerHTML = '';
        element.appendChild(errorContainer);
        
        // Style the error container
        element.style.color = '#ff6b6b';
        element.style.whiteSpace = 'pre-wrap';
        element.style.overflow = 'auto';
        element.style.maxHeight = '200px';
        element.style.padding = '8px';
        element.style.border = '1px solid #ffb3b3';
        element.style.borderRadius = '4px';
        element.style.backgroundColor = '#fff0f0';
        
        // Auto-clear error after 30 seconds
        const clearError = () => {
            if (document.getElementById(errorId)) {
                element.innerHTML = '';
                element.style = '';
                debug.debug('Cleared error message', { errorId });
            }
        };
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.background = 'none';
        closeBtn.style.border = 'none';
        closeBtn.style.fontSize = '1.2em';
        closeBtn.style.float = 'right';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.padding = '0 5px';
        closeBtn.onclick = (e) => {
            e.preventDefault();
            clearError();
        };
        
        errorContainer.insertBefore(closeBtn, errorContainer.firstChild);
        
        // Set timeout to clear error
        setTimeout(clearError, 30000);
        
    } catch (error) {
        debug.error('Failed to display error message', {
            errorId,
            originalMessage: message,
            error: error.message,
            stack: error.stack
        });
        
        // Fallback to simple error display
        try {
            element.textContent = `Error: ${typeof message === 'string' ? message : 'An error occurred'}`;
            element.style.color = '#ff6b6b';
        } catch (e) {
            debug.error('Complete failure in error display', {
                originalError: message,
                displayError: e.message
            });
        }
    }
}

// Get problem info from content script or storage
async function testContentScriptConnection(tabId) {
    try {
        debug.debug('Testing connection to content script...');
        const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
        debug.debug('Content script response:', response);
        return response?.status === 'pong';
    } catch (error) {
        debug.error('Content script connection test failed:', error);
        return false;
    }
}

async function getProblemInfo() {
    const requestId = Date.now();
    const log = (...args) => debug.debug(`[${requestId}]`, ...args);
    
    log('Starting to get problem info');
    
    try {
        log('Querying active tab...');
        const [tab] = await chrome.tabs.query({ 
            active: true, 
            currentWindow: true,
            url: 'https://leetcode.com/problems/*'
        });
        
        if (!tab) {
            throw new Error('No active LeetCode problem tab found');
        }
        
        log('Active tab found:', { 
            id: tab.id, 
            url: tab.url,
            title: tab.title,
            status: tab.status
        });
        
        // Test content script connection
        log('Testing content script connection...');
        const connectionTest = await testContentScriptConnection(tab.id);
        
        if (!connectionTest) {
            // Try to inject content script if not responding
            log('Content script not responding, attempting to inject...');
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
            
            // Give it a moment to initialize
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Test connection again
            const retryTest = await testContentScriptConnection(tab.id);
            if (!retryTest) {
                throw new Error('Content script injection failed. Please refresh the page and try again.');
            }
            log('Successfully injected content script');
        }
        
        // First try to get from content script
        const response = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Content script response timeout'));
            }, 2000);
            
            chrome.tabs.sendMessage(
                tab.id, 
                { 
                    action: 'extractQuestion',
                    timestamp: Date.now()
                },
                (response) => {
                    clearTimeout(timeout);
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message || 'Content script error'));
                    } else {
                        resolve(response);
                    }
                }
            );
        });
        
        log('Content script response:', response ? 'success' : 'no response');
        
        if (response?.success) {
            // Store in localStorage for future use
            try {
                localStorage.setItem('leetcodeTitle', response.title);
                localStorage.setItem('leetcodeDesc', response.description);
                localStorage.setItem('lastProblemUrl', tab.url);
                localStorage.setItem('lastProblemFetch', Date.now().toString());
            } catch (e) {
                console.error('Error saving to localStorage:', e);
            }
            
            return response;
        }
        
        // If no response but we have cached data, return that
        const cachedTitle = localStorage.getItem('leetcodeTitle');
        const cachedDesc = localStorage.getItem('leetcodeDesc');
        const lastUrl = localStorage.getItem('lastProblemUrl');
        
        if (cachedTitle && cachedDesc && lastUrl === tab.url) {
            log('Using cached problem info');
            return {
                success: true,
                title: cachedTitle,
                description: cachedDesc,
                fromCache: true
            };
        }
        
        throw new Error('Could not extract problem information');
        
    } catch (error) {
        log('Failed to get problem info:', error);
        throw error;
    }
}

/**
 * Make an API request to get a hint or solution
 * @param {string} type - The type of request ('hint' or 'solution')
 * @param {number} [retryCount=2] - Number of retry attempts
 * @returns {Promise<void>}
 */
async function fetchFromAPI(type, retryCount = 2) {
    const requestId = `api-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const logContext = {
        requestId,
        type,
        timestamp: new Date().toISOString()
    };
    
    const element = document.getElementById(type);
    const button = document.getElementById(`get${type.charAt(0).toUpperCase() + type.slice(1)}`);
    
    if (!element || !button) {
        const error = new Error(`Required elements not found for type: ${type}`);
        debug.error('Missing UI elements', { ...logContext, error: error.message });
        return;
    }
    
    // Helper function to log API request state
    const logApiState = (state, data = {}) => {
        debug.debug(`API ${type} ${state}`, { 
            ...logContext, 
            ...data,
            elementId: element.id,
            buttonId: button.id
        });
    };
    
    logApiState('starting');
    
    try {
        setLoading(button, true);
        element.textContent = `Loading ${type}...`;
        
        // Get problem info with retries
        logApiState('fetching problem info');
        let problemInfo;
        
        try {
            problemInfo = await getProblemInfo(2, 'api-request');
            logApiState('problem info received', {
                hasTitle: !!problemInfo?.title,
                descLength: problemInfo?.description?.length
            });
        } catch (error) {
            logApiState('failed to get problem info', { 
                error: error.message,
                stack: error.stack 
            });
            throw new Error('Could not get problem information. Please make sure you are on a LeetCode problem page.');
        }
        
        const { title, description } = problemInfo;
        
        if (!title || !description) {
            const error = new Error('Incomplete problem information');
            logApiState('incomplete problem info', {
                hasTitle: !!title,
                hasDescription: !!description
            });
            throw error;
        }
        
        // Prepare API request
        const endpoint = type === 'hint' ? '/hint' : '/solution';
        const url = `http://localhost:8000${endpoint}`;
        const requestBody = {
            title: title,
            desc: description.substring(0, 10000), // Match backend's expected field name 'desc'
            // Move metadata inside the request body if needed by the backend
            metadata: {
                requestId,
                timestamp: new Date().toISOString(),
                source: 'leetcode-hint-extension',
                version: '1.0.0'
            }
        };
        
        // Remove metadata if backend doesn't expect it
        // const requestBody = {
        //     title: title,
        //     desc: description.substring(0, 10000)
        // };
        
        logApiState('making API request', {
            url,
            titleLength: title.length,
            descLength: description.length,
            truncatedDesc: description.length > 10000
        });
        
        const controller = new AbortController();
        const timeoutMs = 30000; // 30 seconds
        const timeoutId = setTimeout(() => {
            logApiState('request timeout', { timeoutMs });
            controller.abort();
        }, timeoutMs);
        
        let response;
        let responseData;
        
        try {
            // Make the API request
            const startTime = performance.now();
            response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'LeetCodeHintGenie/1.0',
                    'X-Request-ID': requestId,
                    'X-Client-Version': '1.0.0'
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
                credentials: 'omit',
                referrerPolicy: 'no-referrer',
                cache: 'no-store'
            });
            
            const duration = Math.round(performance.now() - startTime);
            logApiState('API response received', {
                status: response.status,
                statusText: response.statusText,
                durationMs: duration,
                ok: response.ok
            });
            
            clearTimeout(timeoutId);
            
            // Handle non-OK responses
            if (!response.ok) {
                const errorText = await response.text();
                logApiState('API error response', {
                    status: response.status,
                    responseText: errorText.substring(0, 1000) // Limit error text size
                });
                
                throw new Error(`Server responded with status ${response.status}: ${response.statusText}`);
            }
            
            // Parse JSON response
            try {
                responseData = await response.json();
                logApiState('API response parsed', {
                    hasData: !!responseData,
                    hasContent: !!responseData?.[type]
                });
            } catch (parseError) {
                logApiState('failed to parse JSON response', {
                    error: parseError.message,
                    status: response.status,
                    statusText: response.statusText
                });
                throw new Error('Invalid response format from server');
            }
            
            const content = responseData[type];
            
            if (!content) {
                throw new Error(`No ${type} found in response`);
            }
            
            // Success - display the content
            element.textContent = content;
            element.style.color = '';
            element.style.whiteSpace = 'pre-wrap';
            element.style.overflow = 'auto';
            element.style.maxHeight = '300px';
            
            logApiState('content displayed', { contentLength: content.length });
            
            // Store the successful response in history
            try {
                const history = JSON.parse(localStorage.getItem('apiHistory') || '[]');
                const historyItem = {
                    id: requestId,
                    type,
                    title,
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                    contentLength: content.length
                };
                
                history.unshift(historyItem);
                localStorage.setItem('apiHistory', JSON.stringify(history.slice(0, 50)));
                logApiState('history updated', { historyCount: history.length });
                
            } catch (historyError) {
                logApiState('failed to update history', {
                    error: historyError.message,
                    stack: historyError.stack
                });
                // Non-critical error, continue
            }
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            // Handle specific error types
            if (error.name === 'AbortError') {
                logApiState('request aborted', { reason: 'timeout' });
                throw new Error('Request timed out. The server is taking too long to respond.');
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                logApiState('network error', { error: error.message });
                throw new Error('Network error. Please check your internet connection and try again.');
            } else if (error.name === 'SyntaxError') {
                logApiState('invalid JSON response', { error: error.message });
                throw new Error('Invalid response from server. The server might be returning an error page.');
            }
            
            // Re-throw other errors
            throw error;
        }
        
    } catch (error) {
        logApiState('API request failed', {
            error: error.message,
            stack: error.stack,
            retryCount,
            willRetry: retryCount > 0
        });
        
        // Format error message for user
        let userMessage = error.message || `Failed to fetch ${type}`;
        let errorDetails = null;
        
        // Add more context for common errors
        if (error.message.includes('Failed to fetch')) {
            userMessage = 'Could not connect to the server. Please make sure the backend server is running at http://localhost:8000';
            errorDetails = {
                message: 'Network request failed',
                suggestion: '1. Make sure the server is running\n2. Check your internet connection\n3. Verify CORS settings on the server',
                originalError: error.message
            };
        } else if (error.message.includes('Unexpected token')) {
            userMessage = 'Invalid response from server';
            errorDetails = {
                message: 'Server returned invalid JSON',
                suggestion: 'The server might be returning an error page or incorrect content type',
                originalError: error.message
            };
        } else if (error.message.includes('timed out')) {
            userMessage = 'Request timed out. The server is taking too long to respond.';
            errorDetails = {
                message: 'Request timeout',
                suggestion: '1. Check if the server is under heavy load\n2. Try again in a moment\n3. Verify server logs for issues',
                originalError: error.message
            };
        }
        
        // Show error to user
        showError(element, userMessage, errorDetails);
        
        // Auto-retry if we have retries left
        if (retryCount > 0) {
            const delay = 1000 * (3 - retryCount); // Exponential backoff
            logApiState('scheduling retry', { retryCount, delay });
            
            element.textContent += `\n\nRetrying in ${delay/1000} seconds... (${retryCount} ${retryCount === 1 ? 'retry' : 'retries'} left)`;
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchFromAPI(type, retryCount - 1);
        }
        
        // Log final failure if all retries are exhausted
        logApiState('all retries exhausted', { error: error.message });
        
    } finally {
        setLoading(button, false);
        logApiState('completed');
    }
}

// Track if popup was opened automatically
let isAutoOpened = window.opener && window.opener !== window;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Popup initialized', { isAutoOpened });
    
    // Add a close button for auto-opened popups
    if (isAutoOpened) {
        const header = document.querySelector('.header');
        if (header) {
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '×';
            closeBtn.style.cssText = `
                background: none;
                border: none;
                color: var(--text-muted);
                font-size: 24px;
                cursor: pointer;
                margin-left: auto;
                padding: 0 8px;
                line-height: 1;
            `;
            closeBtn.onclick = () => window.close();
            header.appendChild(closeBtn);
        }
    }
    
    const hintElement = document.getElementById('hint');
    const solutionElement = document.getElementById('solution');
    const hintButton = document.getElementById('getHint');
    const solutionButton = document.getElementById('getSolution');
    
    if (!hintElement || !solutionElement || !hintButton || !solutionButton) {
        console.error('Could not find required elements');
        return;
    }
    
    // Set initial content
    const setInitialState = () => {
        hintElement.textContent = 'Click the button to get a hint';
        solutionElement.textContent = 'Click the button to view the solution';
        hintElement.style.color = '';
        solutionElement.style.color = '';
    };
    
    setInitialState();
    
    // Set up event listeners with error handling
    const setupButton = (button, type) => {
        if (!button) return;
        
        button.addEventListener('click', async () => {
            try {
                await fetchFromAPI(type);
            } catch (error) {
                console.error(`Error in ${type} button click:`, error);
                const element = document.getElementById(type);
                if (element) {
                    showError(element, `Failed to get ${type}: ${error.message}`);
                }
            }
        });
    };
    
    setupButton(hintButton, 'hint');
    setupButton(solutionButton, 'solution');
    
    // Try to preload problem info
    const preloadProblemInfo = async () => {
        try {
            console.log('Preloading problem info...');
            const { title, fromCache } = await getProblemInfo();
            
            if (title) {
                const cacheStatus = fromCache ? ' (from cache)' : '';
                console.log(`Found problem: ${title}${cacheStatus}`);
                
                hintElement.textContent = `Ready to get a hint for: ${title}`;
                solutionElement.textContent = `Ready to view solution for: ${title}`;
                
                // Show a small indicator if using cached data
                if (fromCache) {
                    const cacheNote = document.createElement('div');
                    cacheNote.textContent = 'Using cached problem data';
                    cacheNote.style.fontSize = '0.8em';
                    cacheNote.style.color = '#888';
                    cacheNote.style.marginTop = '5px';
                    
                    const parent = hintElement.parentNode;
                    if (parent) {
                        parent.insertBefore(cacheNote, hintElement.nextSibling);
                    }
                }
            } else {
                console.log('No problem title found');
            }
        } catch (error) {
            console.log('No active problem detected or error loading problem info:', error);
            // Don't show error to user in preload - they haven't requested anything yet
        }
    };
    
    // Add a refresh button
    const addRefreshButton = () => {
        const refreshButton = document.createElement('button');
        refreshButton.textContent = '🔄 Refresh';
        refreshButton.style.marginTop = '10px';
        refreshButton.style.padding = '5px 10px';
        refreshButton.style.fontSize = '0.9em';
        refreshButton.addEventListener('click', () => {
            // Clear cached data
            localStorage.removeItem('leetcodeTitle');
            localStorage.removeItem('leetcodeDesc');
            chrome.storage.local.remove(['leetcodeTitle', 'leetcodeDesc']);
            
            // Reset UI
            setInitialState();
            
            // Try to reload problem info
            preloadProblemInfo();
        });
        
        const container = document.querySelector('.container');
        if (container) {
            container.appendChild(refreshButton);
        }
    };
    
    // Initialize
    preloadProblemInfo();
    addRefreshButton();
    
    console.log('Popup initialization complete');
});
