document.addEventListener("DOMContentLoaded", () => {
  function setupSummaryToggle() {
  const btn = document.getElementById("toggleSummary");
  const summary = document.getElementById("summaryContent");
  if (!btn || !summary) return;

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
      const isOpen = content.style.display === "block";
      content.style.display = isOpen ? "none" : "block";
      btn.textContent = (isOpen ? "▸" : "▾") + " Toon uitgaven per groep";
      if (!isOpen) {
        renderSamenvatting();
      }
    });
  }

  // Render per-groep overzicht met kleur
  function renderSamenvatting() {
    const lijst = document.getElementById("groepSamenvatting");
    lijst.innerHTML = "";

    // Zet alle totalen op nul
    const totals = {};
    alleGroepen.forEach(g => {
      totals[g] = 0;
    });

    // Tel alle bedragen per groep op
    firebase.database().ref("uitgaven")
      .once("value", snapshot => {
        const data = snapshot.val() || {};
        Object.values(data).forEach(u => {
          totals[u.groep] += parseFloat(u.bedrag);
        });

        // Maak per groep een <li>
        alleGroepen.forEach(groep => {
          const bedrag = totals[groep].toFixed(2);
          const li     = document.createElement("li");
          li.style.backgroundColor = groepKleuren[groep] || "#fff";
          li.textContent = groep;

          const span = document.createElement("span");
          span.textContent = `€${bedrag}`;
          li.appendChild(span);

          lijst.appendChild(li);
        });
      });
  }

  // PDF-export setup
  function setupPdfExport() {
    const btn = document.getElementById("exportPdfBtn");
    btn.addEventListener("click", async () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Datum/tijd stempel
      const now = new Date();
      const timestamp = now.toLocaleString("nl-NL", {
        day:    "2-digit",
        month:  "2-digit",
        year:   "numeric",
        hour:   "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(10);
      doc.text(timestamp, pageWidth - 20, 10, { align: "right" });

      // Titel
      let y = 20;
      doc.setFontSize(16);
      doc.text("Uitgaven activiteitenkas per groep", 20, y);
      y += 10;

      // Groepen en items ophalen
      const perGroep = {};
      alleGroepen.forEach(g => perGroep[g] = []);

      const snap = await firebase.database().ref("uitgaven").once("value");
      const data = snap.val() || {};
      Object.values(data).forEach(u => {
        if (perGroep[u.groep]) {
          perGroep[u.groep].push(u);
        }
      });

      // Per groep in PDF schrijven
      alleGroepen.forEach(groep => {
        const items = perGroep[groep];
        if (!items.length) return;

        doc.setFontSize(14);
        doc.text(groep, 20, y);
        y += 8;

        doc.setFontSize(11);
        items.forEach(u => {
          const regel = `${u.datum} – €${u.bedrag} – ${u.activiteit}` +
                        (u.betaald ? " (Betaald)" : " (Niet betaald)");
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



  // Uitgaven in overzichtstabel tonen
  function renderTabel(filterGroep = "", filterBetaald = "") {
    const tbody = document.querySelector("#overzicht tbody");
    tbody.innerHTML = "";

    firebase.database().ref("uitgaven")
      .once("value", snap => {
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

            // Verwijder-knop
            const c6 = rij.insertCell(6);
            const delBtn = document.createElement("button");
            delBtn.textContent = "Verwijder";
            delBtn.className   = "verwijder";
            delBtn.onclick     = () => {
              firebase.database().ref("uitgaven/" + u.nummer).remove();
              renderTabel(
                document.getElementById("filterGroep").value,
                document.getElementById("filterBetaald").value
              );
            };
            c6.appendChild(delBtn);

            // Betaald-toggle
            const c7 = rij.insertCell(7);
            c7.className = "betaald-toggle";
            const cb = document.createElement("input");
            cb.type    = "checkbox";
            cb.checked = u.betaald;
            cb.onchange = () => {
              firebase.database().ref("uitgaven/" + u.nummer)
                .update({ betaald: cb.checked }, () => {
                  renderTabel(
                    document.getElementById("filterGroep").value,
                    document.getElementById("filterBetaald").value
                  );
                });
            };
            c7.appendChild(cb);
          });
      });
  }

  // Nieuw uitgave toevoegen
  document.getElementById("uitgaveForm")
    .addEventListener("submit", e => {
      e.preventDefault();
      const groepVal   = document.getElementById("groep").value;
      const bedragVal  = parseFloat(
        document.getElementById("bedrag").value.replace(",", ".")
      ) || 0;
      const activiteit = document.getElementById("activiteit").value;
      const datum      = document.getElementById("datum").value;
      const betaald    = document.getElementById("betaald").checked;

      if (!groepVal || isNaN(bedragVal) || !activiteit || !datum) {
        alert("Gelieve alle velden correct in te vullen.");
        return;
      }

      const id = Date.now();
      const obj = {
        nummer:    id,
        groep:     groepVal,
        bedrag:    bedragVal.toFixed(2),
        activiteit,
        datum,
        betaald
      };

      firebase.database().ref("uitgaven/" + id).set(obj, err => {
        if (!err) {
          e.target.reset();
          renderTabel(
            document.getElementById("filterGroep").value,
            document.getElementById("filterBetaald").value
          );
        }
      });
    });

  // Filters
  document.getElementById("filterGroep")
    .addEventListener("change", e =>
      renderTabel(e.target.value, document.getElementById("filterBetaald").value)
    );

  document.getElementById("filterBetaald")
    .addEventListener("change", e =>
      renderTabel(document.getElementById("filterGroep").value, e.target.value)
    );
});


