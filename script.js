document.addEventListener("DOMContentLoaded", function () {
  const correctWachtwoord = "chiro2025";
  const alleGroepen = [
    "Ribbels", "Speelclubs", "Rakkers", "Kwiks",
    "Tippers", "Toppers", "Aspi", "LEIDING"
  ];
  const groepKleuren = {
    Ribbels:    "#cce5ff",
    Speelclubs: "#ffe5cc",
    Rakkers:    "#e5ffcc",
    Kwiks:      "#ffccf2",
    Tippers:    "#d5ccff",
    Toppers:    "#ccffd5",
    Aspi:       "#ffd5cc",
    LEIDING:    "#dddddd"
  };

  // LocalStorage voor leden & budget per lid
  function loadSettings() {
    const s = localStorage.getItem("groepSettings");
    return s ? JSON.parse(s) : {};
  }
  function saveSettings(settings) {
    localStorage.setItem("groepSettings", JSON.stringify(settings));
  }

  // Toggle van het samenvattingspaneel
  function setupSummaryToggle() {
    const btn     = document.getElementById("toggleSummary");
    const content = document.getElementById("summaryContent");

    btn.addEventListener("click", () => {
      const open = content.style.display === "block";
      content.style.display = open ? "none" : "block";
      btn.textContent = (open ? "▸" : "▾") + " Toon uitgaven per groep";
      if (!open) renderSamenvatting();
    });
  }

// laad/​slaat de instellinkjes voor leden en budget per lid
function loadSettings() {
  const s = localStorage.getItem("groepSettings");
  return s ? JSON.parse(s) : {};
}
function saveSettings(settings) {
  localStorage.setItem("groepSettings", JSON.stringify(settings));
}

// zet de toggle knop en roep render aan
function setupSummaryToggle() {
  const btn     = document.getElementById("toggleSummary");
  const content = document.getElementById("summaryContent");

  btn.addEventListener("click", () => {
    const open = content.style.display === "block";
    content.style.display = open ? "none" : "block";
    btn.textContent = (open ? "▸" : "▾") + " Toon uitgaven per groep";
    if (!open) renderSamenvatting();
  });
}

// vul de tabel met: leden, budget/​lid, uitgaven, beschikbaar
function renderSamenvatting() {
  const tbody    = document.getElementById("summaryBody");
  tbody.innerHTML = "";
  const settings = loadSettings();
  const totals   = {};
  alleGroepen.forEach(g => totals[g] = 0);

  firebase.database().ref("uitgaven").once("value", snap => {
    const data = snap.val() || {};
    Object.values(data).forEach(u => {
      totals[u.groep] += parseFloat(u.bedrag);
    });

    alleGroepen.forEach(groep => {
      const row = document.createElement("tr");
      row.style.backgroundColor = groepKleuren[groep] || "#fff";

      // Groep
      const tdGroep = document.createElement("td");
      tdGroep.textContent = groep;
      row.appendChild(tdGroep);

      // Leden
      const tdLeden = document.createElement("td");
      const inL   = document.createElement("input");
      inL.type    = "number";
      inL.min     = 0;
      inL.value   = settings[groep]?.leden || "";
      inL.addEventListener("change", () => {
        settings[groep] = settings[groep] || {};
        settings[groep].leden = parseInt(inL.value) || 0;
        saveSettings(settings);
        renderSamenvatting();
      });
      tdLeden.appendChild(inL);
      row.appendChild(tdLeden);

      // Budget per lid
      const tdPer = document.createElement("td");
      const inP   = document.createElement("input");
      inP.type    = "number";
      inP.min     = 0;
      inP.step    = "0.01";
      inP.value   = settings[groep]?.perLid || "";
      inP.addEventListener("change", () => {
        settings[groep] = settings[groep] || {};
        settings[groep].perLid = parseFloat(inP.value) || 0;
        saveSettings(settings);
        renderSamenvatting();
      });
      tdPer.appendChild(inP);
      row.appendChild(tdPer);

      // Uitgaven
      const tdUit = document.createElement("td");
      tdUit.textContent = `€${totals[groep].toFixed(2)}`;
      row.appendChild(tdUit);

      // Beschikbaar
      const ledenCount    = settings[groep]?.leden || 0;
      const perLidAmount = settings[groep]?.perLid || 0;
      const totaalBudget  = ledenCount * perLidAmount;
      const beschikbaar   = totaalBudget - totals[groep];
      const tdBs = document.createElement("td");
      tdBs.textContent = `€${beschikbaar.toFixed(2)}`;
      row.appendChild(tdBs);

      tbody.appendChild(row);
    });
  });
}

// In je login-routine (na succesvol inloggen)  
// roep je aan:
setupSummaryToggle();
// renderSamenvatting(); // als je de tabel meteen open wilt
  
  // Render de uitgebreide samenvattingstabel
  function renderSamenvatting() {
    const tbody    = document.getElementById("summaryBody");
    tbody.innerHTML = "";
    const settings = loadSettings();
    const totals   = {};
    alleGroepen.forEach(g => totals[g] = 0);

    firebase.database().ref("uitgaven").once("value", snapshot => {
      const data = snapshot.val() || {};
      Object.values(data).forEach(u => {
        totals[u.groep] += parseFloat(u.bedrag);
      });

      alleGroepen.forEach(groep => {
        const row = document.createElement("tr");
        row.style.backgroundColor = groepKleuren[groep] || "#fff";

        // Groep
        const tdGroep = document.createElement("td");
        tdGroep.textContent = groep;
        row.appendChild(tdGroep);

        // Leden (input)
        const tdLeden = document.createElement("td");
        const inpLeden = document.createElement("input");
        inpLeden.type  = "number";
        inpLeden.min   = 0;
        inpLeden.value = settings[groep]?.leden || "";
        inpLeden.addEventListener("change", () => {
          settings[groep] = settings[groep] || {};
          settings[groep].leden = parseInt(inpLeden.value) || 0;
          saveSettings(settings);
          renderSamenvatting();
        });
        tdLeden.appendChild(inpLeden);
        row.appendChild(tdLeden);

        // Budget per lid (input)
        const tdPerLid = document.createElement("td");
        const inpPerLid = document.createElement("input");
        inpPerLid.type  = "number";
        inpPerLid.min   = 0;
        inpPerLid.step  = "0.01";
        inpPerLid.value = settings[groep]?.perLid || "";
        inpPerLid.addEventListener("change", () => {
          settings[groep] = settings[groep] || {};
          settings[groep].perLid = parseFloat(inpPerLid.value) || 0;
          saveSettings(settings);
          renderSamenvatting();
        });
        tdPerLid.appendChild(inpPerLid);
        row.appendChild(tdPerLid);

        // Uitgaven
        const tdUitgaven = document.createElement("td");
        tdUitgaven.textContent = `€${totals[groep].toFixed(2)}`;
        row.appendChild(tdUitgaven);

        // Beschikbaar
        const ledenCount    = settings[groep]?.leden   || 0;
        const perLidAmount = settings[groep]?.perLid   || 0;
        const totaalBudget  = ledenCount * perLidAmount;
        const beschikbaar   = totaalBudget - totals[groep];
        const tdBeschikbaar = document.createElement("td");
        tdBeschikbaar.textContent = `€${beschikbaar.toFixed(2)}`;
        row.appendChild(tdBeschikbaar);

        tbody.appendChild(row);
      });
    });
  }

  // PDF-export setup
  function setupPdfExport() {
    const btn = document.getElementById("exportPdfBtn");
    btn.addEventListener("click", async () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Datum/tijd stempel rechtsboven
      const now = new Date();
      const timestamp = now.toLocaleString("nl-NL", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(10);
      doc.text(timestamp, pageWidth - 10, 10, { align: "right" });

      // Titel
      let y = 20;
      doc.setFontSize(16);
      doc.text("Uitgaven activiteitenkas per groep", 20, y);
      y += 10;

      // Groepen en hun uitgaven
      const perGroep = {};
      alleGroepen.forEach(g => perGroep[g] = []);

      const snap = await firebase.database().ref("uitgaven").once("value");
      const data = snap.val() || {};
      Object.values(data).forEach(u => perGroep[u.groep].push(u));

      alleGroepen.forEach(groep => {
        const items = perGroep[groep];
        if (!items.length) return;

        doc.setFontSize(14);
        doc.text(groep, 20, y);
        y += 8;

        doc.setFontSize(11);
        items.forEach(u => {
          const regel = `${u.datum} – €${u.bedrag} – ${u.activiteit} ` +
                        (u.betaald ? "(Betaald)" : "(Niet betaald)");
          doc.text(regel, 25, y);
          y += 6;
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
        });

        y += 8;
      });

      doc.save("uitgaven_activiteitenkas_per_groep.pdf");
    });
  }

  // Login logic
  function controleerWachtwoord() {
    const invoer = document.getElementById("wachtwoord").value;
    const fout    = document.getElementById("loginFout");
    if (invoer === correctWachtwoord) {
      document.getElementById("loginScherm").style.display = "none";
      document.getElementById("appInhoud").style.display    = "block";
      fout.textContent = "";
      setupSummaryToggle();
      setupPdfExport();
      renderTabel();
    } else {
      fout.textContent = "Wachtwoord is onjuist.";
    }
  }
  document.getElementById("loginKnop")
    .addEventListener("click", controleerWachtwoord);

  // Hoofdoverzichtstabel met uitgaven
  function renderTabel(filterGroep = "", filterBetaald = "") {
    const tbody = document.querySelector("#overzicht tbody");
    tbody.innerHTML = "";

    firebase.database().ref("uitgaven").once("value", snap => {
      const data = snap.val() || {};
      Object.values(data)
        .filter(u => {
          const groepMatch   = !filterGroep   || u.groep === filterGroep;
          const betaaldMatch = filterBetaald === ""  || String(u.betaald) === filterBetaald;
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

          const c6 = rij.insertCell(6);
          const btn = document.createElement("button");
          btn.textContent = "Verwijder";
          btn.className = "verwijder";
          btn.onclick = () => {
            firebase.database().ref("uitgaven/" + u.nummer).remove();
            renderTabel(
              document.getElementById("filterGroep").value,
              document.getElementById("filterBetaald").value
            );
          };
          c6.appendChild(btn);

          const c7 = rij.insertCell(7);
          c7.className = "betaald-toggle";
          const cb = document.createElement("input");
          cb.type    = "checkbox";
          cb.checked = u.betaald;
          cb.onchange = () => {
            firebase.database().ref("uitgaven/" + u.nummer)
              .update({ betaald: cb.checked }, err => {
                if (!err) {
                  renderTabel(
                    document.getElementById("filterGroep").value,
                    document.getElementById("filterBetaald").value
                  );
                }
              });
          };
          c7.appendChild(cb);
        });
    });
  }

  // Uitgave toevoegen
  document.getElementById("uitgaveForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const groep      = document.getElementById("groep").value;
    const bedrag     = parseFloat(document.getElementById("bedrag").value.replace(",", ".")) || 0;
    const activiteit = document.getElementById("activiteit").value;
    const datum      = document.getElementById("datum").value;
    const betaald    = document.getElementById("betaald").checked;

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

    firebase.database().ref("uitgaven/" + nummer).set(nieuweUitgave, err => {
      if (!err) {
        document.getElementById("uitgaveForm").reset();
        renderTabel(
          document.getElementById("filterGroep").value,
          document.getElementById("filterBetaald").value
        );
      }
    });
  });

  // Filters
  document.getElementById("filterGroep")
    .addEventListener("change", function () {
      renderTabel(this.value, document.getElementById("filterBetaald").value);
    });

  document.getElementById("filterBetaald")
    .addEventListener("change", function () {
      renderTabel(document.getElementById("filterGroep").value, this.value);
    });

});  

