/* ==========================================================
   SANDIP UNIVERSITY — Callback Enquiry Form Logic
   ========================================================== */

/* ==========================================================
   GOOGLE FORM CONFIGURATION
   ==========================================================
   To connect this form to a real Google Form:

   1. Create a Google Form with these questions, in this order:
        - Full Name        (Short answer)
        - Email Address    (Short answer)
        - Mobile Number    (Short answer)
        - Academic Session (Short answer / Dropdown)
        - Interested Program (Short answer / Dropdown)

   2. Open the Google Form, click the three-dot menu → "Get pre-filled link".

   3. Fill in each field with a dummy value, click "Get link", then open
      the generated URL. It will look like:
        https://docs.google.com/forms/d/e/XXXXXXXXXXXX/viewform?
        usp=pp_url&entry.111111111=Test+Name&entry.222222222=test%40mail.com...

   4. From that URL:
        - The "formAction" URL is the same link but ending in
          "/formResponse" instead of "/viewform", e.g.:
          https://docs.google.com/forms/d/e/XXXXXXXXXXXX/formResponse
        - Each "entry.XXXXXXXXX=" in the URL is the entry ID for that
          question. Match each one to the correct field below.

   5. Paste the action URL and entry IDs into GOOGLE_FORM_CONFIG below.

   6. Set enabled: true.

   7. Test the form on this page, then check your Google Form's
      "Responses" tab (or the linked Google Sheet) to confirm the
      submission arrived.

   NOTE: Google Forms does not accept cross-origin fetch() calls with
   readable responses, so submissions are sent from a hidden iframe
   using a standard HTML form POST. This is the common, reliable way
   to submit to Google Forms from a static site — the response can't
   be read back, so we optimistically show the success message once
   the POST has been sent.
   ========================================================== */
const GOOGLE_FORM_CONFIG = {
  enabled: true,
  formAction: "https://docs.google.com/forms/d/e/1FAIpQLSdr1DwVDs0qa8S_vmGmDCoCN8Uc7VZtWDOnLMiOPy6MkvbDoA/formResponse",
  fields: {
    fullName: "entry.1415564150",
    email: "entry.1934201005",
    mobile: "entry.64874007",
    academicSession: "entry.719604368",
    interestedProgram: "entry.565315155"
  }
};

const EMAIL_FORM_CONFIG = {
  enabled: false,
  formAction: "https://formsubmit.co/ramamurthydpi@gmail.com"
};

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("enquiry-form");
  const submitBtn = document.getElementById("submit-btn");
  const successBox = document.getElementById("form-success");

  let isSubmitting = false;

  const fields = {
    fullName: document.getElementById("fullName"),
    email: document.getElementById("email"),
    mobile: document.getElementById("mobile"),
    academicSession: document.getElementById("academicSession"),
    interestedProgram: document.getElementById("interestedProgram")
  };

  // Clear the error state for a field as soon as the user edits it
  Object.values(fields).forEach((field) => {
    const eventName = field.tagName === "SELECT" ? "change" : "input";
    field.addEventListener(eventName, () => clearFieldError(field));
  });

  form.addEventListener("submit", handleSubmit);

  /* ---------------- Validation ---------------- */

  function validateFullName(value) {
    const trimmed = value.trim();
    if (!trimmed) return "Please enter your full name.";
    if (trimmed.length < 2) return "Name must be at least 2 characters.";
    return "";
  }

  function validateEmail(value) {
    const trimmed = value.trim();
    if (!trimmed) return "Please enter your email address.";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmed)) return "Please enter a valid email address.";
    return "";
  }

  function validateMobile(value) {
    let cleaned = value.replace(/[\s-]/g, "");
    if (!cleaned) return "Please enter your mobile number.";
    // Strip a leading +91 or 91 country code before checking length
    cleaned = cleaned.replace(/^\+?91/, "");
    if (!/^\d{10}$/.test(cleaned)) {
      return "Enter a valid 10-digit Indian mobile number.";
    }
    if (!/^[6-9]/.test(cleaned)) {
      return "Enter a valid Indian mobile number starting with 6-9.";
    }
    return "";
  }

  function validateSession(value) {
    if (!value) return "Please select an academic session.";
    return "";
  }

  function validateProgram(value) {
    if (!value) return "Please select a programme.";
    return "";
  }

  function normalizeMobile(value) {
    return value.replace(/[\s-]/g, "").replace(/^\+?91/, "");
  }

  function runValidation() {
    const errors = {
      fullName: validateFullName(fields.fullName.value),
      email: validateEmail(fields.email.value),
      mobile: validateMobile(fields.mobile.value),
      academicSession: validateSession(fields.academicSession.value),
      interestedProgram: validateProgram(fields.interestedProgram.value)
    };
    return errors;
  }

  function showFieldError(field, message) {
    const wrapper = field.closest(".field");
    const errorEl = document.getElementById(`${field.id}-error`);
    wrapper.classList.add("has-error");
    errorEl.textContent = message;
  }

  function clearFieldError(field) {
    const wrapper = field.closest(".field");
    const errorEl = document.getElementById(`${field.id}-error`);
    wrapper.classList.remove("has-error");
    errorEl.textContent = "";
  }

  function clearAllErrors() {
    Object.values(fields).forEach(clearFieldError);
  }

  /* ---------------- Submission ---------------- */

  function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    clearAllErrors();
    successBox.hidden = true;

    const errors = runValidation();
    const firstInvalidKey = Object.keys(errors).find((key) => errors[key]);

    if (firstInvalidKey) {
      Object.keys(errors).forEach((key) => {
        if (errors[key]) showFieldError(fields[key], errors[key]);
      });
      fields[firstInvalidKey].focus();
      return;
    }

    const payload = {
      fullName: fields.fullName.value.trim(),
      email: fields.email.value.trim(),
      mobile: normalizeMobile(fields.mobile.value),
      academicSession: fields.academicSession.value,
      interestedProgram: fields.interestedProgram.value
    };

    setLoading(true);

    if (EMAIL_FORM_CONFIG.enabled) {
      submitToEmail(payload)
        .then(() => onSubmitSuccess())
        .catch(() => onSubmitError());
    } else if (GOOGLE_FORM_CONFIG.enabled) {
      submitToGoogleForm(payload)
        .then(() => onSubmitSuccess())
        .catch(() => onSubmitError());
    } else {
      // ---------------- DEMO MODE ----------------
      // Google Forms is not configured yet. We validate, simulate a
      // network delay, log the data to the console, and show success —
      // nothing is actually saved anywhere.
      console.log("[DEMO MODE] Enquiry data (not saved anywhere):", payload);
      setTimeout(() => onSubmitSuccess(), 900);
    }
  }

  function setLoading(isLoading) {
    isSubmitting = isLoading;
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle("is-loading", isLoading);
  }

  function onSubmitSuccess() {
    setLoading(false);
    form.reset();
    clearAllErrors();
    successBox.hidden = false;
    successBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function onSubmitError() {
    setLoading(false);
    alert("Something went wrong while submitting the form. Please try again in a moment.");
  }

  /**
   * Submits the payload to Google Forms using a hidden iframe + a
   * dynamically built HTML form. This avoids CORS issues, since Google
   * Forms does not support being read via fetch() from another origin,
   * but does accept a standard form POST.
   */
  function submitToGoogleForm(payload) {
    return new Promise((resolve, reject) => {
      try {
        const iframeName = "hidden-google-form-target";
        let iframe = document.getElementById(iframeName);
        if (!iframe) {
          iframe = document.createElement("iframe");
          iframe.name = iframeName;
          iframe.id = iframeName;
          iframe.style.display = "none";
          document.body.appendChild(iframe);
        }

        const hiddenForm = document.createElement("form");
        hiddenForm.action = GOOGLE_FORM_CONFIG.formAction;
        hiddenForm.method = "POST";
        hiddenForm.target = iframeName;
        hiddenForm.style.display = "none";

        Object.entries(GOOGLE_FORM_CONFIG.fields).forEach(([key, entryId]) => {
          if (!payload[key]) return; // never send blank values
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = entryId;
          input.value = payload[key];
          hiddenForm.appendChild(input);
        });

        document.body.appendChild(hiddenForm);
        hiddenForm.submit();

        // The iframe response can't be read cross-origin, so we treat
        // the POST as successful once it has been sent.
        setTimeout(() => {
          hiddenForm.remove();
          resolve();
        }, 700);
      } catch (err) {
        reject(err);
      }
    });
  }

  function submitToEmail(payload) {
    return new Promise((resolve, reject) => {
      try {
        const iframeName = "hidden-email-form-target";
        let iframe = document.getElementById(iframeName);
        if (!iframe) {
          iframe = document.createElement("iframe");
          iframe.name = iframeName;
          iframe.id = iframeName;
          iframe.style.display = "none";
          document.body.appendChild(iframe);
        }

        const emailForm = document.createElement("form");
        emailForm.action = EMAIL_FORM_CONFIG.formAction;
        emailForm.method = "POST";
        emailForm.target = iframeName;
        emailForm.style.display = "none";

        const values = {
          _subject: "New Sandip University enquiry",
          _captcha: "false",
          _template: "table",
          "Full Name": payload.fullName,
          "Email Address": payload.email,
          "Mobile Number": payload.mobile,
          "Academic Session": payload.academicSession,
          "Interested Program": payload.interestedProgram
        };

        Object.entries(values).forEach(([name, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = value;
          emailForm.appendChild(input);
        });

        document.body.appendChild(emailForm);
        emailForm.submit();

        setTimeout(() => {
          emailForm.remove();
          resolve();
        }, 900);
      } catch (err) {
        reject(err);
      }
    });
  }
});
