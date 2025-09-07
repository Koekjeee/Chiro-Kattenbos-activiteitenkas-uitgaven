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

  // Laad en bewaar instellingen in localStorage
  function loadSettings() {
    const s = localStorage.getItem("groepSettings");
    return s ? JSON.parse(s) : {};
  }

  function saveSettings(settings) {
    localStorage.setItem("groepSettings", JSON.stringify(settings));
  }

  // Toggle paneel en render samenvatting
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

  // Renders de tabel met instellingen en budgetten
  function renderSamenvatting() {
    const tbody = document.getElementById("summaryBody");
    tbody.innerHTML = "";
    const settings = loadSettings();
    const totals = {};
    alleGroepen.forEach(g => (totals[g] = 0));

    firebase.database().ref("uitgaven").once("value", snapshot => {
      const data = snapshot.val() || {};
      Object.values(data).forEach(u => {
        totals[u.groep] += parseFloat(u.bedrag);
      });

      alleGroepen.forEach(groep => {
        const row = document.createElement("tr");
        row.style.backgroundColor = groepKleuren[groep] || "#fff";

        // Instellingen ophalen
        const leden = settings[groep]?.leden || "";
        const perLid = settings[groep]?.perLid || "";

        // Berekeningen
        const totaalBudget = leden && perLid
          ? (parseFloat(leden) * parseFloat(perLid))
          : 0;
        const uitgaven = totals[groep];
        const beschikbaar = totaalBudget - uitgaven;

        // Cell: Groep
        const tdGroep = document.createElement("td");
        tdGroep.textContent = groep;
        row.appendChild(tdGroep);

        // Cell: Aantal leden (input)
        const tdLeden = document.createElement("td");
        const inpLeden = document.createElement("input");
        inpLeden.type = "number";
        inpLeden.min = 0;
        inpLeden.value = leden;
        inpLeden.addEventListener("change", () => {
          settings[groep] = settings[groep] || {};
          settings[groep].leden = inpLeden.value;
          saveSettings(settings);
          renderSamenvatting();
        });
        tdLeden.appendChild(inpLeden);
        row.appendChild(tdLeden);

        // Cell: Budget per lid (input)
        const tdPerLid = document.createElement("td");
        const inpPerLid = document.createElement("input");
        inpPerLid.type = "number";
        inpPerLid.min = 0;
        inpPerLid.step = "0.01";
        inpPerLid.value = perLid;
        inpPerLid.addEventListener("change", () => {
          settings[groep] = settings[groep] || {};
          settings[groep].perLid = inpPerLid.value;
          saveSettings(settings);
          renderSamenvatting();
        });
        tdPerLid.appendChild(inpPerLid);
        row.appendChild(tdPerLid);

        // Cell: Totaal budget
        const tdTotaal = document.createElement("td");
        tdTotaal.textContent = `€${totaalBudget.toFixed(2)}`;
        row.appendChild(tdTotaal);

        // Cell: Uitgaven
        const tdUitgaven = document.createElement("td");
        tdUitgaven.textContent = `€${uitgaven.toFixed(2)}`;
        row.appendChild(tdUitgaven);

        // Cell: Beschikbaar
        const tdBeschikbaar = document.createElement("td");
        tdBeschikbaar.textContent = `€${beschikbaar.toFixed(2)}`;
        row.appendChild(tdBeschikbaar);

        tbody.appendChild(row);
      });
    });
  }

  // Login-check
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

  // Bestaande tabelfuncties…
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
