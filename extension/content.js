// Content script to detect and autofill form fields on scholarship portals

// Flag the page to let the React app know the extension is active
document.documentElement.setAttribute('data-scholarmate-extension', 'active');
window.dispatchEvent(new CustomEvent('ScholarMateExtensionLoaded'));

// Heuristic matching function for form inputs
function findField(keywords) {
  const inputs = document.querySelectorAll('input, select');
  
  for (const input of inputs) {
    // 1. Check ID, name, placeholder, autocomplete attributes
    for (const attr of ['id', 'name', 'placeholder', 'autocomplete', 'class']) {
      const val = (input.getAttribute(attr) || '').toLowerCase();
      if (keywords.some(keyword => val.includes(keyword))) {
        return input;
      }
    }
    
    // 2. Check associated label elements
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) {
        const text = label.textContent.toLowerCase();
        if (keywords.some(keyword => text.includes(keyword))) {
          return input;
        }
      }
    }
    
    // 3. Check parent element text (often labels wrap inputs)
    let parent = input.parentElement;
    for (let depth = 0; depth < 3 && parent; depth++) {
      const text = parent.textContent.toLowerCase();
      if (keywords.some(keyword => text.includes(keyword)) && parent.querySelector('input, select') === input) {
        // Double check that text belongs to label-like structures
        if (text.length < 150) {
          return input;
        }
      }
      parent = parent.parentElement;
    }
  }
  return null;
}

// Function to fill value and dispatch events so React/Angular/Vue portal forms detect changes
function fillValue(input, value) {
  if (!input) return false;
  
  if (input.tagName === 'SELECT') {
    // Select dropdown option matching value or text
    const options = Array.from(input.options);
    const bestOption = options.find(opt => 
      opt.value.toLowerCase() === value.toLowerCase() || 
      opt.text.toLowerCase().includes(value.toLowerCase())
    );
    if (bestOption) {
      input.value = bestOption.value;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  }
  
  // Text inputs
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new Event('blur', { bubbles: true }));
  
  // Highlight filled field briefly
  const originalBorder = input.style.border;
  input.style.border = '2px solid #10b981';
  input.style.backgroundColor = '#ecfdf5';
  setTimeout(() => {
    input.style.border = originalBorder;
    input.style.backgroundColor = '';
  }, 1500);
  
  return true;
}

// Listen for fill requests from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "autofill") {
    const profile = request.profile;
    let count = 0;
    
    // Define field mappings
    const mappings = [
      { keys: ['name', 'full_name', 'fullname', 'applicant'], val: profile.name },
      { keys: ['gender', 'sex'], val: profile.gender },
      { keys: ['state', 'domicile', 'residency'], val: profile.state },
      { keys: ['caste', 'category', 'social_category'], val: profile.category },
      { keys: ['income', 'family_income', 'annual_income'], val: profile.income },
      { keys: ['score', 'gpa', 'percentage', 'marks'], val: profile.score },
      { keys: ['phone', 'mobile'], val: profile.phone || '' },
      { keys: ['email'], val: profile.email || '' }
    ];
    
    mappings.forEach(map => {
      if (map.val) {
        const input = findField(map.keys);
        if (input && fillValue(input, map.val)) {
          count++;
        }
      }
    });
    
    sendResponse({ success: true, filledCount: count });
  }
});
