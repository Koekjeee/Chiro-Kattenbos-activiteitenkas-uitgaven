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
  const storage = firebase.storage();

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

  // Render per-groep overzicht met kleur
// 1) Maak renderSamenvatting async
async function renderSamenvatting() {
  const lijst = document.getElementById("groepSamenvatting");
  lijst.innerHTML = "";

  // 2) Haal uitgaven en leden op
  const uitgavenSnap = await firebase.database().ref("uitgaven").once("value");
  const ledenSnap   = await firebase.database().ref("groepLeden").once("value");
  const uitgaven    = uitgavenSnap.val()   || {};
  const ledenData   = ledenSnap.val()      || {};

  // 3) Bereken totalen per groep
  const totals = {};
  alleGroepen.forEach(g => totals[g] = 0);
  Object.values(uitgaven).forEach(u => {
    totals[u.groep] += parseFloat(u.bedrag);
  });

  // 4) Bouw elk li-item
  alleGroepen.forEach(groep => {
    const totaal = totals[groep].toFixed(2);

    const li = document.createElement("li");
    li.style.backgroundColor = groepKleuren[groep] || "#fff";

    // Groepsnaam + totaal
    const naamSpan  = document.createElement("span");
    naamSpan.textContent = groep;
    const totaalSpan= document.createElement("span");
    totaalSpan.textContent = `€${totaal}`;

    // Input voor leden
    const ledenInput = document.createElement("input");
    ledenInput.type        = "number";
    ledenInput.min         = "1";
    ledenInput.placeholder = "Aantal leden";
    ledenInput.style.width     = "80px";
    ledenInput.style.marginLeft = "10px";
    // Prefill met opgeslagen waarde
    if (ledenData[groep]) ledenInput.value = ledenData[groep];

    // Span voor € per persoon
    const perPersoonSpan = document.createElement("span");
    perPersoonSpan.style.marginLeft = "10px";
    // Initieel tonen als al een waarde bestaat
    if (ledenInput.value) {
      const pp = (totals[groep] / parseInt(ledenInput.value)).toFixed(2);
      perPersoonSpan.textContent = `€${pp} per persoon`;
    }

    // 5) Listener: bij wijziging opslaan en herberekenen
    ledenInput.addEventListener("input", async () => {
      const aantal = parseInt(ledenInput.value, 10);
      if (aantal > 0) {
        // opslaan
        await firebase.database()
          .ref(`groepLeden/${groep}`)
          .set(aantal);

        // herberekenen
        const pp = (totals[groep] / aantal).toFixed(2);
        perPersoonSpan.textContent = `€${pp} per persoon`;
      } else {
        perPersoonSpan.textContent = "";
      }
    });

    // append alles
    li.append(naamSpan, totaalSpan, ledenInput, perPersoonSpan);
    lijst.appendChild(li);
  });
}

// 6) Pas setupSummaryToggle aan om async te ondersteunen
function setupSummaryToggle() {
  const btn     = document.getElementById("toggleSummary");
  const content = document.getElementById("summaryContent");

  btn.addEventListener("click", async () => {
    const open = content.style.display === "block";
    content.style.display = open ? "none" : "block";
    btn.textContent = (open ? "▸" : "▾") + " Toon uitgaven per groep";
    if (!open) {
      await renderSamenvatting();
    }
  });
}

  // PDF-export setup
  function setupPdfExport() {
    const btn = document.getElementById("exportPdfBtn");
    btn.addEventListener("click", async () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // datum/tijd stempel
      const now = new Date();
      const timestamp = now.toLocaleString("nl-NL", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(10);
      doc.text(timestamp, pageWidth - 20, 10, { align: "right" });

      let y = 20;
      doc.setFontSize(16);
      doc.text("Uitgaven activiteitenkas per groep", 20, y);
      y += 10;

      // groepen vullen
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
    const fout = document.getElementById("loginFout");
    if (invoer === correctWachtwoord) {
      document.getElementById("loginScherm").style.display = "none";
      document.getElementById("appInhoud").style.display = "block";
      fout.textContent = "";
      setupSummaryToggle();
      setupPdfExport();
      renderTabel();
    } else {
      fout.textContent = "Wachtwoord is onjuist.";
    }
  }
  document.getElementById("loginKnop").addEventListener("click", controleerWachtwoord);

  // Uitgaven in overzichtstabel
  function renderTabel(filterGroep = "", filterBetaald = "") {
    const tbody = document.querySelector("#overzicht tbody");
    tbody.innerHTML = "";
    firebase.database().ref("uitgaven").once("value", snap => {
      const data = snap.val() || {};
      Object.values(data)
        .filter(u =>
          (!filterGroep || u.groep === filterGroep) &&
          (filterBetaald === "" || String(u.betaald) === filterBetaald)
        )
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
          cb.type = "checkbox";
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

  // Nieuw uitgave toevoegen
  document.getElementById("uitgaveForm").addEventListener("submit", e => {
    e.preventDefault();
    const g = document.getElementById("groep").value;
    const b = parseFloat(document.getElementById("bedrag").value.replace(",", ".")) || 0;
    const a = document.getElementById("activiteit").value;
    const d = document.getElementById("datum").value;
    const p = document.getElementById("betaald").checked;
    if (!g || isNaN(b) || !a || !d) {
      return alert("Gelieve alle velden correct in te vullen.");
    }
    const id = Date.now();
    const obj = {
      nummer: id,
      groep: g,
      bedrag: b.toFixed(2),
      activiteit: a,
      datum: d,
      betaald: p
    };
    firebase.database().ref("uitgaven/" + id).set(obj, err => {
      if (!err) {
        document.getElementById("uitgaveForm").reset();
        renderTabel(
          document.getElementById("filterGroep").value,
          document.getElementById("filterBetaald").value
        );
      }
    });
  });  // ← Méér dan hier niks missen!

  // Filters
  document.getElementById("filterGroep")
    .addEventListener("change", e =>
      renderTabel(e.target.value, document.getElementById("filterBetaald").value)
    );

  document.getElementById("filterBetaald")
    .addEventListener("change", e =>
      renderTabel(document.getElementById("filterGroep").value, e.target.value)
    );

});  // sluit DOMContentLoaded af


