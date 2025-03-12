let vttData = [];

async function loadVTTData() {
    try {
        const response = await fetch('combined_vtt');
        const text = await response.text();
        vttData = parseVttContent(text);
        console.log('VTT data loaded successfully');
    } catch (error) {
        console.error('Error loading VTT data:', error);
    }
}


// Add a button to unregister service worker
document.addEventListener('DOMContentLoaded', () => {
    // Create unregister button
    const unregisterButton = document.createElement('button');
    unregisterButton.textContent = 'Reset App';
    unregisterButton.style.backgroundColor = '#800080';
    unregisterButton.style.color = 'white';
    unregisterButton.style.border = 'none';
    unregisterButton.style.padding = '8px 12px';
    unregisterButton.style.borderRadius = '4px';
    unregisterButton.style.cursor = 'pointer';
    unregisterButton.style.marginRight = '5px';
    
    
    // Add button to the top right container
    const container = document.querySelector('div[style*="position: fixed; top: 10px; right: 10px;"]');
    if (container) {
        container.insertBefore(unregisterButton, container.firstChild);
    }
    
    // Dark mode functionality
    initDarkMode();
});

// Initialize dark mode functionality
function initDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    // Check if user preference exists in localStorage
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    // Set initial mode
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
    
    // Add click event listener to toggle
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        
        // Save preference to localStorage
        const currentIsDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', currentIsDarkMode.toString());
    });
}

function searchVTTContent(keyword) {
    const results = [];
    for (const episode of vttData) {
        const matches = episode.segments.filter(segment => 
            segment.text.toLowerCase().includes(keyword.toLowerCase())
        );
        if (matches.length > 0) {
            // Extract YouTube ID from the episode name (assuming it's the last word)
            const parts = episode.filename.split(' ');
            const youtubeId = parts[parts.length - 1];
            
            // Clean up the display name - remove YouTube ID
            let displayName = episode.filename;
            displayName = displayName.substring(0, displayName.lastIndexOf(' '));
            displayName = displayName.replace(/_/g, ' ');
            
            results.push({ 
                filename: episode.filename, 
                name: displayName, 
                url: `https://www.youtube.com/watch?v=${youtubeId}`, 
                matches: matches.map(segment => ({
                    timestamp: segment.timecode,
                    text: segment.text,
                    keyword: keyword // Store the keyword for highlighting
                }))
            });
        }
    }
    return results;
}
// Run the initialize function when the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}


function shakeElement(element) {
    const originalPosition = element.style.transform;
    const shakeIntensity = 0.3; // Slightly increased for visibility
    let beatCount = 0;
    const beatsPerCycle = 2;
    const cycleCount = 3; // Number of heartbeat cycles

    function heartbeatShake() {
        if (beatCount >= beatsPerCycle * cycleCount) {
            element.style.transform = originalPosition;
            return;
        }

        const currentBeat = beatCount % beatsPerCycle;
        const xShift = (Math.random() - 0.5) * shakeIntensity;
        const yShift = (Math.random() - 0.5) * shakeIntensity;

        if (currentBeat === 0) {
            // First beat: quick, strong shake
            element.style.transform = `translate(${xShift * 1.5}px, ${yShift * 1.5}px)`;
            setTimeout(() => {
                element.style.transform = originalPosition;
                setTimeout(heartbeatShake, 100); // Short pause before second beat
            }, 50);
        } else {
            // Second beat: slightly weaker shake
            element.style.transform = `translate(${xShift}px, ${yShift}px)`;
            setTimeout(() => {
                element.style.transform = originalPosition;
                setTimeout(heartbeatShake, 600); // Longer pause before next cycle
            }, 50);
        }

        beatCount++;
    }

    heartbeatShake();
}




function getYoutubeLink(filename, timestamp) {
    const videoId = filename.split('-').pop().split('.')[0];
    const [hours, minutes, seconds] = timestamp.split(':').map(Number);
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
    return `https://www.youtube.com/watch?v=${videoId}&t=${totalSeconds}s`;
}

function displayResults(results, keyword) {
    const resultsDiv = document.getElementById('results');
    if (!resultsDiv) {
        console.error('Results div not found');
        return;
    }
    if (results.length === 0) {
        resultsDiv.innerHTML = `<p>No results found for "${keyword}".</p>`;
    } else {
        const resultHtml = results.map((result, index) => `
            <div class="video-result" style="animation: fadeIn 0.5s ease-out ${index * 0.1}s both;">
                <h3>${result.name}</h3>
                <ul>
                    ${result.matches.map(match => {
                        // Highlight the keyword in the text
                        const highlightedText = highlightKeyword(match.text, keyword);
                        return `
                        <li class="result-item">
                            <a href="${result.url}&t=${getTimestampSeconds(match.timestamp)}" target="_blank" class="timestamp">
                                <strong>${getStartTimecode(match.timestamp)}</strong>
                            </a>
                            <span class="result-text">${highlightedText}</span>
                        </li>
                    `}).join('')}
                </ul>
            </div>
        `).join('');
        resultsDiv.innerHTML = `<h2>Search Results for "${keyword}":</h2>${resultHtml}`;
        
        // Add hover effect to the entire result item
        document.querySelectorAll('.result-item').forEach(item => {
            item.addEventListener('mouseenter', function() {
                // Find all highlight spans within this result item and make them red
                const highlights = this.querySelectorAll('.highlight');
                highlights.forEach(highlight => {
                    highlight.style.color = '#ff6666'; // Slightly red on hover
                });
            });
            
            item.addEventListener('mouseleave', function() {
                // Reset color when mouse leaves
                const highlights = this.querySelectorAll('.highlight');
                highlights.forEach(highlight => {
                    highlight.style.color = ''; // Reset to default highlight color
                });
            });
        });
    }
}

// Function to highlight keywords in text
function highlightKeyword(text, keyword) {
    if (!keyword) return text;
    
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

function getTimestampSeconds(timestamp) {
    const [start] = timestamp.split(' --> ');
    const [hours, minutes, seconds] = start.split(':').map(Number);
    return Math.floor((hours * 3600) + (minutes * 60) + seconds);
}

function getStartTimecode(timestamp) {
    return timestamp.split(' --> ')[0];
}

function initializeSearch() {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    if (!searchForm || !searchInput) {
        console.error('Search form or input not found');
        return;
    }

    searchInput.placeholder = "Search video History";

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const keyword = searchInput.value.trim();
        if (keyword) {
            const results = searchVTTContent(keyword);
            displayResults(results, keyword);
        }
    });
}

function populateVTTList() {
    const vttList = document.getElementById('vtt-files');
    if (!vttList) {
        console.error('VTT list element not found');
        return;
    }

    const vttItems = vttData.map(episode => {
        // Extract date from filename (assuming format: YYYY-MM-DD-title-videoId)
        const datePart = episode.filename.split('-').slice(0, 3).join('-');
        const date = new Date(datePart);
        
        // Extract YouTube ID from filename
        const parts = episode.filename.split('.');
        const youtubeId = parts[parts.length - 1];
        const url = `https://www.youtube.com/watch?v=${youtubeId}`;
        
        // Clean up the display name - remove underscore and YouTube ID
        let displayName = episode.filename;
        // Remove YouTube ID (everything after the last period)
        displayName = displayName.substring(0, displayName.lastIndexOf('.'));
        // Replace underscores with spaces
        displayName = displayName.replace(/_/g, ' ');
        
        // Check if the date is valid
        const formattedDate = !isNaN(date.getTime()) 
            ? ` <span class="vtt-date">(${date.toLocaleDateString('en-GB')})</span>` 
            : '';

        return `
        <li>
            <label>
                <input type="checkbox" class="vtt-checkbox" data-filename="${episode.filename}" 
                    ${getCookie(episode.filename) === 'true' ? 'checked' : ''}>
                <a href="${url}" target="_blank">
                    ${displayName}${formattedDate}
                </a>
            </label>
        </li>
    `});
    vttList.innerHTML = vttItems.join('');

    // Add event listeners to checkboxes
    document.querySelectorAll('.vtt-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            setCookie(this.dataset.filename, this.checked, 365);
        });
    });
}

function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

async function initialize() {
    await loadVTTData();
    initializeSearch();
    populateVTTList();
    
    // Perform initial search for "christ"
    const initialKeyword = "christ";
    const initialResults = searchVTTContent(initialKeyword);
    displayResults(initialResults, initialKeyword);
}

// Run the initialize function when the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

function shakeElement(element) {
    const originalPosition = element.style.transform;
    const shakeIntensity = 0.3; // Slightly increased for visibility
    let beatCount = 0;
    const beatsPerCycle = 2;
    const cycleCount = 3; // Number of heartbeat cycles

    function heartbeatShake() {
        if (beatCount >= beatsPerCycle * cycleCount) {
            element.style.transform = originalPosition;
            return;
        }

        const currentBeat = beatCount % beatsPerCycle;
        const xShift = (Math.random() - 0.5) * shakeIntensity;
        const yShift = (Math.random() - 0.5) * shakeIntensity;

        if (currentBeat === 0) {
            // First beat: quick, strong shake
            element.style.transform = `translate(${xShift * 1.5}px, ${yShift * 1.5}px)`;
            setTimeout(() => {
                element.style.transform = originalPosition;
                setTimeout(heartbeatShake, 100); // Short pause before second beat
            }, 50);
        } else {
            // Second beat: slightly weaker shake
            element.style.transform = `translate(${xShift}px, ${yShift}px)`;
            setTimeout(() => {
                element.style.transform = originalPosition;
                setTimeout(heartbeatShake, 600); // Longer pause before next cycle
            }, 50);
        }

        beatCount++;
    }

    heartbeatShake();
}


// Set up modal functionality for all images with class 'myImg'
document.addEventListener('DOMContentLoaded', function() {
    // Get all images with class 'myImg'
    var images = document.querySelectorAll('.myImg');
    
    // Set up click event for all modal images
    images.forEach(function(img) {
        img.onclick = function() {
            // Get the next sibling element which is the modal
            var modal = this.nextElementSibling;
            var modalImg = modal.querySelector('.modal-content');
            var captionText = modal.querySelector('.caption');
            
            modal.style.display = "block";
            modalImg.src = this.src;
            modalImg.setAttribute('data-alt', this.alt); // Store alt text in a data attribute
            captionText.innerHTML = this.alt;
            
            // Add click event to close the modal when clicking outside the image
            modal.onclick = function(event) {
                if (event.target == modal || event.target == captionText) {
                    modal.style.display = "none";
                }
            }
            
            // Add click event to the modal image to open YouTube link if present
            modalImg.onclick = function(event) {
                event.stopPropagation(); // Prevent modal from closing
                const altText = this.getAttribute('data-alt'); // Get alt text from data attribute
                const urlMatch = altText.match(/<a href='([^']+)'>/);
                
                if (urlMatch && urlMatch[1]) {
                    window.open(urlMatch[1], '_blank'); // Open extracted URL in new tab
                }
            }
        }
    });
});


// Example of how you might set up event listeners and search functionality:
document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            try {
                const results = await performSearch(query);
                displayResults(results);
            } catch (error) {
                console.error('Error performing search:', error);
                displayResults([], query);
            }
        }
    });
});

// This function would need to be implemented to actually perform the search
async function performSearch(query) {
    // Implement your search logic here
    // This might involve fetching data from a server or searching through local data
    // Return an array of results in the format expected by displayResults
}

// Add any other necessary functions or logic here

function parseVttContent(content) {
    // Split content by empty lines to get episodes
    const episodeBlocks = content.split(/\n\s*\n/).filter(block => block.trim());
    
    const episodes = [];
    
    for (const block of episodeBlocks) {
        const lines = block.split('\n').map(line => line.trim()).filter(line => line);
        
        if (lines.length < 2) {
            console.warn('Skipping invalid episode block:', block);
            continue;
        }
        
        // First line is the episode name
        const episodeName = lines[0];
        
        const segments = [];
        
        // Process timecode and text pairs (starting from index 1)
        for (let i = 1; i < lines.length; i += 2) {
            if (i + 1 >= lines.length) break; // Ensure we have a pair
            
            const timecode = lines[i];
            const text = lines[i + 1] || ''; // Handle case where text might be missing
            
            // Extract the start time from the timecode (format: "00:00:00.000 - 00:00:00.000")
            const startTime = timecode.split(' - ')[0].trim();
            
            segments.push({
                timecode,
                text
            });
        }
        
        episodes.push({
            filename: episodeName,
            segments
        });
    }
    
    return episodes;
}

function convertTimeToSeconds(timeString) {
    const [hours, minutes, secondsMs] = timeString.split(':');
    const [seconds, ms] = secondsMs.split('.');
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
}
