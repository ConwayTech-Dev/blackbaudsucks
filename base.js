// Code originally created by https://jhsieh.dev

// some elements have a defered load, so we need to wait for them to appear
function waitForElm(selector) {
  console.log("checking " + selector);
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}
function clickHideFiltersButton() {
  // Target the button using the _ngcontent attribute
  const button = document.querySelectorAll("button");
  console.log(button);
  for (let i = 0; i < button.length; i++) {
    if (button[i].innerText === " Hide filters") {
      button[i].click();
      break;
    }
  }
}

document.addEventListener("DOMContentLoaded", async function (event) {
  // // get from localstorage if we have a feature flag
  // let featureFlagLS = chrome.storage
  // if (featureFlagLS) {
  //   console.log("feature flag exists");
  //   const secondsToExpire = 20;
  //   if (new Date() - new Date(JSON.parse(featureFlagLS).lastUpdated) > secondsToExpire*1000) {
  //     console.log("feature flag expired");
  //     localStorage.removeItem("featureFlag");
  //     let featureFlag = await getEnable();
  //     localStorage.setItem("featureFlag", JSON.stringify({enabled: featureFlag.enabled, lastUpdated: new Date()}));
  //   }
  //   featureFlag = JSON.parse(featureFlagLS);
  //   if (featureFlag.enabled === false) {
  //     return;
  //   }
  // }
  // else{
  //   console.log("feature flag does not exist");
  //   let featureFlag = await getEnable();
  //   localStorage.setItem("featureFlag", JSON.stringify({enabled: featureFlag.enabled, lastUpdated: new Date()}));
  //   if (featureFlag.enabled === false) {
  //     return;
  //   }
  // }
  // Initial application of settings
  let autoFilter = false;
  let oldAssignmentCenter = false;
  let autoLogin;
  let result;

  const getStorageData = () => {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(
        ["autoFilter", "oldAssignmentCenter", "autoLogin"],
        function (result) {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result);
          }
        }
      );
    });
  };

  try {
    result = await getStorageData();

    // Check if values exist, if not, set them to true (on) and save
    if (
      result.autoFilter === undefined ||
      result.oldAssignmentCenter === undefined ||
      result.autoLogin === undefined
    ) {
      console.log("No existing settings found. Setting defaults to ON.");
      autoFilter = true;
      oldAssignmentCenter = true;
      autoLogin = true;

      // Save the default values
      chrome.storage.sync.set(
        {
          autoFilter: true,
          oldAssignmentCenter: true,
          autoLogin: true,
        },
        function () {
          if (chrome.runtime.lastError) {
            console.error(
              "Error saving default values:",
              chrome.runtime.lastError
            );
          } else {
            console.log("Default values saved successfully");
          }
        }
      );
    } else {
      // Use existing values or default to true if individual value is undefined
      autoFilter = result.autoFilter ?? true;
      oldAssignmentCenter = result.oldAssignmentCenter ?? true;
      autoLogin = result.autoLogin ?? true;
    }
  } catch (error) {
    console.error("Error retrieving storage data:", error);
  }

  console.log(result);
  let featureFlag = getEnable();

  featureFlag.then(async (flag) => {
    console.log("flag is " + flag.enabled);
    if (flag.enabled == false) {
      return;
    } else {
      if (oldAssignmentCenter) {
        if (
          window.location.href.includes(
            "lms-assignment/assignment-center/student"
          )
        ) {
          window.location.href =
            "https://polytechnic.myschoolapp.com/app/student#studentmyday/assignment-center";
        }

        (async () => {
          console.log("waiting for assignment center button");
          await waitForElm("#assignment-center-btn");
          let button = window.document.getElementById("assignment-center-btn");
          button.setAttribute(
            "href",
            "/app/student#studentmyday/assignment-center"
          );
        })();

        if (window.location.href.includes("assignment-center")) {
          await waitForElm("a[data-sort='date_due']");
          let button = document.querySelector('a[data-sort="date_due"]');
          if (button && autoFilter) {
            // Click the button
            button.click();
            console.log("Due date button clicked");
          } else {
            // If the button wasn't found
            console.log("Due date button not found");
          }
          await waitForElm("#status1");
          button = document.querySelector("#status1");
          if (button) {
            button.click();
            console.log("Status button clicked");
          }
        }
      }
    }
  });

  console.log("autoLogin is " + autoLogin);
  if (!autoLogin) {
    return;
  }

  waitForElm("#label-Username").then(async (elm) => {
    console.log("found logo of login screen");
    addQuoteToDiv();
    if ((await featureFlag).enabled == false) {
      // block until we are sure to continue
      console.log("returning");
      return;
    }
    window.location.href =
      "https://signin.blackbaud.com/signin/?redirectUrl=https:%2F%2Fpolytechnic.myschoolapp.com";
  });

  // we need this to track changes across relative urls where the domain doesnt change
  window.onhashchange = function () {
    console.log("window changed");
    console.log(window.location.href);

    // check if we are logged into the main page rather than using cookies we look for an html element
    if (document.querySelector("#site-header") != null) {
      console.log("logged in bc we see site headre");
      return;
    }
    // cueck current url, if it contains "/app/student#studentmyday/progress" we logged in
    if (
      window.location.href.includes(
        "https://polytechnic.myschoolapp.com/app/student#student"
      )
    ) {
      console.log("logged in");
    }
  };

  if (window.location.href.includes("sso.myschoolapp.com")) {
    addQuoteToDiv();
  } else if (window.location.href.includes("app.blackbaud.com/signin")) {
    addQuoteToDiv();
    await waitForElm(".spa-auth-button-full");
    if ((await featureFlag).enabled == false) {
      // block until we are sure to continue
      return;
    }
    document.getElementsByClassName("spa-auth-button-full")[0].click();
  } else if (
    window.location.href.includes(
      "https://accounts.google.com/o/oauth2/auth"
    ) &&
    window.location.href.includes("blackbaud.com")
  ) {
    addQuoteToDiv();
    if ((await featureFlag).enabled == false) {
      // block until we are sure to continued
      return;
    }
    setTimeout(() => {
      // find all elements with [authuser] field and loop over them checking text content
      let authUsers = document.querySelectorAll("[data-email]");

      for (let i = 0; i < authUsers.length; i++) {
        if (authUsers[i].innerText.includes("students.polytechnic.org")) {
          authUsers[i].click();
          break;
        } else if (authUsers[i].innerText.includes("@polytechnic.org")) {
          authUsers[i].click();
          break;
        }
      }
    }, 450);

    setInterval(() => {
      let authUsers = document.querySelectorAll("[data-email]");

      for (let i = 0; i < authUsers.length; i++) {
        if (authUsers[i].innerText.includes("students.polytechnic.org")) {
          authUsers[i].click();
          break;
        } else if (authUsers[i].innerText.includes("@polytechnic.org")) {
          authUsers[i].click();
          break;
        }
      }
    }, 5000);
  }
});
async function getEnable() {
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      resolve({ enabled: false });
    }, 200);
  });

  const featureFlagPromise = fetch("https://api.jhsieh.dev")
    .then((response) => response.text())
    .then((text) => JSON.parse(text));

  return Promise.race([featureFlagPromise, timeoutPromise]);
}

function addQuoteToDiv() {
  loading_messages = [
    "Rearranging the cosmos for your homework…",
    "Loading your assignments faster than you can write 'procrastination'…",
    "Brewing coffee for the late-night study sessions…",
    "Polishing all the apples for the teachers…",
    "Calculating the minimum amount of effort required for an A…",
    "Taking a quick power nap before your next class…",
    "Deciphering teacher's handwriting…",
    "Getting our ducks in a row. And yes, we mean literal ducks…",
    "Cranking up the motivation speakers to 11…",
    "Loading motivational quotes… Error: too inspired to continue…",
    "Counting all the pencils in the world for you to borrow…",
    "Compressing all nighters into power naps…",
    "Finding more creative excuses for not doing homework…",
    "Downloading a sense of humor for the upcoming math class…",
    "Inventing a time machine for last-minute assignment submissions…",
    "Persuading your text books to open themselves…",
    "Chasing down the dog that ate your homework…",
    "Fluffing up the clouds in daydreams…",
    "Sharpening digital pencils… because you never know…",
    "Rewriting history, because your essay didn’t…",
    "Juggling deadlines and procrastination like a circus act…",
    "Engaging warp speed for this loading page…",
    "Microwaving leftovers because study breaks are sacred…",
    "Hiring a detective to find where the last hour went…",
    "Trying to convince your assignments to complete themselves…",
    "Upgrading your brain's software… Please wait…",
    "Loading the smell of old books and new possibilities…",
    "Uncovering the secrets of the Bermuda Triangle for your geography homework…",
    "Training carrier pigeons to submit your assignments…",
    "Bribing the Wi-Fi hamsters with extra seeds…",
    "Digging through the library of Alexandria for your research paper…",
    "Hunting down the elusive 'page 404' students have cited in their bibliography…",
    "Consulting the Oracle for the answers to your next test…",
    "Knocking on wood for those superstitious about exams…",
    "Rescuing your focus from the clutches of social media…",
    "Firing the cannon of success for your upcoming presentation…",
    "Googling 'How to become a wizard' to deal with this term’s workload…",
    "Stretching time so you can meet your deadline…",
    "Assembling a team of scholarly ninjas for peer reviews…",
    "Rolling out the red carpet for your GPA…",
    "Training your brain to enjoy studying… by bribing it with chocolate…",
    "Running a marathon on Encyclopedia pages… metaphorically…",
    "Filling the idea tank to the brim…",
    "Smuggling forbidden knowledge from the secret school archives…",
    "Setting up a playdate with Plato and Socrates…",
    "Organizing a pep rally for your morale…",
    "Doing a rain dance for extra inspiration… because why not…",
    "Whispering sweet nothings to the database for faster responses…",
    "Using telepathy to contact the server… Results uncertain…",
    "Enrolling pigeons in flight school to deliver your assignments…",
    "Packing your backpack with ambition and snacks… 80% snacks…",
    "Hiring squirrels to gather nuts of wisdom for the winter semester…",
    "Loading… because even your computer needs a moment to think about calculus…",
    "Asking a genie for more wishes... and more time for exam prep…",
    "Crafting a cloak of invisibility for those days you want to avoid everyone…",
    "Uploading the spirit of Einstein… Please stand by…",
    "Consulting with wizards to make your notebook self-writing…",
    "Trying to find the square root of pi for dessert…",
    "Rounding up the homework gremlins. Don’t feed them after midnight…",
    "Buffering… Just like your brain before the first coffee of the day…",
    "Programming the robots to attend 8 AM classes for you…",
    "Asking the magic 8-ball if you'll pass this semester… Outlook good…",
    "Dusting off the dictionaries for that perfect essay word…",
    "Tuning the instruments for your brain orchestra…",
    "Pumping the jams for a homework dance break…",
    "Inflating the balloons for your graduation party in advance…",
    "Taming the wild essays into submission…",
    "Negotiating with the alarm clock for five more minutes…",
    "Gathering the dragon balls to wish for limitless knowledge…",
    "Searching for the Holy Grail of uncopied homework ideas…",
    "Unleashing the Kraken on your study distractions…",
    "Sending carrier pigeons to remind you of due dates…",
    "Drawing straws to see who has to do the group project work…",
    "Paving the road to graduation with good intentions and late-night snacks…",
    "Deploying search and rescue for your lost motivation…",
    "Sending smoke signals to the server for faster load times…",
    "Consulting tea leaves for the outcome of your next presentation…",
    "Opening a portal for quick escapes from boring lectures…",
  ];
  const now = new Date();
  const currentHour = now.getHours();
  const dayOfMonth = now.getDate();

  // Combine the day of the month with the current hour to get a unique index for each hour of each day
  let combinedIndex = (dayOfMonth * 24 + currentHour) % loading_messages.length;
  document.querySelector(".quote").innerHTML = loading_messages[combinedIndex];
}
