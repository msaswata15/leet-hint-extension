// Debug utility for service worker
const debug = {
    info: console.log.bind(console, '[BG INFO]'),
    debug: console.debug.bind(console, '[BG DEBUG]'),
    warn: console.warn.bind(console, '[BG WARN]'),
    error: console.error.bind(console, '[BG ERROR]')
};

debug.info('LeetCode Hint Genie background script initialized');

// Listen for when the extension is installed or updated
chrome.runtime.onInstalled.addListener((details) => {
    debug.info('Extension installed or updated:', details.reason);
    
    // Clear any existing data
    chrome.storage.local.clear();
    
    // Set default values
    chrome.storage.local.set({
        extensionEnabled: true,
        lastUpdated: new Date().toISOString()
    });
});

// Listen for tab updates to detect when a LeetCode problem is loaded
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url?.includes('leetcode.com/problems/')) {
        console.log('LeetCode problem page loaded, injecting content script');
        // The content script will automatically run due to the matches pattern in manifest
    }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    debug.info('Message received in background:', { action: request.action, sender });
    
    if (request.action === 'testContentScript') {
        if (!request.tabId) {
            debug.error('No tabId provided for content script test');
            sendResponse({ success: false, error: 'No tabId provided' });
            return true;
        }
        
        testContentScriptInjection(request.tabId)
            .then(result => sendResponse(result))
            .catch(error => {
                debug.error('Content script test failed:', error);
                sendResponse({ 
                    success: false, 
                    error: 'Test failed', 
                    details: error.message 
                });
            });
        return true; // Keep the message channel open for async response
    }
    else if (request.action === 'getProblemInfo') {
        // Forward the message to the content script
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]?.id) {
                debug.debug('Forwarding getProblemInfo to tab:', tabs[0].id);
                chrome.tabs.sendMessage(tabs[0].id, 
                    { action: 'extractQuestion' },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            debug.error('Error sending message to tab:', chrome.runtime.lastError);
                            sendResponse({
                                success: false,
                                error: 'Failed to communicate with content script',
                                details: chrome.runtime.lastError.message
                            });
                        } else {
                            sendResponse(response || {
                                success: false,
                                error: 'No response from content script'
                            });
                        }
                    }
                );
            } else {
                debug.error('No active tab found');
                sendResponse({
                    success: false, 
                    error: 'No active tab found',
                    details: 'Please open a LeetCode problem page first'
                });
            }
        });
        return true; // Keep the message channel open for async response
    }
    
    // For unhandled messages
    debug.debug('Unhandled message type:', request.action);
    return false;
});

// Function to test content script injection and communication
async function testContentScriptInjection(tabId) {
    debug.info('Testing content script injection for tab:', tabId);
    
    try {
        // First, try to execute script to check if content script is accessible
        const injectionResult = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => ({
                isContentScriptInjected: true,
                url: window.location.href,
                readyState: document.readyState
            })
        });
        
        debug.debug('Script injection result:', injectionResult);
        
        if (chrome.runtime.lastError) {
            debug.error('Script injection failed:', chrome.runtime.lastError);
            return { success: false, error: 'Script injection failed', details: chrome.runtime.lastError };
        }
        
        // Then try to ping the content script
        try {
            const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
            debug.debug('Ping response:', response);
            return { 
                success: true, 
                contentScript: true,
                response 
            };
        } catch (pingError) {
            debug.debug('Ping failed, attempting to inject content script...');
            
            // If ping fails, try to inject the content script manually
            try {
                await chrome.scripting.executeScript({
                    target: { tabId },
                    files: ['content.js']
                });
                
                // Give it a moment to initialize
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Try pinging again
                const retryResponse = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
                debug.debug('Ping after injection:', retryResponse);
                
                return { 
                    success: true, 
                    contentScript: true,
                    injected: true,
                    response: retryResponse 
                };
            } catch (injectError) {
                debug.error('Failed to inject content script:', injectError);
                return { 
                    success: false, 
                    error: 'Content script injection failed', 
                    details: injectError 
                };
            }
        }
    } catch (error) {
        debug.error('Content script test failed:', error);
        return { 
            success: false, 
            error: 'Content script test failed', 
            details: error 
        };
    }
}


// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
    debug.info('LeetCode Hint Genie extension installed');
    
    try {
        // Create context menu items
        chrome.contextMenus.create({
            id: 'getHint',
            title: 'Get Hint for This Problem',
            contexts: ['page'],
            documentUrlPatterns: ['https://leetcode.com/problems/*']
        });
        
        chrome.contextMenus.create({
            id: 'getSolution',
            title: 'Get Solution for This Problem',
            contexts: ['page'],
            documentUrlPatterns: ['https://leetcode.com/problems/*']
        });
        
        debug.info('Context menu items created');
    } catch (error) {
        debug.error('Failed to create context menu items:', error);
    }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab?.id) return;
    
    if (info.menuItemId === 'getHint') {
        chrome.tabs.sendMessage(tab.id, {action: 'getHint'});
    } else if (info.menuItemId === 'getSolution') {
        chrome.tabs.sendMessage(tab.id, {action: 'getSolution'});
    }
});
