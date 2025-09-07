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
  function renderTabel(filterGroep = "", filterBetaald = "") {
    const tbody = document.querySelector("#overzicht tbody");
    tbody.innerHTML = "";
    firebase.database().ref("uitgaven").once("value", snap => {
      const data = snap.val() || {};
      Object.values(data)
        .filter(u => {
          const mg = !filterGroep || u.groep === filterGroep;
          const mb = filterBetaald === "" || String(u.betaald) === filterBetaald;
          return mg && mb;
        })
        .sort((a,b) => b.nummer - a.nummer)
        .forEach(u => {
          const r = tbody.insertRow();
          r.style.backgroundColor = groepKleuren[u.groep] || "#fff";
          r.insertCell(0).textContent = u.nummer;
          r.insertCell(1).textContent = u.groep;
          r.insertCell(2).textContent = `€${u.bedrag}`;
          r.insertCell(3).textContent = u.activiteit;
          r.insertCell(4).textContent = u.datum;
          r.insertCell(5).textContent = u.betaald ? "✅" : "❌";
          const c6 = r.insertCell(6);
          const btn = document.createElement("button");
          btn.className = "verwijder";
          btn.textContent = "Verwijder";
          btn.onclick = () => {
            firebase.database().ref("uitgaven/"+u.nummer).remove();
            renderTabel(
              document.getElementById("filterGroep").value,
              document.getElementById("filterBetaald").value
            );
          };
          c6.appendChild(btn);
          const c7 = r.insertCell(7);
          c7.className = "betaald-toggle";
          const cb = document.createElement("input");
          cb.type = "checkbox";
          cb.checked = u.betaald;
          cb.onchange = () => {
            firebase.database().ref("uitgaven/"+u.nummer)
              .update({betaald: cb.checked}, err => {
                if (!err) renderTabel(
                  document.getElementById("filterGroep").value,
                  document.getElementById("filterBetaald").value
                );
              });
          };
          c7.appendChild(cb);
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
