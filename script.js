document.addEventListener("DOMContentLoaded", function () {
  const correctWachtwoord = "chiro2025";
  const alleGroepen = [
    "Ribbels", "Speelclubs", "Rakkers", "Kwiks",
    "Tippers", "Toppers", "Aspi", "LEIDING"
  ];

  const groepKleuren = {
    Ribbels: "#cce5ff",
    Speelclubs: "#ffe5cc",
    Rakkers: "#e5ffcc",
    Kwiks: "#ffccf2",
    Tippers: "#d5ccff",
    Toppers: "#ccffd5",
    Aspi: "#ffd5cc",
    LEIDING: "#dddddd"
  };

  // Toggle paneel en laad samenvatting
  function setupSummaryToggle() {
    const btn = document.getElementById("toggleSummary");
    const content = document.getElementById("summaryContent");

    btn.addEventListener("click", () => {
      const open = content.style.display === "block";
      content.style.display = open ? "none" : "block";
      btn.textContent = (open ? "▸" : "▾") + " Toon uitgaven per groep";
      if (!open) renderSamenvatting();
    });
  }

  // Haal totalen op en render per groep met kleur
  function renderSamenvatting() {
    const lijst = document.getElementById("groepSamenvatting");
    lijst.innerHTML = "";

    const totals = {};
    alleGroepen.forEach(g => totals[g] = 0);

    firebase.database().ref("uitgaven").once("value", snapshot => {
      const data = snapshot.val() || {};
      Object.values(data).forEach(u => {
        totals[u.groep] += parseFloat(u.bedrag);
      });

      alleGroepen.forEach(groep => {
        const bedrag = totals[groep].toFixed(2);
        const li = document.createElement("li");
        li.style.backgroundColor = groepKleuren[groep] || "#fff";
        li.style.padding = "6px 10px";
        li.style.marginBottom = "4px";
        li.style.borderRadius = "4px";
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.fontWeight = "500";
        li.style.color = "#333";

        li.textContent = groep;
        const span = document.createElement("span");
        span.textContent = `€${bedrag}`;
        li.appendChild(span);
        lijst.appendChild(li);
      });
    });
  }

  function controleerWachtwoord() {
    const invoer = document.getElementById("wachtwoord").value;
    const foutmelding = document.getElementById("loginFout");

    if (invoer === correctWachtwoord) {
      document.getElementById("loginScherm").style.display = "none";
      document.getElementById("appInhoud").style.display = "block";
      foutmelding.textContent = "";
      setupSummaryToggle();
      renderTabel();
    } else {
      foutmelding.textContent = "Wachtwoord is onjuist.";
    }
  }

  document.getElementById("loginKnop").addEventListener("click", controleerWachtwoord);

  function renderTabel(filterGroep = "", filterBetaald = "") {
    const tbody = document.querySelector("#overzicht tbody");
    tbody.innerHTML = "";

    firebase.database().ref("uitgaven").once("value", snapshot => {
      const data = snapshot.val();
      const uitgaven = data ? Object.values(data) : [];

      uitgaven
        .filter(u => {
          const groepMatch = !filterGroep || u.groep === filterGroep;
          const betaaldMatch = filterBetaald === "" || String(u.betaald) === filterBetaald;
          return groepMatch && betaaldMatch;
        })
        .sort((a, b) => b.nummer - a.nummer)
        .forEach(u => {
          const rij = tbody.insertRow();
          rij.style.backgroundColor = groepKleuren[u.groep] || "#fff";
          rij.insertCell(0).textContent = u.nummer;
          rij.insertCell(1).textContent = u.groep;
          rij.insertCell(2).textContent = `€${u.bedrag}`;
          rij.insertCell(3).textContent = u.activiteit;
          rij.insertCell(4).textContent = u.datum;
          rij.insertCell(5).textContent = u.betaald ? "✅" : "❌";

          const actieCel = rij.insertCell(6);
          const knop = document.createElement("button");
          knop.textContent = "Verwijder";
          knop.className = "verwijder";
          knop.onclick = () => {
            firebase.database().ref("uitgaven/" + u.nummer).remove();
            renderTabel(
              document.getElementById("filterGroep").value,
              document.getElementById("filterBetaald").value
            );
          };
          actieCel.appendChild(knop);

          const toggleCel = rij.insertCell(7);
          toggleCel.className = "betaald-toggle";
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = u.betaald;
          checkbox.title = "Betaald aanvinken";
          checkbox.onchange = () => {
            firebase.database().ref("uitgaven/" + u.nummer).update({ betaald: checkbox.checked }, error => {
              if (!error) {
                renderTabel(
                  document.getElementById("filterGroep").value,
                  document.getElementById("filterBetaald").value
                );
              }
            });
          };
          toggleCel.appendChild(checkbox);
        });
    });
  }

  document.getElementById("uitgaveForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const groep = document.getElementById("groep").value;
    const bedrag = parseFloat(document.getElementById("bedrag").value.replace(",", "."));
    const activiteit = document.getElementById("activiteit").value;
    const datum = document.getElementById("datum").value;
    const betaald = document.getElementById("betaald").checked;

    if (!groep || isNaN(bedrag) || !activiteit || !datum) {
      alert("Gelieve alle velden correct in te vullen.");
      return;
    }

    const nummer = Date.now();
    const nieuweUitgave = {
      nummer,
      groep,
      bedrag: bedrag.toFixed(2),
      activiteit,
      datum,
      betaald
    };

    firebase.database().ref("uitgaven/" + nummer).set(nieuweUitgave, error => {
      if (!error) {
        document.getElementById("uitgaveForm").reset();
        renderTabel(
          document.getElementById("filterGroep").value,
          document.getElementById("filterBetaald").value
        );
      }
    });
  });

  document.getElementById("filterGroep").addEventListener("change", function () {
    renderTabel(this.value, document.getElementById("filterBetaald").value);
  });

  document.getElementById("filterBetaald").addEventListener("change", function () {
    renderTabel(document.getElementById("filterGroep").value, this.value);
  });
});
