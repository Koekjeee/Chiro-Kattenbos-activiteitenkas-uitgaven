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

  // Load/save per-group settings
  function loadSettings() {
    const s = localStorage.getItem("groepSettings");
    return s ? JSON.parse(s) : {};
  }
  function saveSettings(settings) {
    localStorage.setItem("groepSettings", JSON.stringify(settings));
  }

  // Toggle summary panel
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

  // Build summary cards
  function renderSamenvatting() {
    const container = document.getElementById("summaryCards");
    container.innerHTML = "";
    const settings = loadSettings();
    const totals = {};
    alleGroepen.forEach(g => (totals[g] = 0));

    firebase.database().ref("uitgaven").once("value", snap => {
      const data = snap.val() || {};
      Object.values(data).forEach(u => {
        totals[u.groep] += parseFloat(u.bedrag);
      });

      alleGroepen.forEach(groep => {
        const card = document.createElement("div");
        card.className = "summary-card";
        card.style.borderLeft = `4px solid ${groepKleuren[groep]}`;

        // settings
        const leden = settings[groep]?.leden || 0;
        const perLid = settings[groep]?.perLid || 0;
        const totaalBudget = leden * perLid;
        const uitgaven = totals[groep];
        const beschikbaar = totaalBudget - uitgaven;

        card.innerHTML = `
          <h3>${groep}</h3>
          <div><span>Leden:</span><span>${leden}</span></div>
          <div><span>Budget/​lid:</span><span>€${parseFloat(perLid).toFixed(2)}</span></div>
          <div><span>Totaal:</span><span>€${totaalBudget.toFixed(2)}</span></div>
          <div><span>Uitgaven:</span><span>€${uitgaven.toFixed(2)}</span></div>
          <div><span>Vrij:</span><span>€${beschikbaar.toFixed(2)}</span></div>
        `;

        // inline controls: update leden & perLid
        const ctrlLeden = document.createElement("input");
        ctrlLeden.type = "number";
        ctrlLeden.min = 0;
        ctrlLeden.value = leden;
        ctrlLeden.placeholder = "Leden";
        ctrlLeden.addEventListener("change", () => {
          settings[groep] = settings[groep] || {};
          settings[groep].leden = parseInt(ctrlLeden.value) || 0;
          saveSettings(settings);
          renderSamenvatting();
        });

        const ctrlPerLid = document.createElement("input");
        ctrlPerLid.type = "number";
        ctrlPerLid.min = 0;
        ctrlPerLid.step = "0.01";
        ctrlPerLid.value = perLid;
        ctrlPerLid.placeholder = "Budget/​lid (€)";
        ctrlPerLid.addEventListener("change", () => {
          settings[groep] = settings[groep] || {};
          settings[groep].perLid = parseFloat(ctrlPerLid.value) || 0;
          saveSettings(settings);
          renderSamenvatting();
        });

        // controls container
        const ctrls = document.createElement("div");
        ctrls.style.marginTop = "8px";
        ctrls.style.display = "flex";
        ctrls.style.gap = "6px";
        ctrls.append(ctrlLeden, ctrlPerLid);
        card.appendChild(ctrls);

        container.appendChild(card);
      });
    });
  }

  // Login logic
  function controleerWachtwoord() {
    const invoer = document.getElementById("wachtwoord").value;
    const fout = document.getElementById("loginFout");
    if (invoer === correctWachtwoord) {
      document.getElementById("loginScherm").style.display = "none";
      document.getElementById("appInhoud").style.display = "block";
      fout.textContent = "";
      setupSummaryToggle();
      renderTabel();
    } else {
      fout.textContent = "Wachtwoord is onjuist.";
    }
  }
  document.getElementById("loginKnop").addEventListener("click", controleerWachtwoord);

  // Existing renderTabel & event-handlers unchanged...
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

      const leden = settings[groep]?.leden || "";
      const perLid = settings[groep]?.perLid || "";

      const totaalBudget = leden && perLid
        ? (parseFloat(leden) * parseFloat(perLid))
        : 0;
      const uitgaven = totals[groep];
      const beschikbaar = totaalBudget - uitgaven;

      const tdGroep = document.createElement("td");
      tdGroep.textContent = groep;
      row.appendChild(tdGroep);

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

      const tdTotaal = document.createElement("td");
      tdTotaal.textContent = `€${totaalBudget.toFixed(2)}`;
      row.appendChild(tdTotaal);

      const tdUitgaven = document.createElement("td");
      tdUitgaven.textContent = `€${uitgaven.toFixed(2)}`;
      row.appendChild(tdUitgaven);

      const tdBeschikbaar = document.createElement("td");
      tdBeschikbaar.textContent = `€${beschikbaar.toFixed(2)}`;
      row.appendChild(tdBeschikbaar);

      tbody.appendChild(row);
    });
  });
}
  document.getElementById("uitgaveForm").addEventListener("submit", e => {
    e.preventDefault();
    const g = document.getElementById("groep").value;
    const b = parseFloat(document.getElementById("bedrag").value.replace(",","."))||0;
    const a = document.getElementById("activiteit").value;
    const d = document.getElementById("datum").value;
    const p = document.getElementById("betaald").checked;
    if (!g|| !a||!d) return alert("Vul alle velden in.");
    const id = Date.now();
    const obj = { nummer:id, groep:g, bedrag:b.toFixed(2), activiteit:a, datum:d, betaald:p };
    firebase.database().ref("uitgaven/"+id).set(obj, err => {
      if (!err) {
        document.getElementById("uitgaveForm").reset();
        renderTabel(
          document.getElementById("filterGroep").value,
          document.getElementById("filterBetaald").value
        );
      }
    });
  });

  document.getElementById("filterGroep")
    .addEventListener("change", e => renderTabel(e.target.value, document.getElementById("filterBetaald").value));
  document.getElementById("filterBetaald")
    .addEventListener("change", e => renderTabel(document.getElementById("filterGroep").value, e.target.value));
});

