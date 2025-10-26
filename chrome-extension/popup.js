// DOM Elements
const mainSection = document.getElementById('mainSection');
const uploadSection = document.getElementById('uploadSection');
const editSection = document.getElementById('editSection');
const successSection = document.getElementById('successSection');
const historySection = document.getElementById('historySection');
const errorSection = document.getElementById('errorSection');
const loadingOverlay = document.getElementById('loadingOverlay');

// Main section elements
const newRecordBtn = document.getElementById('newRecordBtn');
const viewHistoryBtn = document.getElementById('viewHistoryBtn');
const recordCount = document.getElementById('recordCount');

// Upload section elements
const selectPhotoBtn = document.getElementById('selectPhotoBtn');
const fileInput = document.getElementById('fileInput');
const backToMainBtn = document.getElementById('backToMainBtn');

// Edit section elements
const previewImage = document.getElementById('previewImage');
const dateInput = document.getElementById('dateInput');
const amountInput = document.getElementById('amountInput');
const memoInput = document.getElementById('memoInput');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const saveBtn = document.getElementById('saveBtn');

// Success section elements
const copiedText = document.getElementById('copiedText');
const newRecordFromSuccessBtn = document.getElementById('newRecordFromSuccessBtn');
const viewHistoryFromSuccessBtn = document.getElementById('viewHistoryFromSuccessBtn');

// History section elements
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const historyList = document.getElementById('historyList');
const deleteAllSection = document.getElementById('deleteAllSection');
const deleteAllBtn = document.getElementById('deleteAllBtn');

// Error section elements
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');

// State
let selectedFile = null;
let extractedDateTime = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  updateRecordCount();
  showSection('main');
});

// Event Listeners
function setupEventListeners() {
  // Main section
  newRecordBtn.addEventListener('click', () => showSection('upload'));
  viewHistoryBtn.addEventListener('click', () => loadAndShowHistory());

  // Upload section
  selectPhotoBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);
  backToMainBtn.addEventListener('click', () => showSection('main'));

  // Edit section
  cancelEditBtn.addEventListener('click', resetToMain);
  saveBtn.addEventListener('click', handleSave);

  // AI estimation button
  const aiEstimateBtn = document.getElementById('aiEstimateBtn');
  if (aiEstimateBtn) {
    aiEstimateBtn.addEventListener('click', handleAIReEstimate);
  }

  // Success section
  newRecordFromSuccessBtn.addEventListener('click', () => showSection('upload'));
  viewHistoryFromSuccessBtn.addEventListener('click', () => loadAndShowHistory());

  // History section
  closeHistoryBtn.addEventListener('click', () => showSection('main'));
  deleteAllBtn.addEventListener('click', handleDeleteAll);

  // Error section
  retryBtn.addEventListener('click', () => showSection('main'));
}

// Update record count on main screen
async function updateRecordCount() {
  try {
    const records = await RecordStorage.getAllRecords();
    const count = records.length;
    recordCount.textContent = count > 0 ? `Saved: ${count} record${count > 1 ? 's' : ''}` : '';
  } catch (error) {
    console.error('Failed to get record count:', error);
  }
}

// Handle file selection
async function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showError('Please select an image file');
    return;
  }

  selectedFile = file;
  showLoading(true);

  try {
    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
    };
    reader.readAsDataURL(file);

    // Extract EXIF data
    await extractEXIFData(file);

    // AI estimation attempt
    const aiResult = await attemptAIEstimation(file);

    if (aiResult.success) {
      // AI estimation successful: auto-fill input
      amountInput.value = aiResult.estimatedVolume;
      showAIEstimationBadge(aiResult.confidence);
    } else {
      // AI estimation failed: manual input mode
      amountInput.value = '';
      showManualInputMessage();
    }

    // Show edit section
    showSection('edit');
  } catch (error) {
    console.error('File processing error:', error);
    showError('Error processing image: ' + error.message);
  } finally {
    showLoading(false);
  }
}

// Extract EXIF data from image
function extractEXIFData(file) {
  return new Promise((resolve, reject) => {
    EXIF.getData(file, function() {
      try {
        const dateTimeOriginal = EXIF.getTag(this, 'DateTimeOriginal');

        if (dateTimeOriginal) {
          // EXIF date format: "YYYY:MM:DD HH:MM:SS"
          const exifDate = parseEXIFDate(dateTimeOriginal);
          extractedDateTime = exifDate;
          dateInput.value = formatDateForInput(exifDate);
        } else {
          // Fallback to file modification date
          const fileDate = new Date(file.lastModified);
          extractedDateTime = fileDate;
          dateInput.value = formatDateForInput(fileDate);
          console.warn('No EXIF date found, using file modification date');
        }

        resolve();
      } catch (error) {
        reject(new Error('EXIF parsing error: ' + error.message));
      }
    });
  });
}

// Parse EXIF date string to Date object
function parseEXIFDate(exifDateString) {
  // Format: "2024:12:25 14:30:45"
  const parts = exifDateString.split(' ');
  const dateParts = parts[0].split(':');
  const timeParts = parts[1].split(':');

  return new Date(
    parseInt(dateParts[0]), // year
    parseInt(dateParts[1]) - 1, // month (0-indexed)
    parseInt(dateParts[2]), // day
    parseInt(timeParts[0]), // hour
    parseInt(timeParts[1]), // minute
    parseInt(timeParts[2])  // second
  );
}

// Format Date object for datetime-local input
function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Handle save 
async function handleSave() {
  // Validate inputs
  if (!dateInput.value) {
    showError('Please enter date and time');
    return;
  }

  const amount = parseFloat(amountInput.value);
  if (isNaN(amount) || amount < 0) {
    showError('Please enter a valid flow amount');
    return;
  }

  showLoading(true);

  try {
    // Prepare record data
    const recordData = {
      datetime: new Date(dateInput.value).toISOString(),
      amount: amount,
      memo: memoInput.value.trim(),
      source: 'manual'
    };

    // Save to storage
    const savedRecord = await RecordStorage.saveRecord(recordData);

    // Format for display
    const displayText = RecordStorage.formatRecordForDisplay(savedRecord);

    // Show success screen
    copiedText.textContent = displayText;
    showSection('success');

    // Update record count
    await updateRecordCount();

    // Reset form
    resetForm();
  } catch (error) {
    console.error('Save error:', error);
    showError('Error saving record: ' + error.message);
  } finally {
    showLoading(false);
  }
}


// Load and show history
async function loadAndShowHistory() {
  showLoading(true);

  try {
    const records = await RecordStorage.getAllRecords();

    if (records.length === 0) {
      // Empty state: clear list and hide delete button
      deleteAllSection.classList.add('hidden');
      historyList.innerHTML = '';
    } else {
      // Data exists: show list and delete button
      deleteAllSection.classList.remove('hidden');
      renderHistoryList(records);
    }

    showSection('history');
  } catch (error) {
    console.error('Failed to load history:', error);
    showError('Failed to load history: ' + error.message);
  } finally {
    showLoading(false);
  }
}

// Render history list
function renderHistoryList(records) {
  historyList.innerHTML = '';

  records.forEach(record => {
    const card = createHistoryCard(record);
    historyList.appendChild(card);
  });
}

// Create history card element
function createHistoryCard(record) {
  const card = document.createElement('div');
  card.className = 'history-card';

  const datetime = RecordStorage.formatDateTime(record.datetime);
  const dateObj = new Date(record.datetime);
  const dateOnly = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  const timeOnly = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

  card.innerHTML = `
    <div class="history-card-header">
      <div class="history-date">${dateOnly}</div>
      <div class="history-time">${timeOnly}</div>
    </div>
    <div class="history-card-body">
      <div class="history-amount">Flow: ${record.amount}ml</div>
      ${record.memo ? `<div class="history-memo">${record.memo}</div>` : ''}
    </div>
    <div class="history-card-actions">
      <button class="btn-icon delete-btn" data-id="${record.id}" title="Delete">🗑️</button>
    </div>
  `;

  // Add event listeners
  card.querySelector('.delete-btn').addEventListener('click', () => handleDeleteRecord(record.id));

  return card;
}


// Handle delete record
async function handleDeleteRecord(id) {
  if (!confirm('Delete this record?')) {
    return;
  }

  showLoading(true);

  try {
    await RecordStorage.deleteRecord(id);
    await loadAndShowHistory();
    await updateRecordCount();
  } catch (error) {
    console.error('Delete error:', error);
    showError('Failed to delete: ' + error.message);
  } finally {
    showLoading(false);
  }
}

// Handle delete all records
async function handleDeleteAll() {
  if (!confirm('Delete all records? This action cannot be undone.')) {
    return;
  }

  showLoading(true);

  try {
    await RecordStorage.clearAllRecords();
    await updateRecordCount();
    showSection('main');
    showTemporaryMessage('All records deleted');
  } catch (error) {
    console.error('Delete all error:', error);
    showError('Failed to delete: ' + error.message);
  } finally {
    showLoading(false);
  }
}

// Show temporary message (for  confirmation)
function showTemporaryMessage(message) {
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 2000);
}

// UI Control Functions
function showSection(sectionName) {
  mainSection.classList.add('hidden');
  uploadSection.classList.add('hidden');
  editSection.classList.add('hidden');
  successSection.classList.add('hidden');
  historySection.classList.add('hidden');
  errorSection.classList.add('hidden');

  switch (sectionName) {
    case 'main':
      mainSection.classList.remove('hidden');
      break;
    case 'upload':
      uploadSection.classList.remove('hidden');
      break;
    case 'edit':
      editSection.classList.remove('hidden');
      break;
    case 'success':
      successSection.classList.remove('hidden');
      break;
    case 'history':
      historySection.classList.remove('hidden');
      break;
    case 'error':
      errorSection.classList.remove('hidden');
      break;
  }
}

function showLoading(show) {
  if (show) {
    loadingOverlay.classList.remove('hidden');
  } else {
    loadingOverlay.classList.add('hidden');
  }
}

function showError(message) {
  errorMessage.textContent = message;
  showSection('error');
}

function resetForm() {
  selectedFile = null;
  extractedDateTime = null;
  fileInput.value = '';
  dateInput.value = '';
  amountInput.value = '';
  memoInput.value = '';
  previewImage.src = '';
}

function resetToMain() {
  resetForm();
  showSection('main');
}

// AI Estimation Functions

/**
 * Attempt AI estimation of flow volume
 * @param {File} imageFile - Image file
 * @returns {Promise<Object>} { success: boolean, estimatedVolume?: number, confidence?: string, reason?: string }
 */
async function attemptAIEstimation(imageFile) {
  try {
    // Check if PromptAPIWrapper is available
    if (typeof PromptAPIWrapper === 'undefined') {
      console.warn('PromptAPIWrapper not loaded');
      return { success: false, reason: 'API wrapper not loaded' };
    }

    // Check API availability
    const isAvailable = await PromptAPIWrapper.checkAvailability();

    if (!isAvailable) {
      console.warn('Prompt API not available, falling back to manual input');
      return { success: false, reason: 'API not available' };
    }

    // Execute AI estimation
    const result = await PromptAPIWrapper.estimateFlowFromImage(imageFile);

    if (result.error) {
      console.error('AI estimation failed:', result.error);
      return { success: false, reason: result.error };
    }

    return {
      success: true,
      estimatedVolume: result.estimatedVolume,
      confidence: result.confidence
    };

  } catch (error) {
    console.error('AI estimation error:', error);
    return { success: false, reason: error.message };
  }
}

/**
 * Show AI estimation badge next to amount input
 * @param {string} confidence - Confidence level (low/medium/high)
 */
function showAIEstimationBadge(confidence) {
  // Remove existing badge
  const existingBadge = document.querySelector('.ai-badge');
  if (existingBadge) {
    existingBadge.remove();
  }

  // Create badge element
  const badge = document.createElement('div');
  badge.className = 'ai-badge';
  badge.textContent = `🤖 AI Estimated (${confidence} confidence)`;
  badge.style.fontSize = '12px';
  badge.style.fontWeight = 'normal';
  badge.style.color = confidence === 'high' ? '#4CAF50' : (confidence === 'medium' ? '#FF9800' : '#F44336');
  badge.style.marginTop = '4px';
  badge.style.marginBottom = '4px';

  // Insert badge after .input-with-button container, within .form-group
  const formGroup = amountInput.parentElement.parentElement;
  const inputContainer = amountInput.parentElement;

  // Insert after .input-with-button, before next element (hint text)
  const nextElement = inputContainer.nextElementSibling;
  if (nextElement) {
    formGroup.insertBefore(badge, nextElement);
  } else {
    formGroup.appendChild(badge);
  }
}

/**
 * Remove AI estimation badge (for manual input mode)
 */
function showManualInputMessage() {
  const existingBadge = document.querySelector('.ai-badge');
  if (existingBadge) {
    existingBadge.remove();
  }
}

/**
 * Handle AI re-estimation button click
 */
async function handleAIReEstimate() {
  if (!selectedFile) {
    showError('No image selected. Please select a photo first.');
    return;
  }

  showLoading(true);

  try {
    const aiResult = await attemptAIEstimation(selectedFile);

    if (aiResult.success) {
      amountInput.value = aiResult.estimatedVolume;
      showAIEstimationBadge(aiResult.confidence);
      showTemporaryMessage('AI estimation updated');
    } else {
      showError('AI estimation failed. Please enter manually.');
    }
  } catch (error) {
    console.error('AI re-estimation error:', error);
    showError('AI estimation failed: ' + error.message);
  } finally {
    showLoading(false);
  }
}
