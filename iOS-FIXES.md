# 🍎 iOS PWA Troubleshooting Guide

## 🐛 Issues You Faced & Fixes Applied

### **Issue 1: Buttons Not Working on iOS** ✅ FIXED

**Problem:**
- Buttons don't respond to taps
- Touch events not registering

**Root Causes:**
1. iOS Safari has strict touch event handling
2. Service worker caching interfering with button events
3. Missing `-webkit-` prefixes

**Fixes Applied:**
```css
/* Added to CSS */
button, a, input {
    -webkit-user-select: text;
    user-select: text;
    cursor: pointer;
}
```

```javascript
// Added touch event listeners
document.addEventListener('touchstart', function() {}, { passive: true });

buttons.forEach(button => {
    button.addEventListener('touchstart', function() {
        this.style.opacity = '0.7';
    }, { passive: true });
});
```

---

### **Issue 2: Data Not Loading on iOS** ✅ FIXED

**Problem:**
- History tab shows empty
- Statistics don't load
- Google Sheets data not fetching

**Root Causes:**
1. Service worker caching Google Apps Script API responses
2. CORS issues on iOS
3. Cached empty responses

**Fixes Applied:**

**In service-worker-ios.js:**
```javascript
// NEVER cache Google Scripts API
if (url.hostname.includes('script.google.com')) {
    event.respondWith(
        fetch(event.request)  // Always fetch fresh
            .catch(() => {
                return new Response(JSON.stringify([]), {
                    headers: { 'Content-Type': 'application/json' }
                });
            })
    );
    return;  // Skip caching entirely
}
```

---

## 🔧 How to Apply Fixes

### **Step 1: Replace Files on GitHub**

Upload these 3 files (replacing old ones):
1. **index.html** → Use `penak-ios-fixed.html`
2. **service-worker.js** → Use `service-worker-ios.js`
3. **manifest.json** → Keep the same

### **Step 2: Clear iOS Cache**

On your iPhone:
1. **Settings** → **Safari**
2. Scroll down → **Advanced**
3. **Website Data**
4. Find your GitHub Pages site
5. **Remove** or swipe left to delete
6. **Clear History and Website Data** (at bottom)

### **Step 3: Force Refresh**

1. Close Safari completely (swipe up)
2. Reopen Safari
3. Visit your site
4. Hard refresh: Pull down from top of page

### **Step 4: Reinstall PWA**

If already installed:
1. Long-press app icon → **Delete App**
2. Visit site in Safari again
3. Share → **Add to Home Screen**
4. Open from home screen

---

## ✅ Testing Checklist

After applying fixes, test:

### **Buttons:**
- [ ] Tab buttons work (بازی, آمار, تاریخچه)
- [ ] Player selection works
- [ ] Quick score buttons (+52, +20, +10)
- [ ] Save button works
- [ ] All touch buttons respond

### **Data Loading:**
- [ ] History loads on first tap
- [ ] Statistics calculate correctly
- [ ] New games save to Google Sheets
- [ ] Saved games appear in history

### **PWA Features:**
- [ ] App installs on home screen
- [ ] Opens without Safari UI
- [ ] Works in airplane mode (offline)
- [ ] Status bar color matches (#667eea)

---

## 🔍 Debug on iOS

### **Method 1: Safari Web Inspector (Best)**

On Mac with iPhone connected:
1. iPhone: **Settings** → **Safari** → **Advanced** → Enable **Web Inspector**
2. Mac: **Safari** → **Develop** → [Your iPhone] → [Your Page]
3. Check **Console** for errors
4. Check **Network** tab for failed requests

### **Method 2: Console Logs**

Add this temporarily to your HTML:
```javascript
// Show console on screen
window.onerror = function(msg, url, line) {
    alert('Error: ' + msg + '\nLine: ' + line);
};

// Log button clicks
document.addEventListener('click', function(e) {
    console.log('Clicked:', e.target.tagName, e.target.className);
});
```

### **Method 3: Check Service Worker**

In Safari on iPhone:
1. Open your site
2. Check if console shows: `✅ Service Worker registered`
3. If it shows error, service worker failed

---

## 🚨 Common iOS Issues & Solutions

### **Issue: "Add to Home Screen" doesn't appear**

**Solution:**
- Must use **Safari** (not Chrome/Firefox on iOS)
- Check manifest.json is accessible
- Check icons exist (icon-192.png, icon-512.png)

### **Issue: Buttons work on first load, then stop**

**Solution:**
- Service worker caching issue
- Clear cache: Settings → Safari → Clear History
- Update `CACHE_NAME` in service-worker-ios.js:
  ```javascript
  const CACHE_NAME = 'penak-v1.2';  // Increment
  ```

### **Issue: Old data shows, new data doesn't**

**Solution:**
- Service worker cached old response
- In service-worker-ios.js, change cache strategy
- Force reload: Close app, clear Safari cache, reopen

### **Issue: Works in Safari, not as installed app**

**Solution:**
- iOS treats installed PWAs differently
- Check if `display-mode: standalone` works
- Add to HTML:
  ```javascript
  if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('Running as PWA');
  } else {
      console.log('Running in browser');
  }
  ```

---

## 📝 iOS-Specific Limitations

### **What Works:**
✅ Install to home screen
✅ Full screen mode
✅ Offline caching (with service worker)
✅ Touch events
✅ Local storage
✅ Fetch API

### **What Doesn't Work (iOS PWA):**
❌ Push notifications (iOS limitation)
❌ Background sync (iOS limitation)
❌ `beforeinstallprompt` event (Android only)
❌ Web Share Target (iOS limitation)
❌ App badges (iOS limitation)

### **Workarounds:**
- **Install prompt:** Show manual instructions for iOS
- **Push notifications:** Can't do natively, use email
- **Background sync:** Check on app open instead

---

## 🔄 Update Process for iOS

When you update the app:

1. **Change cache version:**
   ```javascript
   const CACHE_NAME = 'penak-v1.2';  // Increment
   ```

2. **Commit to GitHub:**
   - Push changes
   - Wait 1-2 minutes for GitHub Pages to update

3. **User update (automatic):**
   - User opens app
   - Service worker detects new version
   - Auto-reloads (no prompt on iOS)

4. **Manual update (if needed):**
   - User deletes app
   - Reinstalls from Safari

---

## 🎯 Best Practices for iOS PWA

### **1. Keep Service Worker Simple**
- Don't cache too aggressively
- Never cache API responses
- Use network-first strategy

### **2. Test in Safari First**
- Always test in Safari before installing
- Check console for errors
- Test all buttons

### **3. Provide Fallbacks**
- App should work without service worker
- Graceful degradation if offline fails

### **4. Use iOS-Specific Meta Tags**
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" href="icon-192.png">
```

### **5. Handle Offline Gracefully**
```javascript
window.addEventListener('online', () => {
    showNotification("✅ اتصال برقرار شد", "success");
});

window.addEventListener('offline', () => {
    showNotification("⚠️ آفلاین", "warning");
});
```

---

## 📊 Performance on iOS

After fixes, you should see:

| Metric | Before | After Fix |
|--------|--------|-----------|
| Button Response | ❌ Slow/No response | ✅ Instant |
| Data Load | ❌ Cached/Empty | ✅ Fresh data |
| Install | ✅ Works | ✅ Works better |
| Offline | ❌ Broken | ✅ Works |
| Updates | ❌ Manual | ✅ Automatic |

---

## 🆘 Still Having Issues?

### **Quick Diagnostics:**

Run this in Safari console:
```javascript
// Test 1: Service Worker
navigator.serviceWorker.getRegistration().then(reg => {
    console.log('SW:', reg ? 'Registered' : 'Not registered');
});

// Test 2: Cache
caches.keys().then(keys => {
    console.log('Caches:', keys);
});

// Test 3: Fetch API
fetch('https://script.google.com/your-url')
    .then(r => r.json())
    .then(d => console.log('API works:', d.length, 'games'))
    .catch(e => console.log('API error:', e));
```

### **Nuclear Option (Last Resort):**

1. Delete app from iPhone
2. Settings → Safari → Clear History and Website Data
3. Restart iPhone
4. Visit site fresh
5. Install again

---

## ✅ Summary

**Files to upload:**
1. `penak-ios-fixed.html` → Rename to `index.html`
2. `service-worker-ios.js` → Rename to `service-worker.js`
3. `manifest.json` (same as before)
4. `icon-192.png` (your icon)
5. `icon-512.png` (your icon)

**After upload:**
1. Clear iOS cache
2. Reinstall app
3. Test all features
4. Should work perfectly! 🎉

---

Good luck! 🍀
