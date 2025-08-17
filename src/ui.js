async function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error("Timed out when waiting for" + selector));
    }, timeout);

    if (document.querySelector(selector)) {
      clearTimeout(timer);
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        clearTimeout(timer);
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

if (window.location.href.includes("studentmyday/progress")) {
  const link = document.createElement("link");
  link.rel = "prerender";
  link.href = `${window.location.hostname}/lms-assignment/assignment-center/student/?svcid=edu`;
  document.head.appendChild(link);
}
