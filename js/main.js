(function () {
  "use strict";

  /* ---- Navigazione mobile ---- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var isOpen = links.getAttribute("data-open") === "true";
      links.setAttribute("data-open", String(!isOpen));
      toggle.setAttribute("aria-expanded", String(!isOpen));
    });

    links.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth < 900) {
          links.setAttribute("data-open", "false");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  /* ---- Recensioni: form + elenco persistito nel browser ----
     Nota: senza un backend collegato, le recensioni inviate restano
     salvate solo su questo dispositivo/browser (localStorage), per
     mostrare subito il funzionamento reale del modulo. Per renderle
     visibili a tutti i visitatori occorre collegare il form a un
     servizio (es. Formspree, Google Form, o un piccolo backend). */
  var STORAGE_KEY = "vecchio-torcio-recensioni";

  function getStoredReviews() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return [];
    }
  }

  function saveReview(review) {
    var reviews = getStoredReviews();
    reviews.unshift(review);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    } catch (err) {
      /* storage non disponibile: la recensione resta comunque mostrata in pagina */
    }
  }

  function starsMarkup(count) {
    var svg =
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" style="stroke:none;fill:currentColor;width:1rem;height:1rem;">' +
      '<path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.6 6.1 20.6l1.3-6.6-4.9-4.6 6.6-.8z"/></svg>';
    return svg.repeat(count);
  }

  function renderReviews() {
    var list = document.querySelector("[data-review-list]");
    if (!list) return;
    var reviews = getStoredReviews();
    var empty = document.querySelector("[data-review-empty]");

    if (reviews.length === 0) {
      if (empty) empty.hidden = false;
      list.innerHTML = "";
      return;
    }
    if (empty) empty.hidden = true;

    list.innerHTML = reviews
      .map(function (r) {
        var date = new Date(r.date).toLocaleDateString("it-IT", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        return (
          '<li class="card review-card">' +
          '<div class="stars" aria-hidden="true">' + starsMarkup(r.rating) + "</div>" +
          '<p class="visually-hidden">Valutazione: ' + r.rating + " su 5</p>" +
          "<p>" + escapeHtml(r.message) + "</p>" +
          '<span class="author">' + escapeHtml(r.name) + "</span>" +
          '<span class="date">' + date + "</span>" +
          "</li>"
        );
      })
      .join("");
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---- Selettore stelle ---- */
  var starInput = document.querySelector("[data-star-input]");
  var ratingValue = document.querySelector("[data-rating-value]");
  if (starInput) {
    var starButtons = Array.prototype.slice.call(starInput.querySelectorAll("button"));
    var setRating = function (value) {
      ratingValue.value = value;
      starButtons.forEach(function (btn) {
        var active = Number(btn.dataset.value) <= value;
        btn.setAttribute("aria-pressed", String(active));
        btn.classList.toggle("is-active", active);
      });
    };
    starButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        setRating(Number(btn.dataset.value));
      });
    });
  }

  /* ---- Validazione e invio form ---- */
  var form = document.querySelector("[data-review-form]");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var name = form.querySelector("#review-name");
      var message = form.querySelector("#review-message");
      var rating = form.querySelector("[data-rating-value]");
      var status = form.querySelector("[data-form-status]");
      var valid = true;

      [name, message].forEach(function (input) {
        var field = input.closest(".field");
        if (!input.value.trim()) {
          field.setAttribute("data-invalid", "true");
          valid = false;
        } else {
          field.setAttribute("data-invalid", "false");
        }
      });

      var ratingField = rating.closest(".field");
      if (!rating.value || Number(rating.value) < 1) {
        ratingField.setAttribute("data-invalid", "true");
        valid = false;
      } else {
        ratingField.setAttribute("data-invalid", "false");
      }

      if (!valid) {
        status.hidden = false;
        status.dataset.state = "error";
        status.textContent = "Controlla i campi evidenziati: mancano alcune informazioni.";
        status.setAttribute("role", "alert");
        var firstInvalid = form.querySelector('[data-invalid="true"] input, [data-invalid="true"] [data-star-input]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      saveReview({
        name: name.value.trim(),
        message: message.value.trim(),
        rating: Number(rating.value),
        date: new Date().toISOString(),
      });

      form.reset();
      setRating(0);
      status.hidden = false;
      status.dataset.state = "success";
      status.textContent = "Grazie! La tua recensione è stata pubblicata su questo dispositivo.";
      status.setAttribute("role", "status");
      renderReviews();
    });
  }

  renderReviews();
})();
