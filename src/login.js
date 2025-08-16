(async function () {
  async function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error("Timed out when waiting for" + selector))
    }, timeout)
    
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

  if (window.location.href.includes("app.blackbaud.com/signin")) {
    const initiateAuth = await waitForElement(
      "app-spa-auth-google-signin-button button"
    );
    initiateAuth.click();
  }

  async function loginPage() {
    const currentUrl = window.location.href;
    if (
      currentUrl.includes("myschoolapp.com") &&
      currentUrl.includes("login")
    ) {
      const blackbaudGarbage = await waitForElement("iframe");
      const loginInput = await waitForElement("div.textfield");
      const rememberCheckbox = await waitForElement("div.remember");
      const nextButton = await waitForElement("#nextBtn");

      const hostname = window.location.hostname;
      const dashboard = encodeURI(`https://${hostname}/app/student?svcid=edu`);

      document
        .querySelectorAll('script[type="text/javascript"]')
        .forEach((script) => script.remove());
      blackbaudGarbage?.remove();
      loginInput?.remove();
      rememberCheckbox?.remove();
      nextButton?.value = "Sign in with Google";

      nextButton?.addEventListener("click", function () {
        console.log(`Redirecting to ${dashboard}`);
        window.location.href = `https://app.blackbaud.com/signin/?redirectUrl=${dashboard}`;
      });
    }
  }

  await loginPage();
  window.addEventListener("hashchange", loginPage);
})();
