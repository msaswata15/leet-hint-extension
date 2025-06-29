// Debug utility will be loaded asynchronously
let debug = {
    info: console.log.bind(console, '[CONTENT INFO]'),
    debug: console.debug.bind(console, '[CONTENT DEBUG]'),
    warn: console.warn.bind(console, '[CONTENT WARN]'),
    error: console.error.bind(console, '[CONTENT ERROR]')
};

// Log that content script is running
debug.info('Content script initialized on:', window.location.href);

// Add a ping handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'ping') {
        debug.debug('Received ping, sending pong');
        sendResponse({ status: 'pong', tabId: sender.tab?.id });
        return true;
    }
    return false;
});

// Load debug module asynchronously
(async () => {
    try {
        const debugModule = await import(chrome.runtime.getURL('debug.js'));
        const debugInstance = debugModule.createDebugger('Content');
        
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

debug.info('Content script initialized');

// Function to extract problem info
async function extractProblemInfo() {
    debug.info('Starting problem info extraction');
    
    try {
        // Log document title for debugging
        debug.debug('Document title:', document.title);
        
        // Get title using the specific selector
        let titleEl = document.querySelector('div.text-title-large a');
        let title = '';
        
        if (titleEl && titleEl.textContent && titleEl.textContent.trim()) {
            title = titleEl.textContent.trim();
            debug.debug('Found title element with selector: div.text-title-large a', {
                text: title,
                href: titleEl.href || 'N/A'
            });
        } else {
            debug.warn('Title element not found with selector: div.text-title-large a');
            return null;
        }
        

        debug.info('Found problem title', { title });
        
        // Get problem description - try different selectors as LeetCode might change their DOM
        const descriptionSelectors = [
            'div.elfjS[data-track-load="description_content"]',
            '[data-track-load="description_content"]',
            '.xFUwe',
            '.elfjS',
            '.question-content__JfgR',
            '.content__1cEW',
            '.question-content__1MmRn',
            '.description__1kZP',
            '.question-description__1s6e',
            'div[data-cy="question-title"] + div',  // Title's sibling
            'div[data-cy="description-content"]'    // Common data-cy attribute
        ];
        
        let descEl = null;
        let description = '';
        
        // First try direct queries with specific selectors
        debug.debug('Trying description selectors:', descriptionSelectors);
        for (const selector of descriptionSelectors) {
            descEl = document.querySelector(selector);
            const hasContent = descEl && descEl.textContent && descEl.textContent.trim();
            debug.debug(`Selector '${selector}':`, { 
                found: !!descEl, 
                hasText: hasContent ? `[${hasContent.length} chars]` : 'no text',
                sample: hasContent ? `${descEl.textContent.trim().substring(0, 50)}...` : 'n/a'
            });
            
            if (hasContent) {
                debug.debug(`Found description with selector: ${selector}`, { 
                    length: hasContent.length,
                    preview: `${descEl.textContent.trim().substring(0, 100)}...`
                });
                description = descEl.textContent.trim();
                break;
            }
            descEl = null;
        }
        
        // If not found, try waiting for dynamic content
        if (!description) {
            debug.debug('Description not found in initial load, waiting for dynamic content...');
            try {
                await new Promise((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, 1000);
                });
            
                // Retry with the same selectors after delay
                for (const selector of descriptionSelectors) {
                    descEl = document.querySelector(selector);
                    if (descEl && descEl.textContent && descEl.textContent.trim()) {
                        debug.debug(`Found description element after delay with selector: ${selector}`);
                        description = descEl.textContent.trim();
                        break;
                    }
                    descEl = null;
                }
            } catch (error) {
                debug.error('Error while waiting for dynamic content:', error);
            }
        }
        
        // If still not found, try parent containers as fallback
        if (!description) {
            debug.debug('Trying fallback parent containers...');
            const parentContainers = [
                'div[class*="content"]',
                'div[class*="description"]',
                'div[class*="Question"]',
                'div[class*="question"]',
                'div[class*="problem"]',
                'div[class*="Problem"]',
                '#app > div > div > div > div > div',
                'body > div > div > div'
            ];
            
            for (const container of parentContainers) {
                const content = document.querySelector(container);
                if (content) {
                    debug.debug(`Found potential container with selector: ${container}`);
                    // Clone to avoid modifying the original
                    const clone = content.cloneNode(true);
                    // Remove code editors, buttons, and other elements we don't want
                    const toRemove = clone.querySelectorAll([
                        '.monaco-editor', 'button', '.CodeMirror', '[role="button"]',
                        '.action', '.btn', '.editor', '.mt-3', '.editor-wrapper',
                        '.code-editor', '.react-codemirror2', '.react-monaco-editor-container',
                        '.monaco-scrollable-element', '.monaco-editor-background',
                        '.inputarea', '.margin', '.overflow-guard', '.minimap',
                        '.decorationsOverviewRuler', '.scrollbar', '.suggest-widget',
                        '.parameter-hints-widget', '.snippet-suggestions',
                        'script', 'style', 'link', 'svg', 'img', 'iframe', 'noscript'
                    ].join(','));
                    
                    toRemove.forEach(el => el.remove());
                    
                    // Check if we have enough text content
                    const text = clone.textContent.replace(/\s+/g, ' ').trim();
                    if (text.length > 100) {  // Reasonable minimum length for a problem description
                        descEl = clone;
                        description = text;
                        debug.debug(`Found valid description in container: ${container}`, { textLength: text.length });
                        break;
                    }
                }
            }
        }
        
        if (!description) {
            debug.error('Could not find description element after all attempts');
            debug.debug('Document body structure:', {
                title: document.title,
                location: window.location.href,
                bodyClass: document.body.className,
                bodyId: document.body.id,
                bodyChildren: Array.from(document.body.children).map(el => ({
                    tag: el.tagName,
                    id: el.id,
                    classes: el.className,
                    text: el.textContent ? el.textContent.substring(0, 100) + '...' : ''
                }))
            });
            return null;
        }
        
        // Clean up the description text if it's not already cleaned
        description = description
            .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
            .replace(/\n+/g, ' ')  // Replace newlines with space
            .replace(/\t+/g, ' ')  // Replace tabs with space
            .trim();
            
        debug.debug('Extracted description', { 
            length: description.length,
            preview: description.substring(0, 100) + '...' 
        });
        
        if (!description) {
            debug.error('Empty description after cleaning');
            return null;
        }
        
        // Store in both storage mechanisms for reliability
        const data = { 
            title, 
            description,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            extractedFrom: {
                titleSelector: '.text-title-large a',
                descriptionSelectors: descriptionSelectors,
                usedParentContainer: descEl.className || descEl.id || 'unknown'
            }
        };
        
        debug.info('Extracted problem info', { 
            titleLength: title.length,
            title: title,
            descriptionLength: description?.length || 0,
            descriptionPreview: description ? `${description.substring(0, 100)}...` : 'N/A',
            url: window.location.href
        });
        
        // Store in chrome.storage.local
        const storageData = {
            leetcodeTitle: title,
            leetcodeDesc: description,
            lastProblemUrl: window.location.href,
            lastUpdated: new Date().toISOString(),
            extractionStats: {
                success: true,
                timestamp: Date.now(),
                version: chrome.runtime.getManifest().version
            }
        };
        
        chrome.storage.local.set(storageData, () => {
            if (chrome.runtime.lastError) {
                debug.error('Error saving to chrome.storage.local:', chrome.runtime.lastError);
            } else {
                debug.debug('Successfully saved problem info to chrome.storage.local');
            }
        });
        
        // Also store in localStorage for backward compatibility
        try {
            localStorage.setItem('leetcodeTitle', title);
            localStorage.setItem('leetcodeDesc', description);
            localStorage.setItem('lastProblemUrl', window.location.href);
            localStorage.setItem('lastProblemFetch', Date.now().toString());
            debug.debug('Saved problem info to localStorage');
        } catch (e) {
            debug.error('Error saving to localStorage:', e);
            // If we hit quota, try to clean up old items
            if (e.name === 'QuotaExceededError') {
                debug.warn('LocalStorage quota exceeded, attempting cleanup...');
                try {
                    const keysToKeep = ['leetcodeTitle', 'leetcodeDesc', 'lastProblemUrl', 'lastProblemFetch'];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (!keysToKeep.includes(key)) {
                            localStorage.removeItem(key);
                        }
                    }
                    // Retry saving
                    localStorage.setItem('leetcodeTitle', title);
                    localStorage.setItem('leetcodeDesc', description);
                    localStorage.setItem('lastProblemUrl', window.location.href);
                    localStorage.setItem('lastProblemFetch', Date.now().toString());
                    debug.info('Successfully saved to localStorage after cleanup');
                } catch (cleanupError) {
                    debug.error('Failed to clean up localStorage:', cleanupError);
                }
            }
        }
        
        return data;
    } catch (error) {
        debug.error('Error in extractProblemInfo:', error);
        // Log additional context
        debug.debug('Error context:', {
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack,
            location: window.location.href,
            timestamp: new Date().toISOString()
        });
        throw error; // Re-throw to be caught by the caller
    }
}

// Listen for messages from popup and other parts of the extension
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    debug.info('Message received', { 
        action: request.action,
        sender: sender.tab ? `tab:${sender.tab.id}` : 'unknown',
        requestId: request.requestId || 'none',
        timestamp: new Date().toISOString()
    });

    if (request.action === 'extractQuestion') {
        const requestId = request.requestId || Date.now();
        const logPrefix = `[${requestId}]`;
        
        debug.info(`${logPrefix} Processing extractQuestion request`);
        
        // Helper function to send response with logging
        const sendProblemInfoResponse = (result, source) => {
            debug.info(`${logPrefix} Sending response (source: ${source})`, {
                hasTitle: !!result?.title,
                descLength: result?.description?.length || 0,
                success: result?.success,
                error: result?.error
            });
            
            if (chrome.runtime.lastError) {
                debug.error(`${logPrefix} Error sending response:`, chrome.runtime.lastError);
            }
            
            try {
                sendResponse(result);
            } catch (e) {
                debug.error(`${logPrefix} Failed to send response:`, e);
            }
        };
        
        // Try to get fresh data first
        debug.debug(`${logPrefix} Attempting to extract problem info`);
        try {
            const problemInfo = await extractProblemInfo();
            if (problemInfo) {
                sendProblemInfoResponse({
                    success: true,
                    ...problemInfo,
                    _source: 'direct_extraction'
                }, 'direct extraction');
                return true;
            }
        } catch (error) {
            debug.error(`${logPrefix} Error extracting problem info:`, error);
            sendProblemInfoResponse({
                success: false,
                error: 'Failed to extract problem info',
                details: error.message
            }, 'error');
            return false;
        }
        
        debug.debug(`${logPrefix} Direct extraction failed, trying storage...`);
        
        // If not found immediately, try to get from storage
        chrome.storage.local.get(['leetcodeTitle', 'leetcodeDesc', 'lastProblemUrl'], (result) => {
            const currentUrl = window.location.href;
            const isSameProblem = result.lastProblemUrl && 
                               new URL(result.lastProblemUrl).pathname === new URL(currentUrl).pathname;
            
            if (result.leetcodeTitle && result.leetcodeDesc && isSameProblem) {
                debug.debug(`${logPrefix} Found valid cached data for current problem`);
                sendProblemInfoResponse({
                    success: true,
                    title: result.leetcodeTitle,
                    description: result.leetcodeDesc,
                    _source: 'storage_cache',
                    _cached: true
                }, 'storage cache');
                return;
            }
            
            debug.debug(`${logPrefix} No valid cache, retrying extraction...`);
            
            // If still not found, try one more time after a delay
            setTimeout(() => {
                debug.debug(`${logPrefix} Retrying problem info extraction`);
                const retryProblemInfo = extractProblemInfo();
                
                if (retryProblemInfo) {
                    sendProblemInfoResponse({
                        success: true,
                        ...retryProblemInfo,
                        _source: 'retry_extraction'
                    }, 'retry extraction');
                } else {
                    debug.error(`${logPrefix} Failed to extract problem information after retry`);
                    
                    // Log detailed error information
                    debug.debug(`${logPrefix} Page state at time of failure:`, {
                        url: window.location.href,
                        title: document.title,
                        hasContent: document.body && document.body.innerHTML.length > 0,
                        contentPreview: document.body ? 
                            document.body.textContent.substring(0, 200) + '...' : 'No body',
                        timestamp: new Date().toISOString()
                    });
                    
                    sendProblemInfoResponse({
                        success: false,
                        error: "Could not extract problem information",
                        errorDetails: {
                            message: "Failed after multiple attempts",
                            url: window.location.href,
                            timestamp: new Date().toISOString()
                        },
                        _source: 'error_handling'
                    }, 'error');
                }
            }, 1000);
        });
        
        return true; // Keep the message channel open for async response
    }
    
    // Handle other message types
    debug.debug('Unhandled message type:', { action: request.action });
    return false; // Not handled
});

// Function to log when the content script is injected
function logInjectionPoint() {
    debug.info('Content script injected at:', new Date().toISOString());
    debug.debug('Document readyState:', document.readyState);
    debug.debug('Document title:', document.title);
    debug.debug('URL:', window.location.href);
}

// Extract and store info when the page loads
function setupExtraction() {
    debug.info('Setting up extraction listeners');
    
    // Immediate extraction if DOM is already ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        debug.debug('Document already ready, extracting immediately');
        extractProblemInfo();
    }
    
    // Setup listeners for future state changes
    document.addEventListener('DOMContentLoaded', () => {
        debug.debug('DOMContentLoaded - extracting problem info');
        extractProblemInfo();
    });

    window.addEventListener('load', () => {
        debug.debug('Window loaded - extracting problem info');
        extractProblemInfo();
    });
}

// Initialize
logInjectionPoint();
setupExtraction();

// Notify background script that LeetCode page has loaded
if (window.location.hostname.includes('leetcode.com')) {
    chrome.runtime.sendMessage({ action: 'pageLoaded' });
}

// Also try to extract when URL changes (for SPA navigation)
let lastUrl = location.href;
const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        if (location.href.includes('/problems/')) {
            console.log('URL changed - extracting problem info');
            setTimeout(extractProblemInfo, 1000); // Wait for the page to update
        }
    }
});
observer.observe(document, { subtree: true, childList: true });
