export function createAuthUi({ root, onSignIn, onSignUp, onResetRequest, onPasswordUpdate }) {
  const elements = {
    panel: root.querySelector("#authPanel"),
    tabs: root.querySelector("#authModeTabs"),
    loginMode: root.querySelector("#loginModeButton"),
    signupMode: root.querySelector("#signupModeButton"),
    form: root.querySelector("#authForm"),
    title: root.querySelector("#authTitle"),
    subtitle: root.querySelector("#authSubtitle"),
    nameField: root.querySelector("#authNameField"),
    name: root.querySelector("#authName"),
    emailField: root.querySelector("#authEmailField"),
    email: root.querySelector("#authEmail"),
    passwordField: root.querySelector("#authPasswordField"),
    password: root.querySelector("#authPassword"),
    confirmationField: root.querySelector("#authPasswordConfirmationField"),
    confirmation: root.querySelector("#authPasswordConfirmation"),
    passwordVisibilityField: root.querySelector("#passwordVisibilityField"),
    passwordVisibility: root.querySelector("#passwordVisibility"),
    forgot: root.querySelector("#forgotPasswordButton"),
    back: root.querySelector("#backToLoginButton"),
    submit: root.querySelector("#authSubmitButton"),
    status: root.querySelector("#authStatus"),
  };
  let mode = "login";

  elements.loginMode.addEventListener("click", () => setMode("login"));
  elements.signupMode.addEventListener("click", () => setMode("signup"));
  elements.forgot.addEventListener("click", () => setMode("forgot"));
  elements.back.addEventListener("click", () => setMode("login"));
  elements.passwordVisibility.addEventListener("change", () => {
    const type = elements.passwordVisibility.checked ? "text" : "password";
    elements.password.type = type;
    elements.confirmation.type = type;
  });

  elements.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearStatus();
    if (!validate()) return;

    setBusy(true);
    try {
      let result;
      if (mode === "login") {
        result = await onSignIn(credentials());
      } else if (mode === "signup") {
        result = await onSignUp({ ...credentials(), name: elements.name.value.trim() });
      } else if (mode === "forgot") {
        result = await onResetRequest(elements.email.value.trim());
      } else {
        result = await onPasswordUpdate(elements.password.value);
      }
      if (result?.nextMode) setMode(result.nextMode);
      if (result?.message) setStatus(result.message, "success");
    } catch (error) {
      setStatus(getFriendlyAuthError(error), "error");
    } finally {
      setBusy(false);
    }
  });

  function setMode(nextMode) {
    mode = nextMode;
    const signup = mode === "signup";
    const forgot = mode === "forgot";
    const update = mode === "update";
    const usesPassword = !forgot;

    elements.tabs.hidden = forgot || update;
    elements.nameField.hidden = !signup;
    elements.name.required = signup;
    elements.emailField.hidden = update;
    elements.email.required = !update;
    elements.passwordField.hidden = !usesPassword;
    elements.password.required = usesPassword;
    elements.confirmationField.hidden = !signup && !update;
    elements.confirmation.required = signup || update;
    elements.passwordVisibilityField.hidden = !usesPassword;
    elements.forgot.hidden = mode !== "login";
    elements.back.hidden = !forgot;
    elements.loginMode.classList.toggle("active", mode === "login");
    elements.signupMode.classList.toggle("active", signup);
    elements.loginMode.setAttribute("aria-selected", String(mode === "login"));
    elements.signupMode.setAttribute("aria-selected", String(signup));
    elements.password.autocomplete = signup || update ? "new-password" : "current-password";

    const copy = {
      login: ["Ingresar", "Volvé a tu progreso.", "Ingresar"],
      signup: ["Crear cuenta", "Tus datos quedarán separados por usuario.", "Crear cuenta"],
      forgot: ["Recuperar clave", "Te enviaremos un enlace seguro.", "Enviar enlace"],
      update: ["Nueva clave", "Elegí una clave segura para continuar.", "Guardar clave"],
    }[mode];
    [elements.title.textContent, elements.subtitle.textContent, elements.submit.textContent] = copy;
    elements.form.reset();
    elements.password.type = "password";
    elements.confirmation.type = "password";
    clearStatus();
    focusPrimaryField();
  }

  function validate() {
    if (!elements.form.reportValidity()) return false;
    if ((mode === "signup" || mode === "update") && elements.password.value.length < 8) {
      setStatus("La clave debe tener al menos 8 caracteres.", "error");
      return false;
    }
    if (
      (mode === "signup" || mode === "update") &&
      elements.password.value !== elements.confirmation.value
    ) {
      setStatus("Las claves no coinciden.", "error");
      return false;
    }
    return true;
  }

  function credentials() {
    return {
      email: elements.email.value.trim().toLowerCase(),
      password: elements.password.value,
    };
  }

  function setBusy(busy) {
    elements.form.setAttribute("aria-busy", String(busy));
    elements.submit.disabled = busy;
    elements.loginMode.disabled = busy;
    elements.signupMode.disabled = busy;
  }

  function setStatus(message, tone = "info") {
    elements.status.textContent = message;
    elements.status.dataset.tone = tone;
  }

  function clearStatus() {
    elements.status.textContent = "";
    elements.status.removeAttribute("data-tone");
  }

  function focusPrimaryField() {
    if (mode === "signup") elements.name.focus();
    else if (mode === "update") elements.password.focus();
    else elements.email.focus();
  }

  setMode("login");

  return {
    focus: focusPrimaryField,
    setMode,
    setStatus,
    showConfigurationError() {
      setStatus("El acceso seguro todavía no está conectado a un entorno de Supabase.", "error");
      elements.submit.disabled = true;
      elements.loginMode.disabled = true;
      elements.signupMode.disabled = true;
    },
  };
}

export function getFriendlyAuthError(error) {
  const messages = {
    email_not_confirmed: "Confirmá tu correo antes de ingresar.",
    invalid_credentials: "El usuario o la clave no son correctos.",
    over_email_send_rate_limit: "Esperá unos minutos antes de pedir otro correo.",
    weak_password: "La clave no cumple los requisitos de seguridad.",
  };
  return (
    messages[error?.code] || "No pudimos completar el acceso. Revisá los datos e intentá de nuevo."
  );
}
