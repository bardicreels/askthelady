let deferredPrompt; // Used for PWA installation
let cachedVttList = []; // Store video list for populating the sidebar

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
});

async function searchVTTContent(keyword) {
    try {
        // Use the new server-side endpoint
        const response = await fetch(`/api/search-transcripts?query=${encodeURIComponent(keyword)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const results = await response.json();
        return results;
    } catch (error) {
        console.error('Error searching VTT content:', error);
        
        // Show user-friendly message in results area
        const resultsDiv = document.getElementById('results');
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <p>Unable to search video data. Please try again later.</p>
            `;
        }
        
        return [];
    }
}

// Function to fetch the list of videos for the sidebar
async function fetchVideoList() {
    try {
        // This is a lightweight request to get just the video list
        // You could create a separate endpoint for this if needed
        const response = await fetch('/api/search-transcripts?query=VIDEOLIST_ONLY');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.map(item => ({
            filename: item.filename,
            name: item.name,
            url: item.url
        }));
    } catch (error) {
        console.error('Error fetching video list:', error);
        return [];
    }
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

function getTimestampSeconds(timestamp) {
    // Extract the start time, which could be formatted with either ' --> ' or ' - '
    const start = timestamp.includes(' --> ') ? 
        timestamp.split(' --> ')[0] : 
        timestamp.split(' - ')[0];
    
    // Split by colons to get hours, minutes, seconds
    const parts = start.trim().split(':');
    
    // Handle hours, minutes, seconds with potential milliseconds
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    
    // Handle seconds, which might have milliseconds (e.g., "12.345")
    let seconds = 0;
    if (parts[2]) {
        // Split seconds and milliseconds if present
        const secParts = parts[2].split('.');
        seconds = parseInt(secParts[0], 10) || 0;
        // Milliseconds don't need to be included in YouTube timestamps
    }
    
    // Calculate total seconds
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
    console.log('Timestamp', timestamp, 'converted to seconds:', totalSeconds);
    return totalSeconds;
}

function getStartTimecode(timestamp) {
    return timestamp.includes(' --> ') ? 
        timestamp.split(' --> ')[0] : 
        timestamp.split(' - ')[0];
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
                            <span class="copy-link" data-url="${result.url}&t=${getTimestampSeconds(match.timestamp)}">Copy</span>
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
                
                // Show copy link on hover
                const copyLink = this.querySelector('.copy-link');
                if (copyLink) {
                    copyLink.style.visibility = 'visible';
                }
            });
            
            item.addEventListener('mouseleave', function() {
                // Reset color when mouse leaves
                const highlights = this.querySelectorAll('.highlight');
                highlights.forEach(highlight => {
                    highlight.style.color = ''; // Reset to default highlight color
                });
                
                // Hide copy link when mouse leaves
                const copyLink = this.querySelector('.copy-link');
                if (copyLink) {
                    copyLink.style.visibility = 'hidden';
                }
            });
        });
        
        // Add click event for copy links
        document.querySelectorAll('.copy-link').forEach(copyLink => {
            copyLink.addEventListener('click', function(e) {
                e.preventDefault();
                const url = this.getAttribute('data-url');
                const resultItem = this.closest('.result-item');
                
                console.log('Attempting to copy URL:', url);
                
                // Try modern clipboard API
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(url)
                        .then(() => {
                            console.log('Clipboard API success');
                            // Success - blue flash
                            resultItem.classList.add('copy-success');
                            setTimeout(() => {
                                resultItem.classList.remove('copy-success');
                            }, 500);
                        })
                        .catch(err => {
                            console.error('Clipboard API failed:', err);
                            resultItem.classList.add('copy-error');
                            setTimeout(() => {
                                resultItem.classList.remove('copy-error');
                            }, 500);
                        });
                }
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

function initializeSearch() {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    if (!searchForm || !searchInput) {
        console.error('Search form or input not found');
        return;
    }

    searchInput.placeholder = "Search video History";

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const keyword = searchInput.value.trim();
        if (keyword) {
            // Show loading indicator
            const resultsDiv = document.getElementById('results');
            if (resultsDiv) {
                resultsDiv.innerHTML = `<p>Searching for "${keyword}"...</p>`;
            }
            
            // Perform the search using the server-side endpoint
            const results = await searchVTTContent(keyword);
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

    if (!cachedVttList || cachedVttList.length === 0) {
        vttList.innerHTML = '<li>No videos available</li>';
        return;
    }

    const vttItems = cachedVttList.map(video => {
        // Extract date from filename (assuming format: YYYY-MM-DD-title-videoId)
        const datePart = video.filename.split('-').slice(0, 3).join('-');
        const date = new Date(datePart);
        
        // Check if the date is valid
        const formattedDate = !isNaN(date.getTime()) 
            ? ` <span class="vtt-date">(${date.toLocaleDateString('en-GB')})</span>` 
            : '';

        return `
        <li>
            <label>
                <input type="checkbox" class="vtt-checkbox" data-filename="${video.filename}" 
                    ${getCookie(video.filename) === 'true' ? 'checked' : ''}>
                <a href="${video.url}" target="_blank">
                    ${video.name}${formattedDate}
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
    initializeSearch();
    
    try {
        // Fetch video list for sidebar
        cachedVttList = await fetchVideoList();
        populateVTTList();
        
        // Perform initial search for "christ"
        const initialKeyword = "christ";
        const initialResults = await searchVTTContent(initialKeyword);
        displayResults(initialResults, initialKeyword);
    } catch (error) {
        console.error('Error during initialization:', error);
        const resultsDiv = document.getElementById('results');
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <p>Unable to load video data. Please try again later.</p>
            `;
        }
    }
}

// Run the initialize function when the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
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
