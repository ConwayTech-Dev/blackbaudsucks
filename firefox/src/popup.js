const defaultOptions = {
  automaticLogin: true,
  loadBetweenPages: true,
  fixFavicon: true,
  oldAssignmentCenter: false,
  loginFix: true,
  wideUI: false,
};

const keyToId = {
  automaticLogin: "automatic-login",
  loadBetweenPages: "load-between-pages",
  fixFavicon: "fix-favicon",
  oldAssignmentCenter: "old-assignment-center",
  loginFix: "login-fix",
  wideUI: "wide-ui",
};

function restoreOptions() {
  browser.storage.sync.get(defaultOptions, (items) => {
    for (const key in defaultOptions) {
      const checkbox = document.getElementById(keyToId[key]);
      checkbox.checked = items[key];
    }
  });
}

function checkboxChange(e) {
  // Find the key that matches the ID
  const key = Object.keys(keyToId).find((k) => keyToId[k] === e.target.id);
  if (key) {
    browser.storage.sync.set({ [key]: e.target.checked });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  restoreOptions();
  Object.values(keyToId).forEach((id) => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      checkbox.addEventListener("change", checkboxChange);
    }
  });
});
