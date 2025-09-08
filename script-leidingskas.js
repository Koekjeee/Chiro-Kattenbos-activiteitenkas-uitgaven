document.addEventListener("DOMContentLoaded", () => {
  const correctWachtwoord = "chiro2025";
  const groep = "LEIDING";
  const storage = firebase.storage();

  const groepKleur = "#dddddd";  // kleur LEIDING

  // Toggle summary
  function setupSummaryToggle() {
    const btn = document.getElementById("toggleSummary");
    const content = document.getElementById("summaryContent");
    btn.addEventListener("click", () => {
      const open = content.style.display === "block";
      content.style.display = open ? "none" : "block";
      btn.textContent = (open ? "▸" : "▾") + " Toon totaal Leidingskas";
      if (!open) renderSummary();
    });
  }

  // Render totaal
  function renderSummary() {
    firebase.database().ref("uitgaven")
      .orderByChild("groep").equalTo(groep)
      .once("value", snap => {
        const data = snap.val() || {};
        let totaal = 0;
        Object.values(data).forEach(u => totaal += parseFloat(u.bedrag));
        document.getElementById("leidingTotaal")
          .textContent = `€${totaal.toFixed(2)}`;
      });
  }

  // PDF-export
  function setupPdfExport() {
    const btn = document.getElementById("exportPdfBtn");
    btn.addEventListener("click", async () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const now = new Date();
      const stamp = now.toLocaleString("nl-NL", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
      });
      const w = doc.internal.pageSize.getWidth();
      doc.setFontSize(10);
      doc.text(stamp, w - 20, 10, { align: "right" });

      let y = 20;
      doc.setFontSize(16);
      doc.text("Leidingskas – Uitgaven", 20, y);
      y += 10;

      const snap = await firebase.database().ref("uitgaven")
        .orderByChild("groep").equalTo(groep).once("value");
      const items = Object.values(snap.val() || {});

      doc.setFontSize(14);
      items.forEach(u => {
        const line = `${u.datum} – €${u.bedrag} – ${u.activiteit}` +
                     (u.betaald ? " (Betaald)" : " (Niet betaald)");
        doc.text(line, 20, y);
        y += 8;
        if (y > 280) { doc.addPage(); y = 20; }
      });

      doc.save("leidingskas_uitgaven.pdf");
    });
  }

  // Tabel renderen
  function renderTabel(filterBetaald = "") {
    const tbody = document.querySelector("#overzichtLeiding tbody");
    tbody.innerHTML = "";
    firebase.database().ref("uitgaven")
      .orderByChild("groep").equalTo(groep)
      .once("value", snap => {
        Object.values(snap.val() || {})
          .filter(u =>
            filterBetaald === "" || String(u.betaald) === filterBetaald
          )
          .sort((a,b) => b.nummer - a.nummer)
          .forEach(u => {
            const rij = tbody.insertRow();
            rij.style.backgroundColor = groepKleur;
            rij.insertCell(0).textContent = u.nummer;
            rij.insertCell(1).textContent = `€${u.bedrag}`;
            rij.insertCell(2).textContent = u.activiteit;
            rij.insertCell(3).textContent = u.datum;
            rij.insertCell(4).textContent = u.betaald ? "✅" : "❌";

            // Verwijder
            const cAct = rij.insertCell(5);
            const delBtn = document.createElement("button");
            delBtn.textContent = "Verwijder";
            delBtn.className = "verwijder";
            delBtn.onclick = () => {
              firebase.database().ref("uitgaven/" + u.nummer).remove();
              renderTabel(document.getElementById("filterBetaaldLeiding").value);
            };
            cAct.appendChild(delBtn);

            // Betaald-toggle
            const cToggle = rij.insertCell(6);
            cToggle.className = "betaald-toggle";
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.checked = u.betaald;
            cb.onchange = () => {
              firebase.database().ref("uitgaven/" + u.nummer)
                .update({ betaald: cb.checked }, () => {
                  renderTabel(document.getElementById("filterBetaaldLeiding").value);
                });
            };
            cToggle.appendChild(cb);
          });
      });
  }

  // Login en init
  function controleerWachtwoord() {
    const inp = document.getElementById("wachtwoord").value;
    const fout = document.getElementById("loginFout");
    if (inp === correctWachtwoord) {
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

  document.getElementById("loginKnop")
    .addEventListener("click", controleerWachtwoord);

  // Form submit
  document.getElementById("uitgaveFormLeiding")
    .addEventListener("submit", e => {
      e.preventDefault();
      const bedrag = parseFloat(
        document.getElementById("bedrag").value.replace(",", ".")
      ) || 0;
      const activiteit = document.getElementById("activiteit").value;
      const datum = document.getElementById("datum").value;
      const betaald = document.getElementById("betaald").checked;
      if (!bedrag || !activiteit || !datum) {
        return alert("Vul alle velden correct in.");
      }
      const id = Date.now();
      const obj = {
        nummer: id,
        groep: groep,
        bedrag: bedrag.toFixed(2),
        activiteit,
        datum,
        betaald
      };
      firebase.database().ref("uitgaven/" + id).set(obj, err => {
        if (!err) {
          e.target.reset();
          renderSummary();
          renderTabel(document.getElementById("filterBetaaldLeiding").value);
        }
      });
    });

  // Filter
  document.getElementById("filterBetaaldLeiding")
    .addEventListener("change", e =>
      renderTabel(e.target.value)
    );
});
