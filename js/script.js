let vttData = {};

async function loadVTTData() {
    try {
        const response = await fetch('data/vtt_content.json');
        vttData = await response.json();
        console.log('VTT data loaded successfully');
    } catch (error) {
        console.error('Error loading VTT data:', error);
    }
}

function searchVTTContent(keyword) {
    const results = [];
    for (const [filename, fileData] of Object.entries(vttData)) {
        const matches = fileData.content.filter(item => 
            item.text.toLowerCase().includes(keyword.toLowerCase())
        );
        if (matches.length > 0) {
            results.push({ 
                filename, 
                name: fileData.name, 
                url: fileData.url, 
                matches 
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

function displayResults(results) {
    const resultsDiv = document.getElementById('results');
    if (!resultsDiv) {
        console.error('Results div not found');
        return;
    }
    if (results.length === 0) {
        resultsDiv.innerHTML = '<p>No results found.</p>';
    } else {
        const resultHtml = results.map((result, index) => `
            <div class="video-result" style="animation: fadeIn 0.5s ease-out ${index * 0.1}s both;">
                <h3>${result.name}</h3>
                <ul>
                    ${result.matches.map(match => `
                        <li class="result-item">
                            <a href="${result.url}&t=${getTimestampSeconds(match.timestamp)}" target="_blank" class="timestamp">
                                <strong>${getStartTimecode(match.timestamp)}</strong>
                            </a>
                            <span class="result-text">${match.text}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `).join('');
        resultsDiv.innerHTML = `<h2>Search Results:</h2>${resultHtml}`;
    }
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
            displayResults(results);
        }
    });
}

function populateVTTList() {
    const vttList = document.getElementById('vtt-files');
    if (!vttList) {
        console.error('VTT list element not found');
        return;
    }

    const vttItems = Object.values(vttData).map(fileData => {
        // Extract date from filename (assuming format: YYYY-MM-DD-title-videoId.vtt)
        const datePart = fileData.name.split('-').slice(0, 3).join('-');
        const date = new Date(datePart);
        
        // Check if the date is valid
        const formattedDate = !isNaN(date.getTime()) 
            ? ` <span class="vtt-date">(${date.toLocaleDateString('en-GB')})</span>` 
            : '';

        return `
        <li>
            <label>
                <input type="checkbox" class="vtt-checkbox" data-filename="${fileData.name}" 
                    ${getCookie(fileData.name) === 'true' ? 'checked' : ''}>
                <a href="${fileData.url}" target="_blank">
                    ${fileData.name}${formattedDate}
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
    const initialResults = searchVTTContent("christ");
    displayResults(initialResults);
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


// Get the modal
var modal = document.getElementById("myModal");

// Get the image and insert it inside the modal - use its "alt" text as a caption
var img = document.getElementById("myImg");
var modalImg = document.getElementById("img01");
var captionText = document.getElementById("caption");

img.onclick = function(){
  modal.style.display = "block";
  modalImg.src = this.src;
  modalImg.setAttribute('data-alt', this.alt); // Store alt text in a data attribute
  captionText.innerHTML = this.alt;
}

// Add mouseleave event to the modal image
modalImg.addEventListener('mouseleave', function() {
  modal.style.backgroundColor = 'rgba(0, 34, 34, 0.25)'; // 25% opaque red
});

// Add mouseenter event to the modal image
modalImg.addEventListener('mouseenter', function() {
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; // Reset to default semi-transparent black
});

// Modify the window.onclick function
window.onclick = function(event) {
  if (event.target == modal || event.target == captionText) {
    modal.style.display = "none";
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; // Reset to default semi-transparent black
  }
}

// Get all images with class 'modal-image'
var images = document.getElementsByClassName("modal-image");

// Set up click event for all modal images
for (var i = 0; i < images.length; i++) {
    images[i].onclick = function(){
        modal.style.display = "block";
        modalImg.src = this.src;
        captionText.innerHTML = this.alt;
    }
}



// Get all images within the claims section
var claimImages = document.querySelectorAll('#claims-section img');

// Set up click event for all claim images
claimImages.forEach(function(img) {
    img.onclick = function(event){
        event.preventDefault();
        console.log('Image clicked:', this.alt); // Debug log
        modal.style.display = "block";
        modalImg.src = this.src;
        modalImg.setAttribute('data-alt', this.alt); // Store alt text in a data attribute
        captionText.innerHTML = this.alt;
    }
});

// Add click event to the modal image
modalImg.onclick = function() {
    console.log('Modal image clicked'); // Debug log
    const altText = this.getAttribute('data-alt'); // Get alt text from data attribute
    console.log('Alt text:', altText); // Debug log
    const urlMatch = altText.match(/<a href='([^']+)'>/);
    
    if (urlMatch && urlMatch[1]) {
        console.log('URL found:', urlMatch[1]); // Debug log
        window.open(urlMatch[1], '_blank'); // Open extracted URL in new tab
    } else {
        console.log('No URL found in alt text'); // Debug log
    }
}

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
                displayResults([]);
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