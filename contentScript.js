console.log("DBT Run Alias extension loaded.");

function injectAliasUI() {
    function checkAndInjectAlias(runList) {
        const runs = runList.querySelectorAll('li');
        runs.forEach(run => {
            // Assuming each 'run' li element has a unique identifier you can use to store/fetch aliases
            const anchor = run.querySelector('a[href*="/runs/"]');
            if (!anchor) return;

            const hrefParts = anchor.getAttribute('href').split('/');
            const runId = hrefParts[hrefParts.length - 1];

            // Check if an alias already exists for this run
            chrome.storage.sync.get([runId], function (result) {
                if (result[runId]) {
                    let aliasDisplay = run.querySelector('.run-alias-display');
                    if (!aliasDisplay) {
                        // Alias display span doesn't exist, create it
                        aliasDisplay = document.createElement('span');
                        aliasDisplay.className = 'run-alias-display';
                        run.appendChild(aliasDisplay); // Append the alias display span to the run item
                    }
                    aliasDisplay.textContent = result[runId];
                    
                    run.style.backgroundColor = '#FFBE96';
                }
            });
        });
    }


    const observer = new MutationObserver((mutations) => {
        const runList = document.querySelector('div[data-testid="run-list"]');
        if (runList) {
            checkAndInjectAlias(runList);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Check immediately in case the list is already present
    const initialRunList = document.querySelector('div[data-testid="run-list"]');
    if (initialRunList) {
        checkAndInjectAlias(initialRunList);
    }
}

function isIndividualRunDetailsPage() {
    return window.location.href.includes('/runs/');
}

function manageIndividualRunAlias() {
    // Extracting the run ID from the URL
    const urlParts = window.location.pathname.split('/');
    const runId = urlParts[urlParts.length - 1]; // Assuming run ID is the last part of the URL

    const existingAliasInput = document.querySelector('.run-alias-input');
    if (existingAliasInput) {
        console.log('Alias UI already exists. Skipping re-injection.');
        return; // Exit the function to avoid adding another alias UI
    }

    // Continue with inserting the alias UI if it doesn't already exist
    const headerTitle = document.querySelector('h1[data-testid="page-header-title"]');
    const insertPoint = headerTitle ? headerTitle.closest('div') : null;

    if (!insertPoint) {
        console.log('Insert point for alias UI not found.');
        return;
    }

    const aliasLabel = document.createElement('label');
    aliasLabel.textContent = 'Run Alias: ';
    aliasLabel.style.marginRight = '10px';

    const aliasInput = document.createElement('input');
    aliasInput.setAttribute('type', 'text');
    aliasInput.setAttribute('placeholder', 'No alias set');
    aliasInput.className = 'run-alias-input'; // Add custom styles if needed

    chrome.storage.sync.get([runId], (result) => {
        if (result[runId]) {
            aliasInput.value = result[runId];
        }
    });

    aliasInput.addEventListener('change', () => {
        chrome.storage.sync.set({[runId]: aliasInput.value}, () => {
            console.log(`Alias for run ${runId} updated to ${aliasInput.value}`);
        });
    });

    const aliasContainer = document.createElement('div');
    aliasContainer.appendChild(aliasLabel);
    aliasContainer.appendChild(aliasInput);

    insertPoint.parentNode.insertBefore(aliasContainer, insertPoint.nextSibling);
}

function onDocumentReady() {
    if (isIndividualRunDetailsPage()) {
        manageIndividualRunAlias();
    } else {
        injectAliasUI();
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onDocumentReady);
} else {
    onDocumentReady();
}

// General utility to debounce function calls
function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

// Function that checks the page type and calls the appropriate function
function handlePageChange() {
    if (isIndividualRunDetailsPage()) {
        manageIndividualRunAlias();
    } else {
        const runList = document.querySelector('div[data-testid="run-list"]');
        if (runList) {
            injectAliasUI(runList);
        }
    }
}

// Enhanced observer for SPA navigation
const observer = new MutationObserver(debounce((mutations) => {
    handlePageChange();
}, 500));

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Call handlePageChange initially in case the relevant content is already loaded
handlePageChange();
